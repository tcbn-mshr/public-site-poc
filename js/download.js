"use strict";


/* =========================================
   Configuration
========================================= */

const MATERIALS_API_URL =
    "/api/materials";

const DOWNLOAD_API_URL =
    "/api/download";

const MATERIAL_THUMBNAIL_API_URL =
    "/api/material-thumbnail";


/* =========================================
   DOM Elements
========================================= */

const pageLoadingElement =
    document.getElementById(
        "download-page-loading"
    );


const pageErrorElement =
    document.getElementById(
        "download-page-error"
    );


const contentElement =
    document.getElementById(
        "download-content"
    );


const categoryTopElement =
    document.getElementById(
        "download-category-top"
    );


const documentTitleElement =
    document.getElementById(
        "selected-document-title"
    );


const documentDescriptionElement =
    document.getElementById(
        "selected-document-description"
    );


const backLinkElement =
    document.getElementById(
        "back-to-material"
    );


const thumbnailElement =
    document.getElementById(
        "selected-document-thumbnail"
    );


const pdfFallbackElement =
    document.getElementById(
        "selected-document-pdf"
    );


const submitButton =
    document.getElementById(
        "download-submit"
    );


const submitLabelElement =
    document.getElementById(
        "download-submit-label"
    );


const processingElement =
    document.getElementById(
        "download-processing"
    );


const successElement =
    document.getElementById(
        "download-success"
    );


const apiErrorElement =
    document.getElementById(
        "download-error"
    );


/* =========================================
   State
========================================= */

let currentMaterial =
    null;


/* =========================================
   Utility
========================================= */

function normalizeText(
    value
) {

    return String(
        value ?? ""
    ).trim();
}


function firstText(
    ...values
) {

    for (
        const value of values
    ) {

        const text =
            normalizeText(
                value
            );


        if (text) {

            return text;
        }
    }


    return "";
}


function hideElement(
    element
) {

    if (element) {

        element.hidden =
            true;
    }
}


function showElement(
    element
) {

    if (element) {

        element.hidden =
            false;
    }
}


/* =========================================
   Current Language
========================================= */

function getLanguage() {

    if (
        typeof getCurrentLanguage ===
        "function"
    ) {

        const language =
            getCurrentLanguage();


        if (
            language === "ja" ||
            language === "en"
        ) {

            return language;
        }
    }


    return "en";
}


/* =========================================
   URL Parameter
========================================= */

function getMaterialId() {

    const params =
        new URLSearchParams(
            window.location.search
        );


    return normalizeText(
        params.get("id")
    );
}


/* =========================================
   Normalize Material
========================================= */

function normalizeMaterial(
    material
) {

    return {

        id:
            normalizeText(
                material?.id
            ),


        /* =================================
           Category
        ================================= */

        category:
            normalizeText(
                material?.category
            ) || "other",

        categoryName:
            normalizeText(
                material?.categoryName
            ) || "その他",


        /* =================================
           Legacy
        ================================= */

        title:
            normalizeText(
                material?.title
            ),

        summary:
            normalizeText(
                material?.summary
            ),

        description:
            normalizeText(
                material?.description
            ),


        /* =================================
           English
        ================================= */

        titleEn:
            normalizeText(
                material?.titleEn
            ),

        summaryEn:
            normalizeText(
                material?.summaryEn
            ),

        descriptionEn:
            normalizeText(
                material?.descriptionEn
            ),


        /* =================================
           Japanese
        ================================= */

        titleJa:
            normalizeText(
                material?.titleJa
            ),

        summaryJa:
            normalizeText(
                material?.summaryJa
            ),

        descriptionJa:
            normalizeText(
                material?.descriptionJa
            )
    };
}


/* =========================================
   Localized Title
========================================= */

function getLocalizedTitle(
    material
) {

    const language =
        getLanguage();


    /*
     * English
     *
     * 1. titleEn
     * 2. Legacy title
     */

    if (
        language === "en"
    ) {

        return firstText(

            material.titleEn,

            material.title
        );
    }


    /*
     * Japanese
     *
     * 1. titleJa
     * 2. titleEn
     * 3. Legacy title
     */

    return firstText(

        material.titleJa,

        material.titleEn,

        material.title
    );
}


/* =========================================
   Localized Summary
========================================= */

function getLocalizedSummary(
    material
) {

    const language =
        getLanguage();


    /*
     * English
     *
     * 1. summaryEn
     * 2. Legacy summary
     */

    if (
        language === "en"
    ) {

        return firstText(

            material.summaryEn,

            material.summary
        );
    }


    /*
     * Japanese
     *
     * 1. summaryJa
     * 2. summaryEn
     * 3. Legacy summary
     */

    return firstText(

        material.summaryJa,

        material.summaryEn,

        material.summary
    );
}


/* =========================================
   Localized Category
========================================= */

function getLocalizedCategoryName(
    material
) {

    const language =
        getLanguage();


    const category =
        normalizeText(
            material?.category
        );


    const categoryNames = {

        electronics: {

            en:
                "Information & Electronics",

            ja:
                "情報電子"
        },


        chemicals: {

            en:
                "Chemicals",

            ja:
                "化学品"
        },


        life: {

            en:
                "Life Industry",

            ja:
                "生活産業"
        },


        plastics: {

            en:
                "Plastics",

            ja:
                "合成樹脂"
        },


        other: {

            en:
                "Other",

            ja:
                "その他"
        }
    };


    return firstText(

        categoryNames?.[
            category
        ]?.[
            language
        ],

        material.categoryName,

        category
    );
}


/* =========================================
   Page State
========================================= */

function showPageLoading() {

    showElement(
        pageLoadingElement
    );


    hideElement(
        pageErrorElement
    );


    hideElement(
        contentElement
    );
}


function showPageError() {

    hideElement(
        pageLoadingElement
    );


    hideElement(
        contentElement
    );


    showElement(
        pageErrorElement
    );
}


function showPageContent() {

    hideElement(
        pageLoadingElement
    );


    hideElement(
        pageErrorElement
    );


    showElement(
        contentElement
    );
}


/* =========================================
   Processing State
========================================= */

function setProcessing(
    isProcessing
) {

    if (submitButton) {

        submitButton.disabled =
            isProcessing;
    }


    if (submitLabelElement) {

        if (
            typeof translate ===
            "function"
        ) {

            submitLabelElement.textContent =
                isProcessing
                    ? translate(
                        "download.processing"
                    )
                    : translate(
                        "download.submit"
                    );


        } else {

            submitLabelElement.textContent =
                isProcessing
                    ? "Preparing..."
                    : "Download Material";
        }
    }


    if (isProcessing) {

        showElement(
            processingElement
        );


    } else {

        hideElement(
            processingElement
        );
    }
}


/* =========================================
   Messages
========================================= */

function clearMessages() {

    hideElement(
        apiErrorElement
    );


    hideElement(
        successElement
    );
}


function showApiError(
    message
) {

    if (!apiErrorElement) {

        return;
    }


    apiErrorElement.textContent =
        message ||
        (
            typeof translate ===
            "function"
                ? translate(
                    "download.apiError"
                )
                : "Unable to start the download."
        );


    showElement(
        apiErrorElement
    );
}


/* =========================================
   Materials API
========================================= */

async function fetchMaterials() {

    const response =
        await fetch(
            MATERIALS_API_URL,
            {
                method:
                    "GET",

                headers: {

                    "Accept":
                        "application/json"
                },

                cache:
                    "no-store"
            }
        );


    if (!response.ok) {

        throw new Error(
            "Materials API HTTP error: " +
            response.status
        );
    }


    let result;


    try {

        result =
            await response.json();


    } catch {

        throw new Error(
            "Invalid materials API response."
        );
    }


    if (
        result?.success !== true ||
        !Array.isArray(
            result.materials
        )
    ) {

        throw new Error(
            result?.message ||
            "Invalid materials response."
        );
    }


    return result.materials;
}


/* =========================================
   Find Material
========================================= */

async function getMaterial(
    materialId
) {

    const materials =
        await fetchMaterials();


    return materials
        .map(
            normalizeMaterial
        )
        .find(
            (material) =>
                material.id ===
                materialId
        ) || null;
}


/* =========================================
   Render Thumbnail
========================================= */

function renderThumbnail(
    material
) {

    if (
        !thumbnailElement ||
        !pdfFallbackElement
    ) {

        return;
    }


    /*
     * 初期状態
     *
     * PDFフォールバックを先に表示。
     * Thumbnail取得成功時のみ画像へ切替。
     */

    thumbnailElement.hidden =
        true;


    pdfFallbackElement.hidden =
        false;


    /*
     * 前回のイベントとsrcをリセット。
     */

    thumbnailElement.onload =
        null;


    thumbnailElement.onerror =
        null;


    thumbnailElement.removeAttribute(
        "src"
    );


    /*
     * Thumbnail読込成功
     */

    thumbnailElement.onload =
        () => {

            thumbnailElement.hidden =
                false;


            pdfFallbackElement.hidden =
                true;
        };


    /*
     * Thumbnail無し / 404 /
     * その他の読込エラー
     */

    thumbnailElement.onerror =
        () => {

            thumbnailElement.hidden =
                true;


            pdfFallbackElement.hidden =
                false;
        };


    /*
     * Public Thumbnail API
     */

    thumbnailElement.src =
        MATERIAL_THUMBNAIL_API_URL +
        "?id=" +
        encodeURIComponent(
            material.id
        );
}


/* =========================================
   Render Material
========================================= */

function renderMaterial(
    material
) {

    if (!material) {

        return;
    }


    /* =====================================
       Thumbnail
    ===================================== */

    renderThumbnail(
        material
    );


    const language =
        getLanguage();


    /* =====================================
       Localized Values
    ===================================== */

    const localizedTitle =
        getLocalizedTitle(
            material
        );


    const localizedSummary =
        getLocalizedSummary(
            material
        );


    const localizedCategoryName =
        getLocalizedCategoryName(
            material
        );


    /* =====================================
       Hero Category
    ===================================== */

    if (categoryTopElement) {

        categoryTopElement.textContent =
            localizedCategoryName;
    }


    /* =====================================
       Selected Document Title
    ===================================== */

    if (documentTitleElement) {

        documentTitleElement.textContent =
            localizedTitle;
    }


    /* =====================================
       Selected Document Summary
    ===================================== */

    if (documentDescriptionElement) {

        documentDescriptionElement.textContent =
            localizedSummary ||
            (
                language === "ja"
                    ? "選択した資料をダウンロードします。"
                    : "Download the selected material."
            );
    }


    /* =====================================
       Back To Detail
    ===================================== */

    if (backLinkElement) {

        backLinkElement.href =
            "./material.html?id=" +
            encodeURIComponent(
                material.id
            );
    }


    /* =====================================
       Browser Title
    ===================================== */

    if (localizedTitle) {

        document.title =
            language === "ja"
                ? localizedTitle +
                    "｜資料ダウンロード｜INABATA"
                : localizedTitle +
                    " | Download Material | INABATA";


    } else {

        document.title =
            language === "ja"
                ? "資料ダウンロード｜INABATA"
                : "Download Material | INABATA";
    }
}


/* =========================================
   Download API
========================================= */

async function requestDownload() {

    if (!currentMaterial) {

        const language =
            getLanguage();


        throw new Error(
            language === "ja"
                ? "資料情報を確認できませんでした。"
                : "Unable to verify the material information."
        );
    }


    /*
     * 個人情報は送信しません。
     *
     * 公開APIへ送信するのは
     * materialIdのみ。
     */

    const payload = {

        materialId:
            currentMaterial.id
    };


    const response =
        await fetch(
            DOWNLOAD_API_URL,
            {
                method:
                    "POST",

                headers: {

                    "Content-Type":
                        "application/json",

                    "Accept":
                        "application/json"
                },

                body:
                    JSON.stringify(
                        payload
                    )
            }
        );


    let result =
        null;


    try {

        result =
            await response.json();


    } catch {

        const language =
            getLanguage();


        throw new Error(
            language === "ja"
                ? "APIから有効な応答を取得できませんでした。"
                : "Unable to retrieve a valid response from the API."
        );
    }


    if (
        !response.ok ||
        result?.success !== true
    ) {

        const language =
            getLanguage();


        throw new Error(
            result?.message ||
            (
                language === "ja"
                    ? "ダウンロードを開始できませんでした。"
                    : "Unable to start the download."
            )
        );
    }


    if (!result.downloadUrl) {

        const language =
            getLanguage();


        throw new Error(
            language === "ja"
                ? "ダウンロードURLを取得できませんでした。"
                : "Unable to retrieve the download URL."
        );
    }


    /*
     * APIから返された
     * 短時間有効なRead SAS URLで
     * Private BlobのPDFを取得。
     */

    const downloadLink =
        document.createElement(
            "a"
        );


    downloadLink.href =
        result.downloadUrl;


    downloadLink.style.display =
        "none";


    document.body.appendChild(
        downloadLink
    );


    downloadLink.click();


    downloadLink.remove();
}


/* =========================================
   Download Button
========================================= */

async function handleDownload() {

    /*
     * 二重クリック防止。
     */

    if (
        !submitButton ||
        submitButton.disabled
    ) {

        return;
    }


    clearMessages();


    setProcessing(
        true
    );


    try {

        await requestDownload();


        showElement(
            successElement
        );


    } catch (error) {

        console.error(
            "Download request failed:",
            error
        );


        showApiError(
            error?.message
        );


    } finally {

        setProcessing(
            false
        );
    }
}


/* =========================================
   Initialization
========================================= */

async function initializeDownloadPage() {

    showPageLoading();


    clearMessages();


    const materialId =
        getMaterialId();


    if (!materialId) {

        console.error(
            "Material ID was not specified."
        );


        showPageError();


        return;
    }


    /*
     * ダウンロードボタンは、
     * 資料情報を正常に取得するまで
     * 使用不可にしておきます。
     */

    if (submitButton) {

        submitButton.disabled =
            true;
    }


    try {

        currentMaterial =
            await getMaterial(
                materialId
            );


        if (!currentMaterial) {

            console.error(
                "Material was not found:",
                materialId
            );


            showPageError();


            return;
        }


        renderMaterial(
            currentMaterial
        );


        showPageContent();


        if (submitButton) {

            submitButton.disabled =
                false;
        }


    } catch (error) {

        console.error(
            "Failed to initialize download page:",
            error
        );


        showPageError();
    }
}


/* =========================================
   Download Button Event
========================================= */

if (submitButton) {

    submitButton.addEventListener(
        "click",
        handleDownload
    );
}


/* =========================================
   Language Change
========================================= */

window.addEventListener(
    "inabata-language-change",
    () => {

        /*
         * API再取得は不要。
         *
         * 取得済みの日英6フィールドから
         * 現在言語で再描画。
         */

        if (currentMaterial) {

            renderMaterial(
                currentMaterial
            );
        }


        /*
         * Download Button
         *
         * 処理中でなければ
         * 現在言語へ更新。
         */

        if (
            submitButton &&
            !submitButton.disabled &&
            submitLabelElement &&
            typeof translate ===
                "function"
        ) {

            submitLabelElement.textContent =
                translate(
                    "download.submit"
                );
        }
    }
);


/* =========================================
   Start
========================================= */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initializeDownloadPage
    );


} else {

    initializeDownloadPage();
}
