"use strict";


/* =========================================
   Configuration
========================================= */

const MANAGE_MATERIALS_API =
    "/api/manage-materials";


/* =========================================
   DOM Elements
========================================= */

const form =
    document.getElementById(
        "material-edit-form"
    );

const fileElement =
    document.getElementById(
        "material-file"
    );

const titleElement =
    document.getElementById(
        "material-title"
    );

const categoryElement =
    document.getElementById(
        "material-category"
    );

const summaryElement =
    document.getElementById(
        "material-summary"
    );

const descriptionElement =
    document.getElementById(
        "material-description"
    );

const summaryCounter =
    document.getElementById(
        "summary-counter"
    );

const descriptionCounter =
    document.getElementById(
        "description-counter"
    );

const formErrorElement =
    document.getElementById(
        "admin-form-error"
    );

const saveButton =
    document.getElementById(
        "material-save-button"
    );


/* =========================================
   Utility
========================================= */

function getText(element) {

    return String(
        element?.value || ""
    ).trim();
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


function getErrorElement(fieldName) {

    return document.getElementById(
        `${fieldName}-error`
    );
}


/* =========================================
   Character Counters
========================================= */

function updateSummaryCounter() {

    if (
        !summaryElement ||
        !summaryCounter
    ) {
        return;
    }


    summaryCounter.textContent =
        `${summaryElement.value.length} / 250`;
}


function updateDescriptionCounter() {

    if (
        !descriptionElement ||
        !descriptionCounter
    ) {
        return;
    }


    descriptionCounter.textContent =
        `${descriptionElement.value.length} / 2000`;
}


/* =========================================
   Error Control
========================================= */

function clearErrors() {

    const fieldNames = [

        "material-file",

        "material-title",

        "material-category",

        "material-summary",

        "material-description"
    ];


    fieldNames.forEach(
        (fieldName) => {

            hideElement(
                getErrorElement(
                    fieldName
                )
            );
        }
    );


    if (formErrorElement) {

        formErrorElement.textContent =
            "入力内容を確認してください。";
    }


    hideElement(
        formErrorElement
    );
}


/* =========================================
   PDF Validation
========================================= */

function validatePdf() {

    const file =
        fileElement?.files?.[0];


    if (!file) {

        const errorElement =
            getErrorElement(
                "material-file"
            );


        if (errorElement) {

            errorElement.textContent =
                "PDFファイルを選択してください。";
        }


        showElement(
            errorElement
        );


        return false;
    }


    const fileName =
        String(
            file.name || ""
        ).toLowerCase();


    const isPdf =
        file.type ===
            "application/pdf" ||
        fileName.endsWith(
            ".pdf"
        );


    if (!isPdf) {

        const errorElement =
            getErrorElement(
                "material-file"
            );


        if (errorElement) {

            errorElement.textContent =
                "PDF形式のファイルを選択してください。";
        }


        showElement(
            errorElement
        );


        return false;
    }


    return true;
}


/* =========================================
   Publication Status
========================================= */

function getSelectedStatus() {

    const selected =
        document.querySelector(
            'input[name="status"]:checked'
        );


    return selected
        ? selected.value
        : "draft";
}


/* =========================================
   Form Validation
========================================= */

function validateForm() {

    clearErrors();


    let valid =
        true;


    let firstInvalidElement =
        null;


    /*
     * PDF
     */

    if (!validatePdf()) {

        valid =
            false;


        firstInvalidElement =
            firstInvalidElement ||
            fileElement;
    }


    /*
     * Title
     */

    if (!getText(titleElement)) {

        showElement(
            getErrorElement(
                "material-title"
            )
        );


        valid =
            false;


        firstInvalidElement =
            firstInvalidElement ||
            titleElement;
    }


    /*
     * Category
     */

    if (!getText(categoryElement)) {

        showElement(
            getErrorElement(
                "material-category"
            )
        );


        valid =
            false;


        firstInvalidElement =
            firstInvalidElement ||
            categoryElement;
    }


    /*
     * Summary
     */

    if (!getText(summaryElement)) {

        showElement(
            getErrorElement(
                "material-summary"
            )
        );


        valid =
            false;


        firstInvalidElement =
            firstInvalidElement ||
            summaryElement;
    }


    /*
     * Description
     */

    if (!getText(descriptionElement)) {

        showElement(
            getErrorElement(
                "material-description"
            )
        );


        valid =
            false;


        firstInvalidElement =
            firstInvalidElement ||
            descriptionElement;
    }


    /*
     * Validation Error
     */

    if (!valid) {

        if (formErrorElement) {

            formErrorElement.textContent =
                "入力内容を確認してください。";
        }


        showElement(
            formErrorElement
        );


        if (firstInvalidElement) {

            firstInvalidElement.focus();
        }
    }


    return valid;
}


/* =========================================
   Saving State
========================================= */

function setSaving(
    isSaving
) {

    if (!saveButton) {
        return;
    }


    saveButton.disabled =
        isSaving;


    saveButton.textContent =
        isSaving
            ? "保存しています..."
            : "保存する";
}


/* =========================================
   API Request
========================================= */

async function createMaterial() {

    /*
     * STEP 6ではPDF本体を送信しません。
     *
     * Materials Tableへ登録するのは
     * 資料メタデータのみです。
     */

    const payload = {

        title:
            getText(
                titleElement
            ),

        category:
            getText(
                categoryElement
            ),

        summary:
            getText(
                summaryElement
            ),

        description:
            getText(
                descriptionElement
            ),

        status:
            getSelectedStatus()
    };


    const response =
        await fetch(
            MANAGE_MATERIALS_API,
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


    let result;


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
            "資料を登録できませんでした。"
        );
    }


    if (
        !result.material ||
        !result.material.id
    ) {

        throw new Error(
            "登録された資料IDを取得できませんでした。"
        );
    }


    return result.material;
}


/* =========================================
   Submit
========================================= */

async function handleSubmit(
    event
) {

    event.preventDefault();


    /*
     * Validation
     */

    if (!validateForm()) {
        return;
    }


    /*
     * 過去のAPIエラー表示を消します。
     */

    hideElement(
        formErrorElement
    );


    setSaving(
        true
    );


    try {

        /*
         * Materials Tableへ
         * メタデータを新規登録
         */

        const material =
            await createMaterial();


        /*
         * STEP 6確認用
         */

        window.alert(
            "資料情報を登録しました。\n" +
            "資料ID: " +
            material.id
        );


        /*
         * 登録成功後、
         * 管理一覧へ戻ります。
         */

        window.location.href =
            "/admin/index.html";


    } catch (error) {

        console.error(
            "Material creation failed:",
            error
        );


        if (formErrorElement) {

            formErrorElement.textContent =
                error.message ||
                "資料を登録できませんでした。";
        }


        showElement(
            formErrorElement
        );


    } finally {

        setSaving(
            false
        );
    }
}


/* =========================================
   Events
========================================= */

if (summaryElement) {

    summaryElement.addEventListener(
        "input",
        updateSummaryCounter
    );
}


if (descriptionElement) {

    descriptionElement.addEventListener(
        "input",
        updateDescriptionCounter
    );
}


if (form) {

    form.addEventListener(
        "submit",
        handleSubmit
    );
}


/* =========================================
   Initialization
========================================= */

updateSummaryCounter();

updateDescriptionCounter();

clearErrors();
