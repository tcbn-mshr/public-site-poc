"use strict";


const crypto =
    require("node:crypto");


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

const DEFAULT_LOG_TABLE_NAME =
    "DownloadLogs";

const DEFAULT_CONTAINER_NAME =
    "files";

const DEFAULT_SAS_MINUTES =
    5;


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

function getRequiredSetting(name) {

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


    const logTableName =
        String(
            process.env.DOWNLOAD_LOG_TABLE ||
            DEFAULT_LOG_TABLE_NAME
        ).trim();


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
        logTableName,
        containerName,
        sasMinutes
    };
}


/* =========================================
   Request Validation
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


function isValidEmail(value) {

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        .test(value);
}


function validatePayload(body) {

    const materialId =
        normalizeText(
            body?.materialId,
            128
        );

    const company =
        normalizeText(
            body?.company,
            200
        );

    const customerName =
        normalizeText(
            body?.customerName,
            100
        );

    const email =
        normalizeText(
            body?.email,
            254
        );

    const consent =
        body?.consent === true;


    if (!materialId) {

        return {
            valid: false,
            message:
                "資料IDが指定されていません。"
        };
    }


    if (!company) {

        return {
            valid: false,
            message:
                "会社名を入力してください。"
        };
    }


    if (!customerName) {

        return {
            valid: false,
            message:
                "氏名を入力してください。"
        };
    }


    if (
        !email ||
        !isValidEmail(email)
    ) {

        return {
            valid: false,
            message:
                "正しいメールアドレスを入力してください。"
        };
    }


    if (!consent) {

        return {
            valid: false,
            message:
                "個人情報の取り扱いへの同意が必要です。"
        };
    }


    return {

        valid: true,

        value: {
            materialId,
            company,
            customerName,
            email,
            consent
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


        if (
            String(
                entity.status || ""
            ).toLowerCase() !==
            "published"
        ) {

            return null;
        }


        const blobName =
            String(
                entity.blobName || ""
            ).trim();


        if (!blobName) {

            throw new Error(
                "Material blobName is empty."
            );
        }


        return {

            id:
                materialId,

            title:
                String(
                    entity.title || ""
                ).trim(),

            category:
                String(
                    entity.category || ""
                ).trim(),

            categoryName:
                String(
                    entity.categoryName || ""
                ).trim(),

            description:
                String(
                    entity.description || ""
                ).trim(),

            blobName,

            originalFileName:
                String(
                    entity.originalFileName ||
                    entity.blobName ||
                    "document.pdf"
                ).trim()
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
   Download Log
========================================= */

async function saveDownloadLog(
    connectionString,
    logTableName,
    request,
    input,
    material
) {

    const tableClient =
        TableClient.fromConnectionString(
            connectionString,
            logTableName
        );


    const now =
        new Date();


    const forwardedFor =
        String(
            request.headers.get(
                "x-forwarded-for"
            ) || ""
        )
            .split(",")[0]
            .trim();


    const userAgent =
        normalizeText(
            request.headers.get(
                "user-agent"
            ) || "",
            1024
        );


    const entity = {

        partitionKey:
            material.id,

        rowKey:
            `${now.getTime()}-${crypto.randomUUID()}`,

        materialId:
            material.id,

        title:
            material.title,

        category:
            material.category,

        categoryName:
            material.categoryName,

        blobName:
            material.blobName,

        originalFileName:
            material.originalFileName,

        company:
            input.company,

        customerName:
            input.customerName,

        email:
            input.email,

        consent:
            input.consent,

        downloadedAtUtc:
            now.toISOString(),

        sourceIp:
            forwardedFor,

        userAgent
    };


    await tableClient.createEntity(
        entity
    );
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


    /*
     * PDFをブラウザー表示ではなく
     * ダウンロードとして扱わせます。
     */

    const encodedFileName =
        encodeURIComponent(
            material.originalFileName
        );


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

        let body;


        try {

            body =
                await request.json();

        } catch {

            return jsonResponse(
                400,
                {
                    success: false,
                    message:
                        "リクエスト内容を確認できませんでした。"
                }
            );
        }


        const validation =
            validatePayload(
                body
            );


        if (!validation.valid) {

            return jsonResponse(
                400,
                {
                    success: false,
                    message:
                        validation.message
                }
            );
        }


        const config =
            getConfiguration();


        /*
         * 信頼できるMaterialsテーブルから
         * 資料情報とblobNameを取得します。
         */

        const material =
            await getPublishedMaterial(
                config.connectionString,
                validation.value.materialId
            );


        if (!material) {

            return jsonResponse(
                404,
                {
                    success: false,
                    message:
                        "指定された資料は存在しないか、" +
                        "現在公開されていません。"
                }
            );
        }


        /*
         * Blobの存在確認と
         * 読み取り専用SAS URLの生成
         */

        const downloadUrl =
            await createDownloadUrl(
                config.connectionString,
                config.containerName,
                material,
                config.sasMinutes
            );


        /*
         * SAS発行後、レスポンスを返す前に
         * DownloadLogsへ記録します。
         */

        await saveDownloadLog(
            config.connectionString,
            config.logTableName,
            request,
            validation.value,
            material
        );


        return jsonResponse(
            200,
            {
                success:
                    true,

                materialId:
                    material.id,

                title:
                    material.title,

                downloadUrl,

                expiresInMinutes:
                    config.sasMinutes
            }
        );


    } catch (error) {

        context.error(
            "Download API failed.",
            error
        );


        if (
            error?.code ===
            "BlobNotFound"
        ) {

            return jsonResponse(
                404,
                {
                    success: false,
                    message:
                        "ダウンロード対象のPDFが見つかりませんでした。"
                }
            );
        }


        return jsonResponse(
            500,
            {
                success: false,
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

        authLevel:
            "anonymous",

        route:
            "download",

        handler:
            downloadHandler
    }
);
