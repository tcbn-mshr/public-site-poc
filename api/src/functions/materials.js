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
   Convert Entity To Public Material
========================================= */

function entityToPublicMaterial(
    entity
) {

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
     * 既存資料にはtitleJa等が存在しないため、
     * Legacy値へフォールバックします。
     *
     * 新しい資料で日本語を意図的に未入力にした
     * 場合は、legacy側もadmin-edit.jsによって
     * Englishが保存されているため、
     * 公開画面は空欄になりません。
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


    return {

        /* =================================
           Identity
        ================================= */

        id:
            normalizeText(
                entity.rowKey,
                128
            ),


        /* =================================
           Category
        ================================= */

        category:
            normalizeText(
                entity.category,
                50
            ) || "other",

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
            titleEn,

        summaryEn:
            summaryEn,

        descriptionEn:
            descriptionEn,


        /* =================================
           Japanese
        ================================= */

        titleJa:
            titleJa,

        summaryJa:
            summaryJa,

        descriptionJa:
            descriptionJa
    };
}


/* =========================================
   GET Materials
========================================= */

async function getMaterials(
    tableClient
) {

    /*
     * 公開サイトなので、
     * publishedの資料だけ取得します。
     */

    const entities =
        tableClient.listEntities({

            queryOptions: {

                filter:
                    "PartitionKey eq 'materials' " +
                    "and status eq 'published'"
            }
        });


    const materials = [];


    for await (
        const entity of entities
    ) {

        const material =
            entityToPublicMaterial(
                entity
            );


        /*
         * IDがない異常データは
         * 公開レスポンスへ含めません。
         */

        if (!material.id) {
            continue;
        }


        /*
         * 新仕様ではEnglishが基本ですが、
         * 既存資料との互換性を維持するため、
         * Legacy titleがある資料も公開します。
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
     * English titleを優先してソート。
     *
     * 既存資料ではJapanese / Legacyへ
     * フォールバックします。
     */

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
     * 公開APIはGET専用。
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

        authLevel:
            "anonymous",

        route:
            "materials",

        handler:
            materialsHandler
    }
);
