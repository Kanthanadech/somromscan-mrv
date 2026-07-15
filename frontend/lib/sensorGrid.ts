// Generates an illustrative grid of sensor positions spaced spacingM apart
// (from POST /api/sensor-plan) around a project's center point. This is NOT
// a literal placement across the real (often much larger) plot polygon —
// we don't have plot boundary data — it's bounded to the same small area
// used to scatter tree markers, just to visually communicate the spacing
// the sensor-plan feature recommends.
export interface SensorGridPoint {
  lat: number
  lng: number
}

export function generateSensorGrid(
  centerLat: number,
  centerLng: number,
  spacingM: number,
  boxHalfWidthM = 650,
  maxPoints = 150
): SensorGridPoint[] {
  if (!spacingM || spacingM <= 0) return []

  const metersPerDegLat = 111320
  const metersPerDegLng = 111320 * Math.cos((centerLat * Math.PI) / 180)

  // At the real spacingM, a wide box can need thousands of points (e.g.
  // spacingM=21m over a 1.3km box). Truncating a row-major fill at maxPoints
  // would only ever keep the first couple of rows — visually a single
  // horizontal strip instead of a 2D sample. Scale the spacing up instead so
  // the capped grid still spans the full box in both directions.
  const fullWidthM = boxHalfWidthM * 2
  const pointsPerSideAtRealSpacing = Math.max(1, Math.floor(fullWidthM / spacingM) + 1)
  const totalAtRealSpacing = pointsPerSideAtRealSpacing * pointsPerSideAtRealSpacing
  const scale = totalAtRealSpacing > maxPoints ? Math.sqrt(totalAtRealSpacing / maxPoints) : 1
  const effectiveSpacingM = spacingM * scale

  const stepLat = effectiveSpacingM / metersPerDegLat
  const stepLng = effectiveSpacingM / metersPerDegLng
  const halfLat = boxHalfWidthM / metersPerDegLat
  const halfLng = boxHalfWidthM / metersPerDegLng

  const points: SensorGridPoint[] = []
  for (let dLat = -halfLat; dLat <= halfLat; dLat += stepLat) {
    for (let dLng = -halfLng; dLng <= halfLng; dLng += stepLng) {
      points.push({ lat: centerLat + dLat, lng: centerLng + dLng })
    }
  }
  return points
}
