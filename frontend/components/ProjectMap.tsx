'use client'
import { useEffect, useMemo, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { MapTree } from '@/lib/api'
import { DBH_CLASS_COLORS } from './dbhClassStyle'

function dotIcon(color: string) {
  return L.divIcon({
    className: '',
    html: `<div style="width:16px;height:16px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.4);"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
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
}: {
  trees: MapTree[]
  centerLat: number
  centerLng: number
}) {
  const icons = useMemo(() => {
    const cache: Record<string, L.DivIcon> = {}
    for (const cls of Object.keys(DBH_CLASS_COLORS)) cache[cls] = dotIcon(DBH_CLASS_COLORS[cls])
    cache.default = dotIcon('#6B7C72')
    return cache
  }, [])

  const fallbackCenter: [number, number] = [centerLat, centerLng]

  return (
    <MapContainer
      center={fallbackCenter}
      zoom={14}
      style={{ height: '420px', width: '100%', borderRadius: '1rem' }}
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
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
