function showEmpty() {

    hideLoading();


    hideElement(
        materialsError
    );


    /*
     * 現在の表示言語に合わせて
     * 0件メッセージを更新。
     */

    if (materialsEmpty) {

        materialsEmpty.textContent =
            typeof translate ===
                "function"
                ? translate(
                    "materials.empty"
                )
                : "No materials are available in this category.";


        showElement(
            materialsEmpty
        );
    }


    if (materialsGrid) {

        materialsGrid.innerHTML =
            "";
    }
}
