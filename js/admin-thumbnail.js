"use strict";


import * as pdfjsLib
    from "../assets/vendor/pdfjs/pdf.mjs";


pdfjsLib.GlobalWorkerOptions.workerSrc =
    "../assets/vendor/pdfjs/pdf.worker.mjs";


/* =========================================
   Create PDF Thumbnail
========================================= */

async function createPdfThumbnail(
    file
) {

    if (!file) {

        throw new Error(
            "PDFファイルが指定されていません。"
        );
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

        throw new Error(
            "PDFファイルを選択してください。"
        );
    }


    /*
     * PDFをArrayBufferとして読み込み
     */

    const arrayBuffer =
        await file.arrayBuffer();


    /*
     * PDF.jsでPDFを開く
     */

    const loadingTask =
        pdfjsLib.getDocument({
            data:
                arrayBuffer
        });


    const pdf =
        await loadingTask.promise;


    try {

        /*
         * 1ページ目を取得
         */

        const page =
            await pdf.getPage(
                1
            );


        /*
         * 元ページサイズを取得
         */

        const baseViewport =
            page.getViewport({
                scale:
                    1
            });


        /*
         * サムネイル横幅
         */

        const targetWidth =
            600;


        const scale =
            targetWidth /
            baseViewport.width;


        const viewport =
            page.getViewport({
                scale:
                    scale
            });


        /*
         * Canvas作成
         */

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
            Math.ceil(
                viewport.width
            );


        canvas.height =
            Math.ceil(
                viewport.height
            );


        /*
         * 背景を白にする
         */

        context.fillStyle =
            "#ffffff";


        context.fillRect(
            0,
            0,
            canvas.width,
            canvas.height
        );


        /*
         * PDF 1ページ目をCanvasへ描画
         */

        await page.render({

            canvasContext:
                context,

            viewport:
                viewport

        }).promise;


        /*
         * Canvas
         * ↓
         * JPEG Blob
         */

        const thumbnailBlob =
            await new Promise(
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

                        "image/jpeg",

                        0.85
                    );
                }
            );


        return thumbnailBlob;


    } finally {

        /*
         * PDF.jsリソース解放
         */

        await pdf.destroy();
    }
}


/* =========================================
   Public Function
========================================= */

window.createPdfThumbnail =
    createPdfThumbnail;
