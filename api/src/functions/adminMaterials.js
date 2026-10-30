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
   Value Helpers
========================================= */

function getText(
    value
) {

    return String(
        value ?? ""
    ).trim();
}


function getDateText(
    value
) {

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

async function manageMaterialsHandler(
    request,
    context
) {

    context.log(
        "Manage materials API request received."
    );


    try {

        const connectionString =
            getConnectionString();


        const tableClient =
            TableClient.fromConnectionString(
                connectionString,
                MATERIALS_TABLE_NAME
            );


        /*
         * 管理画面では
         * published / draft の両方を取得します。
         */

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
                    getText(
                        entity.rowKey
                    ),

                title:
                    getText(
                        entity.title
                    ),

                category:
                    getText(
                        entity.category
                    ),

                categoryName:
                    getText(
                        entity.categoryName
                    ),

                summary:
                    getText(
                        entity.summary
                    ),

                description:
                    getText(
                        entity.description
                    ),

                originalFileName:
                    getText(
                        entity.originalFileName
                    ),

                status:
                    getText(
                        entity.status
                    ) || "draft",

                createdAtUtc:
                    getDateText(
                        entity.createdAtUtc
                    ),

                createdBy:
                    getText(
                        entity.createdBy
                    ),

                updatedAtUtc:
                    getDateText(
                        entity.updatedAtUtc
                    ),

                updatedBy:
                    getText(
                        entity.updatedBy
                    )
            });
        }


        /*
         * 現段階ではタイトル順。
         * 将来sortOrderを追加可能。
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

                success:
                    true,

                materials:
                    materials
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
                    "管理用資料一覧を取得できませんでした。"
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
            "GET"
        ],

        authLevel:
            "anonymous",

        route:
            "manage-materials",

        handler:
            manageMaterialsHandler
    }
);
