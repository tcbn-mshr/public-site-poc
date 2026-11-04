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


const fileRequiredElement =
    document.getElementById(
        "material-file-required"
    );


const categoryElement =
    document.getElementById(
        "material-category"
    );


/* =========================================
   English
========================================= */

const titleEnElement =
    document.getElementById(
        "material-title-en"
    );


const summaryEnElement =
    document.getElementById(
        "material-summary-en"
    );


const descriptionEnElement =
    document.getElementById(
        "material-description-en"
    );


const summaryEnCounter =
    document.getElementById(
        "summary-en-counter"
    );


const descriptionEnCounter =
    document.getElementById(
        "description-en-counter"
    );


/* =========================================
   Japanese
========================================= */

const titleJaElement =
    document.getElementById(
        "material-title-ja"
    );


const summaryJaElement =
    document.getElementById(
        "material-summary-ja"
    );


const descriptionJaElement =
    document.getElementById(
        "material-description-ja"
    );


const summaryJaCounter =
    document.getElementById(
        "summary-ja-counter"
    );


const descriptionJaCounter =
    document.getElementById(
        "description-ja-counter"
    );


/* =========================================
   Form
========================================= */

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


function getErrorElement(
    fieldName
) {

    return document.getElementById(
        `${fieldName}-error`
    );
}


/* =========================================
   Character Counters
========================================= */

function updateCounter(
    inputElement,
    counterElement,
    maximumLength
) {

    if (
        !inputElement ||
        !counterElement
    ) {
        return;
    }


    counterElement.textContent =
        `${inputElement.value.length} / ${maximumLength}`;
}


function updateAllCounters() {

    updateCounter(
        summaryEnElement,
        summaryEnCounter,
        250
    );


    updateCounter(
        descriptionEnElement,
        descriptionEnCounter,
        2000
    );


    updateCounter(
        summaryJaElement,
        summaryJaCounter,
        250
    );


    updateCounter(
        descriptionJaElement,
        descriptionJaCounter,
        2000
    );
}


/* =========================================
   Error Control
========================================= */

function clearErrors() {

    const fieldNames = [

        "material-file",

        "material-title-en",
        "material-summary-en",

        "material-category"
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
   Required Field Validation
========================================= */

function validateRequiredField(
    element,
    errorId
) {

    if (getText(element)) {
        return true;
    }


    showElement(
        document.getElementById(
            errorId
        )
    );


    return false;
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


    /* =====================================
       PDF
    ===================================== */

    if (!isEditMode) {

        if (!validatePdf()) {

            valid =
                false;


            firstInvalidElement =
                firstInvalidElement ||
                fileElement;
        }


    } else if (
        fileElement?.files?.[0]
    ) {

        /*
         * 編集時はPDF選択時だけ
         * PDF形式を検証。
         */

        if (!validatePdf()) {

            valid =
                false;


            firstInvalidElement =
                firstInvalidElement ||
                fileElement;
        }
    }


    /* =====================================
       English Title
    ===================================== */

    if (
        !validateRequiredField(
            titleEnElement,
            "material-title-en-error"
        )
    ) {

        valid =
            false;


        firstInvalidElement =
            firstInvalidElement ||
            titleEnElement;
    }


    /* =====================================
       English Summary
    ===================================== */

    if (
        !validateRequiredField(
            summaryEnElement,
            "material-summary-en-error"
        )
    ) {

        valid =
            false;


        firstInvalidElement =
            firstInvalidElement ||
            summaryEnElement;
    }


    /* =====================================
       Category
    ===================================== */

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


    /* =====================================
       Descriptions
       Japanese fields

       すべて任意なので検証なし。
    ===================================== */


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
   Legacy Field Generation
========================================= */

function createLocalizedPayload() {

    const titleEn =
        getText(
            titleEnElement
        );


    const summaryEn =
        getText(
            summaryEnElement
        );


    const descriptionEn =
        getText(
            descriptionEnElement
        );


    const titleJa =
        getText(
            titleJaElement
        );


    const summaryJa =
        getText(
            summaryJaElement
        );


    const descriptionJa =
        getText(
            descriptionJaElement
        );


    /*
     * Legacy fields
     *
     * 日本語があれば日本語を優先。
     * 日本語がなければ必須の英語を使用。
     *
     * descriptionは詳細説明がなくても
     * 一覧用説明を使うことで、
     * 従来フィールドとの互換性を維持。
     */

    const legacyTitle =
        titleJa ||
        titleEn;


    const legacySummary =
        summaryJa ||
        summaryEn;


    const legacyDescription =
        descriptionJa ||
        summaryJa ||
        descriptionEn ||
        summaryEn;


    return {

        title:
            legacyTitle,

        summary:
            legacySummary,

        description:
            legacyDescription,

        titleEn:
            titleEn,

        summaryEn:
            summaryEn,

        descriptionEn:
            descriptionEn,

        titleJa:
            titleJa,

        summaryJa:
            summaryJa,

        descriptionJa:
            descriptionJa
    };
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


    /* =====================================
       English
    ===================================== */

    if (titleEnElement) {

        titleEnElement.value =
            material.titleEn ||
            "";
    }


    if (summaryEnElement) {

        summaryEnElement.value =
            material.summaryEn ||
            "";
    }


    if (descriptionEnElement) {

        descriptionEnElement.value =
            material.descriptionEn ||
            "";
    }


    /* =====================================
       Japanese

       既存資料にはtitleJa等が無い場合が
       あるのでLegacy値へフォールバック。
    ===================================== */

    if (titleJaElement) {

        titleJaElement.value =
            material.titleJa ||
            material.title ||
            "";
    }


    if (summaryJaElement) {

        summaryJaElement.value =
            material.summaryJa ||
            material.summary ||
            "";
    }


    if (descriptionJaElement) {

        /*
         * ここではLegacy descriptionへ
         * 自動コピーしません。
         *
         * descriptionJaが無い場合は空欄にして、
         * 任意項目であることを維持します。
         */

        descriptionJaElement.value =
            material.descriptionJa ||
            "";
    }


    /* =====================================
       Category
    ===================================== */

    if (categoryElement) {

        categoryElement.value =
            material.category ||
            "";
    }


    /* =====================================
       Status
    ===================================== */

    const status =
        material.status ===
            "published"
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


    /* =====================================
       PDF required mark
    ===================================== */

    if (fileRequiredElement) {

        /*
         * 編集時はPDF任意。
         */

        fileRequiredElement.hidden =
            true;
    }


    updateAllCounters();
}


/* =========================================
   Create Material
========================================= */

async function createMaterial() {

    const localized =
        createLocalizedPayload();


    const payload = {

        ...localized,

        category:
            getText(
                categoryElement
            ),

        /*
         * 新規作成直後は必ずdraft。
         *
         * PDF / thumbnail登録完了前に
         * 公開されるのを防止。
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
   Request Upload URL
========================================= */

async function requestUploadUrl(
    materialId,
    file,
    uploadType = "pdf"
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
                            file.name,

                        uploadType:
                            uploadType
                    })
            }
        );


    let result;


    try {

        result =
            await response.json();


    } catch {

        throw new Error(
            "アップロードURLを取得できませんでした。"
        );
    }


    if (
        !response.ok ||
        result?.success !== true
    ) {

        throw new Error(
            result?.message ||
            "アップロードの準備に失敗しました。"
        );
    }


    if (
        !result.uploadUrl ||
        !result.blobName
    ) {

        throw new Error(
            "アップロード情報が正しくありません。"
        );
    }


    return result;
}


/* =========================================
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
   Upload Thumbnail
========================================= */

async function uploadThumbnail(
    uploadUrl,
    thumbnailBlob
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
                        "image/jpeg"
                },

                body:
                    thumbnailBlob
            }
        );


    if (!response.ok) {

        throw new Error(
            "サムネイル画像をアップロードできませんでした。"
        );
    }
}


/* =========================================
   Create And Upload Thumbnail
========================================= */

async function createAndUploadThumbnail(
    materialId,
    pdfFile
) {

    if (
        typeof window.createPdfThumbnail !==
        "function"
    ) {

        throw new Error(
            "PDFサムネイル生成機能を読み込めませんでした。"
        );
    }


    const thumbnailBlob =
        await window.createPdfThumbnail(
            pdfFile
        );


    if (
        !thumbnailBlob ||
        thumbnailBlob.type !==
            "image/jpeg"
    ) {

        throw new Error(
            "PDFサムネイル画像を生成できませんでした。"
        );
    }


    const thumbnailFile =
        new File(
            [
                thumbnailBlob
            ],

            "thumbnail.jpg",

            {
                type:
                    "image/jpeg"
            }
        );


    const thumbnailUploadInfo =
        await requestUploadUrl(
            materialId,
            thumbnailFile,
            "thumbnail"
        );


    await uploadThumbnail(
        thumbnailUploadInfo.uploadUrl,
        thumbnailBlob
    );


    return thumbnailUploadInfo;
}


/* =========================================
   Update Material Metadata
========================================= */

async function updateMaterialMetadata() {

    const localized =
        createLocalizedPayload();


    const payload = {

        id:
            editingMaterialId,

        ...localized,

        category:
            getText(
                categoryElement
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
   Update Material PDF / Thumbnail
========================================= */

async function updateMaterialPdf(
    materialId,
    blobName,
    originalFileName,
    thumbnailBlobName
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
                            originalFileName,

                        thumbnailBlobName:
                            thumbnailBlobName
                    })
            }
        );


    let result;


    try {

        result =
            await response.json();


    } catch {

        throw new Error(
            "PDF・サムネイル情報更新APIから有効な応答を取得できませんでした。"
        );
    }


    if (
        !response.ok ||
        result?.success !== true
    ) {

        throw new Error(
            result?.message ||
            "PDF・サムネイル情報を登録できませんでした。"
        );
    }


    return result.material;
}


/* =========================================
   Update Publication Status
========================================= */

async function updateMaterialStatus(
    materialId,
    status
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

                        status:
                            status
                    })
            }
        );


    let result;


    try {

        result =
            await response.json();


    } catch {

        throw new Error(
            "公開状態更新APIから有効な応答を取得できませんでした。"
        );
    }


    if (
        !response.ok ||
        result?.success !== true
    ) {

        throw new Error(
            result?.message ||
            "公開状態を更新できませんでした。"
        );
    }


    return result.material;
}


/* =========================================
   Upload PDF And Thumbnail
========================================= */

async function uploadMaterialFiles(
    materialId,
    file
) {

    /*
     * PDF SAS
     */

    const uploadInfo =
        await requestUploadUrl(
            materialId,
            file,
            "pdf"
        );


    /*
     * PDF PUT
     */

    await uploadPdf(
        uploadInfo.uploadUrl,
        file
    );


    /*
     * Thumbnail生成 + PUT
     */

    const thumbnailUploadInfo =
        await createAndUploadThumbnail(
            materialId,
            file
        );


    /*
     * Blob情報保存
     */

    await updateMaterialPdf(
        materialId,
        uploadInfo.blobName,
        uploadInfo.originalFileName,
        thumbnailUploadInfo.blobName
    );
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


    const selectedStatus =
        getSelectedStatus();


    hideElement(
        formErrorElement
    );


    setSaving(
        true
    );


    try {

        /* =================================
           EDIT
        ================================= */

        if (isEditMode) {

            /*
             * 日英Metadata更新
             */

            await updateMaterialMetadata();


            /*
             * PDFが選択されている場合のみ
             * PDF + Thumbnail更新。
             */

            if (file) {

                await uploadMaterialFiles(
                    editingMaterialId,
                    file
                );
            }


            /*
             * 公開状態
             *
             * metadataやPDF更新完了後に実施。
             */

            await updateMaterialStatus(
                editingMaterialId,
                selectedStatus
            );


            window.alert(
                file
                    ? "資料情報、PDF、サムネイルを更新しました。"
                    : "資料情報を更新しました。"
            );


            window.location.href =
                "/admin/index.html";


            return;
        }


        /* =================================
           CREATE
        ================================= */

        if (!file) {

            throw new Error(
                "PDFファイルを選択してください。"
            );
        }


        /*
         * 新規作成
         *
         * APIへはdraftで登録。
         */

        const material =
            await createMaterial();


        /*
         * PDF + Thumbnail
         */

        await uploadMaterialFiles(
            material.id,
            file
        );


        /*
         * ユーザーが公開を選択していれば、
         * ファイル登録完了後にpublishedへ変更。
         *
         * draft選択ならdraftのまま。
         */

        if (
            selectedStatus ===
            "published"
        ) {

            await updateMaterialStatus(
                material.id,
                "published"
            );
        }


        window.alert(
            selectedStatus ===
                "published"
                ? "資料を登録し、公開しました。"
                : "資料を下書きとして登録しました。"
        );


        window.location.href =
            "/admin/index.html";


    } catch (error) {

        console.error(
            "Material save failed:",
            error
        );


        if (formErrorElement) {

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
   Events - English
========================================= */

if (summaryEnElement) {

    summaryEnElement.addEventListener(
        "input",
        () => {

            updateCounter(
                summaryEnElement,
                summaryEnCounter,
                250
            );
        }
    );
}


if (descriptionEnElement) {

    descriptionEnElement.addEventListener(
        "input",
        () => {

            updateCounter(
                descriptionEnElement,
                descriptionEnCounter,
                2000
            );
        }
    );
}


/* =========================================
   Events - Japanese
========================================= */

if (summaryJaElement) {

    summaryJaElement.addEventListener(
        "input",
        () => {

            updateCounter(
                summaryJaElement,
                summaryJaCounter,
                250
            );
        }
    );
}


if (descriptionJaElement) {

    descriptionJaElement.addEventListener(
        "input",
        () => {

            updateCounter(
                descriptionJaElement,
                descriptionJaCounter,
                2000
            );
        }
    );
}


/* =========================================
   Submit Event
========================================= */

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

    updateAllCounters();


    clearErrors();


    /*
     * 新規登録ではPDF必須。
     */

    if (fileRequiredElement) {

        fileRequiredElement.hidden =
            false;
    }


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


/* =========================================
   Start
========================================= */

initializeEditPage();
