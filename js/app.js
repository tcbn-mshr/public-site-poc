"use strict";

/*
 * Exhibition Materials
 * PDF list and material card control
 */


/* =========================================
   Azure Blob Storage settings
========================================= */

const storageBaseUrl =
    "https://satenjikaiweb.blob.core.windows.net/files";

const containerListUrl =
    `${storageBaseUrl}?restype=container&comp=list`;


/* =========================================
   DOM elements
========================================= */

const materialsList =
    document.getElementById("materials-list");

const loadingElement =
    document.getElementById("materials-loading");

const errorElement =
    document.getElementById("materials-error");

const categoryButtons =
    document.querySelectorAll(".category-button");


/* =========================================
   Category definitions

   PDFをフォルダーに格納した場合、
   先頭のフォルダー名をカテゴリーとして扱います。

   例:
   electronics/product-a.pdf
   chemicals/product-b.pdf
   life/product-c.pdf
========================================= */

const categoryDefinitions = {
    electronics: {
        name: "情報電子",
        aliases: [
            "electronics",
            "information-electronics"
        ]
    },

    chemicals: {
        name: "化学品",
        aliases: [
            "chemicals",
            "chemical"
        ]
    },

    life: {
        name: "生活産業",
        aliases: [
            "life",
            "life-industry"
        ]
    }
};


/* =========================================
   Internal state
========================================= */

let materials = [];


/* =========================================
   Utility functions
========================================= */

/**
 * Blob上のファイルパスを安全なURLへ変換します。
 *
 * 例:
 * electronics/sample file.pdf
 * 　↓
 * electronics/sample%20file.pdf
 */
function encodeBlobPath(filePath) {
    return filePath
        .split("/")
        .map(pathPart => encodeURIComponent(pathPart))
        .join("/");
}


/**
 * ファイルパスからファイル名だけを取得します。
 *
 * 例:
 * electronics/product-a.pdf
 * 　↓
 * product-a.pdf
 */
function getFileName(filePath) {
    const pathParts = filePath.split("/");

    return pathParts[pathParts.length - 1];
}


/**
 * PDFファイル名から拡張子を除去します。
 */
function removePdfExtension(fileName) {
    return fileName.replace(/\.pdf$/i, "");
}


/**
 * ファイル名から表示用タイトルを生成します。
 *
 * 例:
 * product-a_catalog.pdf
 * 　↓
 * product a catalog
 *
 * 正式な資料名は、今後materials.jsonから
 * 取得する方式へ変更できます。
 */
function createDisplayTitle(filePath) {
    const fileName = getFileName(filePath);
    const nameWithoutExtension =
        removePdfExtension(fileName);

    const convertedName = nameWithoutExtension
        .replace(/[_-]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();

    return convertedName || "名称未設定の資料";
}


/**
 * ファイルパスからカテゴリーを判定します。
 *
 * 現在PDFがfilesコンテナー直下にある場合は、
 * uncategorizedとして扱います。
 */
function getCategoryFromPath(filePath) {
    const normalizedPath =
        filePath.toLowerCase();

    const firstDirectory =
        normalizedPath.includes("/")
            ? normalizedPath.split("/")[0]
            : "";

    for (const [categoryKey, definition]
        of Object.entries(categoryDefinitions)) {

        if (
            definition.aliases.includes(firstDirectory)
        ) {
            return {
                key: categoryKey,
                name: definition.name
            };
        }
    }

    return {
        key: "uncategorized",
        name: "展示会資料"
    };
}


/**
 * Blobファイル情報から画面表示用の資料情報を作ります。
 */
function createMaterial(filePath, index) {
    const category =
        getCategoryFromPath(filePath);

    const encodedPath =
        encodeBlobPath(filePath);

    return {
        id: `material-${index + 1}`,
        filePath: filePath,
        fileName: getFileName(filePath),
        title: createDisplayTitle(filePath),
        category: category.key,
        categoryName: category.name,
        pdfUrl: `${storageBaseUrl}/${encodedPath}`
    };
}


/* =========================================
   Card creation
========================================= */

/**
 * 1件の資料カードを生成します。
 */
function createMaterialCard(material) {
    const article =
        document.createElement("article");

    article.className = "material-card";
    article.dataset.category =
        material.category;


    /* Card image area */

    const imageArea =
        document.createElement("div");

    imageArea.className =
        "material-card-image";

    const fileType =
        document.createElement("span");

    fileType.className =
        "material-file-type";

    fileType.textContent = "PDF";

    imageArea.appendChild(fileType);


    /* Card content */

    const content =
        document.createElement("div");

    content.className =
        "material-card-content";


    const category =
        document.createElement("p");

    category.className =
        "material-category";

    category.textContent =
        material.categoryName;


    const title =
        document.createElement("h3");

    title.className =
        "material-title";

    title.textContent =
        material.title;


    const description =
        document.createElement("p");

    description.className =
        "material-description";

    description.textContent =
        "製品・技術資料の詳細をご確認いただけます。";


    const detailLink =
        document.createElement("a");

    detailLink.className =
        "material-link";

    const queryParameters =
        new URLSearchParams({
            id: material.id,
            file: material.filePath,
            title: material.title,
            category: material.categoryName
        });

    detailLink.href =
        `./material.html?${queryParameters.toString()}`;

    const linkText =
        document.createElement("span");

    linkText.textContent =
        "詳細を見る";

    const arrow =
        document.createElement("span");

    arrow.setAttribute(
        "aria-hidden",
        "true"
    );

    arrow.textContent = "→";

    detailLink.appendChild(linkText);
    detailLink.appendChild(arrow);


    content.appendChild(category);
    content.appendChild(title);
    content.appendChild(description);
    content.appendChild(detailLink);

    article.appendChild(imageArea);
    article.appendChild(content);

    return article;
}


/* =========================================
   Material rendering
========================================= */

/**
 * 指定されたカテゴリーの資料を表示します。
 */
function renderMaterials(category = "all") {
    materialsList.innerHTML = "";

    const filteredMaterials =
        category === "all"
            ? materials
            : materials.filter(
                material =>
                    material.category === category
            );

    if (filteredMaterials.length === 0) {
        const emptyMessage =
            document.createElement("p");

        emptyMessage.className =
            "materials-empty";

        emptyMessage.textContent =
            category === "all"
                ? "公開中のPDF資料はありません。"
                : "該当するカテゴリーの資料はありません。";

        materialsList.appendChild(
            emptyMessage
        );

        return;
    }

    const fragment =
        document.createDocumentFragment();

    filteredMaterials.forEach(material => {
        const card =
            createMaterialCard(material);

        fragment.appendChild(card);
    });

    materialsList.appendChild(fragment);
}


/* =========================================
   Category filter
========================================= */

function initializeCategoryFilter() {
    categoryButtons.forEach(button => {
        button.addEventListener(
            "click",
            () => {
                categoryButtons.forEach(
                    otherButton => {
                        otherButton.classList.remove(
                            "active"
                        );
                    }
                );

                button.classList.add("active");

                const selectedCategory =
                    button.dataset.category;

                renderMaterials(
                    selectedCategory
                );
            }
        );
    });
}


/* =========================================
   Loading and error display
========================================= */

function showLoading() {
    loadingElement.hidden = false;
    errorElement.hidden = true;
}

function hideLoading() {
    loadingElement.hidden = true;
}

function showError(message) {
    hideLoading();

    materialsList.innerHTML = "";

    errorElement.textContent = message;
    errorElement.hidden = false;
}


/* =========================================
   Blob Storage access
========================================= */

async function loadMaterials() {
    showLoading();

    try {
        const response =
            await fetch(containerListUrl);

        if (!response.ok) {
            throw new Error(
                `Blob一覧の取得に失敗しました: ` +
                `HTTP ${response.status}`
            );
        }

        const xmlText =
            await response.text();

        const parser =
            new DOMParser();

        const xml =
            parser.parseFromString(
                xmlText,
                "application/xml"
            );

        const parserError =
            xml.querySelector("parsererror");

        if (parserError) {
            throw new Error(
                "Blob一覧のXML解析に失敗しました。"
            );
        }

        const blobElements =
            Array.from(
                xml.getElementsByTagName("Blob")
            );

        const pdfFiles =
            blobElements
                .map(blob => {
                    const nameElement =
                        blob.getElementsByTagName(
                            "Name"
                        )[0];

                    return nameElement
                        ? nameElement.textContent
                        : "";
                })
                .filter(filePath =>
                    filePath
                        .toLowerCase()
                        .endsWith(".pdf")
                )
                .sort((fileA, fileB) =>
                    fileA.localeCompare(
                        fileB,
                        "ja"
                    )
                );

        materials =
            pdfFiles.map(
                (filePath, index) =>
                    createMaterial(
                        filePath,
                        index
                    )
            );

        hideLoading();
        renderMaterials("all");

    } catch (error) {
        console.error(error);

        showError(
            "資料一覧を取得できませんでした。"
        );
    }
}


/* =========================================
   Initialization
========================================= */

function initializeMaterialsPage() {
    if (
        !materialsList ||
        !loadingElement ||
        !errorElement
    ) {
        console.error(
            "資料一覧画面のHTML要素が見つかりません。"
        );

        return;
    }

    initializeCategoryFilter();
    loadMaterials();
}

initializeMaterialsPage();
