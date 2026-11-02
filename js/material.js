"use strict";


/* =========================================
   Configuration
========================================= */

const MATERIALS_API_URL =
    "/api/materials";


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
   URL Parameter
========================================= */

function getMaterialId() {

    const params =
        new URLSearchParams(
            window.location.search
        );


    return String(
        params.get("id") || ""
    ).trim();
}


/* =========================================
   UI State
========================================= */

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


    const result =
        await response.json();


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
   Normalize
========================================= */

function normalizeMaterial(
    material
) {

    return {

        id:
            String(
                material?.id ?? ""
            ).trim(),

        category:
            String(
                material?.category ??
                "other"
            ).trim() || "other",

        categoryName:
            String(
                material?.categoryName ??
                "その他"
            ).trim() || "その他",


        /* =================================
           Legacy
        ================================= */

        title:
            String(
                material?.title ?? ""
            ).trim(),

        summary:
            String(
                material?.summary ?? ""
            ).trim(),

        description:
            String(
                material?.description ?? ""
            ).trim(),


        /* =================================
           Japanese
        ================================= */

        titleJa:
            String(
                material?.titleJa ??
                material?.title ??
                ""
            ).trim(),

        summaryJa:
            String(
                material?.summaryJa ??
                material?.summary ??
                ""
            ).trim(),

        descriptionJa:
            String(
                material?.descriptionJa ??
                material?.description ??
                ""
            ).trim(),


        /* =================================
           English
        ================================= */

        titleEn:
            String(
                material?.titleEn ?? ""
            ).trim(),

        summaryEn:
            String(
                material?.summaryEn ?? ""
            ).trim(),

        descriptionEn:
            String(
                material?.descriptionEn ?? ""
            ).trim()
    };
}


/* =========================================
   Localization
========================================= */

function getLocalizedMaterialValue(
    material,
    field
) {

    const language =
        typeof getCurrentLanguage ===
        "function"
            ? getCurrentLanguage()
            : "en";


    const localizedField =
        language === "ja"
            ? `${field}Ja`
            : `${field}En`;


    const localizedValue =
        String(
            material?.[
                localizedField
            ] ?? ""
        ).trim();


    if (localizedValue) {

        return localizedValue;
    }


    /*
     * Migration fallback
     *
     * 英語フィールド未登録の資料では、
     * 現段階では既存フィールドへ
     * フォールバックします。
     */

    return String(
        material?.[field] ?? ""
    ).trim();
}


/* =========================================
   Localized Category
========================================= */

function getLocalizedCategoryName(
    material
) {

    const language =
        typeof getCurrentLanguage ===
        "function"
            ? getCurrentLanguage()
            : "en";


    const category =
        String(
            material?.category || ""
        ).trim();


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


    return (
        categoryNames?.[
            category
        ]?.[
            language
        ] ||
        material.categoryName ||
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
     */

    thumbnailElement.hidden =
 *      true;

    pdfFallbackElement.hidden =
        false;


    /*
     * 前回の画像URLをクリア
     */

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
     * Thumbnailなし / 404
     */

    thumbnailElement.onerror =
        () => {

            thumbnailElement.hidden =
                true;

            pdfFallbackElement.hidden =
                false;
        };


    /*
     * API
     */

    thumbnailElement.src =
        "/api/material-thumbnail?id=" +
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

   
   renderThumbnail(
       material
   );

   
    /*
     * Localized values
     */

    const localizedTitle =
        getLocalizedMaterialValue(
            material,
            "title"
        );


    const localizedDescription =
        getLocalizedMaterialValue(
            material,
            "description"
        );


    const localizedCategoryName =
        getLocalizedCategoryName(
            material
        );


    const language =
        typeof getCurrentLanguage ===
        "function"
            ? getCurrentLanguage()
            : "en";


    /*
     * Hero category
     */

    if (categoryTopElement) {

        categoryTopElement.textContent =
            localizedCategoryName;
    }


    /*
     * Hero title
     */

    if (titleTopElement) {

        titleTopElement.textContent =
            localizedTitle;
    }


    /*
     * Document title
     */

    if (titleElement) {

        titleElement.textContent =
            localizedTitle;
    }


    /*
     * Description
     */

    if (descriptionElement) {

        if (
            localizedDescription
        ) {

            descriptionElement.textContent =
                localizedDescription;


        } else {

            descriptionElement.textContent =
                language === "ja"
                    ? "資料の詳細をご確認のうえ、ダウンロードページへお進みください。"
                    : "Please review the material details and proceed to the download page.";
        }
    }


    /*
     * Download page
     *
     * title / category / file は
     * URLへ渡しません。
     *
     * materialIdだけを渡し、
     * 次ページでもMaterials APIから
     * 最新情報を取得します。
     */

    if (downloadLinkElement) {

        downloadLinkElement.href =
            "./download.html?id=" +
            encodeURIComponent(
                material.id
            );
    }


    /*
     * Browser title
     */

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
         * 言語切替時に再利用するため
         * 現在のMaterialを保持します。
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
         * API再取得は不要です。
         *
         * 既に取得済みの
         * titleJa / titleEn /
         * descriptionJa / descriptionEn
         * を使って再描画します。
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
