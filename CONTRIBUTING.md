# 如何貢獻

感謝您有意願參與貢獻！我們非常感謝您願意分享您的修補程式與改進，讓這個專案更加完善。

## 開始之前

在您開始貢獻之前，請花點時間閱讀以下內容：

### 1. 簽署我們的貢獻者授權協議

對本專案的貢獻必須附帶[貢獻者授權協議](https://cla.developers.google.com/about)（Contributor License Agreement, CLA）。
您（或您的雇主）將保留對您貢獻內容的著作權；這僅僅是授權我們可以將您的貢獻用於本專案並進行再發佈。

如果您或您目前的雇主已經簽署過 Google 的 CLA（即使是針對其他專案），通常無需再次簽署。

請造訪<https://cla.developers.google.com/>以查詢您目前的協議狀態或簽署新的協議。

### 2. 閱讀社群指引

我們遵循 [Google 的開源社群指引](https://opensource.google/conduct/)。
請熟悉這些指引，以確保為所有人營造一個正向且協作的環境。

## 貢獻流程

### 尋找可參與的項目

請參閱 [GitHub Issues](https://github.com/google/adk-docs/issues)，查看錯誤回報或功能需求。您可以自由選擇現有議題進行處理，或是如果有新想法或發現錯誤，也歡迎提出新的議題。

### 開發環境設置

1.  **複製（clone）此儲存庫：**

    ```shell
    git clone git@github.com:google/adk-docs.git
    cd adk-docs
    ```

2.  **建立並啟用虛擬環境：**

    ```shell
    python -m venv venv
    source venv/bin/activate
    ```

3.  **安裝相依套件：**

    ```shell
    pip install -r requirements.txt
    ```

4.  **啟動本機開發伺服器：**

    ```shell
    mkdocs serve
    ```

    此指令會啟動一個本地伺服器，通常位於 `http://127.0.0.1:8000/`。

    當你儲存文件變更時，網站會自動重新載入。
    關於網站設定的更多細節，請參閱 mkdocs.yml 檔案。

### 程式碼審查（Code Reviews）

所有貢獻，包括專案成員的貢獻，都需經過審查流程。

1.  **建立 Pull Request：** 我們使用 GitHub Pull Request（PR）進行程式碼審查。
    如果你不熟悉 PR，請參考 GitHub Help。
2.  **審查流程：** 專案維護者會審查你的 PR，並在需要時提供回饋或要求修改。
3.  **合併：** 一旦 PR 通過審查並通過所有必要檢查，將會被合併到主分支。

如需有關 Pull Request 的更多資訊，請參閱 [GitHub Help](https://help.github.com/articles/about-pull-requests/)。
期待你的貢獻！
