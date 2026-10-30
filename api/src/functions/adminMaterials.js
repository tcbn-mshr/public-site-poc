"use strict";

const {
    app
} = require("@azure/functions");


app.http(
    "adminmaterials",
    {
        methods: [
            "GET"
        ],

        authLevel:
            "anonymous",

        handler:
            async (request, context) => {

                context.log(
                    "adminmaterials test API called."
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
                            "adminmaterials function is working."
                    }
                };
            }
    }
);
