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
   HTML Escape
========================================= */

function escapeHtml(value) {

    return String(
        value ?? ""
    )
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            "\"",
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );
}


/* =========================================
   UI State
========================================= */

function hideElement(element) {

    if (!element) {
        return;
    }

    element.hidden = true;
}


function showElement(element) {

    if (!element) {
        return;
    }

    element.hidden = false;
}


function setLoadingState() {

    hideElement(
        materialsError
    );

    hideElement(
        materialsEmpty
    );

    showElement(
        materialsLoading
    );


    if (materialsGrid) {
        materialsGrid.innerHTML = "";
    }
}


function setLoadedState() {

    hideElement(
        materialsLoading
    );

    hideElement(
        materialsError
    );
}


function setErrorState() {

    hideElement(
        materialsLoading
    );

    hideElement(
        materialsEmpty
    );

    showElement(
        materialsError
    );


    if (materialsGrid) {
        materialsGrid.innerHTML = "";
    }
}


function setEmptyState() {

    hideElement(
        materialsLoading
    );

    hideElement(
        materialsError
    );

    showElement(
        materialsEmpty
    );


    if (materialsGrid) {
        materialsGrid.innerHTML = "";
    }
}


/* =========================================
   Material Normalization
========================================= */

function normalizeMaterial(material) {

    const id =
        String(
            material?.id ?? ""
        ).trim();

    const title =
        String(
            material?.title ?? ""
        ).trim();

    const category =
        String(
            material?.category ?? "other"
        ).trim() || "other";

    const categoryName =
        String(
            material?.categoryName ??
            "その他"
        ).trim() || "その他";

    const description =
        String(
            material?.description ?? ""
        ).trim();


    return {
        id,
        title,
        category,
        categoryName,
        description
    };
}


function isValidMaterial(material) {

    return Boolean(
        material.id &&
        material.title
    );
}


/* =========================================
   Material Card
========================================= */

function createMaterialCard(
    material
) {

    const article =
        document.createElement(
            "article"
        );

    article.className =
        "material-card";

    article.dataset.category =
        material.category;


    const detailUrl =
        "./material.html?id=" +
        encodeURIComponent(
            material.id
        );


    article.innerHTML = `
        <a
            class="material-card-link"
            href="${detailUrl}"
            aria-label="${escapeHtml(
                material.title
            )}の詳細を見る"
        >
            <div class="material-card-visual">
                <span
                    class="material-card-file-type"
                    aria-hidden="true"
                >
                    PDF
                </span>
            </div>

            <div class="material-card-body">
                <p class="material-card-category">
                    ${escapeHtml(
                        material.categoryName
                    )}
                </p>

                <h2 class="material-card-title">
                    ${escapeHtml(
                        material.title
                    )}
                </h2>

                ${
                    material.description
                        ? `
                            <p class="material-card-description">
                                ${escapeHtml(
                                    material.description
                                )}
                            </p>
                        `
                        : ""
                }

                <span
                    class="material-card-detail"
                    aria-hidden="true"
                >
                    詳細を見る
                    <span class="material-card-arrow">
                        →
                    </span>
                </span>
            </div>
        </a>
    `;


    return article;
}


/* =========================================
   Render
========================================= */

function getFilteredMaterials() {

    if (
        selectedCategory === "all"
    ) {
        return allMaterials;
    }


    return allMaterials.filter(
        (material) =>
            material.category ===
            selectedCategory
    );
}


function renderMaterials() {

    if (!materialsGrid) {

        console.error(
            "materials-grid element was not found."
        );

        return;
    }


    const filteredMaterials =
        getFilteredMaterials();


    materialsGrid.innerHTML = "";


    if (
        filteredMaterials.length === 0
    ) {

        setEmptyState();

        return;
    }


    hideElement(
        materialsEmpty
    );

    hideElement(
        materialsError
    );


    const fragment =
        document.createDocumentFragment();


    filteredMaterials.forEach(
        (material) => {

            fragment.appendChild(
                createMaterialCard(
                    material
                )
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

            const isSelected =
                category ===
                selectedCategory;


            button.classList.toggle(
                "is-active",
                isSelected
            );

            button.setAttribute(
                "aria-pressed",
                String(
                    isSelected
                )
            );
        }
    );
}


function handleCategoryButtonClick(
    event
) {

    const button =
        event.currentTarget;

    selectedCategory =
        button.dataset.category ||
        "all";


    updateCategoryButtons();

    renderMaterials();
}


function initializeCategoryFilter() {

    categoryButtons.forEach(
        (button) => {

            button.addEventListener(
                "click",
                handleCategoryButtonClick
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
            `Materials API returned ${response.status}.`
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
            "Materials API response is invalid."
        );
    }


    return result.materials;
}


/* =========================================
   Load Materials
========================================= */

async function loadMaterials() {

    setLoadingState();


    try {

        const materials =
            await fetchMaterials();


        allMaterials =
            materials
                .map(
                    normalizeMaterial
                )
                .filter(
                    isValidMaterial
                );


        /*
         * 表示順を安定させます。
         * 日本語タイトルにも対応します。
         */

        allMaterials.sort(
            (firstMaterial, secondMaterial) =>
                firstMaterial.title.localeCompare(
                    secondMaterial.title,
                    "ja"
                )
        );


        setLoadedState();

        renderMaterials();


    } catch (error) {

        console.error(
            "Failed to load materials:",
            error
        );

        setErrorState();
    }
}


/* =========================================
   Initialization
========================================= */

function initializeMaterialsPage() {

    if (!materialsGrid) {

        /*
         * materials.html以外でapp.jsが
         * 読み込まれてもエラーにしません。
         */

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
