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
   Response helper
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
   Date helper
========================================= */

function toIsoString(value) {

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
   Handler
========================================= */

async function adminMaterialsHandler(
    request,
    context
) {

    context.log(
        "Admin materials API request received."
    );


    try {

        const connectionString =
            getConnectionString();


        const tableClient =
            TableClient.fromConnectionString(
                connectionString,
                MATERIALS_TABLE_NAME
            );


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
                    String(
                        entity.rowKey || ""
                    ),

                title:
                    String(
                        entity.title || ""
                    ),

                category:
                    String(
                        entity.category || ""
                    ),

                categoryName:
                    String(
                        entity.categoryName || ""
                    ),

                summary:
                    String(
                        entity.summary || ""
                    ),

                description:
                    String(
                        entity.description || ""
                    ),

                originalFileName:
                    String(
                        entity.originalFileName || ""
                    ),

                status:
                    String(
                        entity.status || "draft"
                    ),

                createdAtUtc:
                    toIsoString(
                        entity.createdAtUtc
                    ),

                createdBy:
                    String(
                        entity.createdBy || ""
                    ),

                updatedAtUtc:
                    toIsoString(
                        entity.updatedAtUtc
                    ),

                updatedBy:
                    String(
                        entity.updatedBy || ""
                    )
            });
        }


        /*
         * タイトルで並べます。
         * 将来 sortOrder を追加して変更可能。
         */

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


    } catch (error) {

        context.error(
            "Admin materials API failed.",
            error
        );


        return jsonResponse(
            500,
            {
                success: false,
                message:
                    "管理用資料一覧を取得できませんでした。"
            }
        );
    }
}


/* =========================================
   Function registration
========================================= */

app.http(
    "admin-materials",
    {
        methods: [
            "GET"
        ],

        authLevel:
            "anonymous",

        route:
            "admin/materials",

        handler:
            adminMaterialsHandler
    }
);
