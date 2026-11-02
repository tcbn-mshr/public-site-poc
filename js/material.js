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

function normalizeText(value) {

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


function hideElement(element) {

    if (element) {
        element.hidden = true;
    }
}


function showElement(element) {

    if (element) {
        element.hidden = false;
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

    return (
        typeof getCurrentLanguage ===
            "function"
    )
        ? getCurrentLanguage()
        : "en";
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
     * titleEn
     * ↓
     * legacy title
     */

    if (
        language ===
        "en"
    ) {

        return firstText(
            material.titleEn,
            material.title
        );
    }


    /*
     * Japanese
     *
     * titleJa
     * ↓
     * titleEn
     * ↓
     * legacy title
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
     */

    if (
        language ===
        "en"
    ) {

        return firstText(
            material.summaryEn,
            material.summary
        );
    }


    /*
     * Japanese
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
     * 1. descriptionEn
     * 2. summaryEn
     * 3. legacy description
     * 4. legacy summary
     * =====================================
     */

    if (
        language ===
        "en"
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
     * 1. descriptionJa
     * 2. summaryJa
     * 3. descriptionEn
     * 4. summaryEn
     * 5. legacy description
     * 6. legacy summary
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
     * 初期状態はPDFフォールバック。
     */

    thumbnailElement.hidden =
        true;


    pdfFallbackElement.hidden =
        false;


    /*
     * 前回のイベント・URLをクリア。
     */

    thumbnailElement.onload =
        null;


    thumbnailElement.onerror =
        null;


    thumbnailElement.removeAttribute(
        "src"
    );


    /*
     * Thumbnail取得成功。
     */

    thumbnailElement.onload =
        () => {

            thumbnailElement.hidden =
                false;


            pdfFallbackElement.hidden =
                true;
        };


    /*
     * Thumbnail未登録 / 404 /
     * その他読み込み失敗。
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


    /*
     * Thumbnail
     */

    renderThumbnail(
        material
    );


    /*
     * Localized values
     */

    const localizedTitle =
        getLocalizedTitle(
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
         * 通常はgetLocalizedDescription()で
         * summaryまでフォールバックするため、
         * ここが空になるのは資料データ自体に
         * 説明系情報が存在しない場合のみ。
         */

        descriptionElement.textContent =
            localizedDescription ||
            (
                language === "ja"
                    ? "資料の詳細をご確認のうえ、ダウンロードページへお進みください。"
                    : "Please review the material details and proceed to the download page."
            );
    }


    /* =====================================
       Download Page
    ===================================== */

    if (downloadLinkElement) {

        /*
         * URLにはmaterialIdだけ渡します。
         *
         * title等は次ページでも
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

    document.title =
        language === "ja"
            ? localizedTitle +
                "｜展示会資料｜INABATA"
            : localizedTitle +
                " | Exhibition Materials | INABATA";
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
         * 言語切替時に再利用。
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
         * APIの再取得は不要。
         *
         * 取得済みの日英6フィールドを
         * 現在言語で再評価します。
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
