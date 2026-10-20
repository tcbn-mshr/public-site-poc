"use strict";

const {
    app
} = require("@azure/functions");

const {
    TableClient
} = require("@azure/data-tables");


const TABLE_NAME = "Materials";


function jsonResponse(status, body) {

    return {
        status,

        headers: {
            "Content-Type":
                "application/json; charset=utf-8",

            "Cache-Control":
                "no-store"
        },

        jsonBody: body
    };
}


function getConnectionString() {

    const connectionString =
        process.env
            .DOWNLOAD_STORAGE_CONNECTION_STRING;

    if (!connectionString) {
        throw new Error(
            "Storage connection is not configured."
        );
    }

    return connectionString;
}


async function materialsHandler(
    request,
    context
) {

    context.log(
        "Materials API request received."
    );

    try {

        const connectionString =
            getConnectionString();

        const tableClient =
            TableClient.fromConnectionString(
                connectionString,
                TABLE_NAME
            );


        const materials = [];


        /*
         * published の資料だけ取得
         */

        const entities =
            tableClient.listEntities({
                queryOptions: {
                    filter:
                        "PartitionKey eq 'materials' " +
                        "and status eq 'published'"
                }
            });


        for await (
            const entity of entities
        ) {

            /*
             * blobNameは公開しません。
             */

            materials.push({
                id:
                    entity.rowKey,

                title:
                    entity.title || "",

                category:
                    entity.category || "",

                categoryName:
                    entity.categoryName || "",

                description:
                    entity.description || ""
            });
        }


        return jsonResponse(
            200,
            {
                success: true,
                materials
            }
        );


    } catch (error) {

        context.error(
            "Materials API failed.",
            error
        );


        return jsonResponse(
            500,
            {
                success: false,
                message:
                    "資料一覧を取得できませんでした。"
            }
        );
    }
}


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
