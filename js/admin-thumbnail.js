"use strict";


import * as pdfjsLib
    from "../assets/vendor/pdfjs/pdf.mjs";


/* =========================================
   PDF.js Worker
========================================= */

pdfjsLib.GlobalWorkerOptions.workerSrc =
    "../assets/vendor/pdfjs/pdf.worker.mjs";


/* =========================================
   Configuration
========================================= */

const THUMBNAIL_WIDTH =
    600;

const THUMBNAIL_TYPE =
    "image/jpeg";

const THUMBNAIL_QUALITY =
    0.85;


/* =========================================
   Utility
========================================= */

function isPdfFile(
    file
) {

    if (!file) {
        return false;
    }


    const fileName =
        String(
            file.name || ""
        ).toLowerCase();


    return (
        file.type ===
            "application/pdf" ||
        fileName.endsWith(
            ".pdf"
        )
    );
}


/* =========================================
   Canvas To Blob
========================================= */

function canvasToBlob(
    canvas
) {

    return new Promise(
        (
            resolve,
            reject
        ) => {

            canvas.toBlob(
                (blob) => {

                    if (!blob) {

                        reject(
                            new Error(
                                "サムネイル画像を生成できませんでした。"
                            )
                        );


                        return;
                    }


                    resolve(
                        blob
                    );
                },

                THUMBNAIL_TYPE,

                THUMBNAIL_QUALITY
            );
        }
    );
}


/* =========================================
   Safe Cleanup
========================================= */

async function cleanupPdfResources(
    page,
    pdf,
    loadingTask
) {

    /*
     * Page cleanup
     */

    if (
        page &&
        typeof page.cleanup ===
            "function"
    ) {

        try {

            page.cleanup();


        } catch (error) {

            console.warn(
                "PDF page cleanup failed:",
                error
            );
        }
    }


    /*
     * PDF document cleanup
     */

    if (
        pdf &&
        typeof pdf.cleanup ===
            "function"
    ) {

        try {

            pdf.cleanup();


        } catch (error) {

            console.warn(
                "PDF document cleanup failed:",
                error
            );
        }
    }


    /*
     * PDF document destroy
     *
     * 使用中のPDF.js実装によって
     * destroy()が存在しない場合があるため、
     * 関数の存在を確認してから実行します。
     */

    if (
        pdf &&
        typeof pdf.destroy ===
            "function"
    ) {

        try {

            await pdf.destroy();


        } catch (error) {

            console.warn(
                "PDF document destroy failed:",
                error
            );
        }


        return;
    }


    /*
     * Document側にdestroy()が無く、
     * loadingTask側に存在する場合はこちらを使用。
     */

    if (
        loadingTask &&
        typeof loadingTask.destroy ===
            "function"
    ) {

        try {

            await loadingTask.destroy();


        } catch (error) {

            console.warn(
                "PDF loading task destroy failed:",
                error
            );
        }
    }
}


/* =========================================
   Create PDF Thumbnail
========================================= */

async function createPdfThumbnail(
    file
) {

    /* =====================================
       Validate
    ===================================== */

    if (!file) {

        throw new Error(
            "PDFファイルが指定されていません。"
        );
    }


    if (
        !isPdfFile(
            file
        )
    ) {

        throw new Error(
            "PDFファイルを選択してください。"
        );
    }


    /* =====================================
       PDF Data
    ===================================== */

    const arrayBuffer =
        await file.arrayBuffer();


    /* =====================================
       PDF.js Loading Task
    ===================================== */

    const loadingTask =
        pdfjsLib.getDocument({

            data:
                arrayBuffer
        });


    let pdf =
        null;


    let page =
        null;


    try {

        /* =================================
           Open PDF
        ================================= */

        pdf =
            await loadingTask.promise;


        if (!pdf) {

            throw new Error(
                "PDFファイルを読み込めませんでした。"
            );
        }


        /* =================================
           First Page
        ================================= */

        page =
            await pdf.getPage(
                1
            );


        if (!page) {

            throw new Error(
                "PDFの1ページ目を取得できませんでした。"
            );
        }


        /* =================================
           Original Viewport
        ================================= */

        const baseViewport =
            page.getViewport({

                scale:
                    1
            });


        if (
            !baseViewport ||
            !baseViewport.width ||
            !baseViewport.height
        ) {

            throw new Error(
                "PDFページサイズを取得できませんでした。"
            );
        }


        /* =================================
           Thumbnail Scale
        ================================= */

        const scale =
            THUMBNAIL_WIDTH /
            baseViewport.width;


        const viewport =
            page.getViewport({

                scale:
                    scale
            });


        /* =================================
           Canvas
        ================================= */

        const canvas =
            document.createElement(
                "canvas"
            );


        const context =
            canvas.getContext(
                "2d",
                {
                    alpha:
                        false
                }
            );


        if (!context) {

            throw new Error(
                "Canvasを作成できませんでした。"
            );
        }


        canvas.width =
            Math.max(
                1,
                Math.ceil(
                    viewport.width
                )
            );


        canvas.height =
            Math.max(
                1,
                Math.ceil(
                    viewport.height
                )
            );


        /* =================================
           White Background
        ================================= */

        context.save();


        context.fillStyle =
            "#ffffff";


        context.fillRect(
            0,
            0,
            canvas.width,
            canvas.height
        );


        context.restore();


        /* =================================
           Render PDF
        ================================= */

        const renderTask =
            page.render({

                canvasContext:
                    context,

                viewport:
                    viewport
            });


        await renderTask.promise;


        /* =================================
           JPEG
        ================================= */

        const thumbnailBlob =
            await canvasToBlob(
                canvas
            );


        if (
            !thumbnailBlob ||
            thumbnailBlob.size <= 0
        ) {

            throw new Error(
                "サムネイル画像を生成できませんでした。"
            );
        }


        return thumbnailBlob;


    } finally {

        /*
         * cleanup失敗によって
         * サムネイル生成結果そのものを
         * 失敗扱いにしないようにします。
         */

        await cleanupPdfResources(
            page,
            pdf,
            loadingTask
        );
    }
}


/* =========================================
   Public Function
========================================= */

window.createPdfThumbnail =
    createPdfThumbnail;
