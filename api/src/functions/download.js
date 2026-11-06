"use strict";


const {
    app
} = require("@azure/functions");


const {
    TableClient
} = require("@azure/data-tables");


const {
    BlobServiceClient
} = require("@azure/storage-blob");


/* =========================================
   Configuration
========================================= */

const MATERIALS_TABLE_NAME =
    "Materials";

const DEFAULT_CONTAINER_NAME =
    "files";

const DEFAULT_SAS_MINUTES =
    5;

const MAX_MATERIAL_ID_LENGTH =
    128;


/* =========================================
   Response
========================================= */

function jsonResponse(
    status,
    body
) {

    return {

        status,

        headers: {

            "Content-Type":
                "application/json; charset=utf-8",

            "Cache-Control":
                "no-store"
        },

        jsonBody:
            body
    };
}


/* =========================================
   Environment
========================================= */

function getRequiredSetting(
    name
) {

    const value =
        String(
            process.env[name] || ""
        ).trim();


    if (!value) {

        throw new Error(
            `${name} is not configured.`
        );
    }


    return value;
}


function getConfiguration() {

    const connectionString =
        getRequiredSetting(
            "DOWNLOAD_STORAGE_CONNECTION_STRING"
        );


    const containerName =
        String(
            process.env.DOWNLOAD_CONTAINER ||
            DEFAULT_CONTAINER_NAME
        ).trim();


    const configuredMinutes =
        Number.parseInt(
            process.env.DOWNLOAD_SAS_MINUTES ||
            "",
            10
        );


    /*
     * SASの有効期間。
     *
     * 未設定時は5分。
     * 設定された場合でも最大60分。
     */

    const sasMinutes =
        Number.isFinite(
            configuredMinutes
        ) &&
        configuredMinutes > 0
            ? Math.min(
                configuredMinutes,
                60
            )
            : DEFAULT_SAS_MINUTES;


    return {

        connectionString,

        containerName,

        sasMinutes
    };
}


/* =========================================
   Utility
========================================= */

function normalizeText(
    value,
    maximumLength
) {

    return String(
        value ?? ""
    )
        .trim()
        .slice(
            0,
            maximumLength
        );
}


/* =========================================
   Material ID Validation
========================================= */

function isValidMaterialId(
    materialId
) {

    if (!materialId) {

        return false;
    }


    if (
        materialId.length >
        MAX_MATERIAL_ID_LENGTH
    ) {

        return false;
    }


    /*
     * 現在materialIdは
     * UUID形式で生成しています。
     *
     * 英数字とハイフンのみを許可し、
     * パス文字等を拒否します。
     */

    return /^[A-Za-z0-9-]+$/
        .test(
            materialId
        );
}


/* =========================================
   Request Validation
========================================= */

function validatePayload(
    body
) {

    const materialId =
        normalizeText(
            body?.materialId,
            MAX_MATERIAL_ID_LENGTH
        );


    if (!materialId) {

        return {

            valid:
                false,

            message:
                "資料IDが指定されていません。"
        };
    }


    if (
        !isValidMaterialId(
            materialId
        )
    ) {

        return {

            valid:
                false,

            message:
                "資料IDが正しくありません。"
        };
    }


    /*
     * materialId以外は使用しません。
     *
     * クライアントから
     *
     * blobName
     * path
     * fileName
     *
     * 等が送信されても無視します。
     */

    return {

        valid:
            true,

        value: {

            materialId
        }
    };
}


/* =========================================
   Materials Table
========================================= */

async function getPublishedMaterial(
    connectionString,
    materialId
) {

    const tableClient =
        TableClient.fromConnectionString(
            connectionString,
            MATERIALS_TABLE_NAME
        );


    try {

        const entity =
            await tableClient.getEntity(
                "materials",
                materialId
            );


        /* =================================
           Published Check
        ================================= */

        const status =
            normalizeText(
                entity.status,
                20
            ).toLowerCase();


        if (
            status !==
            "published"
        ) {

            /*
             * draft等は公開APIから
             * 存在しない資料として扱います。
             */

            return null;
        }


        /* =================================
           Blob Name
        ================================= */

        const blobName =
            normalizeText(
                entity.blobName,
                500
            );


        if (!blobName) {

            throw new Error(
                "Material blobName is empty."
            );
        }


        /*
         * Blobパスはクライアント値ではなく、
         * Materials Tableに保存された値を使用。
         *
         * さらに現在の命名規則
         *
         * materials/{materialId}/document.pdf
         *
         * と一致することを確認します。
         */

        const expectedBlobName =
            `materials/${materialId}/document.pdf`;


        if (
            blobName !==
            expectedBlobName
        ) {

            const error =
                new Error(
                    "Unexpected material blob path."
                );


            error.code =
                "InvalidBlobPath";


            throw error;
        }


        /* =================================
           Original File Name
        ================================= */

        let originalFileName =
            normalizeText(
                entity.originalFileName,
                255
            );


        /*
         * Content-Dispositionで使用するため、
         * 改行等を取り除きます。
         */

        originalFileName =
            originalFileName
                .replace(
                    /[\r\n]/g,
                    ""
                )
                .trim();


        if (
            !originalFileName ||
            !originalFileName
                .toLowerCase()
                .endsWith(
                    ".pdf"
                )
        ) {

            originalFileName =
                "document.pdf";
        }


        return {

            id:
                materialId,

            blobName,

            originalFileName
        };


    } catch (error) {

        if (
            error?.statusCode === 404
        ) {

            return null;
        }


        throw error;
    }
}


/* =========================================
   SAS URL
========================================= */

async function createDownloadUrl(
    connectionString,
    containerName,
    material,
    sasMinutes
) {

    const blobServiceClient =
        BlobServiceClient
            .fromConnectionString(
                connectionString
            );


    const containerClient =
        blobServiceClient
            .getContainerClient(
                containerName
            );


    const blobClient =
        containerClient
            .getBlobClient(
                material.blobName
            );


    /* =====================================
       Blob Existence
    ===================================== */

    const exists =
        await blobClient.exists();


    if (!exists) {

        const error =
            new Error(
                "The material blob was not found."
            );


        error.code =
            "BlobNotFound";


        throw error;
    }


    /* =====================================
       SAS Validity
    ===================================== */

    /*
     * 1分前から有効にすることで
     * 時計ずれを吸収。
     */

    const startsOn =
        new Date(
            Date.now() -
            60 * 1000
        );


    const expiresOn =
        new Date(
            Date.now() +
            sasMinutes *
            60 *
            1000
        );


    /* =====================================
       Download File Name
    ===================================== */

    const encodedFileName =
        encodeURIComponent(
            material.originalFileName
        );


    /* =====================================
       Read-Only SAS
    ===================================== */

    return blobClient.generateSasUrl({

        permissions:
            "r",

        startsOn,

        expiresOn,

        contentDisposition:
            "attachment; filename*=UTF-8''" +
            encodedFileName,

        contentType:
            "application/pdf"
    });
}


/* =========================================
   Handler
========================================= */

async function downloadHandler(
    request,
    context
) {

    context.log(
        "Download API request received."
    );


    try {

        /* =================================
           Request Body
        ================================= */

        let body;


        try {

            body =
                await request.json();


        } catch {

            return jsonResponse(
                400,
                {
                    success:
                        false,

                    message:
                        "リクエスト内容を確認できませんでした。"
                }
            );
        }


        /* =================================
           Validation
        ================================= */

        const validation =
            validatePayload(
                body
            );


        if (!validation.valid) {

            return jsonResponse(
                400,
                {
                    success:
                        false,

                    message:
                        validation.message
                }
            );
        }


        /* =================================
           Configuration
        ================================= */

        const config =
            getConfiguration();


        /* =================================
           Trusted Material Metadata
        ================================= */

        /*
         * クライアントからはmaterialIdのみ受信。
         *
         * blobName等のファイル情報は
         * 信頼できるMaterials Tableから取得します。
         */

        const material =
            await getPublishedMaterial(
                config.connectionString,
                validation.value.materialId
            );


        if (!material) {

            /*
             * draft資料についても
             * 存在有無を外部へ区別させません。
             */

            return jsonResponse(
                404,
                {
                    success:
                        false,

                    message:
                        "指定された資料は存在しないか、現在公開されていません。"
                }
            );
        }


        /* =================================
           Create Read SAS
        ================================= */

        const downloadUrl =
            await createDownloadUrl(
                config.connectionString,
                config.containerName,
                material,
                config.sasMinutes
            );


        /* =================================
           Response
        ================================= */

        /*
         * DownloadLogsへの書き込みは行いません。
         *
         * 個人情報、
         * IPアドレス、
         * User-Agent等も
         * アプリケーション独自ログとして
         * 保存しません。
         */

        return jsonResponse(
            200,
            {
                success:
                    true,

                materialId:
                    material.id,

                downloadUrl,

                expiresInMinutes:
                    config.sasMinutes
            }
        );


    } catch (error) {

        /*
         * 詳細な内部情報はサーバーログのみ。
         */

        context.error(
            "Download API failed.",
            error
        );


        /* =================================
           Blob Not Found
        ================================= */

        if (
            error?.code ===
            "BlobNotFound"
        ) {

            return jsonResponse(
                404,
                {
                    success:
                        false,

                    message:
                        "ダウンロード対象のPDFが見つかりませんでした。"
                }
            );
        }


        /* =================================
           Invalid Blob Path
        ================================= */

        if (
            error?.code ===
            "InvalidBlobPath"
        ) {

            /*
             * 内部のBlobパス情報は
             * クライアントへ返しません。
             */

            return jsonResponse(
                404,
                {
                    success:
                        false,

                    message:
                        "ダウンロード対象の資料を確認できませんでした。"
                }
            );
        }


        /* =================================
           Generic Error
        ================================= */

        return jsonResponse(
            500,
            {
                success:
                    false,

                message:
                    "ダウンロード処理中にエラーが発生しました。"
            }
        );
    }
}


/* =========================================
   Function Registration
========================================= */

app.http(
    "download",
    {
        methods: [
            "POST"
        ],

        /*
         * 展示会来訪者向け公開APIなので
         * anonymousを維持します。
         */

        authLevel:
            "anonymous",

        route:
            "download",

        handler:
            downloadHandler
    }
);
