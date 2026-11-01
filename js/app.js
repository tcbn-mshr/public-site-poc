"use strict";


/* =========================================
   Configuration
========================================= */

const MATERIALS_API_URL =
    "/api/materials";


/* =========================================
   DOM Elements
========================================= */

const materialsGrid =
    document.getElementById(
        "materials-grid"
    );

const materialsLoading =
    document.getElementById(
        "materials-loading"
    );

const materialsError =
    document.getElementById(
        "materials-error"
    );

const materialsEmpty =
    document.getElementById(
        "materials-empty"
    );

const categoryButtons =
    Array.from(
        document.querySelectorAll(
            "[data-category]"
        )
    );


/* =========================================
   State
========================================= */

let allMaterials = [];

let selectedCategory =
    "all";


/* =========================================
   Utility
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


/* =========================================
   UI States
========================================= */

function showLoading() {

    showElement(
        materialsLoading
    );

    hideElement(
        materialsError
    );

    hideElement(
        materialsEmpty
    );


    if (materialsGrid) {

        materialsGrid.innerHTML =
            "";
    }
}


function hideLoading() {

    hideElement(
        materialsLoading
    );
}


function showError() {

    hideLoading();

    hideElement(
        materialsEmpty
    );

    showElement(
        materialsError
    );


    if (materialsGrid) {

        materialsGrid.innerHTML =
            "";
    }
}


function showEmpty() {

    hideLoading();

    hideElement(
        materialsError
    );

    showElement(
        materialsEmpty
    );


    if (materialsGrid) {

        materialsGrid.innerHTML =
            "";
    }
}


/* =========================================
   Normalize
========================================= */

function normalizeMaterial(material) {

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
     * 現在は英語未登録資料も
     * 空カードにしないため、
     * 既存フィールドを利用します。
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
   Sort Materials
========================================= */

function sortMaterials() {

    const language =
        typeof getCurrentLanguage ===
        "function"
            ? getCurrentLanguage()
            : "en";


    allMaterials.sort(
        (a, b) => {

            const titleA =
                getLocalizedMaterialValue(
                    a,
                    "title"
                );


            const titleB =
                getLocalizedMaterialValue(
                    b,
                    "title"
                );


            return titleA.localeCompare(
                titleB,
                language === "ja"
                    ? "ja"
                    : "en"
            );
        }
    );
}


/* =========================================
   Create Material Card
========================================= */

function createMaterialCard(material) {

    /* =====================================
       Localized Values
    ===================================== */

    const localizedTitle =
        getLocalizedMaterialValue(
            material,
            "title"
        );


    const localizedSummary =
        getLocalizedMaterialValue(
            material,
            "summary"
        );


    const localizedCategoryName =
        getLocalizedCategoryName(
            material
        );


    const localizedDetailText =
        typeof translate ===
        "function"
            ? translate(
                "materials.detail"
            )
            : "View Details";


    /* =====================================
       Article
    ===================================== */

    const article =
        document.createElement(
            "article"
        );


    article.className =
        "material-card";


    article.dataset.category =
        material.category;


    /* =====================================
       Link
    ===================================== */

    const link =
        document.createElement(
            "a"
        );


    link.className =
        "material-card-link";


    link.href =
        "./material.html?id=" +
        encodeURIComponent(
            material.id
        );


    link.setAttribute(
        "aria-label",
        localizedTitle
    );


    /* =====================================
       Visual
    ===================================== */

    const visual =
        document.createElement(
            "div"
        );


    visual.className =
        "material-card-visual";


    const fileType =
        document.createElement(
            "span"
        );


    fileType.className =
        "material-card-file-type";


    fileType.textContent =
        "PDF";


    fileType.setAttribute(
        "aria-hidden",
        "true"
    );


    visual.appendChild(
        fileType
    );


    /* =====================================
       Body
    ===================================== */

    const body =
        document.createElement(
            "div"
        );


    body.className =
        "material-card-body";


    /* =====================================
       Category
    ===================================== */

    const category =
        document.createElement(
            "p"
        );


    category.className =
        "material-card-category";


    category.textContent =
        localizedCategoryName;


    /* =====================================
       Title
    ===================================== */

    const title =
        document.createElement(
            "h2"
        );


    title.className =
        "material-card-title";


    title.textContent =
        localizedTitle;


    body.appendChild(
        category
    );


    body.appendChild(
        title
    );


    /* =====================================
       Summary
    ===================================== */

    if (localizedSummary) {

        const description =
            document.createElement(
                "p"
            );


        description.className =
            "material-card-description";


        description.textContent =
            localizedSummary;


        body.appendChild(
            description
        );
    }


    /* =====================================
       Detail
    ===================================== */

    const detail =
        document.createElement(
            "span"
        );


    detail.className =
        "material-card-detail";


    detail.setAttribute(
        "aria-hidden",
        "true"
    );


    const detailText =
        document.createTextNode(
            localizedDetailText +
            " "
        );


    const arrow =
        document.createElement(
            "span"
        );


    arrow.className =
        "material-card-arrow";


    arrow.textContent =
        "→";


    detail.appendChild(
        detailText
    );


    detail.appendChild(
        arrow
    );


    body.appendChild(
        detail
    );


    /* =====================================
       Assemble
    ===================================== */

    link.appendChild(
        visual
    );


    link.appendChild(
        body
    );


    article.appendChild(
        link
    );


    return article;
}


/* =========================================
   Filter
========================================= */

function getFilteredMaterials() {

    if (
        selectedCategory ===
        "all"
    ) {

        return allMaterials;
    }


    return allMaterials.filter(
        (material) =>
            material.category ===
            selectedCategory
    );
}


/* =========================================
   Render
========================================= */

function renderMaterials() {

    if (!materialsGrid) {

        console.error(
            "materials-grid was not found."
        );

        return;
    }


    const materials =
        getFilteredMaterials();


    materialsGrid.innerHTML =
        "";


    if (
        materials.length === 0
    ) {

        showEmpty();

        return;
    }


    hideLoading();


    hideElement(
        materialsError
    );


    hideElement(
        materialsEmpty
    );


    const fragment =
        document.createDocumentFragment();


    materials.forEach(
        (material) => {

            const card =
                createMaterialCard(
                    material
                );


            fragment.appendChild(
                card
            );
        }
    );


    materialsGrid.appendChild(
        fragment
    );
}


/* =========================================
   Category Filter
========================================= */

function updateCategoryButtons() {

    categoryButtons.forEach(
        (button) => {

            const category =
                button.dataset.category ||
                "all";


            const selected =
                category ===
                selectedCategory;


            button.classList.toggle(
                "is-active",
                selected
            );


            button.setAttribute(
                "aria-pressed",
                String(
                    selected
                )
            );
        }
    );
}


function handleCategoryClick(event) {

    selectedCategory =
        event.currentTarget
            .dataset.category ||
        "all";


    updateCategoryButtons();

    renderMaterials();
}


function initializeCategoryFilter() {

    categoryButtons.forEach(
        (button) => {

            button.addEventListener(
                "click",
                handleCategoryClick
            );
        }
    );


    updateCategoryButtons();
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
        result?.success !==
        true
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
   Load
========================================= */

async function loadMaterials() {

    showLoading();


    try {

        const materials =
            await fetchMaterials();


        allMaterials =
            materials
                .map(
                    normalizeMaterial
                )
                .filter(
                    (material) =>
                        material.id &&
                        (
                            material.title ||
                            material.titleJa ||
                            material.titleEn
                        )
                );


        sortMaterials();


        renderMaterials();


    } catch (error) {

        console.error(
            "Failed to load materials:",
            error
        );


        showError();
    }
}


/* =========================================
   Initialization
========================================= */

function initializeMaterialsPage() {

    if (!materialsGrid) {
        return;
    }


    initializeCategoryFilter();


    loadMaterials();
}


/* =========================================
   Language Change
========================================= */

window.addEventListener(
    "inabata-language-change",
    () => {

        /*
         * 表示言語に合わせて
         * 並び順を再計算します。
         */

        sortMaterials();


        /*
         * カードを現在言語で
         * 再描画します。
         */

        renderMaterials();
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
        initializeMaterialsPage
    );


} else {

    initializeMaterialsPage();
}
