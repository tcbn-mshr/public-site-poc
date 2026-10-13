const storageBaseUrl =
    "https://satenjikaiweb.blob.core.windows.net/files";

const containerListUrl =
    `${storageBaseUrl}?restype=container&comp=list`;

const list = document.getElementById("pdfList");

fetch(containerListUrl)
    .then(response => {
        if (!response.ok) {
            throw new Error(
                `Blob一覧の取得に失敗しました: HTTP ${response.status}`
            );
        }

        return response.text();
    })
    .then(xmlText => {
        const parser = new DOMParser();
        const xml = parser.parseFromString(xmlText, "application/xml");

        const parserError = xml.querySelector("parsererror");

        if (parserError) {
            throw new Error("Blob一覧のXML解析に失敗しました。");
        }

        const blobElements = Array.from(
            xml.getElementsByTagName("Blob")
        );

        const pdfFiles = blobElements
            .map(blob => {
                const nameElement =
                    blob.getElementsByTagName("Name")[0];

                return nameElement
                    ? nameElement.textContent
                    : "";
            })
            .filter(fileName =>
                fileName.toLowerCase().endsWith(".pdf")
            )
            .sort((a, b) =>
                a.localeCompare(b, "ja")
            );

        list.innerHTML = "";

        if (pdfFiles.length === 0) {
            const item = document.createElement("li");
            item.textContent = "公開中のPDF資料はありません。";
            list.appendChild(item);
            return;
        }

        pdfFiles.forEach(fileName => {
            const item = document.createElement("li");
            const link = document.createElement("a");

            const encodedPath = fileName
                .split("/")
                .map(part => encodeURIComponent(part))
                .join("/");

            link.href = `${storageBaseUrl}/${encodedPath}`;
            link.textContent = fileName;
            link.target = "_blank";
            link.rel = "noopener noreferrer";

            item.appendChild(link);
            list.appendChild(item);
        });
    })
    .catch(error => {
        console.error(error);

        list.innerHTML = "";

        const item = document.createElement("li");
        item.textContent =
            "資料一覧を取得できませんでした。";

        list.appendChild(item);
    });
