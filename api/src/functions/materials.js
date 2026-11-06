"use strict";


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
        materialId.length > 128
    ) {

        return false;
    }


    /*
     * 現在materialIdはUUID形式。
     *
     * 英数字とハイフン以外を
     * 公開レスポンスへ含めない。
     */

    return /^[A-Za-z0-9-]+$/
        .test(
            materialId
        );
}


/* =========================================
   Convert Entity To Public Material
========================================= */

function entityToPublicMaterial(
    entity
) {

    /*
     * =====================================
     * Identity
     * =====================================
     */

    const id =
        normalizeText(
            entity.rowKey,
            128
        );


    /*
     * IDが想定形式でない異常データは
     * 公開対象外。
     */

    if (
        !isValidMaterialId(
            id
        )
    ) {

        return null;
    }


    /*
     * =====================================
     * Legacy Fields
     * =====================================
     *
     * 既存資料との互換性維持用。
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


    /*
     * =====================================
     * English
     * =====================================
     */

    const titleEn =
        normalizeText(
            entity.titleEn,
            150
        );


    const summaryEn =
        normalizeText(
            entity.summaryEn,
            250
        );


    const descriptionEn =
        normalizeText(
            entity.descriptionEn,
            2000
        );


    /*
     * =====================================
     * Japanese
     * =====================================
     *
     * 既存資料にはtitleJa等が
     * 存在しない場合があるため、
     * Legacy値へフォールバック。
     */

    const titleJa =
        normalizeText(
            entity.titleJa,
            150
        ) ||
        title;


    const summaryJa =
        normalizeText(
            entity.summaryJa,
            250
        ) ||
        summary;


    const descriptionJa =
        normalizeText(
            entity.descriptionJa,
            2000
        );


    /*
     * =====================================
     * Category
     * =====================================
     */

    const category =
        normalizeText(
            entity.category,
            50
        ) ||
        "other";


    const categoryName =
        normalizeText(
            entity.categoryName,
            100
        );


    /*
     * =====================================
     * Public Response
     * =====================================
     *
     * 以下のみ公開。
     *
     * blobName
     * thumbnailBlobName
     * originalFileName
     * status
     * Storage情報
     * SAS
     * Audit情報
     *
     * 等は返却しない。
     */

    return {

        id,


        category,

        categoryName,


        /* Legacy */

        title,

        summary,

        description,


        /* English */

        titleEn,

        summaryEn,

        descriptionEn,


        /* Japanese */

        titleJa,

        summaryJa,

        descriptionJa
    };
}


/* =========================================
   Get Published Materials
========================================= */

async function getMaterials(
    tableClient
) {

    /*
     * =====================================
     * Published Only
     * =====================================
     *
     * 公開APIではpublished資料だけ取得。
     *
     * draft等はTable Storageから
     * 公開レスポンスへ出さない。
     */

    const entities =
        tableClient.listEntities({

            queryOptions: {

                filter:
                    "PartitionKey eq 'materials' " +
                    "and status eq 'published'"
            }
        });


    const materials =
        [];


    for await (
        const entity of entities
    ) {

        /*
         * 念のためAPI側でも
         * publishedを再確認。
         */

        const status =
            normalizeText(
                entity.status,
                20
            ).toLowerCase();


        if (
            status !==
            "published"
        ) {

            continue;
        }


        const material =
            entityToPublicMaterial(
                entity
            );


        /*
         * ID等が異常なデータは
         * 公開しない。
         */

        if (!material) {

            continue;
        }


        /*
         * 資料名が完全に存在しない
         * 異常データも公開しない。
         */

        if (
            !material.titleEn &&
            !material.titleJa &&
            !material.title
        ) {

            continue;
        }


        materials.push(
            material
        );
    }


    /*
     * =====================================
     * Sort
     * =====================================
     *
     * English titleを優先。
     *
     * 既存資料では
     * Japanese / Legacyへフォールバック。
     */

    materials.sort(
        (
            a,
            b
        ) => {

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

            materials
        }
    );
}


/* =========================================
   Handler
========================================= */

async function materialsHandler(
    request,
    context
) {

    context.log(
        "Public materials API request:",
        request.method
    );


    /*
     * =====================================
     * GET Only
     * =====================================
     */

    if (
        request.method !==
        "GET"
    ) {

        return jsonResponse(
            405,
            {

                success:
                    false,

                message:
                    "Method not allowed."
            }
        );
    }


    try {

        const connectionString =
            getConnectionString();


        const tableClient =
            TableClient
                .fromConnectionString(
                    connectionString,
                    MATERIALS_TABLE_NAME
                );


        return await getMaterials(
            tableClient
        );


    } catch (error) {

        /*
         * 詳細な内部エラーは
         * Azure Functions側ログのみ。
         *
         * 外部レスポンスへ
         * error.message / stack等は返さない。
         */

        context.error(
            "Public materials API failed.",
            error
        );


        return jsonResponse(
            500,
            {

                success:
                    false,

                message:
                    "資料情報を取得できませんでした。"
            }
        );
    }
}


/* =========================================
   Function Registration
========================================= */

app.http(
    "materials",
    {

        methods: [
            "GET"
        ],

        /*
         * 展示会来訪者向け公開APIのため
         * anonymous。
         */

        authLevel:
            "anonymous",

        route:
            "materials",

        handler:
            materialsHandler
    }
);
