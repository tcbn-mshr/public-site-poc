"use strict";


/* =========================================
   Configuration
========================================= */

const MANAGE_MATERIALS_API =
    "/api/manage-materials";

const MANAGE_UPLOAD_API =
    "/api/manage-upload";


/* =========================================
   Edit Mode
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


const editingMaterialId =
    getMaterialId();


const isEditMode =
    Boolean(
        editingMaterialId
    );


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
            "入力内容を確認してください.";
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

   /*
   * 新規登録時のみPDF必須。
   *
   * 編集時は新しいPDFを選択しなければ
   * 既存PDFを維持します。
   */

   if (
      !isEditMode &&
      !validatePdf()
   ) {

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

function setSaving(isSaving) {

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
   Load Material For Edit
========================================= */

async function loadMaterialForEdit() {

    if (!isEditMode) {
        return;
    }


    const response =
        await fetch(
            MANAGE_MATERIALS_API,
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


    let result;


    try {

        result =
            await response.json();

    } catch {

        throw new Error(
            "資料情報を取得できませんでした。"
        );
    }


    if (
        !response.ok ||
        result?.success !== true ||
        !Array.isArray(
            result.materials
        )
    ) {

        throw new Error(
            result?.message ||
            "資料情報を取得できませんでした。"
        );
    }


    const material =
        result.materials.find(
            (item) =>
                String(
                    item.id || ""
                ) ===
                editingMaterialId
        );


    if (!material) {

        throw new Error(
            "編集対象の資料が見つかりません。"
        );
    }


    /*
     * Form
     */

    if (titleElement) {

        titleElement.value =
            material.title || "";
    }


    if (categoryElement) {

        categoryElement.value =
            material.category || "";
    }


    if (summaryElement) {

        summaryElement.value =
            material.summary || "";
    }


    if (descriptionElement) {

        descriptionElement.value =
            material.description || "";
    }


    /*
     * Status
     */

    const status =
        material.status === "published"
            ? "published"
            : "draft";


    const statusElement =
        document.querySelector(
            `input[name="status"][value="${status}"]`
        );


    if (statusElement) {

        statusElement.checked =
            true;
    }


    /*
     * Counters
     */

    updateSummaryCounter();

    updateDescriptionCounter();
}


/* =========================================
   STEP 1
   Create Material
========================================= */

async function createMaterial() {

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

        /*
         * PDFアップロード完了前の外部公開を
         * 防ぐため、新規登録は必ずdraftで作成します。
         *
         * 公開状態の変更は後のSTEPで実装します。
         */

        status:
            "draft"
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
            "資料登録APIから有効な応答を取得できませんでした。"
        );
    }


    if (
        !response.ok ||
        result?.success !== true
    ) {

        throw new Error(
            result?.message ||
            "資料情報を登録できませんでした。"
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
   STEP 2
   Request Upload URL
========================================= */

async function requestUploadUrl(
    materialId,
    file
) {

    const response =
        await fetch(
            MANAGE_UPLOAD_API,
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
                    JSON.stringify({

                        materialId:
                            materialId,

                        originalFileName:
                            file.name
                    })
            }
        );


    let result;


    try {

        result =
            await response.json();

    } catch {

        throw new Error(
            "PDFアップロードURLを取得できませんでした。"
        );
    }


    if (
        !response.ok ||
        result?.success !== true
    ) {

        throw new Error(
            result?.message ||
            "PDFアップロードの準備に失敗しました。"
        );
    }


    if (
        !result.uploadUrl ||
        !result.blobName
    ) {

        throw new Error(
            "PDFアップロード情報が正しくありません。"
        );
    }


    return result;
}


/* =========================================
   STEP 3
   Upload PDF
========================================= */

async function uploadPdf(
    uploadUrl,
    file
) {

    const response =
        await fetch(
            uploadUrl,
            {
                method:
                    "PUT",

                headers: {

                    "x-ms-blob-type":
                        "BlockBlob",

                    "Content-Type":
                        "application/pdf"
                },

                body:
                    file
            }
        );


    if (!response.ok) {

        throw new Error(
            "PDFファイルをアップロードできませんでした。"
        );
    }
}


/* =========================================
   Update Material Metadata
========================================= */

async function updateMaterialMetadata() {

    const payload = {

        id:
            editingMaterialId,

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
            )
    };


    const response =
        await fetch(
            MANAGE_MATERIALS_API,
            {
                method:
                    "PUT",

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
            "資料更新APIから有効な応答を取得できませんでした。"
        );
    }


    if (
        !response.ok ||
        result?.success !== true
    ) {

        throw new Error(
            result?.message ||
            "資料情報を更新できませんでした。"
        );
    }


    return result.material;
}


/* =========================================
   STEP 4
   Update Material PDF Information
========================================= */

async function updateMaterialPdf(
    materialId,
    blobName,
    originalFileName
) {

    const response =
        await fetch(
            MANAGE_MATERIALS_API,
            {
                method:
                    "PUT",

                headers: {

                    "Content-Type":
                        "application/json",

                    "Accept":
                        "application/json"
                },

                body:
                    JSON.stringify({

                        id:
                            materialId,

                        blobName:
                            blobName,

                        originalFileName:
                            originalFileName
                    })
            }
        );


    let result;


    try {

        result =
            await response.json();

    } catch {

        throw new Error(
            "PDF情報更新APIから有効な応答を取得できませんでした。"
        );
    }


    if (
        !response.ok ||
        result?.success !== true
    ) {

        throw new Error(
            result?.message ||
            "PDF情報をMaterialsへ登録できませんでした。"
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


    if (!validateForm()) {
        return;
    }


    const file =
        fileElement?.files?.[0] ||
        null;


    hideElement(
        formErrorElement
    );


    setSaving(
        true
    );


    try {

        /*
         * =====================================
         * EDIT
         * =====================================
         */

        if (isEditMode) {

            /*
             * Metadata
             */

            await updateMaterialMetadata();


            /*
             * PDFが選択された場合だけ
             * Blobを差し替えます。
             */

            if (file) {

                const uploadInfo =
                    await requestUploadUrl(
                        editingMaterialId,
                        file
                    );


                await uploadPdf(
                    uploadInfo.uploadUrl,
                    file
                );


                await updateMaterialPdf(
                    editingMaterialId,
                    uploadInfo.blobName,
                    uploadInfo.originalFileName
                );
            }


            window.alert(
                file
                    ? "資料情報とPDFを更新しました。"
                    : "資料情報を更新しました。"
            );


            window.location.href =
                "/admin/index.html";


            return;
        }


        /*
         * =====================================
         * CREATE
         * =====================================
         */

        if (!file) {

            throw new Error(
                "PDFファイルを選択してください。"
            );
        }


        /*
         * Materialsへdraft登録
         */

        const material =
            await createMaterial();


        /*
         * Upload URL
         */

        const uploadInfo =
            await requestUploadUrl(
                material.id,
                file
            );


        /*
         * PDF Upload
         */

        await uploadPdf(
            uploadInfo.uploadUrl,
            file
        );


        /*
         * PDF Information
         */

        await updateMaterialPdf(
            material.id,
            uploadInfo.blobName,
            uploadInfo.originalFileName
        );


        window.alert(
            "資料を登録しました。\n" +
            "PDFのアップロードも完了しました。"
        );


        window.location.href =
            "/admin/index.html";


    } catch (error) {

        console.error(
            "Material save failed:",
            error
        );


        if (
            formErrorElement
        ) {

            formErrorElement.textContent =
                error.message ||
                "資料を保存できませんでした。";
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

async function initializeEditPage() {

    updateSummaryCounter();

    updateDescriptionCounter();

    clearErrors();


    if (!isEditMode) {
        return;
    }


    try {

        await loadMaterialForEdit();


    } catch (error) {

        console.error(
            "Failed to load material for edit:",
            error
        );


        if (formErrorElement) {

            formErrorElement.textContent =
                error.message ||
                "資料情報を取得できませんでした。";
        }


        showElement(
            formErrorElement
        );
    }
}


initializeEditPage();
