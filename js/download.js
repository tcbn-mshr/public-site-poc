"use strict";

/*
 * Download Form
 *
 * 入力情報をAzure Static Web AppsのAPIへ送信し、
 * API側で履歴を保存した後にPDFを配布します。
 */


/* =========================================
   API settings
========================================= */

const downloadApiUrl = "/api/download";


/* =========================================
   URL parameters
========================================= */

const params =
    new URLSearchParams(window.location.search);

const materialId =
    params.get("id") || "";

const filePath =
    params.get("file") || "";

const materialTitle =
    params.get("title") || "資料";

const materialCategory =
    params.get("category") || "展示会資料";


/* =========================================
   DOM elements
========================================= */

const form =
    document.getElementById("download-form");

const materialIdInput =
    document.getElementById("material-id");

const materialTitleElement =
    document.getElementById(
        "download-material-title"
    );

const materialCategoryElement =
    document.getElementById(
        "download-material-category"
    );

const companyInput =
    document.getElementById("company");

const nameInput =
    document.getElementById("name");

const emailInput =
    document.getElementById("email");

const consentInput =
    document.getElementById(
        "privacy-consent"
    );

const submitButton =
    document.getElementById(
        "download-submit"
    );

const submitButtonText =
    document.getElementById(
        "submit-button-text"
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

const backLink =
    document.getElementById(
        "back-to-material"
    );


/* =========================================
   Initial display
========================================= */

function initializeDownloadPage() {

    materialIdInput.value =
        materialId;

    materialTitleElement.textContent =
        materialTitle;

    materialCategoryElement.textContent =
        materialCategory;


    /*
     * 資料詳細へ戻るリンクを設定します。
     */

    const detailParams =
        new URLSearchParams({
            id: materialId,
            file: filePath,
            title: materialTitle,
            category: materialCategory
        });

    backLink.href =
        `./material.html?${detailParams.toString()}`;


    /*
     * 資料IDが存在しない場合は送信不可にします。
     */

    if (!materialId) {
        submitButton.disabled = true;

        showApiError(
            "対象資料を特定できません。資料一覧から選択し直してください。"
        );
    }
}


/* =========================================
   Validation
========================================= */

function setFieldError(
    fieldName,
    message
) {
    const errorElement =
        document.getElementById(
            `${fieldName}-error`
        );

    if (errorElement) {
        errorElement.textContent =
            message;
    }
}


function clearErrors() {

    setFieldError("company", "");
    setFieldError("name", "");
    setFieldError("email", "");
    setFieldError("consent", "");

    apiErrorElement.hidden = true;
}


function isValidEmail(emailAddress) {

    /*
     * 詳細なメールアドレス検証は
     * API側でも必ず実施します。
     */

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        .test(emailAddress);
}


function validateForm() {

    clearErrors();

    let isValid = true;

    const company =
        companyInput.value.trim();

    const customerName =
        nameInput.value.trim();

    const email =
        emailInput.value.trim();


    if (!company) {
        setFieldError(
            "company",
            "会社名を入力してください。"
        );

        isValid = false;
    }


    if (!customerName) {
        setFieldError(
            "name",
            "氏名を入力してください。"
        );

        isValid = false;
    }


    if (!email) {
        setFieldError(
            "email",
            "メールアドレスを入力してください。"
        );

        isValid = false;

    } else if (!isValidEmail(email)) {

        setFieldError(
            "email",
            "メールアドレスの形式を確認してください。"
        );

        isValid = false;
    }


    if (!consentInput.checked) {
        setFieldError(
            "consent",
            "個人情報の取り扱いへの同意が必要です。"
        );

        isValid = false;
    }


    return isValid;
}


/* =========================================
   Display control
========================================= */

function setProcessing(isProcessing) {

    submitButton.disabled =
        isProcessing;

    companyInput.disabled =
        isProcessing;

    nameInput.disabled =
        isProcessing;

    emailInput.disabled =
        isProcessing;

    consentInput.disabled =
        isProcessing;

    processingElement.hidden =
        !isProcessing;

    submitButtonText.textContent =
        isProcessing
            ? "準備しています"
            : "同意してダウンロード";
}


function showApiError(message) {

    apiErrorElement.textContent =
        message;

    apiErrorElement.hidden = false;
}


/* =========================================
   API request
========================================= */

async function requestDownload() {

    const requestBody = {
        materialId: materialId,
        company: companyInput.value.trim(),
        name: nameInput.value.trim(),
        email: emailInput.value.trim(),
        consent: consentInput.checked
    };


    const response =
        await fetch(
            downloadApiUrl,
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify(
                    requestBody
                )
            }
        );


    /*
     * APIが返した内容を取得します。
     * エラー応答がJSONでない場合にも対応します。
     */

    let result = {};

    try {
        result =
            await response.json();
    } catch {
        result = {};
    }


    if (!response.ok) {

        const errorMessage =
            result.message ||
            "ダウンロード処理に失敗しました。";

        throw new Error(errorMessage);
    }


    if (!result.downloadUrl) {
        throw new Error(
            "ダウンロードURLを取得できませんでした。"
        );
    }


    /*
     * APIが履歴保存後に返した
     * ダウンロードURLへ移動します。
     */

    window.location.assign(
        result.downloadUrl
    );
}


/* =========================================
   Submit
========================================= */

async function handleSubmit(event) {

    event.preventDefault();

    if (!validateForm()) {
        return;
    }

    /*
     * 前回の成功メッセージを消す
     */
    successElement.hidden = true;

    setProcessing(true);

    try {

        await requestDownload();

        /*
         * ダウンロード開始成功
         */
        successElement.hidden = false;

    } catch (error) {

        console.error(error);

        showApiError(
            error.message ||
            "ダウンロードを開始できませんでした。"
        );

    } finally {

        /*
         * 成功・失敗にかかわらず
         * 「準備しています」を解除
         */
        setProcessing(false);
    }
}


/* =========================================
   Initialization
========================================= */

if (form) {
    form.addEventListener(
        "submit",
        handleSubmit
    );

    initializeDownloadPage();
}
