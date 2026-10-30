"use strict";

const {
    app
} = require("@azure/functions");


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
            async (request, context) => {

                context.log(
                    "Manage materials test API called."
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
                            "Manage Materials API is working."
                    }
                };
            }
    }
);
