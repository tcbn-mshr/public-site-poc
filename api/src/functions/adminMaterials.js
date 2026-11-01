"use strict";

const crypto =
    require("node:crypto");

const {
    app
} = require("@azure/functions");

const {
    TableClient
} = require("@azure/data-tables");


/* =========================================
   Configuration
========================================= */

const MATERIALS_TABLE_NAME =
    "Materials";


const CATEGORY_MAP = {

    electronics:
        "情報電子",

    chemicals:
        "化学品",

    life:
        "生活産業",

    plastics:
        "合成樹脂",

    other:
        "その他"
};


const VALID_STATUS =
    new Set([
        "draft",
        "published"
    ]);


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


function getDateText(value) {

    if (!value) {
        return "";
    }


    if (
        value instanceof Date
    ) {

        return value.toISOString();
    }


    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "";
    }


    return date.toISOString();
}


/* =========================================
   GET
========================================= */

async function getMaterials(
    tableClient
) {

    const entities =
        tableClient.listEntities({

            queryOptions: {

                filter:
                    "PartitionKey eq 'materials'"
            }
        });


    const materials = [];


    for await (
        const entity of entities
    ) {

        materials.push({

            id:
                normalizeText(
                    entity.rowKey,
                    128
                ),

            title:
                normalizeText(
                    entity.title,
                    150
                ),

            category:
                normalizeText(
                    entity.category,
                    50
                ),

            categoryName:
                normalizeText(
                    entity.categoryName,
                    100
                ),

            summary:
                normalizeText(
                    entity.summary,
                    250
                ),

            description:
                normalizeText(
                    entity.description,
                    2000
                ),

            originalFileName:
                normalizeText(
                    entity.originalFileName,
                    255
                ),

            blobName:
                normalizeText(
                    entity.blobName,
                    500
                ),

            status:
                normalizeText(
                    entity.status,
                    20
                ) || "draft",

            createdAtUtc:
                getDateText(
                    entity.createdAtUtc
                ),

            createdBy:
                normalizeText(
                    entity.createdBy,
                    200
                ),

            updatedAtUtc:
                getDateText(
                    entity.updatedAtUtc
                ),

            updatedBy:
                normalizeText(
                    entity.updatedBy,
                    200
                )
        });
    }


    materials.sort(
        (a, b) =>
            a.title.localeCompare(
                b.title,
                "ja"
            )
    );


    return jsonResponse(
        200,
        {
            success: true,
            materials
        }
    );
}


/* =========================================
   POST Validation
========================================= */

function validateCreateBody(body) {

    const title =
        normalizeText(
            body?.title,
            150
        );

    const category =
        normalizeText(
            body?.category,
            50
        );

    const summary =
        normalizeText(
            body?.summary,
            250
        );

    const description =
        normalizeText(
            body?.description,
            2000
        );

    const status =
        normalizeText(
            body?.status,
            20
        ) || "draft";


    if (!title) {

        return {
            valid: false,
            message:
                "資料名を入力してください。"
        };
    }


    if (
        !Object.prototype.hasOwnProperty.call(
            CATEGORY_MAP,
            category
        )
    ) {

        return {
            valid: false,
            message:
                "カテゴリーを確認してください。"
        };
    }


    if (!summary) {

        return {
            valid: false,
            message:
                "一覧用説明を入力してください。"
        };
    }


    if (!description) {

        return {
            valid: false,
            message:
                "詳細説明を入力してください。"
        };
    }


    if (
        !VALID_STATUS.has(
            status
        )
    ) {

        return {
            valid: false,
            message:
                "公開状態を確認してください。"
        };
    }


    return {

        valid: true,

        value: {

            title,

            category,

            categoryName:
                CATEGORY_MAP[
                    category
                ],

            summary,

            description,

            status
        }
    };
}


/* =========================================
   POST
========================================= */

async function createMaterial(
    request,
    tableClient
) {

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
        validateCreateBody(
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


    const now =
        new Date()
            .toISOString();


    const materialId =
        crypto.randomUUID();


    /*
     * STEP 6ではまだPDFをBlobへ保存しません。
     *
     * blobName / originalFileName は
     * PDFアップロード実装後に設定します。
     */

    const entity = {

        partitionKey:
            "materials",

        rowKey:
            materialId,

        title:
            validation.value.title,

        category:
            validation.value.category,

        categoryName:
            validation.value.categoryName,

        summary:
            validation.value.summary,

        description:
            validation.value.description,

        status:
            validation.value.status,

        blobName:
            "",

        originalFileName:
            "",

        createdAtUtc:
            now,

        createdBy:
            "",

        updatedAtUtc:
            now,

        updatedBy:
            ""
    };


    await tableClient.createEntity(
        entity
    );


    return jsonResponse(
        201,
        {

            success:
                true,

            material: {

                id:
                    materialId,

                title:
                    entity.title,

                category:
                    entity.category,

                categoryName:
                    entity.categoryName,

                summary:
                    entity.summary,

                description:
                    entity.description,

                status:
                    entity.status,

                createdAtUtc:
                    entity.createdAtUtc,

                updatedAtUtc:
                    entity.updatedAtUtc
            }
        }
    );
}


/* =========================================
   PUT - PDF Information
========================================= */

async function updateMaterialPdf(
    request,
    tableClient
) {

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
        normalizeText(
            body?.id,
            128
        );

    const blobName =
        normalizeText(
            body?.blobName,
            500
        );

    const originalFileName =
        normalizeText(
            body?.originalFileName,
            255
        );


    /*
     * Required fields
     */

    if (!materialId) {

        return jsonResponse(
            400,
            {
                success: false,
                message:
                    "資料IDが指定されていません。"
            }
        );
    }


    if (!blobName) {

        return jsonResponse(
            400,
            {
                success: false,
                message:
                    "Blob名が指定されていません。"
            }
        );
    }


    if (!originalFileName) {

        return jsonResponse(
            400,
            {
                success: false,
                message:
                    "元のPDFファイル名が指定されていません。"
            }
        );
    }


    /*
     * PDFのみ許可
     */

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


    /*
     * STEP 7ではBlobパスを
     * システム生成形式に限定します。
     */

    const expectedBlobName =
        `materials/${materialId}/document.pdf`;


    if (
        blobName !==
        expectedBlobName
    ) {

        return jsonResponse(
            400,
            {
                success: false,
                message:
                    "Blob名が正しくありません。"
            }
        );
    }


    /*
     * 対象資料が存在するか確認
     */

    try {

        await tableClient.getEntity(
            "materials",
            materialId
        );

    } catch (error) {

        if (
            error?.statusCode === 404
        ) {

            return jsonResponse(
                404,
                {
                    success: false,
                    message:
                        "対象資料が見つかりません。"
                }
            );
        }


        throw error;
    }


    /*
     * PDF関連情報だけ更新
     *
     * mergeを使うことで、
     * title / summary / descriptionなどを
     * 上書きしません。
     */

    const now =
        new Date()
            .toISOString();


    await tableClient.updateEntity(
        {

            partitionKey:
                "materials",

            rowKey:
                materialId,

            blobName:
                blobName,

            originalFileName:
                originalFileName,

            updatedAtUtc:
                now
        },

        "Merge"
    );


    return jsonResponse(
        200,
        {

            success:
                true,

            material: {

                id:
                    materialId,

                blobName:
                    blobName,

                originalFileName:
                    originalFileName,

                updatedAtUtc:
                    now
            }
        }
    );
}


/* =========================================
   Handler
========================================= */

async function manageMaterialsHandler(
    request,
    context
) {

    context.log(
        "Manage materials API request:",
        request.method
    );


    try {

        const connectionString =
            getConnectionString();


        const tableClient =
            TableClient.fromConnectionString(
                connectionString,
                MATERIALS_TABLE_NAME
            );


        if (
            request.method ===
            "GET"
        ) {

            return await getMaterials(
                tableClient
            );
        }


        if (
            request.method ===
            "POST"
        ) {

            return await createMaterial(
                request,
                tableClient
            );
        }


        if (
            request.method ===
            "PUT"
        ) {

            return await updateMaterialPdf(
                request,
                tableClient
            );
        }

        
        return jsonResponse(
            405,
            {
                success: false,
                message:
                    "許可されていないリクエストです。"
            }
        );


    } catch (error) {

        context.error(
            "Manage materials API failed.",
            error
        );


        return jsonResponse(
            500,
            {
                success: false,
                message:
                    "資料管理処理中にエラーが発生しました。"
            }
        );
    }
}


/* =========================================
   Function Registration
========================================= */

app.http(
    "manage-materials",
    {

        methods: [
            "GET",
            "POST",
            "PUT"
        ],

        authLevel:
            "anonymous",

        route:
            "manage-materials",

        handler:
            manageMaterialsHandler
    }
);
