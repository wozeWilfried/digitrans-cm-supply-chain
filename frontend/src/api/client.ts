import axios from 'axios';

// ─── Instance Axios centralisée ────────────────────────────────────
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Intercepteur requête — Injecte le JWT ─────────────────────────
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('jwt_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Intercepteur réponse — Gestion 401 / refresh token ───────────
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refresh_token');

      if (refreshToken) {
        try {
          const { data } = await axios.post(
            `${import.meta.env.VITE_API_BASE_URL}/auth/refresh`,
            { refreshToken }
          );
          localStorage.setItem('jwt_token', data.token);
          originalRequest.headers.Authorization = `Bearer ${data.token}`;
          return apiClient(originalRequest);
        } catch {
          localStorage.clear();
          window.location.href = '/login';
        }
      } else {
        localStorage.clear();
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;

// ─── Services API ──────────────────────────────────────────────────
export const authApi = {
  login: (email: string, motDePasse: string) =>
    apiClient.post('/auth/login', { email, motDePasse }),
  refresh: (refreshToken: string) =>
    apiClient.post('/auth/refresh', { refreshToken }),
};

export const stockApi = {
  getAll: (params?: { entrepotId?: number; produitId?: number; alerteSeulement?: boolean }) =>
    apiClient.get('/stocks', { params }),
  getAlertes: () => apiClient.get('/stocks/alertes'),
  getById: (id: number) => apiClient.get(`/stocks/${id}`),
};

export const fournisseurApi = {
  getAll: (statut?: string) => apiClient.get('/fournisseurs', { params: { statut } }),
  getById: (id: number) => apiClient.get(`/fournisseurs/${id}`),
  create: (data: unknown) => apiClient.post('/fournisseurs', data),
  update: (id: number, data: unknown) => apiClient.put(`/fournisseurs/${id}`, data),
};

export const commandeApi = {
  getAll: (statut?: string) => apiClient.get('/commandes', { params: { statut } }),
  getById: (id: number) => apiClient.get(`/commandes/${id}`),
  create: (data: unknown) => apiClient.post('/commandes', data),
  changerStatut: (id: number, statut: string) =>
    apiClient.put(`/commandes/${id}/statut`, { statut }),
};

export const livraisonApi = {
  getAll: (statut?: string) => apiClient.get('/livraisons', { params: { statut } }),
  getById: (id: number) => apiClient.get(`/livraisons/${id}`),
  updatePosition: (id: number, lat: number, lng: number) =>
    apiClient.put(`/livraisons/${id}/position`, { latitude: lat, longitude: lng }),
  changerStatut: (id: number, statut: string) =>
    apiClient.put(`/livraisons/${id}/statut`, { statut }),
};

export const mouvementApi = {
  getAll: (params?: { entrepotId?: number; type?: string }) =>
    apiClient.get('/mouvements', { params }),
  enregistrer: (data: unknown) => apiClient.post('/mouvements', data),
};

export const dashboardApi = {
  getKpis: () => apiClient.get('/dashboard/kpis'),
  getFluxTempsReel: () => apiClient.get('/dashboard/flux'),
};
