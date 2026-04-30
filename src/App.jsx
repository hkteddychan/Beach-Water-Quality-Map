import { useState, useEffect, useCallback } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// ─── i18n ───────────────────────────────────────────────────────────────────
const T = {
  zh: {
    title: '🏖️ 香港沙灘水質地圖',
    loading: '加載中...',
    error: '無法載入數據',
    retry: '重試',
    updated: '最後更新',
    noBeaches: '冇沙灘數據',
    filters: {
      all: '全部',
      good: '🟢 良好',
      fair: '🟡 一般',
      poor: '🟠 欠佳',
      danger: '🔴 極差/惡劣',
    },
    gradeLabels: { 1: '良好', 2: '一般', 3: '欠佳', 4: '極差', 5: '惡劣' },
    distance: '距離',
    km: 'km',
    viewOnMap: '喺地圖睇',
    listView: '列表',
    mapView: '地圖',
    beaches: '個沙灘',
    offlineNote: '📴 離線模式 — 數據可能過時',
  },
  en: {
    title: '🏖️ HK Beach Water Quality Map',
    loading: 'Loading...',
    error: 'Failed to load data',
    retry: 'Retry',
    updated: 'Updated',
    noBeaches: 'No beach data',
    filters: {
      all: 'All',
      good: '🟢 Good',
      fair: '🟡 Fair',
      poor: '🟠 Poor',
      danger: '🔴 V.Poor/Bad',
    },
    gradeLabels: { 1: 'Good', 2: 'Fair', 3: 'Poor', 4: 'Very Poor', 5: 'Extremely Poor' },
    distance: 'Distance',
    km: 'km',
    viewOnMap: 'View on map',
    listView: 'List',
    mapView: 'Map',
    beaches: 'beaches',
    offlineNote: '📴 Offline — data may be stale',
  },
}

// ─── helpers ─────────────────────────────────────────────────────────────────
function getGradeEmoji(g) { return ['','🟢','🟡','🟠','🔴','⚫'][g] ?? '❓' }
function getGradeColor(g) {
  return ['','#00E676','#FFEB3B','#FF9800','#F44336','#212121'][g] ?? '#9E9E9E'
}

function distanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371
  const d = (a, b) => (b - a) * Math.PI / 180
  const a = Math.sin(d(lat2,lat1)/2)**2 +
            Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*
            Math.sin(d(lon2,lon1)/2)**2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
}

// ─── custom marker icons ──────────────────────────────────────────────────────
function makeIcon(grade, size = 32) {
  const color = getGradeColor(grade)
  const emoji = getGradeEmoji(grade)
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size+8}" viewBox="0 0 ${size} ${size+8}">
    <circle cx="${size/2}" cy="${size/2}" r="${size/2}" fill="${color}" stroke="white" stroke-width="2"/>
    <text x="${size/2}" y="${size/2+1}" font-size="${size*0.55}" text-anchor="middle" dominant-baseline="middle">${emoji}</text>
  </svg>`
  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [size, size+8],
    iconAnchor: [size/2, size+8],
    popupAnchor: [0, -(size+8)],
  })
}

// ─── Map Fitter (auto-fit bounds) ────────────────────────────────────────────
function MapFitter({ features }) {
  const map = useMap()
  useEffect(() => {
    if (!features?.length) return
    const bounds = L.latLngBounds(features.map(f => f.geometry.coordinates.slice().reverse()))
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 })
  }, [features, map])
  return null
}

// ─── Bottom Sheet ─────────────────────────────────────────────────────────────
function BottomSheet({ beach, onClose, t }) {
  const [open, setOpen] = useState(false)
  const sheetRef = useCallback(el => {
    if (!el) return
    let startY = 0
    const onTouchStart = e => { startY = e.touches[0].clientY }
    const onTouchMove = e => {
      const dy = e.touches[0].clientY - startY
      if (dy > 60) onClose()
    }
    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchmove', onTouchMove, { passive: true })
    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
    }
  }, [onClose])

  if (!beach) return null
  const { properties } = beach
  const color = getGradeColor(properties.grade)

  return (
    <div className="beach-bottom-sheet" ref={sheetRef}>
      <div className="beach-bottom-sheet-handle" />
      <div className="px-5 pb-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{properties.name_zh}</h2>
            <p className="text-sm text-gray-500">{properties.name_en}</p>
          </div>
          <button
            onClick={onClose}
            className="w-11 h-11 flex items-center justify-center rounded-full bg-gray-100 text-gray-600 text-xl font-bold"
            aria-label="Close"
          >×</button>
        </div>

        {/* Grade badge */}
        <div className="flex items-center gap-3 mb-4">
          <span
            className="grade-chip text-gray-900"
            style={{ color, borderColor: color, backgroundColor: color + '22' }}
          >
            {getGradeEmoji(properties.grade)} {properties.grade}
          </span>
          <span className="text-lg font-semibold text-gray-800">
            {properties.grade_label?.zh ?? t.gradeLabels[properties.grade]}
          </span>
        </div>

        {/* Meta */}
        <div className="text-sm text-gray-500 mb-4">
          {t.updated}: {properties.updated ? new Date(properties.updated).toLocaleString('zh-HK') : '—'}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <a
            href={properties.link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 bg-blue-600 text-white text-center py-4 rounded-xl font-semibold text-base"
          >
            🌐 EPD 詳情
          </a>
          <button
            onClick={() => onClose()}
            className="flex-1 bg-gray-100 text-gray-700 py-4 rounded-xl font-semibold text-base"
          >
            {t.viewOnMap}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Beach List ───────────────────────────────────────────────────────────────
function BeachList({ features, filter, onSelect, t }) {
  const [userLoc, setUserLoc] = useState(null)
  const [distances, setDistances] = useState({})

  useEffect(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      pos => {
        setUserLoc([pos.coords.latitude, pos.coords.longitude])
      },
      () => {}
    )
  }, [])

  useEffect(() => {
    if (!userLoc || !features) return
    const dists = {}
    features.forEach(f => {
      const [lon, lat] = f.geometry.coordinates
      dists[f.properties.id] = distanceKm(userLoc[0], userLoc[1], lat, lon)
    })
    setDistances(dists)
  }, [userLoc, features])

  const filtered = features?.filter(f => {
    if (filter === 'all') return true
    if (filter === 'good') return f.properties.grade === 1
    if (filter === 'fair') return f.properties.grade === 2
    if (filter === 'poor') return f.properties.grade === 3
    if (filter === 'danger') return f.properties.grade >= 4
    return true
  }) ?? []

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <p className="text-sm text-gray-500 mb-3 px-1">
        {filtered.length} {t.beaches}
        {userLoc && ' · 距離你最近'}
      </p>
      {filtered
        .sort((a, b) => (distances[a.properties.id] ?? 999) - (distances[b.properties.id] ?? 999))
        .map(beach => {
          const { properties } = beach
          const color = getGradeColor(properties.grade)
          return (
            <div
              key={properties.id}
              className="beach-card cursor-pointer active:scale-[0.98] transition-transform"
              onClick={() => onSelect(beach)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-base text-gray-900 truncate">{properties.name_zh}</h3>
                  <p className="text-xs text-gray-400 truncate">{properties.name_en}</p>
                </div>
                <div className="flex flex-col items-end ml-3">
                  <span
                    className="grade-chip text-xs"
                    style={{ color, borderColor: color, backgroundColor: color + '22' }}
                  >
                    {getGradeEmoji(properties.grade)} {properties.grade}
                  </span>
                  {distances[properties.id] != null && (
                    <span className="text-xs text-gray-400 mt-1">
                      {distances[properties.id].toFixed(1)} km
                    </span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
    </div>
  )
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [lang, setLang] = useState('zh')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all')
  const [view, setView] = useState('map') // 'map' | 'list'
  const [selectedBeach, setSelectedBeach] = useState(null)
  const t = T[lang]

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/beach_data.geojson')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      setData(json)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  // Auto-detect language from browser
  useEffect(() => {
    const hl = navigator.language || ''
    if (hl.toLowerCase().startsWith('zh')) setLang('zh')
    else setLang('en')
  }, [])

    const filters = ['all', 'good', 'fair', 'poor', 'danger']

    const center = [22.35, 114.18]

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-blue-50 gap-4">
        <span className="text-5xl">🏖️</span>
        <p className="text-gray-500 text-lg">{t.loading}</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-red-50 gap-4 p-6">
        <span className="text-5xl">😵</span>
        <p className="text-red-600 text-center">{t.error}: {error}</p>
        <button onClick={loadData} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold">
          {t.retry}
        </button>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm z-[100] px-4 py-3 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-lg font-bold text-gray-900 leading-tight">{t.title}</h1>
          {data?.metadata?.updated && (
            <p className="text-xs text-gray-400">
              {t.updated}: {new Date(data.metadata.updated).toLocaleString(lang === 'zh' ? 'zh-HK' : 'en')}
            </p>
          )}
        </div>
        <button
          onClick={() => setLang(l => l === 'zh' ? 'en' : 'zh')}
          className="bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium"
        >
          {lang === 'zh' ? 'EN' : '中文'}
        </button>
      </header>

      {/* Filter chips */}
      <div className="bg-white border-b px-4 py-2 flex gap-2 overflow-x-auto shrink-0">
        {filters.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`filter-chip whitespace-nowrap ${filter === f ? 'active' : 'bg-gray-100 text-gray-600'}`}
            style={filter === f ? { color: f === 'good' ? '#00E676' : f === 'fair' ? '#FFEB3B' : f === 'poor' ? '#FF9800' : f === 'danger' ? '#F44336' : '#0066CC', backgroundColor: filter === f ? (f === 'all' ? '#0066CC11' : getGradeColor(f === 'good' ? 1 : f === 'fair' ? 2 : f === 'poor' ? 3 : 4) + '22') : '' } : {}}
          >
            {t.filters[f]}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 relative overflow-hidden">
        {/* Map view */}
        {view === 'map' && (
          <MapContainer
            center={center}
            zoom={11}
            className="absolute inset-0 z-0"
            zoomControl={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {data?.features && <MapFitter features={data.features} />}
            {data?.features?.map(beach => {
              const { properties, geometry } = beach
              const [lon, lat] = geometry.coordinates
              return (
                <Marker
                  key={properties.id}
                  position={[lat, lon]}
                  icon={makeIcon(properties.grade)}
                  eventHandlers={{
                    click: () => setSelectedBeach(beach),
                  }}
                >
                  <Popup>
                    <div className="min-w-[180px]">
                      <h3 className="font-bold text-base mb-1">{properties.name_zh}</h3>
                      <p className="text-xs text-gray-500 mb-2">{properties.name_en}</p>
                      <div className="flex items-center gap-2">
                        <span
                          className="font-bold text-sm px-3 py-1 rounded-full"
                          style={{ backgroundColor: getGradeColor(properties.grade) + '33', color: getGradeColor(properties.grade) }}
                        >
                          {getGradeEmoji(properties.grade)} {properties.grade_label?.zh ?? properties.grade_label?.en}
                        </span>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              )
            })}
          </MapContainer>
        )}

        {/* List view */}
        {view === 'list' && (
          <BeachList
            features={data?.features}
            filter={filter}
            onSelect={b => { setSelectedBeach(b); setView('map') }}
            t={t}
          />
        )}

        {/* View toggle FAB */}
        <button
          onClick={() => setView(v => v === 'map' ? 'list' : 'map')}
          className="absolute bottom-4 right-4 z-[400] bg-white shadow-lg rounded-full w-14 h-14 flex items-center justify-center text-2xl"
        >
          {view === 'map' ? '📋' : '🗺️'}
        </button>
      </div>

      {/* Bottom sheet */}
      {selectedBeach && (
        <BottomSheet
          beach={selectedBeach}
          onClose={() => setSelectedBeach(null)}
          t={t}
        />
      )}
    </div>
  )
}
