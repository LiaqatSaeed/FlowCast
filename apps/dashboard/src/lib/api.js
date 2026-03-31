import { supabase } from './supabase';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * Get the current session's Bearer token for authenticated API calls.
 * @returns {Promise<string|null>}
 */
async function getAuthToken() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

/**
 * Base fetch wrapper. Automatically attaches Authorization header and
 * parses the standard { success, data, error } response envelope.
 *
 * @param {string} path - API path e.g. '/api/channels'
 * @param {RequestInit} [options]
 * @returns {Promise<any>} - The `data` field from the response envelope
 * @throws {Error} - When success is false or the network call fails
 */
async function apiFetch(path, options = {}) {
  const token = await getAuthToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  const json = await res.json();

  if (!res.ok || !json.success) {
    throw new Error(json.error || `Request failed: ${res.status}`);
  }

  return json.data;
}

// ─── Opportunities ────────────────────────────────────────────────────────────

export const opportunitiesApi = {
  list: () => apiFetch('/api/opportunities'),
  get: (id) => apiFetch(`/api/opportunities/${id}`),
  updateStatus: (id, status) =>
    apiFetch(`/api/opportunities/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  scan: (trends) =>
    apiFetch('/api/opportunities/scan', {
      method: 'POST',
      body: JSON.stringify({ trends }),
    }),
  previewScript: (id) =>
    apiFetch(`/api/opportunities/${id}/preview-script`, { method: 'POST' }),
};

// ─── Channels ─────────────────────────────────────────────────────────────────

export const channelsApi = {
  list: () => apiFetch('/api/channels'),
  get: (id) => apiFetch(`/api/channels/${id}`),
  create: (payload) =>
    apiFetch('/api/channels', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  update: (id, payload) =>
    apiFetch(`/api/channels/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  archive: (id) =>
    apiFetch(`/api/channels/${id}`, { method: 'DELETE' }),
};

// ─── Queue ────────────────────────────────────────────────────────────────────

export const queueApi = {
  list: () => apiFetch('/api/queue'),
  listByChannel: (channelId) => apiFetch(`/api/queue/${channelId}`),
  generate: (channelId, topic) =>
    apiFetch('/api/queue/generate', {
      method: 'POST',
      body: JSON.stringify({ channel_id: channelId, topic }),
    }),
};

// ─── Analytics ────────────────────────────────────────────────────────────────

export const analyticsApi = {
  aggregate: (days = 30) => apiFetch(`/api/analytics?days=${days}`),
  channel: (channelId, days = 30) => apiFetch(`/api/analytics/${channelId}?days=${days}`),
};

// ─── Publish ──────────────────────────────────────────────────────────────────

export const publishApi = {
  publish: (videoId, platforms) =>
    apiFetch(`/api/publish/${videoId}`, {
      method: 'POST',
      body: JSON.stringify({ platforms }),
    }),
  status: (videoId) => apiFetch(`/api/publish/status/${videoId}`),
};
