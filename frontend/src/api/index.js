import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

// ── Tenant endpoints ──────────────────────────────────────────────────────────
export const tenantApi = {
  getAll:  ()           => api.get('/tenants'),
  getById: (id)         => api.get(`/tenants/${id}`),
  create:  (data)       => api.post('/tenants', data),
  update:  (id, data)   => api.put(`/tenants/${id}`, data),
  delete:  (id)         => api.delete(`/tenants/${id}`),
};

// ── Payment endpoints ─────────────────────────────────────────────────────────
export const paymentApi = {
  getAll:      (month)      => api.get('/payments', { params: month ? { month } : {} }),
  getByTenant: (tenantId)   => api.get(`/payments/tenant/${tenantId}`),
  getById:     (id)         => api.get(`/payments/${id}`),
  create:      (data)       => api.post('/payments', data),
  delete:      (id)         => api.delete(`/payments/${id}`),
};
