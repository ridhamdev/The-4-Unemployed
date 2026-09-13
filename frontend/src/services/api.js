const API_BASE = '/api';

export async function fetchHealth() {
  const res = await fetch(`${API_BASE}/health`);
  return res.json();
}

export async function fetchDemoFactory() {
  const res = await fetch(`${API_BASE}/factory/demo/load`);
  if (!res.ok) throw new Error('Failed to load demo factory');
  return res.json();
}

export async function fetchLiveEnvironment(lat, lng, radiusKm = 5.0) {
  const res = await fetch(`${API_BASE}/environment/live?latitude=${lat}&longitude=${lng}&radius_km=${radiusKm}`);
  if (!res.ok) throw new Error('Failed to fetch environmental data');
  return res.json();
}

export async function runAnalysis(factoryPayload) {
  const res = await fetch(`${API_BASE}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(factoryPayload)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Analysis execution failed');
  }
  return res.json();
}

export async function fetchAnalysis(id) {
  const res = await fetch(`${API_BASE}/analysis/${id}`);
  if (!res.ok) throw new Error('Failed to fetch analysis record');
  return res.json();
}

export async function loadSampleDataset() {
  const res = await fetch(`${API_BASE}/dataset/sample/load`);
  if (!res.ok) throw new Error('Failed to load sample dataset');
  return res.json();
}

export async function uploadDataset(file) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_BASE}/dataset/upload`, {
    method: 'POST',
    body: formData
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Failed to upload dataset');
  }
  return res.json();
}

export async function trainBaselineModel(datasetId, targetCol, featureCols, testSize = 0.2) {
  const res = await fetch(`${API_BASE}/dataset/${datasetId}/train_baseline`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      target_column: targetCol,
      feature_columns: featureCols,
      test_size: testSize
    })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Baseline training failed');
  }
  return res.json();
}

export async function uploadEnvironmentalCsv(file) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_BASE}/environment/upload`, {
    method: 'POST',
    body: formData
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Failed to upload environmental CSV');
  }
  return res.json();
}

export async function fetchSpatialGrid(latitude = 22.4125, longitude = 73.0944, radiusKm = 5.0) {
  const res = await fetch(`${API_BASE}/spatial-grid?latitude=${latitude}&longitude=${longitude}&radius_km=${radiusKm}`);
  if (!res.ok) throw new Error('Failed to fetch spatial grid');
  return res.json();
}

export async function fetchSpatialRisk(latitude = 22.4125, longitude = 73.0944, windSpeed = 2.8, windDeg = 225.0) {
  const res = await fetch(`${API_BASE}/spatial-risk?latitude=${latitude}&longitude=${longitude}&wind_speed_ms=${windSpeed}&wind_deg=${windDeg}`);
  if (!res.ok) throw new Error('Failed to fetch spatial risk heatmap');
  return res.json();
}

export async function fetchModelRegistry() {
  const res = await fetch(`${API_BASE}/ml/models`);
  if (!res.ok) throw new Error('Failed to fetch model registry');
  return res.json();
}

export async function fetchModelComparison() {
  const res = await fetch(`${API_BASE}/ml/comparison`);
  if (!res.ok) throw new Error('Failed to fetch ML model comparison');
  return res.json();
}

export async function fetchAblationStudy() {
  const res = await fetch(`${API_BASE}/ml/ablation`);
  if (!res.ok) throw new Error('Failed to fetch ablation study');
  return res.json();
}

export async function fetchModelExplainability() {
  const res = await fetch(`${API_BASE}/ml/explain`);
  if (!res.ok) throw new Error('Failed to fetch model explainability');
  return res.json();
}

export async function extractEarthEngine(payload) {
  const res = await fetch(`${API_BASE}/earth-engine/extract`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Earth Engine extraction failed');
  }
  return res.json();
}

// -------------------------------------------------------------
// -------------------------------------------------------------
// FACTORY PLATFORM & GEOGRAPHIC ONBOARDING ENDPOINTS (Section 3 & 4)
// -------------------------------------------------------------
export async function fetchStates() {
  const res = await fetch(`${API_BASE}/geo/states`);
  if (!res.ok) throw new Error('Failed to fetch states list');
  return res.json();
}

export async function fetchCities(state) {
  const res = await fetch(`${API_BASE}/geo/cities?state=${encodeURIComponent(state)}`);
  if (!res.ok) throw new Error(`Failed to fetch cities for ${state}`);
  return res.json();
}

export async function createFactoryProfile(factoryPayload) {
  const res = await fetch(`${API_BASE}/factories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(factoryPayload)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Failed to create factory profile');
  }
  return res.json();
}

export async function fetchFactories(isDemo = null) {
  let url = `${API_BASE}/factories`;
  if (isDemo !== null) url += `?is_demo=${isDemo}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch factories');
  return res.json();
}

export async function fetchFactoryById(identifier) {
  const res = await fetch(`${API_BASE}/factories/${identifier}`);
  if (!res.ok) throw new Error(`Failed to fetch factory ${identifier}`);
  return res.json();
}

export async function analyzeFactoryById(identifier) {
  const res = await fetch(`${API_BASE}/factories/${identifier}/analyze`, {
    method: 'POST'
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Factory analysis failed');
  }
  return res.json();
}

export async function fetchFactoryAnalysis(identifier) {
  const res = await fetch(`${API_BASE}/factories/${identifier}/analysis`);
  if (!res.ok) throw new Error(`Failed to fetch analysis for factory ${identifier}`);
  return res.json();
}

export async function fetchFactoryReport(identifier) {
  const res = await fetch(`${API_BASE}/factories/${identifier}/report`);
  if (!res.ok) throw new Error(`Failed to fetch report for factory ${identifier}`);
  return res.json();
}

export async function fetchScenarios() {
  const res = await fetch(`${API_BASE}/factory/scenarios`);
  if (!res.ok) throw new Error('Failed to fetch factory scenarios');
  return res.json();
}

export async function fetchScenario(key) {
  const res = await fetch(`${API_BASE}/factory/scenarios/${key}`);
  if (!res.ok) throw new Error('Failed to fetch scenario details');
  return res.json();
}

export async function fetchGisLayers(lat = 22.4125, lng = 73.0944, radiusKm = 5.0) {
  const res = await fetch(`${API_BASE}/gis/layers?latitude=${lat}&longitude=${lng}&radius_km=${radiusKm}`);
  if (!res.ok) throw new Error('Failed to fetch GIS layers');
  return res.json();
}

export async function fetchBufferAnalysis(lat = 22.4125, lng = 73.0944, radiusKm = 5.0) {
  const res = await fetch(`${API_BASE}/gis/buffer-analysis?latitude=${lat}&longitude=${lng}&radius_km=${radiusKm}`);
  if (!res.ok) throw new Error('Failed to fetch buffer analysis');
  return res.json();
}

export async function fetchReport(analysisId) {
  const res = await fetch(`${API_BASE}/reports/${analysisId}`);
  if (!res.ok) throw new Error('Failed to fetch analysis report');
  return res.json();
}

// -------------------------------------------------------------
// INTERNAL ML RESEARCH WORKBENCH ENDPOINTS (Section 2)
// -------------------------------------------------------------
export async function fetchWorkbenchDatasets() {
  const res = await fetch(`${API_BASE}/workbench/datasets`);
  if (!res.ok) throw new Error('Failed to fetch datasets metadata');
  return res.json();
}

export async function fetchWorkbenchDataQuality() {
  const res = await fetch(`${API_BASE}/workbench/data-quality`);
  if (!res.ok) throw new Error('Failed to fetch data quality stats');
  return res.json();
}

export async function fetchWorkbenchFeatures() {
  const res = await fetch(`${API_BASE}/workbench/features`);
  if (!res.ok) throw new Error('Failed to fetch feature engineering specs');
  return res.json();
}

export async function fetchWorkbenchModels() {
  const res = await fetch(`${API_BASE}/workbench/models`);
  if (!res.ok) throw new Error('Failed to fetch models registry');
  return res.json();
}

export async function fetchWorkbenchEvaluation() {
  const res = await fetch(`${API_BASE}/workbench/evaluation`);
  if (!res.ok) throw new Error('Failed to fetch evaluation benchmark');
  return res.json();
}

export async function fetchWorkbenchAblation() {
  const res = await fetch(`${API_BASE}/workbench/ablation`);
  if (!res.ok) throw new Error('Failed to fetch ablation metrics');
  return res.json();
}

export async function fetchWorkbenchExplainability() {
  const res = await fetch(`${API_BASE}/workbench/explainability`);
  if (!res.ok) throw new Error('Failed to fetch SHAP explainability');
  return res.json();
}

export async function fetchWorkbenchGisValidation(lat = 22.4125, lng = 73.0944, radiusKm = 5.0) {
  const res = await fetch(`${API_BASE}/workbench/gis-validation?latitude=${lat}&longitude=${lng}&radius_km=${radiusKm}`);
  if (!res.ok) throw new Error('Failed to fetch GIS validation data');
  return res.json();
}

export async function fetchWorkbenchAnomalies() {
  const res = await fetch(`${API_BASE}/workbench/anomalies`);
  if (!res.ok) throw new Error('Failed to fetch anomaly records');
  return res.json();
}


