"use strict";


/* =========================================
   Configuration
========================================= */

const MATERIALS_API_URL = "/api/materials";


/* =========================================
   DOM Elements
========================================= */

const materialsGrid =
    document.getElementById("materials-grid");

const materialsLoading =
    document.getElementById("materials-loading");

const materialsError =
    document.getElementById("materials-error");

const materialsEmpty =
    document.getElementById("materials-empty");

const categoryButtons =
    Array.from(
        document.querySelectorAll("[data-category]")
    );


/* =========================================
   State
========================================= */

let allMaterials = [];

let selectedCategory = "all";


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

    showElement(materialsLoading);

    hideElement(materialsError);
    hideElement(materialsEmpty);

    if (materialsGrid) {
        materialsGrid.innerHTML = "";
    }
}


function hideLoading() {

    hideElement(materialsLoading);
}


function showError() {

    hideLoading();

    hideElement(materialsEmpty);

    showElement(materialsError);

    if (materialsGrid) {
        materialsGrid.innerHTML = "";
    }
}


function showEmpty() {

    hideLoading();

    hideElement(materialsError);

    showElement(materialsEmpty);

    if (materialsGrid) {
        materialsGrid.innerHTML = "";
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

        title:
            String(
                material?.title ?? ""
            ).trim(),

        category:
            String(
                material?.category ?? "other"
            ).trim() || "other",

        categoryName:
            String(
                material?.categoryName ?? "その他"
            ).trim() || "その他",

        description:
            String(
                material?.description ?? ""
            ).trim()
    };
}


/* =========================================
   Create Material Card
========================================= */

function createMaterialCard(material) {

    /*
     * article
     */

    const article =
        document.createElement("article");

    article.className =
        "material-card";

    article.dataset.category =
        material.category;


    /*
     * Link
     */

    const link =
        document.createElement("a");

    link.className =
        "material-card-link";

    link.href =
        "./material.html?id=" +
        encodeURIComponent(material.id);

    link.setAttribute(
        "aria-label",
        material.title + "の詳細を見る"
    );


    /*
     * Visual
     */

    const visual =
        document.createElement("div");

    visual.className =
        "material-card-visual";


    const fileType =
        document.createElement("span");

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


    /*
     * Body
     */

    const body =
        document.createElement("div");

    body.className =
        "material-card-body";


    /*
     * Category
     */

    const category =
        document.createElement("p");

    category.className =
        "material-card-category";

    category.textContent =
        material.categoryName;


    /*
     * Title
     */

    const title =
        document.createElement("h2");

    title.className =
        "material-card-title";

    title.textContent =
        material.title;


    body.appendChild(
        category
    );

    body.appendChild(
        title
    );


    /*
     * Description
     */

    if (material.description) {

        const description =
            document.createElement("p");

        description.className =
            "material-card-description";

        description.textContent =
            material.description;

        body.appendChild(
            description
        );
    }


    /*
     * Detail
     */

    const detail =
        document.createElement("span");

    detail.className =
        "material-card-detail";

    detail.setAttribute(
        "aria-hidden",
        "true"
    );


    const detailText =
        document.createTextNode(
            "詳細を見る "
        );


    const arrow =
        document.createElement("span");

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


    /*
     * Assemble
     */

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

    if (selectedCategory === "all") {

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


    materialsGrid.innerHTML = "";


    if (materials.length === 0) {

        showEmpty();

        return;
    }


    hideLoading();

    hideElement(materialsError);
    hideElement(materialsEmpty);


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
                String(selected)
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
                method: "GET",

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


    if (result?.success !== true) {

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
                        material.title
                );


        allMaterials.sort(
            (a, b) =>
                a.title.localeCompare(
                    b.title,
                    "ja"
                )
        );


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
