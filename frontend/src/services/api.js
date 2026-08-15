import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

// Add auth token to requests if available
api.interceptors.request.use(config => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authApi = {
  login: (email, password) => api.post('/auth/login', { email, password }).then(({ data }) => {
    localStorage.setItem('authToken', data.access_token);
    localStorage.setItem('user', JSON.stringify(data.user));
    return data;
  }),
  register: (name, email, password) => api.post('/auth/register', { name, email, password }).then(({ data }) => {
    localStorage.setItem('authToken', data.access_token);
    localStorage.setItem('user', JSON.stringify(data.user));
    return data;
  }),
};

export const profileApi = {
  get: () => api.get('/profile').then(({ data }) => data),
  save: (profile) => api.put('/profile', profile).then(({ data }) => data),
};

export const formApi = {
  analyze: (url, questions = []) => api.post('/forms/analyze', { url, questions }).then(({ data }) => data),
  generate: (formId, questions) => api.post('/forms/generate', { form_id: formId, questions }).then(({ data }) => data),
  validate: (formId, questions) => api.post('/forms/validate', { form_id: formId, questions }).then(({ data }) => data),
  recordExecution: (formId, status) => api.post(`/forms/${formId}/execution`, { status }).then(({ data }) => data),
  history: () => api.get('/forms/history').then(({ data }) => data),
  get: (formId) => api.get(`/forms/${formId}`).then(({ data }) => data),
};

export const documentApi = {
  upload: (file) => { const body = new FormData(); body.append('file', file); return api.post('/documents/upload', body).then(({ data }) => data); },
};
