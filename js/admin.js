"use strict";


/* =========================================
   Configuration
========================================= */

const ADMIN_MATERIALS_API =
    "/api/admin-materials";


/* =========================================
   DOM
========================================= */

const loadingElement =
    document.getElementById(
        "admin-loading"
    );

const errorElement =
    document.getElementById(
        "admin-error"
    );

const emptyElement =
    document.getElementById(
        "admin-empty"
    );

const listElement =
    document.getElementById(
        "admin-material-list"
    );

const searchElement =
    document.getElementById(
        "material-search"
    );

const statusFilterElement =
    document.getElementById(
        "status-filter"
    );


/* =========================================
   State
========================================= */

let allMaterials = [];


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


function normalize(value) {

    return String(
        value ?? ""
    ).trim();
}


function normalizeMaterial(material) {

    return {

        id:
            normalize(
                material?.id
            ),

        title:
            normalize(
                material?.title
            ),

        category:
            normalize(
                material?.category
            ),

        categoryName:
            normalize(
                material?.categoryName
            ),

        summary:
            normalize(
                material?.summary
            ),

        description:
            normalize(
                material?.description
            ),

        originalFileName:
            normalize(
                material?.originalFileName
            ),

        status:
            normalize(
                material?.status
            ) || "draft",

        createdAtUtc:
            normalize(
                material?.createdAtUtc
            ),

        updatedAtUtc:
            normalize(
                material?.updatedAtUtc
            )
    };
}


/* =========================================
   Date
========================================= */

function formatDate(value) {

    if (!value) {
        return "－";
    }


    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "－";
    }


    return new Intl.DateTimeFormat(
        "ja-JP",
        {
            year:
                "numeric",

            month:
                "2-digit",

            day:
                "2-digit"
        }
    ).format(date);
}


/* =========================================
   Status
========================================= */

function getStatusLabel(status) {

    return status === "published"
        ? "公開中"
        : "下書き";
}


function getStatusClass(status) {

    return status === "published"
        ? "admin-status-published"
        : "admin-status-draft";
}


/* =========================================
   API
========================================= */

async function fetchMaterials() {

    const response =
        await fetch(
            ADMIN_MATERIALS_API,
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
            "Admin Materials API HTTP error: " +
            response.status
        );
    }


    const result =
        await response.json();


    if (
        result?.success !== true ||
        !Array.isArray(
            result.materials
        )
    ) {

        throw new Error(
            result?.message ||
            "Invalid admin materials response."
        );
    }


    return result.materials;
}


/* =========================================
   Filter
========================================= */

function getFilteredMaterials() {

    const keyword =
        normalize(
            searchElement?.value
        )
            .toLocaleLowerCase(
                "ja"
            );


    const status =
        statusFilterElement?.value ||
        "all";


    return allMaterials.filter(
        (material) => {

            const matchesStatus =
                status === "all" ||
                material.status ===
                    status;


            const searchText =
                [
                    material.title,
                    material.summary,
                    material.description,
                    material.categoryName,
                    material.originalFileName
                ]
                    .join(" ")
                    .toLocaleLowerCase(
                        "ja"
                    );


            const matchesKeyword =
                !keyword ||
                searchText.includes(
                    keyword
                );


            return (
                matchesStatus &&
                matchesKeyword
            );
        }
    );
}


/* =========================================
   Row
========================================= */

function createMaterialRow(material) {

    const row =
        document.createElement(
            "article"
        );

    row.className =
        "admin-material-row";


    /* Material */

    const materialMain =
        document.createElement(
            "div"
        );

    materialMain.className =
        "admin-material-main";


    const pdfIcon =
        document.createElement(
            "div"
        );

    pdfIcon.className =
        "admin-pdf-icon";

    pdfIcon.textContent =
        "PDF";


    const materialText =
        document.createElement(
            "div"
        );

    materialText.className =
        "admin-material-text";


    const title =
        document.createElement(
            "h2"
        );

    title.className =
        "admin-material-title";

    title.textContent =
        material.title ||
        "名称未設定";


    const summary =
        document.createElement(
            "p"
        );

    summary.className =
        "admin-material-summary";

    summary.textContent =
        material.summary ||
        material.description ||
        "説明は登録されていません。";


    materialText.appendChild(
        title
    );

    materialText.appendChild(
        summary
    );


    materialMain.appendChild(
        pdfIcon
    );

    materialMain.appendChild(
        materialText
    );


    /* Category */

    const category =
        document.createElement(
            "div"
        );

    category.className =
        "admin-material-category";

    category.textContent =
        material.categoryName ||
        "未設定";


    /* Status */

    const status =
        document.createElement(
            "div"
        );

    status.className =
        "admin-status " +
        getStatusClass(
            material.status
        );

    status.textContent =
        getStatusLabel(
            material.status
        );


    /* Date */

    const updated =
        document.createElement(
            "div"
        );

    updated.className =
        "admin-material-updated";

    updated.textContent =
        formatDate(
            material.updatedAtUtc ||
            material.createdAtUtc
        );


    /* Actions */

    const actions =
        document.createElement(
            "div"
        );

    actions.className =
        "admin-material-actions";


    const editButton =
        document.createElement(
            "button"
        );

    editButton.type =
        "button";

    editButton.className =
        "admin-action-button";

    editButton.textContent =
        "編集";

    editButton.disabled =
        true;


    const publishButton =
        document.createElement(
            "button"
        );

    publishButton.type =
        "button";

    publishButton.className =
        "admin-action-button " +
        "admin-action-button-dark";

    publishButton.textContent =
        material.status ===
        "published"
            ? "非公開にする"
            : "公開する";

    publishButton.disabled =
        true;


    actions.appendChild(
        editButton
    );

    actions.appendChild(
        publishButton
    );


    /* Assemble */

    row.appendChild(
        materialMain
    );

    row.appendChild(
        category
    );

    row.appendChild(
        status
    );

    row.appendChild(
        updated
    );

    row.appendChild(
        actions
    );


    return row;
}


/* =========================================
   Render
========================================= */

function renderMaterials() {

    if (!listElement) {
        return;
    }


    const materials =
        getFilteredMaterials();


    listElement.innerHTML =
        "";


    if (
        materials.length === 0
    ) {

        showElement(
            emptyElement
        );

        return;
    }


    hideElement(
        emptyElement
    );


    const fragment =
        document.createDocumentFragment();


    materials.forEach(
        (material) => {

            fragment.appendChild(
                createMaterialRow(
                    material
                )
            );
        }
    );


    listElement.appendChild(
        fragment
    );
}


/* =========================================
   Initialization
========================================= */

async function initializeAdminPage() {

    showElement(
        loadingElement
    );

    hideElement(
        errorElement
    );

    hideElement(
        emptyElement
    );


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
                        material.id
                );


        hideElement(
            loadingElement
        );


        renderMaterials();


    } catch (error) {

        console.error(
            "Failed to initialize admin page:",
            error
        );


        hideElement(
            loadingElement
        );


        showElement(
            errorElement
        );
    }
}


/* =========================================
   Events
========================================= */

if (searchElement) {

    searchElement.addEventListener(
        "input",
        renderMaterials
    );
}


if (statusFilterElement) {

    statusFilterElement.addEventListener(
        "change",
        renderMaterials
    );
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
        initializeAdminPage
    );

} else {

    initializeAdminPage();
}
