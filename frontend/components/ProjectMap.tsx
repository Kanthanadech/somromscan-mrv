'use client'
import { useEffect, useMemo, useRef } from 'react'
import { MapContainer, TileLayer, LayersControl, Marker, Popup, useMap } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { MapTree } from '@/lib/api'
import { DBH_CLASS_COLORS } from './dbhClassStyle'
import { SensorGridPoint } from '@/lib/sensorGrid'

// Reuses the app's existing blue accent (#1E4D8C) — same color already used
// for the "Sensor readings" KPI on the project detail page — no new colors.
const SENSOR_POINT_COLOR = '#1E4D8C'

function dotIcon(color: string) {
  return L.divIcon({
    className: '',
    html: `<div style="width:16px;height:16px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.4);"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  })
}

function sensorIcon() {
  return L.divIcon({
    className: '',
    html: `<div style="width:12px;height:12px;background:${SENSOR_POINT_COLOR};border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.4);transform:rotate(45deg);"></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  })
}

function FitBounds({ trees, fallbackCenter }: { trees: MapTree[]; fallbackCenter: [number, number] }) {
  const map = useMap()
  useEffect(() => {
    if (trees.length > 0) {
      const bounds = L.latLngBounds(trees.map(t => [t.lat, t.lng] as [number, number]))
      map.fitBounds(bounds, { padding: [30, 30], maxZoom: 17 })
    } else {
      map.setView(fallbackCenter, 14)
    }
  }, [trees, fallbackCenter, map])
  return null
}

export default function ProjectMap({
  trees,
  centerLat,
  centerLng,
  sensorPoints,
}: {
  trees: MapTree[]
  centerLat: number
  centerLng: number
  sensorPoints?: SensorGridPoint[]
}) {
  const icons = useMemo(() => {
    const cache: Record<string, L.DivIcon> = {}
    for (const cls of Object.keys(DBH_CLASS_COLORS)) cache[cls] = dotIcon(DBH_CLASS_COLORS[cls])
    cache.default = dotIcon('#6B7C72')
    return cache
  }, [])

  const sensorMarkerIcon = useMemo(() => sensorIcon(), [])

  const fallbackCenter: [number, number] = [centerLat, centerLng]

  return (
    <MapContainer
      center={fallbackCenter}
      zoom={14}
      style={{ height: '420px', width: '100%', borderRadius: '1rem' }}
      scrollWheelZoom={true}
    >
      <LayersControl position="topright">
        <LayersControl.BaseLayer checked name="ภาพถ่ายดาวเทียม (ESRI)">
          <TileLayer
            attribution="Tiles © Esri — Source: Esri, Maxar, Earthstar Geographics"
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="แผนที่ถนน (OpenStreetMap)">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="ภูมิประเทศ (OpenTopoMap)">
          <TileLayer
            attribution='&copy; <a href="https://opentopomap.org">OpenTopoMap</a> (CC-BY-SA)'
            url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
          />
        </LayersControl.BaseLayer>
        {sensorPoints && sensorPoints.length > 0 && (
          <LayersControl.Overlay name={`ตำแหน่งเซนเซอร์แนะนำ (ตัวอย่าง, ${sensorPoints.length} จุด)`}>
            <>
              {sensorPoints.map((p, i) => (
                <Marker key={`sensor-${i}`} position={[p.lat, p.lng]} icon={sensorMarkerIcon}>
                  <Popup>
                    <div style={{ fontSize: '13px' }}>ตำแหน่งเซนเซอร์แนะนำ (ตัวอย่างจาก sensor-plan)</div>
                  </Popup>
                </Marker>
              ))}
            </>
          </LayersControl.Overlay>
        )}
      </LayersControl>
      <FitBounds trees={trees} fallbackCenter={fallbackCenter} />
      <MarkerClusterGroup chunkedLoading>
        {trees.map(t => (
          <Marker key={t.id} position={[t.lat, t.lng]} icon={icons[t.dbhClass || 'default']}>
            <Popup>
              <div style={{ fontSize: '13px', lineHeight: 1.6 }}>
                <div style={{ fontWeight: 700 }}>{t.species_common || 'ไม่ระบุชนิด'}</div>
                <div>DBH: {t.dbh_cm?.toFixed(1) ?? '—'} ซม.</div>
                <div>CO₂: {t.co2_kg ? (t.co2_kg / 1000).toFixed(3) : '—'} tCO₂</div>
                <div>สถานะ: {t.status === 'alive' ? 'มีชีวิต' : 'ตาย'}</div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MarkerClusterGroup>
    </MapContainer>
  )
}
