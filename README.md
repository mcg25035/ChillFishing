# ChillFishing 互動式線上抽獎系統

## 專案簡介

ChillFishing 是一個現代化的互動式線上抽獎系統，旨在提供一個公平、透明且充滿樂趣的抽獎體驗。本系統透過結合即時通訊技術與生動的「釣魚」動畫，將傳統抽獎活動轉化為一場引人入勝的數位盛宴。無論是企業活動、社群聚會還是個人抽獎，ChillFishing 都能有效提升參與者的投入感與活動的吸引力。

## 解決的問題

傳統的抽獎活動往往面臨以下挑戰：

1.  **效率低下**：手動抽獎過程耗時，且容易因人為操作而產生錯誤。
2.  **參與度不足**：缺乏互動元素，導致參與者在等待抽獎結果時感到枯燥。
3.  **透明度與公正性疑慮**：參與者可能對抽獎過程的隨機性和公正性產生質疑。
4.  **管理複雜**：管理大量參與者資料、獎品清單以及抽獎流程本身，需要耗費大量人力與時間。

ChillFishing 旨在解決這些痛點，提供一個自動化、視覺化且高度互動的解決方案。

## 核心功能與特色

### 1. 互動式抽獎體驗
*   **「釣魚」動畫**：獨特的釣魚主題動畫，將抽獎過程視覺化，為參與者帶來新奇有趣的體驗。
*   **即時結果呈現**：透過 WebSocket 技術，抽獎結果即時推送到所有連接的參與者和投影頁面，確保資訊同步與透明。

### 2. 全面管理員控制台
*   **安全登入**：專屬的管理員登入介面，確保只有授權人員才能操作。
*   **抽獎流程控制**：管理員可以輕鬆啟動、鎖定、解鎖抽獎，並控制抽獎的進行。
*   **參與者管理**：查看、新增、編輯參與者資訊。
*   **獎品設定**：靈活配置多種獎品，並追蹤獎品發放狀態。

### 3. 參與者友善介面
*   **簡單註冊**：參與者可以透過簡單的介面輸入資訊參與抽獎。
*   **即時狀態顯示**：參與者頁面會即時顯示抽獎的鎖定/解鎖狀態，讓參與者隨時掌握活動進度。

### 4. 專業投影頁面
*   **大螢幕展示**：專為活動現場設計的投影頁面，清晰展示抽獎動畫和即時結果，提升現場氣氛。
*   **安全控制**：投影頁面透過安全識別碼與後端通訊，確保只有授權的投影端能觸發抽獎進程。

## 技術棧

*   **前端 (Frontend)**:
    *   **React.js**: 構建使用者介面，提供高效能和模組化的開發體驗。
    *   **React Router**: 實現前端路由，管理頁面導航。
    *   **Socket.IO Client**: 處理與後端的即時通訊。
    *   **CSS**: 負責頁面樣式與視覺呈現。
*   **後端 (Backend)**:
    *   **Node.js**: 運行環境。
    *   **Express.js**: 構建 RESTful API 服務。
    *   **Socket.IO**: 實現即時雙向通訊，用於抽獎狀態廣播。
    *   **SQLite3**: 輕量級資料庫，用於儲存參與者和獎品資訊。
    *   **jsonwebtoken**: 用於管理員身份驗證。
    *   **bcrypt**: 用於密碼加密。
    *   **dotenv**: 管理環境變數。
    
## 未來展望

*   **更多抽獎模式**：引入多輪抽獎、指定獎項抽獎等。
*   **數據統計與分析**：提供更詳細的抽獎數據報告。
*   **主題客製化**：允許用戶自定義抽獎介面主題和動畫。
*   **雲端部署**：提供部署指南或一鍵部署方案。

---

**ChillFishing - 讓抽獎活動變得簡單、有趣、透明！**
