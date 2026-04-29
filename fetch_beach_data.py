#!/usr/bin/env python3
"""Fetch EPD Beach Water Quality RSS and convert to GeoJSON."""
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime
import json
import re

RSS_URL = "https://cd.epic.epd.gov.hk/beachpsi/en/beach2.rss"
OUTPUT_FILE = "beach_data.geojson"

def dms_to_decimal(dms_str):
    """Convert DMS string like 22° 21' 53\" to decimal degrees."""
    match = re.match(r"(\d+)[°\s]+(\d+)[′'\\s]+(\d+(?:\.\d+)?)[\"\\s]*", dms_str.strip())
    if match:
        deg, min_, sec = match.groups()
        return float(deg) + float(min_)/60 + float(sec)/3600
    return None

def parse_rss():
    req = urllib.request.Request(RSS_URL, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, timeout=30) as response:
        content = response.read().decode('utf-8')
    
    root = ET.fromstring(content)
    features = []
    
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
        beach_name = re.sub(r'\s+water quality was rated as.*', '', title_text).strip()
        grade_text = re.search(r'Grade\s*(\d+)', title_text)
        grade = int(grade_text.group(1)) if grade_text else 0
        
        # Parse description HTML table for coordinates
        lat_match = re.search(r'Latitude.*?(\d+)[°\s]+(\d+)[′'\s]+(\d+(?:\.\d+)?)["\s]*[NS]', desc_html, re.DOTALL)
        lon_match = re.search(r'Longitude.*?(\d+)[°\s]+(\d+)[′'\s]+(\d+(?:\.\d+)?)["\s]*[EW]', desc_html, re.DOTALL)
        
        lat, lon = None, None
        if lat_match:
            deg, min_, sec = lat_match.groups()
            lat = float(deg) + float(min_)/60 + float(sec)/3600
        if lon_match:
            deg, min_, sec = lon_match.groups()
            lon = float(deg) + float(min_)/60 + float(sec)/3600
        
        if lat and lon:
            grade_labels = {1: "Good", 2: "Fair", 3: "Poor", 4: "Very Poor", 5: " Extremely Poor"}
            color_map = {1: "#00FF00", 2: "#FFFF00", 3: "#FFA500", 4: "#FF4500", 5: "#FF0000"}
            
            features.append({
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [lon, lat]},
                "properties": {
                    "name": beach_name,
                    "name_en": beach_name,
                    "grade": grade,
                    "grade_label": grade_labels.get(grade, "Unknown"),
                    "color": color_map.get(grade, "#CCCCCC"),
                    "link": link_text,
                    "updated": pub_date_text
                }
            })
    
    return features

def main():
    print(f"[{datetime.now().isoformat()}] Fetching beach data from EPD...")
    features = parse_rss()
    
    geojson = {
        "type": "FeatureCollection",
        "features": features,
        "updated": datetime.utcnow().isoformat(),
        "count": len(features)
    }
    
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(geojson, f, ensure_ascii=False, indent=2)
    
    print(f"✅ Updated {len(features)} beaches -> {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
