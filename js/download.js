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

const departmentElement =
    document.getElementById(
        "department"
    );

const customerNameElement =
    document.getElementById(
        "customer-name"
    );

const emailElement =
    document.getElementById(
        "email"
    );

const phoneNumberElement =
    document.getElementById(
        "phone-number"
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

let currentMaterial =
    null;


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


/* =========================================
   Normalize Material
========================================= */

function normalizeMaterial(material) {

    return {

        id:
            String(
                material?.id ?? ""
            ).trim(),

        category:
            String(
                material?.category ?? "other"
            ).trim() || "other",

        categoryName:
            String(
                material?.categoryName ?? "その他"
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
            material?.[localizedField] ??
            ""
        ).trim();


    if (localizedValue) {

        return localizedValue;
    }


    /*
     * 移行期間中のフォールバック。
     *
     * 英語フィールド未登録資料を
     * 空表示にしないため、
     * 旧フィールドを使用します。
     */

    return String(
        material?.[field] ??
        ""
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
        categoryNames?.[category]?.[language] ||
        material.categoryName ||
        category
    );
}


/* =========================================
   Email Validation
========================================= */

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

function setProcessing(
    isProcessing
) {

    const formControls = [

        companyElement,

        departmentElement,

        customerNameElement,

        emailElement,

        phoneNumberElement,

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


    /*
     * Submit button text
     */

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
                    : "Agree and Download";
        }
    }


    /*
     * Processing message
     */

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
        (
            typeof translate ===
            "function"
                ? translate(
                    "download.apiError"
                )
                : "Unable to start the download."
        );


    apiErrorElement.hidden =
        false;
}


/* =========================================
   Validation
========================================= */

function validateForm() {

    clearMessages();


    const company =
        String(
            companyElement?.value ||
            ""
        ).trim();


    const customerName =
        String(
            customerNameElement?.value ||
            ""
        ).trim();


    const email =
        String(
            emailElement?.value ||
            ""
        ).trim();


    const consent =
        Boolean(
            consentElement?.checked
        );


    let firstInvalidElement =
        null;


    /*
     * Company
     */

    if (!company) {

        showElement(
            companyErrorElement
        );


        firstInvalidElement =
            firstInvalidElement ||
            companyElement;
    }


    /*
     * Name
     */

    if (!customerName) {

        showElement(
            customerNameErrorElement
        );


        firstInvalidElement =
            firstInvalidElement ||
            customerNameElement;
    }


    /*
     * Email
     */

    if (
        !email ||
        !isValidEmail(
            email
        )
    ) {

        showElement(
            emailErrorElement
        );


        firstInvalidElement =
            firstInvalidElement ||
            emailElement;
    }


    /*
     * Consent
     */

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
   Render Material
========================================= */

function renderMaterial(material) {

    if (!material) {
        return;
    }


    const language =
        typeof getCurrentLanguage ===
        "function"
            ? getCurrentLanguage()
            : "en";


    /*
     * Localized values
     */

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


    /*
     * Hero category
     */

    if (categoryTopElement) {

        categoryTopElement.textContent =
            localizedCategoryName;
    }


    /*
     * Selected document title
     */

    if (documentTitleElement) {

        documentTitleElement.textContent =
            localizedTitle;
    }


    /*
     * Selected document summary
     */

    if (documentDescriptionElement) {

        documentDescriptionElement.textContent =
            localizedSummary ||
            (
                language === "ja"
                    ? "選択した資料をダウンロードします。"
                    : "Download the selected material."
            );
    }


    /*
     * Back to detail
     */

    if (backLinkElement) {

        backLinkElement.href =
            "./material.html?id=" +
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
                "｜資料ダウンロード｜INABATA"
            : localizedTitle +
                " | Download Material | INABATA";
}


/* =========================================
   Download API
========================================= */

async function requestDownload() {

    if (!currentMaterial) {

        const language =
            typeof getCurrentLanguage ===
            "function"
                ? getCurrentLanguage()
                : "en";


        throw new Error(
            language === "ja"
                ? "資料情報を確認できませんでした。"
                : "Unable to verify the material information."
        );
    }


    /*
     * Department and phone number are
     * optional.
     */

    const payload = {

        materialId:
            currentMaterial.id,

        company:
            String(
                companyElement?.value ||
                ""
            ).trim(),

        department:
            String(
                departmentElement?.value ||
                ""
            ).trim(),

        customerName:
            String(
                customerNameElement?.value ||
                ""
            ).trim(),

        email:
            String(
                emailElement?.value ||
                ""
            ).trim(),

        phoneNumber:
            String(
                phoneNumberElement?.value ||
                ""
            ).trim(),

        consent:
            Boolean(
                consentElement?.checked
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


    let result =
        null;


    try {

        result =
            await response.json();


    } catch {

        const language =
            typeof getCurrentLanguage ===
            "function"
                ? getCurrentLanguage()
                : "en";


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
            typeof getCurrentLanguage ===
            "function"
                ? getCurrentLanguage()
                : "en";


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
            typeof getCurrentLanguage ===
            "function"
                ? getCurrentLanguage()
                : "en";


        throw new Error(
            language === "ja"
                ? "ダウンロードURLを取得できませんでした。"
                : "Unable to retrieve the download URL."
        );
    }


    /*
     * APIが返した短時間有効な
     * SAS URLを開きます。
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
   Submit
========================================= */

async function handleSubmit(event) {

    event.preventDefault();


    if (!validateForm()) {
        return;
    }


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
            error.message
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
   Language Change
========================================= */

window.addEventListener(
    "inabata-language-change",
    () => {

        /*
         * Material data
         */

        if (currentMaterial) {

            renderMaterial(
                currentMaterial
            );
        }


        /*
         * Submit button
         *
         * i18n.js handles all elements with
         * data-i18n, but this label is also
         * changed dynamically while processing.
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
