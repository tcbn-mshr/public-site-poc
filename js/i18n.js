"use strict";


/* =========================================
   Configuration
========================================= */

const LANGUAGE_STORAGE_KEY =
    "inabata-language";

const DEFAULT_LANGUAGE =
    "en";


/* =========================================
   Translations
========================================= */

const translations = {

    /* =====================================
       English
    ===================================== */

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


        /* =================================
           Top Page
        ================================= */

        "top.label":
            "EXHIBITION MATERIALS",

        "top.title":
            "Exhibition Materials",

        "top.description":
            "Explore product, technology and service materials from INABATA.",

        "top.button":
            "View Materials",


        /* =================================
           Materials Page
        ================================= */

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


        /* =================================
           Material Detail
        ================================= */

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


        /* =================================
           Download Page
        ================================= */

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


        /* Company */

        "download.company":
            "Company",

        "download.companyError":
            "Please enter your company name.",


        /* Department */

        "download.department":
            "Department",


        /* Name */

        "download.name":
            "Name",

        "download.nameError":
            "Please enter your name.",


        /* Email */

        "download.email":
            "Email Address",

        "download.emailError":
            "Please enter a valid email address.",


        /* Phone */

        "download.phone":
            "Phone Number",


        /* Optional */

        "download.optional":
            "Optional",


        /* Consent */

        "download.handling":
            "Handling of Personal Information",

        "download.consentPrefix":
            "I have read and agree to the ",

        "download.consentSuffix":
            ".",

        "download.consentError":
            "You must agree to the Handling of Personal Information.",


        /* Download operation */

        "download.submit":
            "Agree and Download",

        "download.processing":
            "Preparing your download...",

        "download.success":
            "Your download has started.",

        "download.apiError":
            "Unable to start the download. Please review your information and try again.",


        /* =================================
           Cookie
        ================================= */

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


    /* =====================================
       Japanese
    ===================================== */

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


        /* =================================
           Top Page
        ================================= */

        "top.label":
            "EXHIBITION MATERIALS",

        "top.title":
            "展示会資料",

        "top.description":
            "製品・技術・サービスに関する展示会資料をご覧いただけます。",

        "top.button":
            "資料を見る",


        /* =================================
           Materials Page
        ================================= */

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


        /* =================================
           Material Detail
        ================================= */

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


        /* =================================
           Download Page
        ================================= */

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


        /* Company */

        "download.company":
            "会社名",

        "download.companyError":
            "会社名を入力してください。",


        /* Department */

        "download.department":
            "部署名",


        /* Name */

        "download.name":
            "氏名",

        "download.nameError":
            "氏名を入力してください。",


        /* Email */

        "download.email":
            "メールアドレス",

        "download.emailError":
            "正しいメールアドレスを入力してください。",


        /* Phone */

        "download.phone":
            "電話番号",


        /* Optional */

        "download.optional":
            "任意",


        /* Consent */

        "download.handling":
            "個人情報の取扱いについて",

        "download.consentPrefix":
            "「",

        "download.consentSuffix":
            "」を確認し、同意します。",

        "download.consentError":
            "個人情報の取扱いへの同意が必要です。",


        /* Download operation */

        "download.submit":
            "同意してダウンロード",

        "download.processing":
            "ダウンロードを準備しています...",

        "download.success":
            "ダウンロードを開始しました。",

        "download.apiError":
            "ダウンロードを開始できませんでした。入力内容をご確認のうえ、もう一度お試しください。",


        /* =================================
           Cookie
        ================================= */

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
   Current Language
========================================= */

function getCurrentLanguage() {

    const savedLanguage =
        localStorage.getItem(
            LANGUAGE_STORAGE_KEY
        );


    if (
        savedLanguage === "ja" ||
        savedLanguage === "en"
    ) {

        return savedLanguage;
    }


    /*
     * First visit:
     * English is always the default.
     */

    return DEFAULT_LANGUAGE;
}


/* =========================================
   Translation
========================================= */

function translate(
    key,
    language = getCurrentLanguage()
) {

    const languageMessages =
        translations[language] || {};


    const englishMessages =
        translations.en || {};


    if (
        Object.prototype.hasOwnProperty.call(
            languageMessages,
            key
        )
    ) {

        return languageMessages[key];
    }


    if (
        Object.prototype.hasOwnProperty.call(
            englishMessages,
            key
        )
    ) {

        return englishMessages[key];
    }


    return key;
}


/* =========================================
   Apply Language
========================================= */

function applyLanguage(language) {

    if (
        language !== "ja" &&
        language !== "en"
    ) {

        language =
            DEFAULT_LANGUAGE;
    }


    /*
     * HTML lang
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


                if (!key) {
                    return;
                }


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


                if (!key) {
                    return;
                }


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
     * aria-label
     */

    document
        .querySelectorAll(
            "[data-i18n-aria-label]"
        )
        .forEach(
            (element) => {

                const key =
                    element.dataset
                        .i18nAriaLabel;


                if (!key) {
                    return;
                }


                element.setAttribute(
                    "aria-label",
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

                const isSelected =
                    button.dataset.language ===
                    language;


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


/* =========================================
   Set Language
========================================= */

function setLanguage(language) {

    if (
        language !== "ja" &&
        language !== "en"
    ) {
        return;
    }


    /*
     * Persist selection
     */

    localStorage.setItem(
        LANGUAGE_STORAGE_KEY,
        language
    );


    /*
     * Immediately update page
     */

    applyLanguage(
        language
    );


    /*
     * Notify dynamic JavaScript such as
     * app.js / material.js / download.js.
     *
     * Materials multilingual support can
     * listen for this event later.
     */

    window.dispatchEvent(
        new CustomEvent(
            "inabata-language-change",
            {
                detail: {
                    language:
                        language
                }
            }
        )
    );
}


/* =========================================
   Language Switcher
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

                        const language =
                            button.dataset.language;


                        setLanguage(
                            language
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


/* =========================================
   Start
========================================= */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initializeI18n
    );

} else {

    initializeI18n();
}
