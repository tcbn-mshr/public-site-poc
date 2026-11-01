"use strict";


/* =========================================
   Configuration
========================================= */

const LANGUAGE_STORAGE_KEY =
    "inabata-language";

const DEFAULT_LANGUAGE =
    "en";


/* =========================================
   Messages
========================================= */

const translations = {

    en: {

        /* Common */

        "nav.materials":
            "Materials",

        "footer.privacy":
            "Privacy Policy",

        "footer.handling":
            "Handling of Personal Information",

        "footer.cookie":
            "Cookie Policy",

        "footer.site":
            "Site Policy",


        /* Top */

        "top.label":
            "EXHIBITION MATERIALS",

        "top.title":
            "Exhibition Materials",

        "top.description":
            "Explore product, technology and service materials from INABATA.",

        "top.button":
            "View Materials",


        /* Materials */

        "materials.label":
            "MATERIALS",

        "materials.title":
            "Find Materials",

        "materials.description":
            "Browse our exhibition materials by category.",

        "materials.all":
            "All",

        "materials.electronics":
            "Information & Electronics",

        "materials.loading":
            "Loading materials...",

        "materials.empty":
            "No materials were found.",

        "materials.error":
            "Unable to load materials. Please try again later.",

        "materials.reload":
            "Reload",

        "materials.detail":
            "View Details",


        /* Material Detail */

        "detail.label":
            "MATERIAL DETAIL",

        "detail.document":
            "DOCUMENT",

        "detail.download":
            "Download Material",

        "detail.loading":
            "Loading material information...",

        "detail.error":
            "Unable to load the material information.",

        "detail.back":
            "Back to Materials",


        /* Download */

        "download.label":
            "DOWNLOAD",

        "download.title":
            "Download Material",

        "download.description":
            "Please enter the required information below to download the material.",

        "download.selected":
            "SELECTED DOCUMENT",

        "download.back":
            "Back to Material Details",

        "download.yourInformation":
            "YOUR INFORMATION",

        "download.customerInformation":
            "Your Information",

        "download.requiredNote":
            "* Required fields",

        "download.company":
            "Company",

        "download.department":
            "Department",

        "download.name":
            "Name",

        "download.email":
            "Email Address",

        "download.phone":
            "Phone Number",

        "download.optional":
            "Optional",

        "download.companyError":
            "Please enter your company name.",

        "download.nameError":
            "Please enter your name.",

        "download.emailError":
            "Please enter a valid email address.",

        "download.consent":
            "I have read and agree to the Handling of Personal Information.",

        "download.consentSuffix":
            " has been reviewed and agreed to.",
       
        "download.consentError":
            "You must agree to the Handling of Personal Information.",

        "download.submit":
            "Agree and Download",

        "download.processing":
            "Preparing your download...",

        "download.success":
            "Your download has started.",

        "download.apiError":
            "Unable to start the download. Please review your information and try again.",


        /* Cookie */

        "cookie.title":
            "Use of Cookies",

        "cookie.description":
            "This website may use cookies to understand website usage and improve our services.",

        "cookie.policy":
            "Cookie Policy",

        "cookie.reject":
            "Reject",

        "cookie.accept":
            "Accept All"
    },


    ja: {

        /* Common */

        "nav.materials":
            "資料一覧",

        "footer.privacy":
            "個人情報保護方針",

        "footer.handling":
            "個人情報の取扱いについて",

        "footer.cookie":
            "Cookieポリシー",

        "footer.site":
            "サイトポリシー",


        /* Top */

        "top.label":
            "EXHIBITION MATERIALS",

        "top.title":
            "展示会資料",

        "top.description":
            "製品・技術・サービスに関する展示会資料をご覧いただけます。",

        "top.button":
            "資料を見る",


        /* Materials */

        "materials.label":
            "MATERIALS",

        "materials.title":
            "資料を探す",

        "materials.description":
            "製品・技術・サービスに関する展示会資料を、カテゴリーからお探しいただけます。",

        "materials.all":
            "すべて",

        "materials.electronics":
            "情報電子",

        "materials.loading":
            "資料を読み込んでいます...",

        "materials.empty":
            "該当する資料はありません。",

        "materials.error":
            "資料一覧を取得できませんでした。しばらくしてから、もう一度お試しください。",

        "materials.reload":
            "再読み込み",

        "materials.detail":
            "詳細を見る",


        /* Material Detail */

        "detail.label":
            "MATERIAL DETAIL",

        "detail.document":
            "DOCUMENT",

        "detail.download":
            "資料をダウンロード",

        "detail.loading":
            "資料情報を読み込んでいます...",

        "detail.error":
            "資料情報を取得できませんでした。",

        "detail.back":
            "資料一覧へ戻る",


        /* Download */

        "download.label":
            "DOWNLOAD",

        "download.title":
            "資料ダウンロード",

        "download.description":
            "必要事項をご入力のうえ、ダウンロードへお進みください。",

        "download.selected":
            "SELECTED DOCUMENT",

        "download.back":
            "資料詳細へ戻る",

        "download.yourInformation":
            "YOUR INFORMATION",

        "download.customerInformation":
            "お客様情報",

        "download.requiredNote":
            "* は必須項目です。",

        "download.company":
            "会社名",

        "download.department":
            "部署名",

        "download.name":
            "氏名",

        "download.email":
            "メールアドレス",

        "download.phone":
            "電話番号",

        "download.optional":
            "任意",

        "download.companyError":
            "会社名を入力してください。",

        "download.nameError":
            "氏名を入力してください。",

        "download.emailError":
            "正しいメールアドレスを入力してください。",

        "download.consent":
            "個人情報の取り扱いを確認し、同意します。",

        "download.consentSuffix":
            "を確認し、同意します。",
       
        "download.consentError":
            "個人情報の取り扱いへの同意が必要です。",

        "download.submit":
            "同意してダウンロード",

        "download.processing":
            "ダウンロードを準備しています...",

        "download.success":
            "ダウンロードを開始しました。",

        "download.apiError":
            "ダウンロードを開始できませんでした。入力内容をご確認のうえ、もう一度お試しください。",


        /* Cookie */

        "cookie.title":
            "Cookieの利用について",

        "cookie.description":
            "当サイトでは、サイトの利用状況の把握等のためCookieを使用する場合があります。",

        "cookie.policy":
            "Cookieポリシー",

        "cookie.reject":
            "拒否する",

        "cookie.accept":
            "すべて許可する"
    }
};


/* =========================================
   Language
========================================= */

function getCurrentLanguage() {

    const saved =
        localStorage.getItem(
            LANGUAGE_STORAGE_KEY
        );


    if (
        saved === "ja" ||
        saved === "en"
    ) {

        return saved;
    }


    /*
     * 初回アクセスは必ずEnglish
     */

    return DEFAULT_LANGUAGE;
}


function setLanguage(language) {

    if (
        language !== "ja" &&
        language !== "en"
    ) {
        return;
    }


    localStorage.setItem(
        LANGUAGE_STORAGE_KEY,
        language
    );


    applyLanguage(
        language
    );


    window.dispatchEvent(
        new CustomEvent(
            "inabata-language-change",
            {
                detail: {
                    language
                }
            }
        )
    );
}


/* =========================================
   Translation
========================================= */

function translate(
    key,
    language = getCurrentLanguage()
) {

    return (
        translations?.[language]?.[key] ??
        translations?.en?.[key] ??
        key
    );
}


function applyLanguage(language) {

    /*
     * HTML language
     */

    document.documentElement.lang =
        language;


    /*
     * Normal text
     */

    document
        .querySelectorAll(
            "[data-i18n]"
        )
        .forEach(
            (element) => {

                const key =
                    element.dataset.i18n;


                element.textContent =
                    translate(
                        key,
                        language
                    );
            }
        );


    /*
     * Placeholder
     */

    document
        .querySelectorAll(
            "[data-i18n-placeholder]"
        )
        .forEach(
            (element) => {

                const key =
                    element.dataset
                        .i18nPlaceholder;


                element.setAttribute(
                    "placeholder",
                    translate(
                        key,
                        language
                    )
                );
            }
        );


    /*
     * Language buttons
     */

    document
        .querySelectorAll(
            "[data-language]"
        )
        .forEach(
            (button) => {

                const selected =
                    button.dataset.language ===
                    language;


                button.classList.toggle(
                    "is-active",
                    selected
                );


                button.setAttribute(
                    "aria-pressed",
                    String(
                        selected
                    )
                );
            }
        );
}


/* =========================================
   Events
========================================= */

function initializeLanguageSwitcher() {

    document
        .querySelectorAll(
            "[data-language]"
        )
        .forEach(
            (button) => {

                button.addEventListener(
                    "click",
                    () => {

                        setLanguage(
                            button.dataset.language
                        );
                    }
                );
            }
        );
}


/* =========================================
   Initialization
========================================= */

function initializeI18n() {

    const language =
        getCurrentLanguage();


    initializeLanguageSwitcher();

    applyLanguage(
        language
    );
}


if (
    document.readyState === "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initializeI18n
    );

} else {

    initializeI18n();
}
