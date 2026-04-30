# 🏖️ Beach Water Quality Map — System Architecture & Design Proposal
## 系統架構分析與地圖設計提案

---

## 一、現有系統分析 (Current System Analysis)

### 已實現組件
| 組件 | 技術 | 狀態 |
|------|------|------|
| 數據獲取 | Python + EPD RSS | ✅ 正常 |
| 格式轉換 | Python → GeoJSON | ✅ 正常 |
| 自動更新 | GitHub Actions (每小時:25) | ✅ 正常 |
| 數據存儲 | GitHub Repo (Static GeoJSON) | ✅ 正常 |

### 現有數據流
```
EPD RSS → fetch_beach_data.py → beach_data.geojson → GitHub Repo
```

### 缺失組件 (Critical Gaps)
- ❌ **無 Web 地圖前端** — 只有原始 GeoJSON
- ❌ **無 API 端點** — 無法實時獲取數據
- ❌ **無地理編碼/反向地理編碼**
- ❌ **無離線支援**
- ❌ **無多語言 UI** (目前只有英文 grade label)

---

## 二、提議海灘資訊地圖設計 (Proposed Beach Info Map Design)

### 2.1 前端架構 (Frontend Architecture)

```
┌─────────────────────────────────────────────────────────────┐
│                        MOBILE APP / PWA                      │
├─────────────────────────────────────────────────────────────┤
│  🗺️ Map View        │  📋 List View       │  ⚙️ Settings    │
│  - Clustered markers│  - Beach cards      │  - Language     │
│  - Color-coded pins │  - Quick grade badge│  - Notifications│
│  - User location    │  - Distance sort    │  - About       │
├─────────────────────────────────────────────────────────────┤
│                      MAP PROVIDER LAYER                      │
│         [Leaflet.js / Mapbox GL / Google Maps]               │
├─────────────────────────────────────────────────────────────┤
│                      DATA LAYER                              │
│   [REST API / GraphQL] ←→ [CDN Cache / Local Storage]        │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 地圖功能設計 (Map Feature Design)

#### 地圖標記 (Map Markers)
| 等級 | 顏色 | 圖標 | 含義 |
|------|------|------|------|
| 1 | 🟢 綠色 `#00FF00` | ✓ | Good - 適合游泳 |
| 2 | 🟡 黃色 `#FFFF00` | ⚠ | Fair - 注意安全 |
| 3 | 🟠 橙色 `#FFA500` | ! | Poor - 謹慎下水 |
| 4 | 🔴 橙紅 `#FF4500` | ⚠ | Very Poor - 不建議 |
| 5 | 🔴 紅色 `#FF0000` | ✗ | Extremely Poor - 禁止下水 |

#### 標記彈窗內容 (Marker Popup)
```
┌────────────────────────────────────┐
│ 🏖️ 海灘名稱 (中/英)                │
├────────────────────────────────────┤
│ 等級: ★★★☆☆ (Grade 3 - Poor)      │
│                                    │
│ 📍 坐標: 22.1234°N, 114.1234°E      │
│ 📏 距您: 2.3 km                    │
│                                    │
│ 🕐 更新時間: 2026-04-30 14:25      │
│ 🔗 EPD 原始頁面                    │
│                                    │
│ [📍 導航] [⭐ 收藏] [📤 分享]       │
└────────────────────────────────────┘
```

### 2.3 推薦技術棧 (Recommended Tech Stack)

#### 移動端優先 (Mobile-First)
| 層面 | 推薦方案 | 原因 |
|------|----------|------|
| **地圖引擎** | Leaflet.js + OpenStreetMap | 開源、免費、移動端友好 |
| **地圖瓦片** | MapTiler / Stadia Maps | 高質量衛星/地形圖 |
| **集群顯示** | Leaflet.markercluster | 減少密密麻麻的標記 |
| **PWA 框架** | Vite + React / Vue | 快速、加離線支援 |
| **狀態管理** | Zustand / Pinia | 輕量、現代 |
| **API 客戶端** | TanStack Query | 快取、重試、離線 |

#### 可選付費方案
| 服務 | 用途 | 費用 |
|------|------|------|
| Mapbox GL JS | 更美觀的地圖 | 按使用量 |
| Firebase | 推送通知、用戶收藏 | 免費額度 |
| Cloudflare R2 | GeoJSON CDN | 便宜 |

---

## 三、向 Agent 2 提出的移動 UX 問題 (Mobile UX Questions for Agent 2)

### 3.1 導航與位置
1. **「我的位置」按鈕** — 應該多久刷新一次位置？如何在省電和準確性之間平衡？
2. **方向導航** — 點擊「導航」後，應該用 Google Maps 還是 Apple Maps？還是內嵌 Turn-by-turn？
3. **地理圍欄** — 是否需要用戶接近某海灘時自動推送通知？

### 3.2 標記交互
4. **點擊 vs 長按** — 單擊標記開彈窗，長按開快捷菜單？還是雙擊？
5. **標記擁擠** — 當多個海灘距離很近時，點擊哪個？如何選擇？
6. **拖放地圖** — 是否需要「跟隨用戶位置」按鈕？自動跟隨時如何取消？

### 3.3 列表視圖
7. **排序邏輯** — 默認按「距離」還是「水質等級」排序？用戶可以切換嗎？
8. **卡片信息密度** — 每張海灘卡片應該顯示多少信息？需要展開嗎？
9. **搜索/篩選** — 是否需要文字搜索？按等級篩選？

### 3.4 離線與性能
10. **離線模式** — 應該缓存多少歷史數據？用戶能看到多久之前的更新？
11. **加載狀態** — GeoJSON 載入中應該顯示什麼？骨架屏？進度條？
12. **黑暗模式** — 地圖在夜間模式下是否需要不同的配色？

### 3.5 通知與提醒
13. **推通知** — 用戶能否設置「水質變差」時通知？還是「距離範圍內」通知？
14. **通知頻率** — 每天最多幾條？是否需要「勿擾模式」？

---

## 四、向 Agent 3 提出的部署問題 (Deployment Questions for Agent 3)

### 4.1 托管與基礎設施
1. **前端部署** — Vercel / Netlify / Cloudflare Pages？各自優缺點？
2. **靜態 GeoJSON** — 應該存在哪裡？GitHub raw URL？還是 CDN？
3. **API 服務** — 是否需要後端？如需要，Serverless (Lambda) 還是容器 (Docker)？

### 4.2 CI/CD
4. **現有 GitHub Actions** — 是否需要修改？新增哪些步驟？
5. **預覽部署** — PR 時是否需要自動部署預覽環境？
6. **回滾策略** — 如何快速回滾到上一版本？

### 4.3 域名與 SSL
7. **域名策略** — 應該用 `beach.example.com` 還是子路徑 `/beach`？
8. **HTTPS** — 完全强制 HTTPS？有哪些考慮？

### 4.4 監控與日誌
9. **錯誤追蹤** — Sentry？LogRocket？還是只需要 CloudWatch？
10. **性能監控** — 如何追蹤 Core Web Vitals？
11. **API 監控** — 如果新增 API，如何監控可用性和響應時間？

### 4.5 成本預算
12. **月度成本** — 預計多少用戶？流量估計？最大成本來源？
13. **成本控制** — 如何設置預算警報？哪些服務有免費額度？

---

## 五、向 Agent 4 提出的數據架構問題 (Data Architecture Questions for Agent 4)

### 5.1 數據源與獲取
1. **RSS 局限性** — EPD RSS 是否有 rate limit？如果 EPD 改變格式怎麼辦？
2. **備用數據源** — 是否有其他官方數據源？如何驗證數據一致性？
3. **抓取頻率** — 每小時是否足夠？是否需要實時 WebSocket 更新？

### 5.2 數據存儲
4. **實時數據** — GeoJSON 應該存在哪裡？S3？Blob Storage？GitHub？
5. **歷史數據** — 是否需要保存歷史水質記錄？用什麼數據庫？(TimescaleDB？SQLite？)
6. **用戶數據** — 用戶收藏/設置應該存在哪裡？LocalStorage？Firebase？

### 5.3 數據處理
7. **坐標轉換** — DMS → Decimal 的轉換邏輯是否需要測試覆蓋？
8. **數據清洗** — 如何處理 EPD RSS 中的特殊字符、缺失字段？
9. **地理索引** — 是否需要 Spatial Index？如何加速「附近海灘」查詢？

### 5.4 API 設計 (如有)
10. **REST vs GraphQL** — 哪個更適合？需要哪些端點？
    ```
    GET /api/beaches              # 所有海灘
    GET /api/beaches/:id          # 單個海灘
    GET /api/beaches?lat=&lng=&r=  # 半徑範圍內海灘
    GET /api/beaches/:id/history   # 歷史記錄
    ```
11. **緩存策略** — CDN 緩存？API 級別緩存？Client 緩存？TTL 多長？
12. **增量更新** — 是否需要 WebSocket / Server-Sent Events 實時推送？

### 5.5 數據安全
13. **隱私** — 用戶位置數據是否需要脫敏？
14. **速率限制** — 如何防止 API 被濫用？
15. **數據備份** — 如何備份？如果 EPD RSS 不可用怎麼辦？

---

## 六、優先級建議 (Priority Recommendations)

### Phase 1 — MVP (4-6 週)
1. ✅ Leaflet.js 網頁地圖，讀取現有 GeoJSON
2. ✅ 基礎標記 + 彈窗
3. ✅ 簡單列表視圖
4. ✅ 移動端適配

### Phase 2 — 增強 (2-3 月)
5. 🔧 PWA 支援 (離線緩存)
6. 🔧 用戶收藏功能
7. 🔧 推送通知
8. 🔧 歷史數據圖表

### Phase 3 — 完善
9. ⚡ 性能優化
10. ⚡ 高級地圖功能 (等高線、潮汐圖)
11. ⚡ 多語言支援
12. ⚡ 社交分享

---

*文檔版本: 1.0 | 創建日期: 2026-04-30*
