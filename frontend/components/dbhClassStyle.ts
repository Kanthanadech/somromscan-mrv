// DBH class colors/labels — kept in a leaflet-free module so pages can
// import these at the top level without pulling `leaflet` (which touches
// `window`) into server-side rendering. Reuses the app's existing green
// shade tokens only (--sage-light → --sage → --moss → --forest).
export const DBH_CLASS_COLORS: Record<string, string> = {
  class1: '#E8F0DC',
  class2: '#97BC62',
  class3: '#2C5F2D',
  class4: '#1F3D2E',
}

export const DBH_CLASS_LABELS: Record<string, string> = {
  class1: '< 10 ซม.',
  class2: '10–20 ซม.',
  class3: '20–30 ซม.',
  class4: '≥ 30 ซม.',
}
