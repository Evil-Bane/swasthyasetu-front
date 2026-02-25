# SwasthyaSetu — Frontend API Reference

> **Base URL**: `https://swasthyasetu-seven.vercel.app`  
> **Format**: All responses are JSON with `{ "success": true, "data": ... }` wrapper  
> **CORS**: Enabled for all origins

---

## How the Backend Works (Quick Overview)

SwasthyaSetu is a **healthcare simulation platform** that mimics a real hospital environment:

1. **Patients** are auto-generated with Indian names (Faker), assigned a disease (from 10 types), and given medications
2. **Vitals** (heart rate, SpO2, blood pressure, temperature, ECG) are generated every 30s per patient using disease-aware distributions
3. **ML Engine** (Isolation Forest + 10 clinical rules) scans each vital reading and auto-creates **Alerts** if anomalies are detected
4. **Medications** are tracked with adherence events (taken/missed) and streak counting
5. **Hospital Beds** (50 total: 30 General + 10 ICU + 10 Emergency) are allocated to patients with occupancy simulation
6. **Patient Lifecycle** — new patients are auto-admitted, and recovered patients (3 consecutive normal readings) are auto-discharged

All simulation runs via **external cron jobs** hitting POST endpoints every 1-3 minutes.

```
Patient Admitted → Vitals Generated → ML Scans → Alert Created (if anomaly)
                → Medication Tracked → Recovery Checked → Discharged (if recovered)
```

---

## Pages, Features & Buttons

### Page 1: Dashboard (Home)
**Purpose**: Bird's-eye view of the entire hospital

| Feature | API | Data Key |
|---------|-----|----------|
| Total active patients card | `GET /api/analytics/dashboard` | `data.patients.total` |
| Active alerts count (red badge) | same | `data.alerts.active` |
| Medication adherence % (gauge) | same | `data.medications.adherence_rate_percent` |
| Bed occupancy % (progress bar) | same | `data.hospital.occupancy_rate_percent` |
| Disease distribution (donut chart) | same | `data.patients.by_disease` |
| Gender distribution (pie chart) | same | `data.patients.by_gender` |
| Alert severity breakdown (bar chart) | same | `data.alerts.by_severity` |
| Hospital bed split (stacked bar) | same | `data.hospital.icu / general / emergency` |
| Recovery rate % | same | `data.lifecycle.recovery_rate_percent` |
| Total patients ever treated | same | `data.lifecycle.total_patients_ever` |
| Recent alerts list (last 5) | `GET /api/alerts?limit=5` | `data[]` |

**Buttons**:
| Button | Action | API Call |
|--------|--------|----------|
| 🔄 Refresh | Reload all dashboard data | `GET /api/analytics/dashboard` |
| ✅ Acknowledge (per alert row) | Mark alert as seen | `PUT /api/alerts/{alert_id}/acknowledge` |

---

### Page 2: Patient Management
**Purpose**: View, search, generate, and manage patients

| Feature | API | Notes |
|---------|-----|-------|
| Patient table (name, age, gender, disease, medications, bed, status) | `GET /api/patients` | Returns active patients by default |
| Include discharged toggle | `GET /api/patients?include_discharged=true` | Shows all patients ever |
| Patient detail panel (on row click) | `GET /api/patients/{patient_id}` | Full patient data |
| Generate new patients modal | `POST /api/patients/generate` | Body: `{"count": 5}` |
| Download PDF report | `GET /api/reports/patient/{patient_id}` | Returns PDF binary |
| Check recovery status | `GET /api/lifecycle/recovery/{patient_id}` | Shows if patient can be discharged |
| Discharge patient | `POST /api/lifecycle/discharge/{patient_id}` | Releases bed, resolves alerts |

**Buttons**:
| Button | API Call | Method |
|--------|----------|--------|
| ➕ Generate Patients | `/api/patients/generate` | POST, body `{"count": N}` |
| 🔍 Search | Client-side filter | — |
| 📄 Download Report | `/api/reports/patient/{id}` | GET (returns PDF) |
| 🩺 Check Recovery | `/api/lifecycle/recovery/{id}` | GET |
| 🚪 Discharge | `/api/lifecycle/discharge/{id}` | POST |
| ➕ Admit New | `/api/lifecycle/admit?count=1` | POST |

---

### Page 3: Vitals Monitor
**Purpose**: Real-time vital signs dashboard with ECG waveforms

| Feature | API | Notes |
|---------|-----|-------|
| Patient vital cards grid (HR, SpO2, BP, Temp) | `GET /api/vitals/latest` | One card per patient |
| ECG sparkline per patient | same | `data[].ecg_signal` (50 float points) |
| Anomaly indicator (red/green dot) | same | `data[].is_anomaly` |
| Patient vital history (line chart) | `GET /api/vitals/{patient_id}?limit=50` | Time-series data |
| Generate new vitals round | `POST /api/vitals/generate` | Triggers ML + alerts |

**Buttons**:
| Button | API Call | Method |
|--------|----------|--------|
| ⚡ Generate Vitals | `/api/vitals/generate` | POST |
| 📈 View History (per card) | `/api/vitals/{patient_id}?limit=50` | GET |

---

### Page 4: Alerts
**Purpose**: View and manage ML-detected health alerts

| Feature | API | Notes |
|---------|-----|-------|
| Stats bar (total, active, acknowledged, resolved) | `GET /api/alerts/stats` | Summary counts |
| Alert severity breakdown chart | same | `data.by_severity` |
| Alert type breakdown chart | same | `data.by_type` |
| Filtered alert table | `GET /api/alerts?status=active&severity=high&limit=100` | All params optional |
| Acknowledge alert | `PUT /api/alerts/{alert_id}/acknowledge` | Changes status |
| Resolve alert | `PUT /api/alerts/{alert_id}/resolve` | Archives alert |

**Buttons**:
| Button | API Call | Method |
|--------|----------|--------|
| Filter: Status ▼ | `/api/alerts?status=active` | GET |
| Filter: Severity ▼ | `/api/alerts?severity=high` | GET |
| ✅ Acknowledge | `/api/alerts/{id}/acknowledge` | PUT |
| 🗑️ Resolve | `/api/alerts/{id}/resolve` | PUT |

---

### Page 5: Medications
**Purpose**: Track medication adherence and streaks

| Feature | API | Notes |
|---------|-----|-------|
| Stats cards (total Rx, taken, missed, adherence %) | `GET /api/medications/stats` | Aggregated data |
| Top streaks leaderboard | same | `data.top_streaks` |
| Medication table (patient, medicine, schedule, status, streak) | `GET /api/medications` | All records |
| Patient-specific medications | `GET /api/medications/{patient_id}` | Filtered |
| Mark taken/missed | `POST /api/medications/adherence` | See body below |
| Simulate bulk adherence | `POST /api/medications/simulate` | ~80% taken |

**Adherence body**:
```json
{ "patient_id": "uuid", "medication_id": "uuid", "action": "taken" }
```

**Buttons**:
| Button | API Call | Method |
|--------|----------|--------|
| ✅ Mark Taken | `/api/medications/adherence` | POST, action: "taken" |
| ❌ Mark Missed | `/api/medications/adherence` | POST, action: "missed" |
| 🔄 Simulate All | `/api/medications/simulate` | POST |

---

### Page 6: Hospital Resources
**Purpose**: Visual bed map and occupancy management

| Feature | API | Notes |
|---------|-----|-------|
| Occupancy stats (total, occupied, available, %) | `GET /api/hospital/stats` | By type breakdown |
| ICU-specific view | `GET /api/hospital/icu` | ICU beds only |
| Full bed grid (visual map) | `GET /api/hospital/beds` | All 50 beds |
| Simulate occupancy changes | `POST /api/hospital/simulate` | Random admit/discharge |

**Buttons**:
| Button | API Call | Method |
|--------|----------|--------|
| Tab: All / General / ICU / Emergency | Client-side filter | — |
| 🔄 Simulate | `/api/hospital/simulate` | POST |

---

### Page 7: Analytics & Trends
**Purpose**: Time-series vital trends and population analytics

| Feature | API | Notes |
|---------|-----|-------|
| Vital trends multi-line chart | `GET /api/analytics/trends` | avg HR/SpO2/BP/Temp over time |
| Full dashboard aggregation | `GET /api/analytics/dashboard` | Everything in one call |
| Lifecycle stats | same | `data.lifecycle` |

---

### Page 8: Reports
**Purpose**: Generate and download patient health PDF reports

| Feature | API | Notes |
|---------|-----|-------|
| Patient selector dropdown | `GET /api/patients` | Populate dropdown |
| Generate PDF | `GET /api/reports/patient/{patient_id}` | Returns binary PDF |

---

## Complete API Reference

### 🟢 GET Endpoints (Read Data)

| # | Endpoint | Description | Response Shape |
|---|----------|-------------|---------------|
| 1 | `/` | Platform info | `{ platform, version, status, endpoints }` |
| 2 | `/health` | System health | `{ status, database, ml_model_trained }` |
| 3 | `/api/patients` | List active patients | `{ success, count, data: [Patient] }` |
| 4 | `/api/patients?include_discharged=true` | List all patients ever | same |
| 5 | `/api/patients/{id}` | Single patient | `{ success, data: Patient }` |
| 6 | `/api/vitals/latest` | Latest vital per patient | `{ success, count, data: [Vital] }` |
| 7 | `/api/vitals/{patient_id}?limit=50` | Vital history | `{ success, count, data: [Vital] }` |
| 8 | `/api/alerts?status=X&severity=X&limit=N` | Filtered alerts | `{ success, count, data: [Alert] }` |
| 9 | `/api/alerts/stats` | Alert summary | `{ success, data: AlertStats }` |
| 10 | `/api/medications` | All medications | `{ success, count, data: [Medication] }` |
| 11 | `/api/medications/{patient_id}` | Patient medications | same |
| 12 | `/api/medications/stats` | Adherence analytics | `{ success, data: MedStats }` |
| 13 | `/api/hospital/beds` | All 50 beds | `{ success, count, data: [Bed] }` |
| 14 | `/api/hospital/icu` | ICU beds only | `{ success, total_icu, occupied, available, data }` |
| 15 | `/api/hospital/stats` | Occupancy dashboard | `{ success, data: HospitalStats }` |
| 16 | `/api/analytics/dashboard` | Full dashboard (single call) | `{ success, data: Dashboard }` |
| 17 | `/api/analytics/trends` | Vital averages over time | `{ success, count, data: [TrendPoint] }` |
| 18 | `/api/reports/patient/{id}` | PDF download | Binary PDF file |
| 19 | `/api/lifecycle/stats` | Lifecycle statistics | `{ success, data: LifecycleStats }` |
| 20 | `/api/lifecycle/recovery/{id}` | Check patient recovery | `{ success, data: RecoveryCheck }` |

### 🟠 POST/PUT Endpoints (Actions)

| # | Endpoint | Method | Body | Description |
|---|----------|--------|------|-------------|
| 21 | `/api/patients/generate` | POST | `{"count": 5}` | Generate new patients |
| 22 | `/api/vitals/generate` | POST | — | Generate vitals + ML + alerts |
| 23 | `/api/alerts/{id}/acknowledge` | PUT | — | Acknowledge alert |
| 24 | `/api/alerts/{id}/resolve` | PUT | — | Resolve alert |
| 25 | `/api/medications/adherence` | POST | `{"patient_id","medication_id","action"}` | Record taken/missed |
| 26 | `/api/medications/simulate` | POST | — | Bulk adherence sim |
| 27 | `/api/hospital/simulate` | POST | — | Occupancy simulation |
| 28 | `/api/lifecycle/admit?count=N` | POST | — | Admit new patients |
| 29 | `/api/lifecycle/discharge/{id}` | POST | — | Discharge patient |
| 30 | `/api/lifecycle/simulate` | POST | — | Full lifecycle cycle |

---

## Data Shapes (TypeScript-style)

```typescript
// ─── Patient ─────────────────────────────────
interface Patient {
  patient_id: string       // UUID
  name: string             // "Sanya Din"
  age: number              // 18-85
  gender: "Male" | "Female" | "Other"
  disease: string          // "Diabetes", "Hypertension", etc.
  medications: string[]    // ["Metformin 500mg", "Glimepiride 2mg"]
  assigned_bed: string | null  // bed UUID or null
  status: "admitted" | "discharged"
  created_timestamp: string    // ISO datetime
  discharge_timestamp?: string // only if discharged
}

// ─── Vital ───────────────────────────────────
interface Vital {
  patient_id: string
  heart_rate: number       // 30-200 bpm
  spo2: number             // 70-100 %
  blood_pressure: { systolic: number, diastolic: number }
  temperature: number      // 34.0-42.0 °C
  ecg_signal: number[]     // 50 float points (for sparkline)
  timestamp: string
  is_anomaly: boolean
  anomaly_score: number | null
}

// ─── Alert ───────────────────────────────────
interface Alert {
  alert_id: string
  patient_id: string
  alert_type: "threshold_breach" | "vital_anomaly" | "emergency"
  severity: "low" | "medium" | "high" | "critical"
  message: string          // "SpO2 below normal (93.4%)"
  status: "active" | "acknowledged" | "resolved"
  triggered_rules: string[]  // ["spo2_warning", "temp_high"]
  timestamp: string
}

// ─── Medication ──────────────────────────────
interface Medication {
  medication_id: string
  patient_id: string
  medicine_name: string    // "Metformin 500mg"
  dosage: string
  schedule: "morning" | "afternoon" | "night" | "morning+night"
  adherence_status: "pending" | "taken" | "missed"
  streak: number           // consecutive taken count
  last_taken: string | null
  timestamp: string
}

// ─── Bed ─────────────────────────────────────
interface Bed {
  bed_id: string
  bed_type: "General" | "ICU" | "Emergency"
  bed_label: string        // "GEN-001", "ICU-003", "EMR-007"
  occupancy_status: "available" | "occupied"
  patient_id: string | null
  icu_flag: boolean
}

// ─── Dashboard (single API call) ─────────────
interface Dashboard {
  patients: {
    total: number
    by_disease: Array<Record<string, number>>  // [{"Diabetes": 3}, ...]
    by_gender: Array<Record<string, number>>
    age_stats: { avg_age: number, min_age: number, max_age: number }
  }
  vitals: {
    total_readings: number
    anomaly_readings: number
    anomaly_rate_percent: number
  }
  alerts: {
    total_alerts: number
    active: number
    acknowledged: number
    resolved: number
    by_severity: { low: number, medium: number, high: number, critical: number }
    by_type: { threshold_breach: number, vital_anomaly: number, emergency: number }
  }
  medications: {
    total_prescriptions: number
    taken: number, missed: number, pending: number
    adherence_rate_percent: number
    top_streaks: Array<{ patient_id: string, medicine_name: string, streak: number }>
  }
  hospital: {
    total_beds: number, occupied: number, available: number
    occupancy_rate_percent: number
    icu: { total: number, occupied: number, available: number }
    general: { total: number, occupied: number, available: number }
    emergency: { total: number, occupied: number, available: number }
  }
  lifecycle: {
    total_patients_ever: number
    currently_active: number
    discharged: number
    avg_stay_hours: number
    recovery_rate_percent: number
  }
}

// ─── Trend Point ─────────────────────────────
interface TrendPoint {
  avg_heart_rate: number
  avg_spo2: number
  avg_systolic: number
  avg_diastolic: number
  avg_temperature: number
  count: number
  timestamp: string        // "2026-02-24T19:55"
}
```

---

## Summary for Frontend Planning

| Metric | Count |
|--------|-------|
| **Total Pages** | 8 |
| **GET Endpoints** | 20 |
| **POST/PUT Endpoints** | 10 |
| **Total API Endpoints** | 30 |
| **Interactive Buttons** | 20 |
| **Charts/Visualizations** | 8+ (donut, bar, line, gauge, sparkline, heatmap) |
| **Data Types** | 6 (Patient, Vital, Alert, Medication, Bed, TrendPoint) |
| **Real-time Updates** | Vitals refresh every 30s, lifecycle every 2min |

### Diseases in System (10)
Diabetes, Hypertension, COPD, Asthma, Heart Failure, Pneumonia, Anemia, Chronic Kidney Disease, Tuberculosis, Dengue Fever

### Severity Levels (4)
`low` → 🔵 | `medium` → 🟡 | `high` → 🟠 | `critical` → 🔴
