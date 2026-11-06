"use strict";


const {
    app
} = require("@azure/functions");


const {
    TableClient
} = require("@azure/data-tables");


const {
    BlobServiceClient,
    BlobSASPermissions
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

function getConnectionString() {

    const connectionString =
        String(
            process.env
                .DOWNLOAD_STORAGE_CONNECTION_STRING ||
            ""
        ).trim();


    if (!connectionString) {

        throw new Error(
            "DOWNLOAD_STORAGE_CONNECTION_STRING " +
            "is not configured."
        );
    }


    return connectionString;
}


function getContainerName() {

    return String(
        process.env.DOWNLOAD_CONTAINER ||
        DEFAULT_CONTAINER_NAME
    ).trim();
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
     * 現在materialIdはUUID形式。
     *
     * 英数字とハイフンのみ許可。
     *
     * "/", "\", ".", "?", "#"
     * 等のパス・URL関連文字を拒否。
     */

    return /^[A-Za-z0-9-]+$/
        .test(
            materialId
        );
}


/* =========================================
   Get Published Material
========================================= */

async function getPublishedMaterial(
    tableClient,
    materialId
) {

    let entity;


    try {

        entity =
            await tableClient.getEntity(
                "materials",
                materialId
            );


    } catch (error) {

        if (
            error?.statusCode ===
            404
        ) {

            return null;
        }


        throw error;
    }


    /* =====================================
       Published Check
    ===================================== */

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
         * draft等は外部から見ると
         * 「存在しない資料」と同じ扱い。
         */

        return null;
    }


    /* =====================================
       Thumbnail Blob Name
    ===================================== */

    const thumbnailBlobName =
        normalizeText(
            entity.thumbnailBlobName,
            500
        );


    if (!thumbnailBlobName) {

        return null;
    }


    /*
     * クライアントからBlobパスは受け取らず、
     * Table Storageに保存された値についても
     * 現在の固定命名規則と完全一致することを確認。
     */

    const expectedBlobName =
        `materials/${materialId}/thumbnail.jpg`;


    if (
        thumbnailBlobName !==
        expectedBlobName
    ) {

        /*
         * ログには詳細を残すが、
         * API利用者にはBlobパスを公開しない。
         */

        return {

            invalidBlobPath:
                true
        };
    }


    return {

        id:
            materialId,

        thumbnailBlobName
    };
}


/* =========================================
   Create Thumbnail SAS
========================================= */

async function createThumbnailUrl(
    connectionString,
    containerName,
    thumbnailBlobName
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
                thumbnailBlobName
            );


    /* =====================================
       Blob Existence
    ===================================== */

    const exists =
        await blobClient.exists();


    if (!exists) {

        return null;
    }


    /* =====================================
       Read-Only SAS
    ===================================== */

    return blobClient.generateSasUrl({

        permissions:
            BlobSASPermissions
                .parse(
                    "r"
                ),

        /*
         * Clock skew対策として
         * 1分前から有効。
         */

        startsOn:
            new Date(
                Date.now() -
                60 * 1000
            ),

        /*
         * Thumbnail用SASは
         * 5分間のみ有効。
         */

        expiresOn:
            new Date(
                Date.now() +
                DEFAULT_SAS_MINUTES *
                60 *
                1000
            )
    });
}


/* =========================================
   Handler
========================================= */

async function materialThumbnailHandler(
    request,
    context
) {

    context.log(
        "Material thumbnail request received."
    );


    try {

        /* =================================
           Material ID
        ================================= */

        const materialId =
            normalizeText(
                request.query.get(
                    "id"
                ),
                MAX_MATERIAL_ID_LENGTH
            );


        if (!materialId) {

            return jsonResponse(
                400,
                {

                    success:
                        false,

                    message:
                        "資料IDが指定されていません。"
                }
            );
        }


        /* =================================
           Material ID Validation
        ================================= */

        if (
            !isValidMaterialId(
                materialId
            )
        ) {

            return jsonResponse(
                400,
                {

                    success:
                        false,

                    message:
                        "資料IDが正しくありません。"
                }
            );
        }


        /* =================================
           Storage
        ================================= */

        const connectionString =
            getConnectionString();


        const tableClient =
            TableClient
                .fromConnectionString(
                    connectionString,
                    MATERIALS_TABLE_NAME
                );


        /* =================================
           Trusted Material Metadata
        ================================= */

        const material =
            await getPublishedMaterial(
                tableClient,
                materialId
            );


        /*
         * 存在しない資料と
         * draft資料は同じ404。
         */

        if (!material) {

            return jsonResponse(
                404,
                {

                    success:
                        false,

                    message:
                        "サムネイル画像が見つかりませんでした。"
                }
            );
        }


        /* =================================
           Invalid Blob Path
        ================================= */

        if (
            material.invalidBlobPath
        ) {

            /*
             * 不正な内部Blob Pathは
             * ログへIDだけ記録。
             *
             * Blob名そのものは
             * 外部レスポンスへ返さない。
             */

            context.warn(
                "Unexpected thumbnail blob path for material:",
                materialId
            );


            return jsonResponse(
                404,
                {

                    success:
                        false,

                    message:
                        "サムネイル画像が見つかりませんでした。"
                }
            );
        }


        /* =================================
           SAS URL
        ================================= */

        const thumbnailUrl =
            await createThumbnailUrl(
                connectionString,
                getContainerName(),
                material.thumbnailBlobName
            );


        if (!thumbnailUrl) {

            return jsonResponse(
                404,
                {

                    success:
                        false,

                    message:
                        "サムネイル画像が見つかりませんでした。"
                }
            );
        }


        /* =================================
           Redirect
        ================================= */

        /*
         * Private Blobへ直接公開せず、
         * 5分間だけ有効なRead SASへRedirect。
         */

        return {

            status:
                302,

            headers: {

                "Location":
                    thumbnailUrl,

                /*
                 * SAS URL自体を長期間
                 * キャッシュさせない。
                 */

                "Cache-Control":
                    "private, max-age=300"
            }
        };


    } catch (error) {

        /*
         * 詳細な内部エラーは
         * Azure Functionsログのみ。
         */

        context.error(
            "Material thumbnail API failed.",
            error
        );


        return jsonResponse(
            500,
            {

                success:
                    false,

                message:
                    "サムネイル画像を取得できませんでした。"
            }
        );
    }
}


/* =========================================
   Function Registration
========================================= */

app.http(
    "material-thumbnail",
    {

        methods: [
            "GET"
        ],

        /*
         * 展示会来訪者向け公開APIなので
         * anonymous。
         */

        authLevel:
            "anonymous",

        route:
            "material-thumbnail",

        handler:
            materialThumbnailHandler
    }
);
