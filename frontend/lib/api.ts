/**
 * SomromScan v2 API Client
 * Typed API calls to FastAPI backend
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Network error' }))
    throw new Error(err.detail || 'Request failed')
  }
  return res.json()
}

// ===== Dashboard =====
export const api = {
  dashboard: {
    stats: () => request<DashboardStats>('/api/dashboard/stats'),
    carbonTrend: (projectId?: number) =>
      request<ChartData>(`/api/dashboard/charts/carbon-trend${projectId ? `?project_id=${projectId}` : ''}`),
    growthTrend: (projectId: number) =>
      request<ChartData>(`/api/dashboard/charts/growth-trend?project_id=${projectId}`),
    activity: () => request<{ activity: Activity[] }>('/api/dashboard/activity'),
  },

  projects: {
    list: (params?: { status?: string; forest_type?: string; province?: string }) => {
      const q = new URLSearchParams(params as Record<string, string> || {}).toString()
      return request<Project[]>(`/api/projects${q ? `?${q}` : ''}`)
    },
    get: (id: number) => request<Project>(`/api/projects/${id}`),
    create: (data: Partial<Project>) =>
      request<Project>('/api/projects', { method: 'POST', body: JSON.stringify(data) }),
    updateStatus: (id: number, status: string) =>
      request<Project>(`/api/projects/${id}/status?status=${status}`, { method: 'PATCH' }),
    delete: (id: number) =>
      request(`/api/projects/${id}`, { method: 'DELETE' }),
  },

  sensors: {
    addReading: (data: SensorInput) =>
      request<SensorReading>('/api/sensors', { method: 'POST', body: JSON.stringify(data) }),
    projectReadings: (projectId: number, anomaliesOnly?: boolean) =>
      request<SensorReading[]>(
        `/api/sensors/project/${projectId}${anomaliesOnly ? '?anomalies_only=true' : ''}`
      ),
    anomalies: () => request<SensorReading[]>('/api/sensors/anomalies'),
  },

  allometric: {
    calculate: (input: AllometricInput) =>
      request<AllometricResponse>('/api/allometric/calculate', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    equations: (forestType?: string) =>
      request<Record<string, Equation>>(`/api/allometric/equations${forestType ? `?forest_type=${forestType}` : ''}`),
  },

  verification: {
    calendar: (daysAhead?: number) =>
      request<VerificationCalendar>(`/api/verification/calendar${daysAhead ? `?days_ahead=${daysAhead}` : ''}`),
    alerts: () => request<{ total: number; alerts: VerificationAlert[] }>('/api/verification/alerts'),
    schedule: (projectId: number, params?: { event_type?: string; due_date?: string; vvb_id?: number }) => {
      const q = new URLSearchParams(params as Record<string, string> || {}).toString()
      return request(`/api/verification/${projectId}/schedule?${q}`, { method: 'POST' })
    },
    complete: (eventId: number, data: { verified_tco2: number; cars_count?: number; notes?: string }) => {
      const q = new URLSearchParams(data as unknown as Record<string, string>).toString()
      return request(`/api/verification/${eventId}/complete?${q}`, { method: 'PATCH' })
    },
  },

  sensorPlan: {
    calculate: (input: SensorPlanRequest) =>
      request<SensorPlanResult>('/api/sensor-plan', { method: 'POST', body: JSON.stringify(input) }),
  },

  vvb: {
    list: () => request<VVB[]>('/api/vvb'),
    match: (projectId: number) => request<VVBMatchResult>(`/api/vvb/match/${projectId}`),
    assign: (projectId: number, vvbId: number) =>
      request(`/api/vvb/assign?project_id=${projectId}&vvb_id=${vvbId}`, { method: 'POST' }),
  },

  reports: {
    generateMonitoring: (projectId: number) =>
      request<MonitoringReport>(`/api/reports/monitoring/${projectId}`),
    history: (projectId: number) =>
      request<MonitoringReport[]>(`/api/reports/history/${projectId}`),
  },
}

// ===== Types =====
export interface DashboardStats {
  overview: { total_projects: number; total_trees: number; total_area_rai: number; total_area_hectare: number; total_vvb: number }
  carbon: { total_co2_measured_tonnes: number; total_co2_issued_tonnes: number; total_expected_tco2_year: number; issuable_credits: number }
  sensors: { total_readings: number; recent_7d: number; anomalies_total: number; anomaly_rate_pct: number }
  verification: { overdue: number; due_within_30d: number }
  projects_by_status: Record<string, number>
  projects_by_forest_type: Record<string, number>
  last_updated: string
}

export interface Project {
  id: number
  name: string
  name_th?: string
  tgo_registration_number?: string
  forest_type: string
  status: string
  methodology: string
  province: string
  district?: string
  area_rai: number
  area_hectare: number
  latitude?: number
  longitude?: number
  project_start_date?: string
  crediting_period_years: number
  crediting_period_end?: string
  expected_reduction_tco2_year?: number
  total_issued_tco2: number
  next_verification_due?: string
  days_to_verification?: number
  trees_count?: number
  verification_events_count?: number
  co_benefits?: Record<string, boolean>
  verification_cycle_years?: number
  buffer_percentage?: number
  registration_date?: string
  notes?: string
}

export interface SensorInput {
  project_id: number
  tree_id?: number
  measurement_type: string
  dbh_cm?: number
  height_m?: number
  tier?: string
  confidence_score?: number
}

export interface SensorPlanSpecies {
  name: string
  treeCount: number
}

export interface SensorPlanRequest {
  plotAreaRai?: number
  plotAreaM2?: number
  species: SensorPlanSpecies[]
  config?: {
    mode?: 'coverage' | 'perTrees'
    coverageRadiusM?: number
    gridFactor?: number
    treesPerSensor?: number
  }
}

export interface SensorPlanResult {
  totalSensors: number
  spacingM: number
  perSpecies: { name: string; treeCount: number; sensors: number }[]
  assumptions: {
    mode: string
    coverageRadiusM: number
    gridFactor: number
    treesPerSensor: number
  }
}

export interface SensorReading {
  id: number
  project_id: number
  tree_id?: number
  measurement_type: string
  dbh_cm?: number
  height_m?: number
  tier: string
  agb_kg?: number
  co2_kg?: number
  confidence_score?: number
  is_anomaly: boolean
  anomaly_reason?: string
  timestamp: string
}

export interface AllometricInput {
  species_scientific?: string
  species_common?: string
  forest_type: string
  dbh_cm: number
  height_m?: number
  wood_density?: number
  methodology?: string
}

export interface AllometricResult {
  equation_id: string
  equation_name: string
  equation_name_th: string
  formula_display: string
  source: string
  dbh_cm: number
  height_m?: number
  wood_density: number
  wood_density_source: string
  agb_kg: number
  agb_tonnes: number
  carbon_kg: number
  carbon_tonnes: number
  co2_kg: number
  co2_tonnes: number
  confidence_score: number
  confidence_level: string
  uncertainty_pct: number
  is_tgo_approved: boolean
  r_squared?: number
  warnings: string[]
}

export interface AllometricResponse {
  best_result: AllometricResult
  alternative_equations: Equation[]
  selection_explanation: { step: string; decision: string; reason: string }[]
  species_resolved: string
  wood_density_source: string
}

export interface Equation {
  id: string
  name: string
  name_th: string
  formula_display: string
  r_squared?: number
  priority_rank: number
  is_tgo_approved: boolean
}

export interface VerificationAlert {
  id: number
  project_id: number
  project_name: string
  alert_type: string
  severity: string
  title: string
  message: string
  days_remaining: number
  due_date: string
  event_type: string
}

export interface VerificationCalendar {
  total: number
  overdue: number
  critical: number
  high: number
  events: VerificationEvent[]
}

export interface VerificationEvent {
  event_id: number
  project_id: number
  project_name: string
  event_type: string
  status: string
  due_date: string
  days_remaining: number
  severity: string
  title: string
  message: string
  forest_type: string
  province: string
}

export interface VVB {
  id: number
  name: string
  name_th: string
  organization_type: string
  contact_email: string
  sectoral_scopes: number[]
  methodology_specialties: string[]
  avg_rating: number
  estimated_cost_thb?: number
  has_forest_scope: boolean
  province: string
  service_regions: string[]
}

export interface VVBMatchResult {
  project_id: number
  project_name: string
  methodology: string
  forest_type: string
  province: string
  recommended: VVBMatch[]
  other_vvbs: VVBMatch[]
  note: string
}

export interface VVBMatch extends VVB {
  vvb_id: number
  match_score: number
  match_reasons: string[]
  estimated_cost_thb: number
  estimated_days: number
  availability: string
}

export interface MonitoringReport {
  id?: number
  status: string
  total_co2_tonnes: number
  issuable_credits: number
  generated_at: string
}

export interface ChartData {
  labels: string[]
  data: number[]
  unit: string
}

export interface Activity {
  type: string
  icon: string
  title: string
  detail: string
  timestamp: string
  is_anomaly: boolean
}

// ===== Helpers =====
export const FOREST_TYPE_LABELS: Record<string, string> = {
  somrom: 'สวนสมรม',
  rubber: 'ยางพารา',
  mangrove: 'ป่าชายเลน',
  community: 'ป่าชุมชน',
  restoration: 'ป่าฟื้นฟู',
  mixed: 'ป่าผสม',
  palm: 'ปาล์มน้ำมัน',
}

export const STATUS_LABELS: Record<string, string> = {
  draft: 'ร่าง',
  submitted: 'ส่งแล้ว',
  validating: 'กำลัง Validate',
  registered: 'ขึ้นทะเบียนแล้ว',
  monitoring: 'กำลัง Monitoring',
  verifying: 'กำลัง Verify',
  issued: 'ออกเครดิตแล้ว',
  expired: 'หมดอายุ',
}

export const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  submitted: 'bg-blue-100 text-blue-700',
  validating: 'bg-yellow-100 text-yellow-700',
  registered: 'bg-indigo-100 text-indigo-700',
  monitoring: 'bg-green-100 text-green-700',
  verifying: 'bg-purple-100 text-purple-700',
  issued: 'bg-emerald-100 text-emerald-700',
  expired: 'bg-red-100 text-red-700',
}

export const SEVERITY_COLORS: Record<string, string> = {
  critical: 'bg-red-100 border-red-400 text-red-800',
  high: 'bg-orange-100 border-orange-400 text-orange-800',
  medium: 'bg-yellow-100 border-yellow-400 text-yellow-800',
  low: 'bg-green-100 border-green-400 text-green-800',
}
