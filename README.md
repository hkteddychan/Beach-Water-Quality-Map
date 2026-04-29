# 🏖️ Beach Water Quality Map

香港沙灘水質地圖 — 每小時自動從 EPD RSS 更新。

## 數據源
- [EPD Beach Water Quality RSS](https://cd.epic.epd.gov.hk/beachpsi/en/beach2.rss)
- 等級 1-5: Good / Fair / Poor / Very Poor / Extremely Poor

## 自動更新
GitHub Actions 每小時 :25 分執行 (`cron: '25 * * * *'`)

## 輸出格式
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "geometry": { "type": "Point", "coordinates": [lon, lat] },
      "properties": {
        "name": "沙灘名稱",
        "grade": 1-5,
        "grade_label": "Good/Fair/Poor/...",
        "color": "#00FF00"
      }
    }
  ]
}
```
