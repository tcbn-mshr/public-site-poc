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
   Blob Utility
========================================= */

function getBlobContainerClient(
    connectionString
) {

    const blobServiceClient =
        BlobServiceClient
            .fromConnectionString(
                connectionString
            );


    return blobServiceClient
        .getContainerClient(
            getContainerName()
        );
}


async function blobExists(
    connectionString,
    blobName
) {

    if (!blobName) {
        return false;
    }


    const containerClient =
        getBlobContainerClient(
            connectionString
        );


    const blobClient =
        containerClient
            .getBlobClient(
                blobName
            );


    return await blobClient.exists();
}


async function deleteBlobIfExists(
    connectionString,
    blobName
) {

    if (!blobName) {
        return;
    }


    const containerClient =
        getBlobContainerClient(
            connectionString
        );


    const blobClient =
        containerClient
            .getBlobClient(
                blobName
            );


    await blobClient.deleteIfExists({

        deleteSnapshots:
            "include"
    });
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

            thumbnailBlobName:
                normalizeText(
                    entity.thumbnailBlobName,
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
            success:
                true,

            materials:
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
            valid:
                false,

            message:
                "資料名を入力してください。"
        };
    }


    if (
        !Object.prototype
            .hasOwnProperty.call(
                CATEGORY_MAP,
                category
            )
    ) {

        return {
            valid:
                false,

            message:
                "カテゴリーを確認してください。"
        };
    }


    if (!summary) {

        return {
            valid:
                false,

            message:
                "一覧用説明を入力してください。"
        };
    }


    if (!description) {

        return {
            valid:
                false,

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
            valid:
                false,

            message:
                "公開状態を確認してください。"
        };
    }


    return {

        valid:
            true,

        value: {

            title:
                title,

            category:
                category,

            categoryName:
                CATEGORY_MAP[
                    category
                ],

            summary:
                summary,

            description:
                description,

            status:
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
                success:
                    false,

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
                success:
                    false,

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

        /*
         * PDF / thumbnailは
         * アップロード完了後にPUTで設定。
         */

        blobName:
            "",

        thumbnailBlobName:
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
   PUT - Update Material
========================================= */

async function updateMaterial(
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
                success:
                    false,

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


    /* =====================================
       Existing Material
    ===================================== */

    let currentEntity;


    try {

        currentEntity =
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
                    success:
                        false,

                    message:
                        "対象資料が見つかりません。"
                }
            );
        }


        throw error;
    }


    /* =====================================
       Merge Entity
    ===================================== */

    const updateEntity = {

        partitionKey:
            "materials",

        rowKey:
            materialId,

        updatedAtUtc:
            new Date()
                .toISOString()
    };


    /* =====================================
       Title
    ===================================== */

    if (
        body?.title !== undefined
    ) {

        const title =
            normalizeText(
                body.title,
                150
            );


        if (!title) {

            return jsonResponse(
                400,
                {
                    success:
                        false,

                    message:
                        "資料名を入力してください。"
                }
            );
        }


        updateEntity.title =
            title;
    }


    /* =====================================
       Category
    ===================================== */

    if (
        body?.category !== undefined
    ) {

        const category =
            normalizeText(
                body.category,
                50
            );


        if (
            !Object.prototype
                .hasOwnProperty.call(
                    CATEGORY_MAP,
                    category
                )
        ) {

            return jsonResponse(
                400,
                {
                    success:
                        false,

                    message:
                        "カテゴリーを確認してください。"
                }
            );
        }


        updateEntity.category =
            category;


        updateEntity.categoryName =
            CATEGORY_MAP[
                category
            ];
    }


    /* =====================================
       Summary
    ===================================== */

    if (
        body?.summary !== undefined
    ) {

        const summary =
            normalizeText(
                body.summary,
                250
            );


        if (!summary) {

            return jsonResponse(
                400,
                {
                    success:
                        false,

                    message:
                        "一覧用説明を入力してください。"
                }
            );
        }


        updateEntity.summary =
            summary;
    }


    /* =====================================
       Description
    ===================================== */

    if (
        body?.description !== undefined
    ) {

        const description =
            normalizeText(
                body.description,
                2000
            );


        if (!description) {

            return jsonResponse(
                400,
                {
                    success:
                        false,

                    message:
                        "詳細説明を入力してください。"
                }
            );
        }


        updateEntity.description =
            description;
    }


    /* =====================================
       PDF / Thumbnail Information
    ===================================== */

    if (
        body?.blobName !== undefined ||
        body?.originalFileName !== undefined ||
        body?.thumbnailBlobName !== undefined
    ) {

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


        const thumbnailBlobName =
            normalizeText(
                body?.thumbnailBlobName,
                500
            );


        /*
         * PDF information
         */

        if (
            body?.blobName !== undefined ||
            body?.originalFileName !== undefined
        ) {

            if (
                !blobName ||
                !originalFileName
            ) {

                return jsonResponse(
                    400,
                    {
                        success:
                            false,

                        message:
                            "PDF情報が正しくありません。"
                    }
                );
            }


            const expectedBlobName =
                `materials/${materialId}/document.pdf`;


            if (
                blobName !==
                expectedBlobName
            ) {

                return jsonResponse(
                    400,
                    {
                        success:
                            false,

                        message:
                            "Blob名が正しくありません。"
                    }
                );
            }


            if (
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


            updateEntity.blobName =
                blobName;


            updateEntity.originalFileName =
                originalFileName;
        }


        /*
         * Thumbnail information
         */

        if (
            body?.thumbnailBlobName !==
            undefined
        ) {

            if (!thumbnailBlobName) {

                return jsonResponse(
                    400,
                    {
                        success:
                            false,

                        message:
                            "サムネイル情報が正しくありません。"
                    }
                );
            }


            const expectedThumbnailBlobName =
                `materials/${materialId}/thumbnail.jpg`;


            if (
                thumbnailBlobName !==
                expectedThumbnailBlobName
            ) {

                return jsonResponse(
                    400,
                    {
                        success:
                            false,

                        message:
                            "サムネイルBlob名が正しくありません。"
                    }
                );
            }


            updateEntity.thumbnailBlobName =
                thumbnailBlobName;
        }
    }


    /* =====================================
       Status
    ===================================== */

    if (
        body?.status !== undefined
    ) {

        const requestedStatus =
            normalizeText(
                body.status,
                20
            );


        if (
            !VALID_STATUS.has(
                requestedStatus
            )
        ) {

            return jsonResponse(
                400,
                {
                    success:
                        false,

                    message:
                        "公開状態を確認してください。"
                }
            );
        }


        /*
         * 公開する場合は
         * PDFの登録・実在を確認。
         */

        if (
            requestedStatus ===
            "published"
        ) {

            /*
             * 同じPUTでblobName更新と
             * status更新が来る場合にも対応。
             */

            const effectiveBlobName =
                normalizeText(
                    updateEntity.blobName ||
                    currentEntity.blobName,
                    500
                );


            if (!effectiveBlobName) {

                return jsonResponse(
                    400,
                    {
                        success:
                            false,

                        message:
                            "PDFが登録されていないため公開できません。"
                    }
                );
            }


            const connectionString =
                getConnectionString();


            const exists =
                await blobExists(
                    connectionString,
                    effectiveBlobName
                );


            if (!exists) {

                return jsonResponse(
                    400,
                    {
                        success:
                            false,

                        message:
                            "PDFファイルがBlob Storageに存在しないため公開できません。"
                    }
                );
            }
        }


        updateEntity.status =
            requestedStatus;
    }


    /* =====================================
       Merge Update
    ===================================== */

    await tableClient.updateEntity(
        updateEntity,
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
                    normalizeText(
                        updateEntity.blobName ||
                        currentEntity.blobName,
                        500
                    ),

                thumbnailBlobName:
                    normalizeText(
                        updateEntity.thumbnailBlobName ||
                        currentEntity.thumbnailBlobName,
                        500
                    ),

                originalFileName:
                    normalizeText(
                        updateEntity.originalFileName ||
                        currentEntity.originalFileName,
                        255
                    ),

                updatedAtUtc:
                    updateEntity.updatedAtUtc
            }
        }
    );
}


/* =========================================
   DELETE - Material
========================================= */

async function deleteMaterial(
    request,
    tableClient,
    connectionString
) {

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


    const materialId =
        normalizeText(
            body?.id,
            128
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


    /* =====================================
       Get Material
    ===================================== */

    let entity;


    try {

        entity =
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
                    success:
                        false,

                    message:
                        "対象資料が見つかりません。"
                }
            );
        }


        throw error;
    }


    const blobName =
        normalizeText(
            entity.blobName,
            500
        );


    const thumbnailBlobName =
        normalizeText(
            entity.thumbnailBlobName,
            500
        );


    /* =====================================
       Delete PDF
    ===================================== */

    await deleteBlobIfExists(
        connectionString,
        blobName
    );


    /* =====================================
       Delete Thumbnail
    ===================================== */

    await deleteBlobIfExists(
        connectionString,
        thumbnailBlobName
    );


    /* =====================================
       Delete Materials Entity
    ===================================== */

    await tableClient.deleteEntity(
        "materials",
        materialId
    );


    return jsonResponse(
        200,
        {
            success:
                true,

            deletedMaterial: {

                id:
                    materialId,

                title:
                    normalizeText(
                        entity.title,
                        150
                    ),

                blobName:
                    blobName,

                thumbnailBlobName:
                    thumbnailBlobName
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
            TableClient
                .fromConnectionString(
                    connectionString,
                    MATERIALS_TABLE_NAME
                );


        /* =================================
           GET
        ================================= */

        if (
            request.method ===
            "GET"
        ) {

            return await getMaterials(
                tableClient
            );
        }


        /* =================================
           POST
        ================================= */

        if (
            request.method ===
            "POST"
        ) {

            return await createMaterial(
                request,
                tableClient
            );
        }


        /* =================================
           PUT
        ================================= */

        if (
            request.method ===
            "PUT"
        ) {

            return await updateMaterial(
                request,
                tableClient
            );
        }


        /* =================================
           DELETE
        ================================= */

        if (
            request.method ===
            "DELETE"
        ) {

            return await deleteMaterial(
                request,
                tableClient,
                connectionString
            );
        }


        return jsonResponse(
            405,
            {
                success:
                    false,

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
                success:
                    false,

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
            "PUT",
            "DELETE"
        ],

        authLevel:
            "anonymous",

        route:
            "manage-materials",

        handler:
            manageMaterialsHandler
    }
);
