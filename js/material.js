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

        title:
            String(
                material?.title ?? ""
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

        description:
            String(
                material?.description ??
                ""
            ).trim()
    };
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
   Render Material
========================================= */

function renderMaterial(
    material
) {

    /*
     * Hero category
     */

    if (categoryTopElement) {

        categoryTopElement.textContent =
            material.categoryName;
    }


    /*
     * Hero title
     */

    if (titleTopElement) {

        titleTopElement.textContent =
            material.title;
    }


    /*
     * Document title
     */

    if (titleElement) {

        titleElement.textContent =
            material.title;
    }


    /*
     * Description
     */

    if (descriptionElement) {

        if (
            material.description
        ) {

            descriptionElement.textContent =
                material.description;

        } else {

            descriptionElement.textContent =
                "資料の詳細をご確認のうえ、" +
                "ダウンロードページへお進みください。";
        }
    }


    /*
     * Download page
     *
     * 重要：
     * title / category / file は渡しません。
     *
     * 今後はmaterialIdだけを
     * サーバー側の資料マスターと照合します。
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
        material.title +
        "｜展示会資料｜INABATA";
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


        renderMaterial(
            material
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
