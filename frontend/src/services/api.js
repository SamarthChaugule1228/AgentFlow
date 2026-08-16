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

const currentUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user') || '{}');
  } catch {
    return {};
  }
};

export const profileApi = {
  get: () => {
    const user = currentUser();
    return api.get('/profile', { params: { email: user.email || '' } }).then(({ data }) => data);
  },
  save: (profile) => {
    const user = currentUser();
    const payload = { ...profile, email: profile.email || user.email || '' };
    return api.put('/profile', payload, { params: { email: payload.email } }).then(({ data }) => data);
  },
};

export const formApi = {
  analyze: (url, questions = []) => {
    const user = currentUser();
    return api.post('/forms/analyze', { url, questions }, { params: { email: user.email || '' } }).then(({ data }) => data);
  },
  generate: (formId, questions) => {
    const user = currentUser();
    return api.post('/forms/generate', { form_id: formId, questions }, { params: { email: user.email || '' } }).then(({ data }) => data);
  },
  validate: (formId, questions) => {
    const user = currentUser();
    return api.post('/forms/validate', { form_id: formId, questions }, { params: { email: user.email || '' } }).then(({ data }) => data);
  },
  recordExecution: (formId, status) => {
    const user = currentUser();
    return api.post(`/forms/${formId}/execution`, { status }, { params: { email: user.email || '' } }).then(({ data }) => data);
  },
  history: () => {
    const user = currentUser();
    return api.get('/forms/history', { params: { email: user.email || '' } }).then(({ data }) => data);
  },
  get: (formId) => {
    const user = currentUser();
    return api.get(`/forms/${formId}`, { params: { email: user.email || '' } }).then(({ data }) => data);
  },
};

export const documentApi = {
  upload: (file) => {
    const user = currentUser();
    const body = new FormData();
    body.append('file', file);
    if (user.email) body.append('email', user.email);
    return api.post('/documents/upload', body).then(({ data }) => data);
  },
};
