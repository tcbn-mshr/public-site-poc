"use strict";


/* =========================================
   Configuration
========================================= */

const MATERIALS_API_URL =
    "/api/materials";

const MATERIAL_THUMBNAIL_API_URL =
    "/api/material-thumbnail";


/* =========================================
   DOM Elements
========================================= */

const loadingElement =
    document.getElementById(
        "material-loading"
    );


const errorElement =
    document.getElementById(
        "material-error"
    );


const contentElement =
    document.getElementById(
        "material-content"
    );


const categoryTopElement =
    document.getElementById(
        "material-category-top"
    );


const titleTopElement =
    document.getElementById(
        "material-title-top"
    );


const titleElement =
    document.getElementById(
        "material-title"
    );


const descriptionElement =
    document.getElementById(
        "material-description"
    );


const downloadLinkElement =
    document.getElementById(
        "material-download-link"
    );


const thumbnailElement =
    document.getElementById(
        "material-detail-thumbnail"
    );


const pdfFallbackElement =
    document.getElementById(
        "material-detail-pdf"
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
   UI State
========================================= */

function showLoading() {

    showElement(
        loadingElement
    );


    hideElement(
        errorElement
    );


    hideElement(
        contentElement
    );
}


function showError() {

    hideElement(
        loadingElement
    );


    hideElement(
        contentElement
    );


    showElement(
        errorElement
    );
}


function showContent() {

    hideElement(
        loadingElement
    );


    hideElement(
        errorElement
    );


    showElement(
        contentElement
    );
}


/* =========================================
   API
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
        result?.success !== true
    ) {

        throw new Error(
            result?.message ||
            "Materials API returned an error."
        );
    }


    if (
        !Array.isArray(
            result.materials
        )
    ) {

        throw new Error(
            "Invalid materials response."
        );
    }


    return result.materials;
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
     * 2. legacy title
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
     * 3. legacy title
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
     * 2. legacy summary
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
     * 3. legacy summary
     */

    return firstText(

        material.summaryJa,

        material.summaryEn,

        material.summary
    );
}


/* =========================================
   Localized Description
========================================= */

function getLocalizedDescription(
    material
) {

    const language =
        getLanguage();


    /*
     * =====================================
     * English
     *
     * 1. English detail description
     * 2. English list summary
     * 3. Legacy detail description
     * 4. Legacy list summary
     *
     * 詳細説明（英語）が空欄の場合、
     * 一覧用説明（英語）を表示します。
     * =====================================
     */

    if (
        language === "en"
    ) {

        return firstText(

            material.descriptionEn,

            material.summaryEn,

            material.description,

            material.summary
        );
    }


    /*
     * =====================================
     * Japanese
     *
     * 1. Japanese detail description
     * 2. Japanese list summary
     * 3. English detail description
     * 4. English list summary
     * 5. Legacy detail description
     * 6. Legacy list summary
     *
     * 日本語詳細説明が空欄の場合は
     * 日本語一覧用説明。
     *
     * 日本語情報自体が無い場合は
     * Englishへフォールバックします。
     * =====================================
     */

    return firstText(

        material.descriptionJa,

        material.summaryJa,

        material.descriptionEn,

        material.summaryEn,

        material.description,

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
   Find Material
========================================= */

async function getMaterial(
    materialId
) {

    const materials =
        await fetchMaterials();


    const normalizedMaterials =
        materials.map(
            normalizeMaterial
        );


    return normalizedMaterials.find(
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
     * 先にPDFフォールバックを表示。
     * サムネイル取得成功時のみ画像へ切替。
     */

    thumbnailElement.hidden =
        true;


    pdfFallbackElement.hidden =
        false;


    /*
     * 前回のイベント・URLをリセット。
     */

    thumbnailElement.onload =
        null;


    thumbnailElement.onerror =
        null;


    thumbnailElement.removeAttribute(
        "src"
    );


    /*
     * Thumbnail取得成功
     */

    thumbnailElement.onload =
        () => {

            thumbnailElement.hidden =
                false;


            pdfFallbackElement.hidden =
                true;
        };


    /*
     * Thumbnail未登録
     * または404 / 読込エラー
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


    /* =====================================
       Localized Values
    ===================================== */

    const localizedTitle =
        getLocalizedTitle(
            material
        );


    /*
     * Summaryは詳細説明の
     * フォールバック計算にも使用するため、
     * 関数自体を保持しています。
     */

    const localizedSummary =
        getLocalizedSummary(
            material
        );


    const localizedDescription =
        getLocalizedDescription(
            material
        );


    const localizedCategoryName =
        getLocalizedCategoryName(
            material
        );


    const language =
        getLanguage();


    /* =====================================
       Hero Category
    ===================================== */

    if (categoryTopElement) {

        categoryTopElement.textContent =
            localizedCategoryName;
    }


    /* =====================================
       Hero Title
    ===================================== */

    if (titleTopElement) {

        titleTopElement.textContent =
            localizedTitle;
    }


    /* =====================================
       Document Title
    ===================================== */

    if (titleElement) {

        titleElement.textContent =
            localizedTitle;
    }


    /* =====================================
       Description
    ===================================== */

    if (descriptionElement) {

        /*
         * 優先順位：
         *
         * 詳細説明
         * ↓
         * 一覧用説明
         * ↓
         * 最終固定文言
         */

        descriptionElement.textContent =
            localizedDescription ||
            localizedSummary ||
            (
                language === "ja"
                    ? "資料の詳細をご確認のうえ、ダウンロードページへお進みください。"
                    : "Please review the material details and proceed to the download page."
            );
    }


    /* =====================================
       Download Page Link
    ===================================== */

    if (downloadLinkElement) {

        /*
         * URLにはmaterialIdのみ渡します。
         *
         * 資料名・説明等は
         * download.html側でも
         * Materials APIから取得します。
         */

        downloadLinkElement.href =
            "./download.html?id=" +
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
                    "｜展示会資料｜INABATA"
                : localizedTitle +
                    " | Exhibition Materials | INABATA";


    } else {

        document.title =
            language === "ja"
                ? "展示会資料｜INABATA"
                : "Exhibition Materials | INABATA";
    }
}


/* =========================================
   Initialization
========================================= */

async function initializeMaterialPage() {

    showLoading();


    const materialId =
        getMaterialId();


    if (!materialId) {

        console.error(
            "Material ID was not specified."
        );


        showError();


        return;
    }


    try {

        const material =
            await getMaterial(
                materialId
            );


        if (!material) {

            console.error(
                "Material was not found:",
                materialId
            );


            showError();


            return;
        }


        /*
         * 言語切替時にAPIを再取得せず
         * 再描画するため保持。
         */

        currentMaterial =
            material;


        renderMaterial(
            currentMaterial
        );


        showContent();


    } catch (error) {

        console.error(
            "Failed to load material:",
            error
        );


        showError();
    }
}


/* =========================================
   Language Change
========================================= */

window.addEventListener(
    "inabata-language-change",
    () => {

        if (!currentMaterial) {

            return;
        }


        /*
         * API再取得は不要。
         *
         * 取得済みの日英6フィールドを
         * 新しい表示言語で再評価。
         */

        renderMaterial(
            currentMaterial
        );
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
        initializeMaterialPage
    );


} else {

    initializeMaterialPage();
}
