// Simple backend connector for PivotFrontend

const DEFAULT_URL = 'http://localhost:8000';
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || DEFAULT_URL;

export function getBackendUrl() {
  return BACKEND_URL;
}

export async function pingBackend() {
  const res = await fetch(`${BACKEND_URL}/health`);
  if (!res.ok) throw new Error(`Health check failed: ${res.status}`);
  return res.json();
}

export async function runGridRiskAssessment(params = {}) {
  const body = {
    min_lat: 10.65,
    max_lat: 10.79,
    min_lng: 122.5,
    max_lng: 122.62,
    grid_spacing: 0.04,
    ...params,
  };
  const res = await fetch(`${BACKEND_URL}/api/grid-risk-assessment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.detail || 'Grid risk assessment failed');
  return data;
}

export async function getGridRiskStatus() {
  const res = await fetch(`${BACKEND_URL}/api/grid-risk-assessment/status`);
  const data = await res.json();
  if (!res.ok) throw new Error(data?.detail || 'Status fetch failed');
  return data;
}


