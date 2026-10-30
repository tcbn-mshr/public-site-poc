"use strict";

const {
    app
} = require("@azure/functions");


async function adminMaterialsHandler(
    request,
    context
) {

    context.log(
        "Admin materials test API called."
    );


    return {

        status: 200,

        headers: {

            "Content-Type":
                "application/json; charset=utf-8",

            "Cache-Control":
                "no-store"
        },

        jsonBody: {

            success: true,

            message:
                "Admin Materials API is working."
        }
    };
}


app.http(
    "admin-materials",
    {
        methods: [
            "GET"
        ],

        authLevel:
            "anonymous",

        route:
            "admin-materials",

        handler:
            adminMaterialsHandler
    }
);
