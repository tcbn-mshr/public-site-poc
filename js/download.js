"use strict";


/* =========================================
   Configuration
========================================= */

const MATERIALS_API_URL =
    "/api/materials";

const DOWNLOAD_API_URL =
    "/api/download";


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

const formElement =
    document.getElementById(
        "download-form"
    );

const companyElement =
    document.getElementById(
        "company"
    );

const customerNameElement =
    document.getElementById(
        "customer-name"
    );

const emailElement =
    document.getElementById(
        "email"
    );

const consentElement =
    document.getElementById(
        "privacy-consent"
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

const companyErrorElement =
    document.getElementById(
        "company-error"
    );

const customerNameErrorElement =
    document.getElementById(
        "customer-name-error"
    );

const emailErrorElement =
    document.getElementById(
        "email-error"
    );

const consentErrorElement =
    document.getElementById(
        "consent-error"
    );


/* =========================================
   State
========================================= */

let currentMaterial = null;


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


function getMaterialId() {

    const params =
        new URLSearchParams(
            window.location.search
        );

    return String(
        params.get("id") || ""
    ).trim();
}


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


function isValidEmail(value) {

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        .test(value);
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

function setProcessing(isProcessing) {

    const formControls = [
        companyElement,
        customerNameElement,
        emailElement,
        consentElement,
        submitButton
    ];


    formControls.forEach(
        (control) => {

            if (control) {
                control.disabled =
                    isProcessing;
            }
        }
    );


    if (submitLabelElement) {

        submitLabelElement.textContent =
            isProcessing
                ? "準備しています"
                : "同意してダウンロード";
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
        companyErrorElement
    );

    hideElement(
        customerNameErrorElement
    );

    hideElement(
        emailErrorElement
    );

    hideElement(
        consentErrorElement
    );

    hideElement(
        apiErrorElement
    );

    hideElement(
        successElement
    );
}


function showApiError(message) {

    if (!apiErrorElement) {
        return;
    }


    apiErrorElement.textContent =
        message ||
        "ダウンロードを開始できませんでした。";

    apiErrorElement.hidden = false;
}


/* =========================================
   Validation
========================================= */

function validateForm() {

    clearMessages();


    const company =
        String(
            companyElement?.value || ""
        ).trim();

    const customerName =
        String(
            customerNameElement?.value || ""
        ).trim();

    const email =
        String(
            emailElement?.value || ""
        ).trim();

    const consent =
        Boolean(
            consentElement?.checked
        );


    let firstInvalidElement = null;


    if (!company) {

        showElement(
            companyErrorElement
        );

        firstInvalidElement =
            firstInvalidElement ||
            companyElement;
    }


    if (!customerName) {

        showElement(
            customerNameErrorElement
        );

        firstInvalidElement =
            firstInvalidElement ||
            customerNameElement;
    }


    if (
        !email ||
        !isValidEmail(email)
    ) {

        showElement(
            emailErrorElement
        );

        firstInvalidElement =
            firstInvalidElement ||
            emailElement;
    }


    if (!consent) {

        showElement(
            consentErrorElement
        );

        firstInvalidElement =
            firstInvalidElement ||
            consentElement;
    }


    if (firstInvalidElement) {

        firstInvalidElement.focus();

        return false;
    }


    return true;
}


/* =========================================
   Materials API
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


async function getMaterial(materialId) {

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
   Render Material
========================================= */

function renderMaterial(material) {

    if (categoryTopElement) {

        categoryTopElement.textContent =
            material.categoryName;
    }


    if (documentTitleElement) {

        documentTitleElement.textContent =
            material.title;
    }


    if (documentDescriptionElement) {

        documentDescriptionElement.textContent =
            material.summary ||
            "選択した資料をダウンロードします。";
    }


    if (backLinkElement) {

        backLinkElement.href =
            "./material.html?id=" +
            encodeURIComponent(
                material.id
            );
    }


    document.title =
        material.title +
        "｜資料ダウンロード｜INABATA";
}


/* =========================================
   Download API
========================================= */

async function requestDownload() {

    if (!currentMaterial) {

        throw new Error(
            "資料情報を確認できませんでした。"
        );
    }


    const payload = {

        materialId:
            currentMaterial.id,

        company:
            String(
                companyElement.value
            ).trim(),

        customerName:
            String(
                customerNameElement.value
            ).trim(),

        email:
            String(
                emailElement.value
            ).trim(),

        consent:
            Boolean(
                consentElement.checked
            )
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


    let result = null;


    try {

        result =
            await response.json();

    } catch {

        throw new Error(
            "APIから有効な応答を取得できませんでした。"
        );
    }


    if (
        !response.ok ||
        result?.success !== true
    ) {

        throw new Error(
            result?.message ||
            "ダウンロードを開始できませんでした。"
        );
    }


    if (!result.downloadUrl) {

        throw new Error(
            "ダウンロードURLを取得できませんでした。"
        );
    }


    /*
     * APIが返した短時間有効なSAS URLを開きます。
     * Content-Dispositionがattachmentなら、
     * 元ページを維持したままダウンロードされます。
     */

    const downloadLink =
        document.createElement("a");

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
   Submit
========================================= */

async function handleSubmit(event) {

    event.preventDefault();


    if (!validateForm()) {
        return;
    }


    setProcessing(true);


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
            error.message
        );


    } finally {

        setProcessing(false);
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


        if (formElement) {

            formElement.addEventListener(
                "submit",
                handleSubmit
            );
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
