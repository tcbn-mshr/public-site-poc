"use strict";


/* =========================================
   Configuration
========================================= */

const LANGUAGE_STORAGE_KEY =
    "inabata-language";

const DEFAULT_LANGUAGE =
    "en";

const SUPPORTED_LANGUAGES =
    new Set([
        "ja",
        "en"
    ]);


/* =========================================
   Translations
========================================= */

const translations = {

    /* =====================================
       English
    ===================================== */

    en: {

        /* ---------------------------------
           Common
        --------------------------------- */

        "common.japanese":
            "日本語",

        "common.english":
            "English",


        /* ---------------------------------
           Home
        --------------------------------- */

        "home.title":
            "Exhibition Materials",

        "home.description":
            "Explore our exhibition materials featuring products, technologies, and services.",

        "home.viewMaterials":
            "View Materials",


        /* ---------------------------------
           Materials
        --------------------------------- */

        "materials.title":
            "Materials",

        "materials.description":
            "Browse our exhibition materials by category.",

        "materials.categoryAll":
            "All",

        "materials.categoryElectronics":
            "Information & Electronics",

        /*
         * 現在HTMLでは非表示ですが、
         * 将来再利用できるよう翻訳値は残します。
         */

        "materials.categoryChemicals":
            "Chemicals",

        "materials.categoryLife":
            "Life Industry",

        "materials.categoryPlastics":
            "Plastics",

        "materials.categoryOther":
            "Other",

        "materials.detail":
            "View Details",

        "materials.backTop":
            "Back to TOP",

        "materials.loading":
            "Loading materials...",

        "materials.error":
            "Unable to load materials.",

        "materials.empty":
            "No materials are available in this category.",


        /* ---------------------------------
           Material Detail
        --------------------------------- */

        "material.download":
            "Download Material",

        "material.back":
            "Back to Materials",

        "material.loading":
            "Loading material information...",

        "material.error":
            "Unable to load the material information.",

        "material.descriptionFallback":
            "Please review the material details and proceed to the download page.",


        /* ---------------------------------
           Download
        --------------------------------- */

        "download.title":
            "Download Material",

        "download.description":
            "Please enter the required information below to download the material.",

        "download.formTitle":
            "Your Information",

        "download.required":
            "Required",

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

        "download.consent":
            "I agree to the handling of my personal information.",

        "download.submit":
            "Agree and Download",

        "download.processing":
            "Preparing your download...",

        "download.success":
            "Your download has started.",

        "download.apiError":
            "Unable to start the download.",

        "download.back":
            "Back to Material Details",

        "download.loading":
            "Loading material information...",

        "download.pageError":
            "Unable to load the material information.",

        "download.companyError":
            "Please enter your company name.",

        "download.nameError":
            "Please enter your name.",

        "download.emailError":
            "Please enter a valid email address.",

        "download.consentError":
            "Please agree to the handling of your personal information.",


        /* ---------------------------------
           Footer
        --------------------------------- */

        "footer.privacy":
            "Privacy Policy",

        "footer.personalInformation":
            "Handling of Personal Information",

        "footer.cookie":
            "Cookie Policy",

        "footer.sitePolicy":
            "Site Policy",


        /* ---------------------------------
           Cookie Consent
        --------------------------------- */

        "cookie.title":
            "Cookie Notice",

        "cookie.message":
            "This website uses cookies to provide a better browsing experience.",

        "cookie.policy":
            "Cookie Policy",

        "cookie.accept":
            "Accept",

        "cookie.decline":
            "Decline"
    },


    /* =====================================
       Japanese
    ===================================== */

    ja: {

        /* ---------------------------------
           Common
        --------------------------------- */

        "common.japanese":
            "日本語",

        "common.english":
            "English",


        /* ---------------------------------
           Home
        --------------------------------- */

        "home.title":
            "展示会資料",

        "home.description":
            "製品・技術・サービスに関する展示会資料をご覧いただけます。",

        "home.viewMaterials":
            "資料一覧を見る",


        /* ---------------------------------
           Materials
        --------------------------------- */

        "materials.title":
            "資料一覧",

        "materials.description":
            "展示会資料をカテゴリー別にご覧いただけます。",

        "materials.categoryAll":
            "すべて",

        "materials.categoryElectronics":
            "情報電子",

        /*
         * 現在HTMLでは非表示ですが、
         * 将来再利用できるよう翻訳値は残します。
         */

        "materials.categoryChemicals":
            "化学品",

        "materials.categoryLife":
            "生活産業",

        "materials.categoryPlastics":
            "合成樹脂",

        "materials.categoryOther":
            "その他",

        "materials.detail":
            "詳細を見る",

        "materials.backTop":
            "TOPページへ戻る",

        "materials.loading":
            "資料を読み込んでいます...",

        "materials.error":
            "資料を読み込めませんでした。",

        "materials.empty":
            "該当する資料はありません。",


        /* ---------------------------------
           Material Detail
        --------------------------------- */

        "material.download":
            "資料をダウンロード",

        "material.back":
            "資料一覧へ戻る",

        "material.loading":
            "資料情報を読み込んでいます...",

        "material.error":
            "資料情報を取得できませんでした。",

        "material.descriptionFallback":
            "資料の詳細をご確認のうえ、ダウンロードページへお進みください。",


        /* ---------------------------------
           Download
        --------------------------------- */

        "download.title":
            "資料ダウンロード",

        "download.description":
            "必要事項をご入力のうえ、資料をダウンロードしてください。",

        "download.formTitle":
            "お客様情報",

        "download.required":
            "必須項目",

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

        "download.consent":
            "個人情報の取扱いに同意します。",

        "download.submit":
            "同意してダウンロード",

        "download.processing":
            "ダウンロードを準備しています...",

        "download.success":
            "ダウンロードを開始しました。",

        "download.apiError":
            "ダウンロードを開始できませんでした。",

        "download.back":
            "資料詳細へ戻る",

        "download.loading":
            "資料情報を読み込んでいます...",

        "download.pageError":
            "資料情報を取得できませんでした。",

        "download.companyError":
            "会社名を入力してください。",

        "download.nameError":
            "氏名を入力してください。",

        "download.emailError":
            "有効なメールアドレスを入力してください。",

        "download.consentError":
            "個人情報の取扱いへの同意が必要です。",


        /* ---------------------------------
           Footer
        --------------------------------- */

        "footer.privacy":
            "個人情報保護方針",

        "footer.personalInformation":
            "個人情報の取扱いについて",

        "footer.cookie":
            "Cookieポリシー",

        "footer.sitePolicy":
            "サイトポリシー",


        /* ---------------------------------
           Cookie Consent
        --------------------------------- */

        "cookie.title":
            "Cookieについて",

        "cookie.message":
            "本サイトでは、より快適にご利用いただくためCookieを使用しています。",

        "cookie.policy":
            "Cookieポリシー",

        "cookie.accept":
            "同意する",

        "cookie.decline":
            "同意しない"
    }
};


/* =========================================
   Storage
========================================= */

function getStoredLanguage() {

    try {

        const storedLanguage =
            String(
                window.localStorage.getItem(
                    LANGUAGE_STORAGE_KEY
                ) || ""
            ).trim();


        if (
            SUPPORTED_LANGUAGES.has(
                storedLanguage
            )
        ) {

            return storedLanguage;
        }


    } catch (error) {

        console.warn(
            "Unable to read language preference:",
            error
        );
    }


    return "";
}


function storeLanguage(
    language
) {

    try {

        window.localStorage.setItem(
            LANGUAGE_STORAGE_KEY,
            language
        );


    } catch (error) {

        console.warn(
            "Unable to save language preference:",
            error
        );
    }
}


/* =========================================
   Current Language
========================================= */

function getCurrentLanguage() {

    const storedLanguage =
        getStoredLanguage();


    if (storedLanguage) {

        return storedLanguage;
    }


    return DEFAULT_LANGUAGE;
}


/* =========================================
   Translate
========================================= */

function translate(key) {

    const language =
        getCurrentLanguage();


    const localizedValue =
        translations?.[
            language
        ]?.[
            key
        ];


    if (
        localizedValue !== undefined
    ) {

        return localizedValue;
    }


    /*
     * English fallback
     */

    const englishValue =
        translations?.en?.[
            key
        ];


    if (
        englishValue !== undefined
    ) {

        return englishValue;
    }


    /*
     * 未定義キー
     */

    return key;
}


/* =========================================
   Language Controls
========================================= */

function updateLanguageControls(
    language
) {

    const controls =
        document.querySelectorAll(
            "[data-language]"
        );


    controls.forEach(
        (control) => {

            const controlLanguage =
                String(
                    control.dataset
                        .language ||
                    ""
                ).trim();


            const active =
                controlLanguage ===
                language;


            control.classList.toggle(
                "is-active",
                active
            );


            control.setAttribute(
                "aria-pressed",
                String(
                    active
                )
            );


            /*
             * 現在言語を視覚的・意味的に
             * 判別できるようにする。
             */

            if (active) {

                control.setAttribute(
                    "aria-current",
                    "true"
                );


            } else {

                control.removeAttribute(
                    "aria-current"
                );
            }
        }
    );
}


/* =========================================
   Apply Translations
========================================= */

function applyTranslations() {

    const language =
        getCurrentLanguage();


    /*
     * HTML lang
     */

    document.documentElement.lang =
        language;


    /*
     * Text
     */

    const elements =
        document.querySelectorAll(
            "[data-i18n]"
        );


    elements.forEach(
        (element) => {

            const key =
                String(
                    element.dataset.i18n ||
                    ""
                ).trim();


            if (!key) {
                return;
            }


            element.textContent =
                translate(
                    key
                );
        }
    );


    /*
     * Placeholder
     */

    const placeholderElements =
        document.querySelectorAll(
            "[data-i18n-placeholder]"
        );


    placeholderElements.forEach(
        (element) => {

            const key =
                String(
                    element.dataset
                        .i18nPlaceholder ||
                    ""
                ).trim();


            if (!key) {
                return;
            }


            element.setAttribute(
                "placeholder",
                translate(
                    key
                )
            );
        }
    );


    /*
     * aria-label
     */

    const ariaElements =
        document.querySelectorAll(
            "[data-i18n-aria-label]"
        );


    ariaElements.forEach(
        (element) => {

            const key =
                String(
                    element.dataset
                        .i18nAriaLabel ||
                    ""
                ).trim();


            if (!key) {
                return;
            }


            element.setAttribute(
                "aria-label",
                translate(
                    key
                )
            );
        }
    );


    updateLanguageControls(
        language
    );
}


/* =========================================
   Static Page Title
========================================= */

function updateStaticPageTitle() {

    const language =
        getCurrentLanguage();


    const pathname =
        window.location.pathname
            .toLowerCase();


    /*
     * TOP
     */

    if (
        pathname === "/" ||
        pathname.endsWith("/") ||
        pathname.endsWith(
            "/index.html"
        )
    ) {

        document.title =
            language === "ja"
                ? "展示会資料｜INABATA"
                : "Exhibition Materials | INABATA";


        return;
    }


    /*
     * Materials
     */

    if (
        pathname.endsWith(
            "/materials.html"
        )
    ) {

        document.title =
            language === "ja"
                ? "資料一覧｜INABATA"
                : "Materials | INABATA";


        return;
    }


    /*
     * material.html と download.html は
     * material.js / download.js が
     * 資料名を含むタイトルを設定します。
     */
}


/* =========================================
   Change Language
========================================= */

function setLanguage(
    language
) {

    const normalizedLanguage =
        String(
            language || ""
        ).trim();


    if (
        !SUPPORTED_LANGUAGES.has(
            normalizedLanguage
        )
    ) {

        console.warn(
            "Unsupported language:",
            normalizedLanguage
        );


        return;
    }


    const oldLanguage =
        getCurrentLanguage();


    storeLanguage(
        normalizedLanguage
    );


    applyTranslations();


    updateStaticPageTitle();


    /*
     * 動的コンテンツを持つ
     * app.js / material.js / download.js
     * へ通知。
     */

    if (
        oldLanguage !==
        normalizedLanguage
    ) {

        window.dispatchEvent(
            new CustomEvent(
                "inabata-language-change",
                {
                    detail: {

                        language:
                            normalizedLanguage
                    }
                }
            )
        );
    }
}


/* =========================================
   Initialize Language Controls
========================================= */

function initializeLanguageControls() {

    const controls =
        document.querySelectorAll(
            "[data-language]"
        );


    controls.forEach(
        (control) => {

            control.addEventListener(
                "click",
                () => {

                    const language =
                        String(
                            control.dataset
                                .language ||
                            ""
                        ).trim();


                    setLanguage(
                        language
                    );
                }
            );
        }
    );
}


/* =========================================
   Initialize
========================================= */

function initializeI18n() {

    /*
     * 保存済み言語がない場合は
     * Englishを使用。
     */

    applyTranslations();


    updateStaticPageTitle();


    initializeLanguageControls();
}


/* =========================================
   Public API
========================================= */

window.getCurrentLanguage =
    getCurrentLanguage;


window.translate =
    translate;


window.setLanguage =
    setLanguage;


window.applyTranslations =
    applyTranslations;


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
