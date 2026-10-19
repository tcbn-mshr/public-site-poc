"use strict";


/* =========================================
   Cookie Consent
========================================= */

const CONSENT_STORAGE_KEY =
    "inabata-cookie-consent";


const cookieBanner =
    document.getElementById(
        "cookie-banner"
    );

const acceptButton =
    document.getElementById(
        "cookie-accept"
    );

const rejectButton =
    document.getElementById(
        "cookie-reject"
    );


/* =========================================
   Consent
========================================= */

function getCookieConsent() {

    return localStorage.getItem(
        CONSENT_STORAGE_KEY
    );
}


function saveCookieConsent(
    consent
) {

    localStorage.setItem(
        CONSENT_STORAGE_KEY,
        consent
    );
}


function hideCookieBanner() {

    if (cookieBanner) {
        cookieBanner.hidden = true;
    }
}


function showCookieBanner() {

    if (cookieBanner) {
        cookieBanner.hidden = false;
    }
}


/* =========================================
   Accept
========================================= */

function acceptCookies() {

    saveCookieConsent(
        "accepted"
    );

    hideCookieBanner();

    /*
     * 将来アクセス解析を追加する場合、
     * ここで解析系Cookieを有効化します。
     */
}


/* =========================================
   Reject
========================================= */

function rejectCookies() {

    saveCookieConsent(
        "rejected"
    );

    hideCookieBanner();

    /*
     * 必須Cookie以外のCookieを
     * 有効にしません。
     */
}


/* =========================================
   Initialization
========================================= */

function initializeCookieConsent() {

    if (!cookieBanner) {
        return;
    }


    const consent =
        getCookieConsent();


    /*
     * 過去に選択されていれば
     * バナーを表示しません。
     */

    if (
        consent === "accepted" ||
        consent === "rejected"
    ) {

        hideCookieBanner();

        return;
    }


    /*
     * 初回アクセス
     */

    showCookieBanner();


    if (acceptButton) {

        acceptButton.addEventListener(
            "click",
            acceptCookies
        );
    }


    if (rejectButton) {

        rejectButton.addEventListener(
            "click",
            rejectCookies
        );
    }
}


initializeCookieConsent();
