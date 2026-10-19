"use strict";

/*
 * Material Detail Page
 *
 * materials.html から渡されたURLパラメーターを取得し、
 * 資料詳細画面へ表示します。
 */


/* =========================================
   URL Parameters
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
   DOM Elements
========================================= */

const titleElement =
    document.getElementById(
        "material-detail-title"
    );

const categoryElement =
    document.getElementById(
        "material-category"
    );

const downloadPageLink =
    document.getElementById(
        "download-page-link"
    );


/* =========================================
   Material Information
========================================= */

function displayMaterialInformation() {

    if (titleElement) {
        titleElement.textContent =
            materialTitle;
    }

    if (categoryElement) {
        categoryElement.textContent =
            materialCategory;
    }


    /*
     * 次のdownload.htmlへ
     * 同じ資料情報を引き継ぎます。
     */

    if (downloadPageLink) {

        const downloadParams =
            new URLSearchParams({
                id: materialId,
                file: filePath,
                title: materialTitle,
                category: materialCategory
            });

        downloadPageLink.href =
            `./download.html?${downloadParams.toString()}`;
    }
}


/* =========================================
   Initialization
========================================= */

displayMaterialInformation();
