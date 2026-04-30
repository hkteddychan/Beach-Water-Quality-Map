# 🏖️ Beach Water Quality Map — 香港沙灘水質地圖

**香港沙灘水質互動地圖** — 為沙灘用家設計，清晰顯示水質等級。

[🌐 Live Demo](https://beach-water-quality-map.pages.dev) *(部署於 Cloudflare Pages)*

---

## ✨ 功能特色

- **🌊 即時水質等級** — EPD RSS 每小時自動更新，5 個等級（良好/一般/欠佳/極差/惡劣）
- **🗺️ 互動地圖** — Leaflet 地圖，點擊標記睇詳情
- **📋 列表視圖** — 按距離排序，顯示最近沙灘
- **🔔 標記過濾** — 一眼睇晒邊個沙灘水質好
- **🌐 雙語支援** — 繁體中文 + English，自動偵測
- **📱 移動優先** — 大尺寸觸控目標（56×48px），沙灘濕手都用到
- **⚡ 極速載入** — 純靜態，CDN 全球分發

---

## 🏗️ 技術架構

| 層面 | 技術 |
|------|------|
| 前端框架 | React 18 + Vite 5 |
| UI 樣式 | Tailwind CSS |
| 地圖 | Leaflet + OpenStreetMap |
| 部署 | Cloudflare Pages |
| 數據更新 | GitHub Actions cron (每小時) |
| 數據源 | [EPD Beach Water Quality RSS](https://cd.epic.epd.gov.hk/beachpsi/en/beach2.rss) |

---

## 🚀 部署（自己托管）

### 快速本地運行

```bash
git clone https://github.com/hkteddychan/Beach-Water-Quality-Map.git
cd Beach-Water-Quality-Map
npm install
npm run dev        # 開發模式 http://localhost:5173
npm run build      # 生產構建
```

### Cloudflare Pages 部署

1. Fork 此 repo
2. 在 [Cloudflare Pages](https://pages.cloudflare.com/) 建立新項目，連接到你的 GitHub repo
3. 在 Cloudflare Pages 設定：
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
4. 在 GitHub repo Settings → Secrets 加入：
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`
5. 之後每次 push 到 `main` 都會自動部署

### 現有 GitHub Actions

- **`update.yml`** — 每小時 fetch 最新 EPD 數據，commit `beach_data.geojson`
- **`deploy.yml`** — push 到 main 時自動 build + 部署到 Cloudflare Pages

---

## 📁 項目結構

```
Beach-Water-Quality-Map/
├── fetch_beach_data.py      # EPD RSS → GeoJSON Python 腳本
├── beach_data.geojson       # 自動生成的水質數據
├── public/
│   └── beach_data.geojson   # 範例數據（開發用）
├── src/
│   ├── App.jsx              # 主要 React 組件
│   ├── main.jsx             # 入口
│   └── index.css            # Tailwind + 自定義樣式
├── index.html
├── vite.config.js
├── tailwind.config.js
├── package.json
└── .github/workflows/
    ├── update.yml           # 每小時更新數據
    └── deploy.yml           # 部署到 Cloudflare Pages
```

---

## 📊 數據格式

```json
{
  "type": "FeatureCollection",
  "metadata": {
    "source": "EPD Beach Water Quality RSS",
    "updated": "2026-04-30T12:00:00Z",
    "count": 29,
    "version": "2.0"
  },
  "features": [{
    "type": "Feature",
    "geometry": { "type": "Point", "coordinates": [lon, lat] },
    "properties": {
      "id": "a1b2c3d4",
      "name_en": "Repulse Bay Beach",
      "name_zh": "淺水灣泳灘",
      "grade": 1,
      "grade_label": { "en": "Good", "zh": "良好", "emoji": "🟢" },
      "color": "#00E676",
      "link": "https://cd.epic.epd.gov.hk/...",
      "updated": "Thu, 30 Apr 2026 08:00:00 +0800"
    }
  }]
}
```

## 🏖️ 水質等級

| 等級 | 顏色 | 英文 | 中文 | 建議 |
|------|------|------|------|------|
| 1 | 🟢 綠 | Good | 良好 | ✅ 可以游泳 |
| 2 | 🟡 黃 | Fair | 一般 | ⚠️ 注意 |
| 3 | 🟠 橙 | Poor | 欠佳 | ⚠️ 小心 |
| 4 | 🔴 紅 | Very Poor | 極差 | ❌ 不建議 |
| 5 | ⚫ 黑 | Extremely Poor | 惡劣 | ❌ 唔好去 |

---

## 📝 許可證

MIT License
