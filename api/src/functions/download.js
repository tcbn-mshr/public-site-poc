"use strict";

const crypto = require("crypto");

const {
    app
} = require("@azure/functions");

const {
    TableClient
} = require("@azure/data-tables");

const {
    BlobServiceClient,
    BlobSASPermissions
} = require("@azure/storage-blob");


/* =========================================
   Constants
========================================= */

const DEFAULT_TABLE_NAME =
    "DownloadLogs";

const DEFAULT_CONTAINER_NAME =
    "files";

const DEFAULT_SAS_MINUTES =
    5;


/* =========================================
   Response helpers
========================================= */

function jsonResponse(
    status,
    body
) {
    return {
        status: status,

        headers: {
            "Content-Type":
                "application/json; charset=utf-8",

            "Cache-Control":
                "no-store"
        },

        jsonBody: body
    };
}


/* =========================================
   Input helpers
========================================= */

function normalizeString(
    value,
    maximumLength
) {
    if (typeof value !== "string") {
        return "";
    }

    return value
        .trim()
        .slice(0, maximumLength);
}


function isValidEmail(
    emailAddress
) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        .test(emailAddress);
}


/* =========================================
   Material map
========================================= */

/*
 * ブラウザーから送られたファイル名は信用せず、
 * materialIdからAPI側でBlob名を解決します。
 *
 * Azure Static Web AppsのApplication setting:
 *
 * MATERIAL_MAP_JSON
 * {"material-1":"テスト.pdf"}
 */

function getMaterialMap() {

    const materialMapJson =
        process.env.MATERIAL_MAP_JSON;

    if (!materialMapJson) {
        throw new Error(
            "MATERIAL_MAP_JSON is not configured."
        );
    }

    let materialMap;

    try {
        materialMap =
            JSON.parse(materialMapJson);

    } catch {
        throw new Error(
            "MATERIAL_MAP_JSON is invalid."
        );
    }

    if (
        !materialMap ||
        typeof materialMap !== "object" ||
        Array.isArray(materialMap)
    ) {
        throw new Error(
            "MATERIAL_MAP_JSON must be an object."
        );
    }

    return materialMap;
}


/* =========================================
   Azure clients
========================================= */

function getStorageConnectionString() {

    const connectionString =
        process.env
            .DOWNLOAD_STORAGE_CONNECTION_STRING;

    if (!connectionString) {
        throw new Error(
            "DOWNLOAD_STORAGE_CONNECTION_STRING " +
            "is not configured."
        );
    }

    return connectionString;
}


function getTableClient(
    connectionString
) {
    const tableName =
        process.env.DOWNLOAD_LOG_TABLE ||
        DEFAULT_TABLE_NAME;

    return TableClient.fromConnectionString(
        connectionString,
        tableName
    );
}


function getContainerClient(
    connectionString
) {
    const containerName =
        process.env.DOWNLOAD_CONTAINER ||
        DEFAULT_CONTAINER_NAME;

    const blobServiceClient =
        BlobServiceClient.fromConnectionString(
            connectionString
        );

    return blobServiceClient
        .getContainerClient(containerName);
}


/* =========================================
   Download log
========================================= */

async function saveDownloadLog({
    tableClient,
    materialId,
    blobName,
    company,
    customerName,
    email,
    consent,
    request
}) {

    /*
     * PartitionKey:
     * 資料単位で履歴を検索できるようmaterialIdを使用
     *
     * RowKey:
     * 時刻とUUIDを組み合わせて重複を防止
     */

    const now =
        new Date();

    const rowKey =
        `${now.toISOString()}_${crypto.randomUUID()}`;

    const forwardedFor =
        request.headers.get(
            "x-forwarded-for"
        ) || "";

    const userAgent =
        request.headers.get(
            "user-agent"
        ) || "";

    const entity = {
        partitionKey:
            materialId,

        rowKey:
            rowKey,

        materialId:
            materialId,

        blobName:
            blobName,

        company:
            company,

        customerName:
            customerName,

        email:
            email,

        consent:
            consent,

        downloadedAtUtc:
            now.toISOString(),

        sourceIp:
            forwardedFor.slice(0, 200),

        userAgent:
            userAgent.slice(0, 500)
    };

    await tableClient.createEntity(
        entity
    );
}


/* =========================================
   Temporary download address
========================================= */

async function createDownloadUrl({
    containerClient,
    blobName
}) {

    const blobClient =
        containerClient.getBlobClient(
            blobName
        );

    /*
     * 対象Blobが存在するかを確認します。
     */

    const exists =
        await blobClient.exists();

    if (!exists) {
        const error =
            new Error(
                "対象資料が見つかりません。"
            );

        error.code =
            "MaterialNotFound";

        throw error;
    }


    const configuredMinutes =
        Number(
            process.env.DOWNLOAD_SAS_MINUTES
        );

    const sasMinutes =
        Number.isFinite(configuredMinutes) &&
        configuredMinutes > 0 &&
        configuredMinutes <= 60
            ? configuredMinutes
            : DEFAULT_SAS_MINUTES;


    const startsOn =
        new Date(
            Date.now() - 60 * 1000
        );

    const expiresOn =
        new Date(
            Date.now() +
            sasMinutes * 60 * 1000
        );


    /*
     * APIが使用しているBlobClientは
     * Storage接続文字列から生成されているため、
     * 読み取り専用SAS URLを生成できます。
     */

    return blobClient.generateSasUrl({
        permissions:
            BlobSASPermissions.parse("r"),

        startsOn:
            startsOn,

        expiresOn:
            expiresOn,

        contentDisposition:
            `attachment; filename*=UTF-8''` +
            encodeURIComponent(blobName),

        contentType:
            "application/pdf"
    });
}


/* =========================================
   HTTP handler
========================================= */

async function downloadHandler(
    request,
    context
) {

    context.log(
        "Download API request received."
    );


    /*
     * POST以外を拒否します。
     */

    if (request.method !== "POST") {
        return jsonResponse(
            405,
            {
                success: false,
                message:
                    "許可されていないリクエストです。"
            }
        );
    }


    let body;

    try {
        body =
            await request.json();

    } catch {
        return jsonResponse(
            400,
            {
                success: false,
                message:
                    "リクエスト形式が正しくありません。"
            }
        );
    }


    const materialId =
        normalizeString(
            body.materialId,
            100
        );

    const company =
        normalizeString(
            body.company,
            100
        );

    const customerName =
        normalizeString(
            body.name,
            100
        );

    const email =
        normalizeString(
            body.email,
            254
        )
            .toLowerCase();

    const consent =
        body.consent === true;


    /*
     * API側でも必ず検証します。
     * フロントエンドの検証だけでは不十分です。
     */

    if (!materialId) {
        return jsonResponse(
            400,
            {
                success: false,
                message:
                    "対象資料を特定できません。"
            }
        );
    }

    if (!company) {
        return jsonResponse(
            400,
            {
                success: false,
                message:
                    "会社名を入力してください。"
            }
        );
    }

    if (!customerName) {
        return jsonResponse(
            400,
            {
                success: false,
                message:
                    "氏名を入力してください。"
            }
        );
    }

    if (
        !email ||
        !isValidEmail(email)
    ) {
        return jsonResponse(
            400,
            {
                success: false,
                message:
                    "メールアドレスの形式を確認してください。"
            }
        );
    }

    if (!consent) {
        return jsonResponse(
            400,
            {
                success: false,
                message:
                    "個人情報の取り扱いへの同意が必要です。"
            }
        );
    }


    try {

        const materialMap =
            getMaterialMap();

        const blobName =
            materialMap[materialId];


        /*
         * materialIdは、API側で設定された
         * 資料マスターに存在するものだけ許可します。
         */

        if (
            typeof blobName !== "string" ||
            !blobName.trim()
        ) {
            return jsonResponse(
                404,
                {
                    success: false,
                    message:
                        "対象資料が登録されていません。"
                }
            );
        }


        const connectionString =
            getStorageConnectionString();


        /*
         * Azure Table Storage
         */

        const tableClient =
            getTableClient(
                connectionString
            );

        /*
         * テーブルが未作成の場合に作成します。
         * 既に存在する場合は409を無視します。
         */

        try {
            await tableClient.createTable();

        } catch (error) {
            if (
                error.statusCode !== 409
            ) {
                throw error;
            }
        }


        /*
         * Azure Blob Storage
         */

        const containerClient =
            getContainerClient(
                connectionString
            );


        /*
         * SASを先に生成し、対象Blobが存在することを確認。
         */

        const downloadUrl =
            await createDownloadUrl({
                containerClient:
                    containerClient,

                blobName:
                    blobName
            });


        /*
         * PDF配布前に履歴を保存します。
         * 保存に失敗した場合はURLを返しません。
         */

        await saveDownloadLog({
            tableClient:
                tableClient,

            materialId:
                materialId,

            blobName:
                blobName,

            company:
                company,

            customerName:
                customerName,

            email:
                email,

            consent:
                consent,

            request:
                request
        });


        return jsonResponse(
            200,
            {
                success: true,
                downloadUrl:
                    downloadUrl
            }
        );


    } catch (error) {

        context.error(
            "Download API failed.",
            error
        );


        if (
            error.code ===
            "MaterialNotFound"
        ) {
            return jsonResponse(
                404,
                {
                    success: false,
                    message:
                        "対象資料が見つかりません。"
                }
            );
        }


        return jsonResponse(
            500,
            {
                success: false,
                message:
                    "ダウンロード処理に失敗しました。"
            }
        );
    }
}


/* =========================================
   Function registration
========================================= */

app.http(
    "download",
    {
        methods: [
            "POST"
        ],

        authLevel:
            "anonymous",

        route:
            "download",

        handler:
            downloadHandler
    }
);
