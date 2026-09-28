const containerUrl =
    "https://satenjikaiweb.blob.core.windows.net/files?restype=container&comp=list";

fetch(containerUrl)
    .then(response => response.text())
    .then(xmlText => {

        const parser = new DOMParser();
        const xml = parser.parseFromString(xmlText, "text/xml");

        const blobs = xml.getElementsByTagName("Blob");

        const list = document.getElementById("pdfList");

        for (let blob of blobs) {

            const fileName =
                blob.getElementsByTagName("Name")[0].textContent;

            const url =
                `https://satenjikaiweb.blob.core.windows.net/files/${fileName}`;

            const li = document.createElement("li");

            li.innerHTML =
                `${url}${fileName}</a>`;

            list.appendChild(li);
        }
    });
