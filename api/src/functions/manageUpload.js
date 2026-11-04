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
     * 管理画面で新規登録した資料IDは
     * crypto.randomUUID() 形式。
     */

    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
        .test(
            materialId
        );
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

        /* =================================
           Request body
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
           Input
        ================================= */

        const materialId =
            String(
                body?.materialId ||
                ""
            ).trim();


        const originalFileName =
            String(
                body?.originalFileName ||
                ""
            )
                .trim()
                .slice(
                    0,
                    255
                );


        const uploadType =
            String(
                body?.uploadType ||
                "pdf"
            ).trim();


        /* =================================
           Material ID
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
           File name
        ================================= */

        if (!originalFileName) {

            return jsonResponse(
                400,
                {
                    success:
                        false,

                    message:
                        "ファイル名が指定されていません。"
                }
            );
        }


        /* =================================
           Upload type
        ================================= */

        if (
            uploadType !== "pdf" &&
            uploadType !== "thumbnail"
        ) {

            return jsonResponse(
                400,
                {
                    success:
                        false,

                    message:
                        "アップロード種別が正しくありません。"
                }
            );
        }


        /* =================================
           PDF validation
        ================================= */

        if (
            uploadType === "pdf" &&
            !originalFileName
                .toLowerCase()
                .endsWith(
                    ".pdf"
                )
        ) {

            return jsonResponse(
                400,
                {
                    success:
                        false,

                    message:
                        "PDFファイルを指定してください。"
                }
            );
        }


        /* =================================
           Thumbnail validation
        ================================= */

        if (
            uploadType === "thumbnail"
        ) {

            const lowerFileName =
                originalFileName
                    .toLowerCase();


            const isJpeg =
                lowerFileName.endsWith(
                    ".jpg"
                ) ||
                lowerFileName.endsWith(
                    ".jpeg"
                );


            if (!isJpeg) {

                return jsonResponse(
                    400,
                    {
                        success:
                            false,

                        message:
                            "JPEG画像を指定してください。"
                    }
                );
            }
        }


        /* =================================
           Storage
        ================================= */

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


        /* =================================
           Blob name
        ================================= */

        const blobName =
            uploadType ===
            "thumbnail"
                ? `materials/${materialId}/thumbnail.jpg`
                : `materials/${materialId}/document.pdf`;


        const contentType =
            uploadType ===
            "thumbnail"
                ? "image/jpeg"
                : "application/pdf";


        const blobClient =
            containerClient
                .getBlockBlobClient(
                    blobName
                );


        /* =================================
           Write SAS
        ================================= */

        /*
         * PDF / thumbnail の実PUTは
         * ブラウザーから実施します。
         *
         * SASは短時間だけ有効。
         */

        const uploadUrl =
            await blobClient
                .generateSasUrl({

                    permissions:
                        BlobSASPermissions
                            .parse(
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
                        contentType
                });


        /* =================================
           Response
        ================================= */

        return jsonResponse(
            200,
            {
                success:
                    true,

                uploadType:
                    uploadType,

                blobName:
                    blobName,

                uploadUrl:
                    uploadUrl,

                originalFileName:
                    originalFileName,

                contentType:
                    contentType
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
                success:
                    false,

                message:
                    "ファイルアップロード準備中にエラーが発生しました。"
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
