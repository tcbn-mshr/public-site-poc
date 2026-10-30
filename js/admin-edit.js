"use strict";


/* =========================================
   DOM
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
   Counters
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
   Validation
========================================= */

function clearErrors() {

    [
        "material-file",
        "material-title",
        "material-category",
        "material-summary",
        "material-description"
    ].forEach(
        (fieldName) => {

            hideElement(
                getErrorElement(
                    fieldName
                )
            );
        }
    );


    hideElement(
        formErrorElement
    );
}


function validatePdf() {

    const file =
        fileElement?.files?.[0];


    if (!file) {

        showElement(
            getErrorElement(
                "material-file"
            )
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
                "PDFファイルを選択してください。";
        }


        showElement(
            errorElement
        );

        return false;
    }


    return true;
}


function validateForm() {

    clearErrors();


    let valid = true;

    let firstInvalidElement = null;


    if (!validatePdf()) {

        valid = false;

        firstInvalidElement =
            firstInvalidElement ||
            fileElement;
    }


    if (!getText(titleElement)) {

        showElement(
            getErrorElement(
                "material-title"
            )
        );

        valid = false;

        firstInvalidElement =
            firstInvalidElement ||
            titleElement;
    }


    if (!getText(categoryElement)) {

        showElement(
            getErrorElement(
                "material-category"
            )
        );

        valid = false;

        firstInvalidElement =
            firstInvalidElement ||
            categoryElement;
    }


    if (!getText(summaryElement)) {

        showElement(
            getErrorElement(
                "material-summary"
            )
        );

        valid = false;

        firstInvalidElement =
            firstInvalidElement ||
            summaryElement;
    }


    if (!getText(descriptionElement)) {

        showElement(
            getErrorElement(
                "material-description"
            )
        );

        valid = false;

        firstInvalidElement =
            firstInvalidElement ||
            descriptionElement;
    }


    if (!valid) {

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
   Submit
========================================= */

function handleSubmit(event) {

    event.preventDefault();


    if (!validateForm()) {
        return;
    }


    /*
     * STEP 5ではまだ保存しません。
     *
     * STEP 6でここを
     * POST /api/manage-materials
     * に置き換えます。
     */

    window.alert(
        "入力チェックは正常です。\n" +
        "Materialsへの保存はSTEP 6で実装します。"
    );
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
