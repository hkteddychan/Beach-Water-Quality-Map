#!/usr/bin/env python3
"""Fetch EPD Beach Water Quality RSS and convert to GeoJSON."""
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime
import json
import re
import hashlib
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')
logger = logging.getLogger(__name__)

RSS_URL = "https://cd.epic.epd.gov.hk/beachpsi/en/beach2.rss"
OUTPUT_FILE = "beach_data.geojson"

# Chinese name mapping for Hong Kong beaches (EPD uses English names)
BEACH_NAMES_ZH = {
    "Anglers' Beach": "钓鱼翁泳滩",
    "Big Wave Bay Beach": "大浪湾泳滩",
    "Cafeteria Beach": "旧咖啡湾泳滩",
    "Cheung Sha Beach": "长洲泳滩",
    "Chi Fu Fa Yuen Beach": "此路火油记泳滩",
    "Clear Water Bay First Beach": "清水湾第一湾泳滩",
    "Clear Water Bay Second Beach": "清水湾第二湾泳滩",
    "Deep Water Bay Beach": "深水湾泳滩",
    "Golden Beach": "黄金海滩",
    "Middle Bay Beach": "中湾泳滩",
    "Pui O Beach": "杯澳泳滩",
    "Repulse Bay Beach": "浅水湾泳滩",
    "Silver Bay Beach": "银湾泳滩",
    "South Bay Beach": "南湾泳滩",
    "Stanley Main Beach": "赤柱正滩",
}

def dms_to_decimal(dms_str):
    """Convert DMS string like 22 21 53 to decimal degrees."""
    match = re.match(r"(\d+)\s+(\d+)\s+(\d+(?:\.\d+)?)", dms_str.strip())
    if match:
        deg, min_, sec = match.groups()
        return float(deg) + float(min_)/60 + float(sec)/3600
    return None

def generate_beach_id(name: str, lat: float, lon: float) -> str:
    """Generate a stable ID from beach name and coordinates."""
    raw = f"{name.lower().strip()}|{lat:.6f},{lon:.6f}"
    return hashlib.md5(raw.encode()).hexdigest()[:8]

def parse_rss():
    req = urllib.request.Request(RSS_URL, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, timeout=30) as response:
        content = response.read().decode('utf-8')

    root = ET.fromstring(content)
    features = []
    skipped = 0

    for item in root.findall('.//item'):
        title = item.find('title')
        desc = item.find('description')
        link = item.find('link')
        pub_date = item.find('pubDate')

        if title is None or desc is None:
            continue

        title_text = title.text or ""
        desc_html = desc.text or ""
        link_text = link.text if link is not None else ""
        pub_date_text = pub_date.text if pub_date is not None else ""

        # Extract beach name from title like "Anglers' Beach  water quality was rated as Fair(Grade 2)"
        beach_name_en = re.sub(r'\s+water quality was rated as.*', '', title_text).strip()
        grade_text = re.search(r'Grade\s*(\d+)', title_text)
        grade = int(grade_text.group(1)) if grade_text else 0

        # Parse description HTML table for coordinates
        # Format: Latitude 22 21 53N or Latitude 22 21 53 N
        lat_match = re.search(r'Latitude.*?(\d+)\s+(\d+)\s+(\d+(?:\.\d+)?)\s*[NS]', desc_html, re.IGNORECASE | re.DOTALL)
        lon_match = re.search(r'Longitude.*?(\d+)\s+(\d+)\s+(\d+(?:\.\d+)?)\s*[EW]', desc_html, re.IGNORECASE | re.DOTALL)

        lat, lon = None, None
        if lat_match:
            deg, min_, sec = lat_match.groups()
            lat = float(deg) + float(min_)/60 + float(sec)/3600
            # Make positive for South
            if 'S' in lat_match.group(0).upper():
                lat = -lat
        if lon_match:
            deg, min_, sec = lon_match.groups()
            lon = float(deg) + float(min_)/60 + float(sec)/3600
            # Make negative for West
            if 'W' in lon_match.group(0).upper():
                lon = -lon

        if lat and lon:
            # Multi-language grade labels
            grade_labels = {
                1: {"en": "Good", "zh": "良好", "emoji": "🟢"},
                2: {"en": "Fair", "zh": "一般", "emoji": "🟡"},
                3: {"en": "Poor", "zh": "欠佳", "emoji": "🟠"},
                4: {"en": "Very Poor", "zh": "极差", "emoji": "🔴"},
                5: {"en": "Extremely Poor", "zh": "恶劣", "emoji": "⚫"},
            }
            color_map = {1: "#00E676", 2: "#FFEB3B", 3: "#FF9800", 4: "#F44336", 5: "#212121"}

            beach_name_zh = BEACH_NAMES_ZH.get(beach_name_en, beach_name_en)
            beach_id = generate_beach_id(beach_name_en, lat, lon)

            features.append({
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [lon, lat]},
                "properties": {
                    "id": beach_id,
                    "name_en": beach_name_en,
                    "name_zh": beach_name_zh,
                    "grade": grade,
                    "grade_label": grade_labels.get(grade, {"en": "Unknown", "zh": "未知", "emoji": "❓"}),
                    "color": color_map.get(grade, "#9E9E9E"),
                    "link": link_text,
                    "updated": pub_date_text
                }
            })
        else:
            skipped += 1
            logger.warning(f"Skipping '{beach_name_en}': no valid coordinates")

    logger.info(f"Parsed {len(features)} beaches, {skipped} skipped (no coordinates)")
    return features

def main():
    logger.info("Fetching beach data from EPD...")
    features = parse_rss()

    geojson = {
        "type": "FeatureCollection",
        "metadata": {
            "source": "EPD Beach Water Quality RSS",
            "updated": datetime.utcnow().isoformat() + "Z",
            "count": len(features),
            "version": "2.0"
        },
        "features": features
    }

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(geojson, f, ensure_ascii=False, indent=2)

    logger.info(f"Updated {len(features)} beaches -> {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
