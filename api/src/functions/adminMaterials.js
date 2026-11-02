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
   Convert Entity To Material
========================================= */

function entityToMaterial(entity) {

    /*
     * Legacy資料では titleJa 等が無いので、
     * 管理画面で編集できるよう旧フィールドを
     * Japaneseへフォールバックします。
     */

    const title =
        normalizeText(
            entity.title,
            150
        );


    const summary =
        normalizeText(
            entity.summary,
            250
        );


    const description =
        normalizeText(
            entity.description,
            2000
        );


    return {

        id:
            normalizeText(
                entity.rowKey,
                128
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


        /* =================================
           Legacy
        ================================= */

        title:
            title,

        summary:
            summary,

        description:
            description,


        /* =================================
           English
        ================================= */

        titleEn:
            normalizeText(
                entity.titleEn,
                150
            ),

        summaryEn:
            normalizeText(
                entity.summaryEn,
                250
            ),

        descriptionEn:
            normalizeText(
                entity.descriptionEn,
                2000
            ),


        /* =================================
           Japanese
        ================================= */

        titleJa:
            normalizeText(
                entity.titleJa,
                150
            ) ||
            title,

        summaryJa:
            normalizeText(
                entity.summaryJa,
                250
            ) ||
            summary,

        descriptionJa:
            normalizeText(
                entity.descriptionJa,
                2000
            ),


        /* =================================
           File
        ================================= */

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


        /* =================================
           Status
        ================================= */

        status:
            normalizeText(
                entity.status,
                20
            ) || "draft",


        /* =================================
           Audit
        ================================= */

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
    };
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

        materials.push(
            entityToMaterial(
                entity
            )
        );
    }


    materials.sort(
        (a, b) => {

            const titleA =
                a.titleEn ||
                a.titleJa ||
                a.title;


            const titleB =
                b.titleEn ||
                b.titleJa ||
                b.title;


            return titleA.localeCompare(
                titleB,
                "en"
            );
        }
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

    /* =====================================
       English
    ===================================== */

    const titleEn =
        normalizeText(
            body?.titleEn,
            150
        );


    const summaryEn =
        normalizeText(
            body?.summaryEn,
            250
        );


    const descriptionEn =
        normalizeText(
            body?.descriptionEn,
            2000
        );


    /* =====================================
       Japanese
    ===================================== */

    const titleJa =
        normalizeText(
            body?.titleJa,
            150
        );


    const summaryJa =
        normalizeText(
            body?.summaryJa,
            250
        );


    const descriptionJa =
        normalizeText(
            body?.descriptionJa,
            2000
        );


    /* =====================================
       Common
    ===================================== */

    const category =
        normalizeText(
            body?.category,
            50
        );


    const status =
        normalizeText(
            body?.status,
            20
        ) || "draft";


    /* =====================================
       English Required
    ===================================== */

    if (!titleEn) {

        return {

            valid:
                false,

            message:
                "資料名（英語）を入力してください。"
        };
    }


    if (!summaryEn) {

        return {

            valid:
                false,

            message:
                "一覧用説明（英語）を入力してください。"
        };
    }


    /* =====================================
       Category Required
    ===================================== */

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


    /* =====================================
       Status
    ===================================== */

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


    /* =====================================
       Legacy Fields
    ===================================== */

    const legacyTitle =
        normalizeText(
            body?.title,
            150
        ) ||
        titleJa ||
        titleEn;


    const legacySummary =
        normalizeText(
            body?.summary,
            250
        ) ||
        summaryJa ||
        summaryEn;


    const legacyDescription =
        normalizeText(
            body?.description,
            2000
        ) ||
        descriptionJa ||
        summaryJa ||
        descriptionEn ||
        summaryEn;


    return {

        valid:
            true,

        value: {

            /* Legacy */

            title:
                legacyTitle,

            summary:
                legacySummary,

            description:
                legacyDescription,


            /* English */

            titleEn:
                titleEn,

            summaryEn:
                summaryEn,

            descriptionEn:
                descriptionEn,


            /* Japanese */

            titleJa:
                titleJa,

            summaryJa:
                summaryJa,

            descriptionJa:
                descriptionJa,


            /* Common */

            category:
                category,

            categoryName:
                CATEGORY_MAP[
                    category
                ],

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


        /* =================================
           Legacy
        ================================= */

        title:
            validation.value.title,

        summary:
            validation.value.summary,

        description:
            validation.value.description,


        /* =================================
           English
        ================================= */

        titleEn:
            validation.value.titleEn,

        summaryEn:
            validation.value.summaryEn,

        descriptionEn:
            validation.value.descriptionEn,


        /* =================================
           Japanese
        ================================= */

        titleJa:
            validation.value.titleJa,

        summaryJa:
            validation.value.summaryJa,

        descriptionJa:
            validation.value.descriptionJa,


        /* =================================
           Category
        ================================= */

        category:
            validation.value.category,

        categoryName:
            validation.value.categoryName,


        /* =================================
           Status
        ================================= */

        status:
            validation.value.status,


        /* =================================
           File
        ================================= */

        blobName:
            "",

        thumbnailBlobName:
            "",

        originalFileName:
            "",


        /* =================================
           Audit
        ================================= */

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

            material:
                entityToMaterial(
                    entity
                )
        }
    );
}


/* =========================================
   PUT
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
       English Title
    ===================================== */

    if (
        body?.titleEn !== undefined
    ) {

        const titleEn =
            normalizeText(
                body.titleEn,
                150
            );


        if (!titleEn) {

            return jsonResponse(
                400,
                {
                    success:
                        false,

                    message:
                        "資料名（英語）を入力してください。"
                }
            );
        }


        updateEntity.titleEn =
            titleEn;
    }


    /* =====================================
       English Summary
    ===================================== */

    if (
        body?.summaryEn !== undefined
    ) {

        const summaryEn =
            normalizeText(
                body.summaryEn,
                250
            );


        if (!summaryEn) {

            return jsonResponse(
                400,
                {
                    success:
                        false,

                    message:
                        "一覧用説明（英語）を入力してください。"
                }
            );
        }


        updateEntity.summaryEn =
            summaryEn;
    }


    /* =====================================
       English Description
       Optional
    ===================================== */

    if (
        body?.descriptionEn !== undefined
    ) {

        updateEntity.descriptionEn =
            normalizeText(
                body.descriptionEn,
                2000
            );
    }


    /* =====================================
       Japanese Title
       Optional
    ===================================== */

    if (
        body?.titleJa !== undefined
    ) {

        updateEntity.titleJa =
            normalizeText(
                body.titleJa,
                150
            );
    }


    /* =====================================
       Japanese Summary
       Optional
    ===================================== */

    if (
        body?.summaryJa !== undefined
    ) {

        updateEntity.summaryJa =
            normalizeText(
                body.summaryJa,
                250
            );
    }


    /* =====================================
       Japanese Description
       Optional
    ===================================== */

    if (
        body?.descriptionJa !== undefined
    ) {

        updateEntity.descriptionJa =
            normalizeText(
                body.descriptionJa,
                2000
            );
    }


    /* =====================================
       Legacy Title
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
                        "資料名が正しくありません。"
                }
            );
        }


        updateEntity.title =
            title;
    }


    /* =====================================
       Legacy Summary
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
                        "一覧用説明が正しくありません。"
                }
            );
        }


        updateEntity.summary =
            summary;
    }


    /* =====================================
       Legacy Description
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
                        "詳細説明が正しくありません。"
                }
            );
        }


        updateEntity.description =
            description;
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
       PDF / Thumbnail
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


        /* =================================
           PDF
        ================================= */

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


        /* =================================
           Thumbnail
        ================================= */

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


        /* =================================
           Published Validation
        ================================= */

        if (
            requestedStatus ===
            "published"
        ) {

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


    /* =====================================
       Read Updated Entity
    ===================================== */

    const updatedEntity =
        await tableClient.getEntity(
            "materials",
            materialId
        );


    return jsonResponse(
        200,
        {
            success:
                true,

            material:
                entityToMaterial(
                    updatedEntity
                )
        }
    );
}


/* =========================================
   DELETE
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
       Delete Entity
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

                titleEn:
                    normalizeText(
                        entity.titleEn,
                        150
                    ),

                titleJa:
                    normalizeText(
                        entity.titleJa,
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
