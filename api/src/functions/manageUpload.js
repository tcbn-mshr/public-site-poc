"use strict";


const {
    app
} = require("@azure/functions");


const {
    BlobServiceClient,
    BlobSASPermissions
} = require("@azure/storage-blob");


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
   Configuration
========================================= */

function getConnectionString() {

    const value =
        String(
            process.env
                .DOWNLOAD_STORAGE_CONNECTION_STRING ||
            ""
        ).trim();


    if (!value) {

        throw new Error(
            "DOWNLOAD_STORAGE_CONNECTION_STRING " +
            "is not configured."
        );
    }


    return value;
}


function getContainerName() {

    return String(
        process.env.DOWNLOAD_CONTAINER ||
        "files"
    ).trim();
}


/* =========================================
   Validation
========================================= */

function isValidMaterialId(
    materialId
) {

    /*
     * crypto.randomUUID() で生成した
     * UUIDのみを受け付けます。
     */

    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
        .test(materialId);
}


/* =========================================
   Handler
========================================= */

async function manageUploadHandler(
    request,
    context
) {

    context.log(
        "Manage upload API request received."
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


        const materialId =
            String(
                body?.materialId || ""
            ).trim();


        const originalFileName =
            String(
                body?.originalFileName || ""
            )
                .trim()
                .slice(0, 255);


        if (
            !isValidMaterialId(
                materialId
            )
        ) {

            return jsonResponse(
                400,
                {
                    success: false,
                    message:
                        "資料IDが正しくありません。"
                }
            );
        }


        if (
            !originalFileName
                .toLowerCase()
                .endsWith(".pdf")
        ) {

            return jsonResponse(
                400,
                {
                    success: false,
                    message:
                        "PDFファイルを指定してください。"
                }
            );
        }


        const connectionString =
            getConnectionString();


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


        const blobName =
            `materials/${materialId}/document.pdf`;


        const blobClient =
            containerClient
                .getBlockBlobClient(
                    blobName
                );


        /*
         * 10分間だけ有効な
         * 書込用SASを発行。
         */

        const uploadUrl =
            await blobClient.generateSasUrl({

                permissions:
                    BlobSASPermissions.parse(
                        "cw"
                    ),

                startsOn:
                    new Date(
                        Date.now() -
                        60 * 1000
                    ),

                expiresOn:
                    new Date(
                        Date.now() +
                        10 * 60 * 1000
                    ),

                contentType:
                    "application/pdf"
            });


        return jsonResponse(
            200,
            {

                success:
                    true,

                blobName:
                    blobName,

                uploadUrl:
                    uploadUrl,

                originalFileName:
                    originalFileName
            }
        );


    } catch (error) {

        context.error(
            "Manage upload API failed.",
            error
        );


        return jsonResponse(
            500,
            {
                success: false,
                message:
                    "PDFアップロード準備中にエラーが発生しました。"
            }
        );
    }
}


/* =========================================
   Function Registration
========================================= */

app.http(
    "manage-upload",
    {

        methods: [
            "POST"
        ],

        authLevel:
            "anonymous",

        route:
            "manage-upload",

        handler:
            manageUploadHandler
    }
);
