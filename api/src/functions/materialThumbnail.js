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
        "files"
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

        /*
         * materialId
         */

        const materialId =
            normalizeText(
                request.query.get("id"),
                128
            );


        if (!materialId) {

            return {
                status:
                    400,

                jsonBody: {
                    success:
                        false,

                    message:
                        "資料IDが指定されていません。"
                }
            };
        }


        /*
         * Storage
         */

        const connectionString =
            getConnectionString();


        const tableClient =
            TableClient
                .fromConnectionString(
                    connectionString,
                    MATERIALS_TABLE_NAME
                );


        /*
         * Materials取得
         */

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

                return {
                    status:
                        404
                };
            }


            throw error;
        }


        /*
         * 公開中の資料だけ
         */

        if (
            normalizeText(
                entity.status,
                20
            ) !== "published"
        ) {

            return {
                status:
                    404
            };
        }


        /*
         * Thumbnail
         */

        const thumbnailBlobName =
            normalizeText(
                entity.thumbnailBlobName,
                500
            );


        if (!thumbnailBlobName) {

            return {
                status:
                    404
            };
        }


        /*
         * materialIdとBlobパスが
         * 一致することを確認
         */

        const expectedBlobName =
            `materials/${materialId}/thumbnail.jpg`;


        if (
            thumbnailBlobName !==
            expectedBlobName
        ) {

            context.warn(
                "Unexpected thumbnail blob name:",
                thumbnailBlobName
            );


            return {
                status:
                    404
            };
        }


        /*
         * Blob Client
         */

        const blobServiceClient =
            BlobServiceClient
                .fromConnectionString(
                    connectionString
                );


        const containerClient =
            blobServiceClient
                .getContainerClient(
                    getContainerName()
                );


        const blobClient =
            containerClient
                .getBlobClient(
                    thumbnailBlobName
                );


        /*
         * Blob実在確認
         */

        const exists =
            await blobClient.exists();


        if (!exists) {

            return {
                status:
                    404
            };
        }


        /*
         * 5分間のRead SAS
         */

        const thumbnailUrl =
            await blobClient
                .generateSasUrl({

                    permissions:
                        BlobSASPermissions
                            .parse("r"),

                    startsOn:
                        new Date(
                            Date.now() -
                            60 * 1000
                        ),

                    expiresOn:
                        new Date(
                            Date.now() +
                            5 * 60 * 1000
                        )
                });


        /*
         * BlobへRedirect
         */

        return {

            status:
                302,

            headers: {

                "Location":
                    thumbnailUrl,

                "Cache-Control":
                    "private, max-age=300"
            }
        };


    } catch (error) {

        context.error(
            "Material thumbnail API failed.",
            error
        );


        return {
            status:
                500,

            jsonBody: {

                success:
                    false,

                message:
                    "サムネイル画像を取得できませんでした。"
            }
        };
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

        authLevel:
            "anonymous",

        route:
            "material-thumbnail",

        handler:
            materialThumbnailHandler
    }
);
