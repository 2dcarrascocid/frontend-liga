import axios from 'axios';

// Configuración base de la API
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
const API_KEY = import.meta.env.VITE_API_KEY || 'your-api-key-here';

// Crear instancia de axios
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY
    }
});

// Interceptor para agregar el token de autenticación
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Interceptor para manejar errores de autenticación
apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Si el error es 401 y no hemos intentado refrescar el token
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem('refreshToken');
                if (refreshToken) {
                    // Intentar refrescar el token
                    const response = await axios.post(`${API_BASE_URL}/login/refresh`, {
                        refreshToken
                    }, {
                        headers: {
                            'x-api-key': API_KEY
                        }
                    });

                    const { accessToken } = response.data;
                    console.log("accessToken", accessToken)
                    localStorage.setItem('accessToken', accessToken);

                    // Reintentar la petición original
                    originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                    return apiClient(originalRequest);
                }
            } catch (refreshError) {
                // Si falla el refresh, limpiar tokens y redirigir al login
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('user');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default apiClient;

// ==================== AUTH API ====================
export const authAPI = {
    login: (credentials) => apiClient.post('/auth/login', credentials),
    register: (userData) => apiClient.post('/auth/register', userData),
    logout: (sessionId) => apiClient.post('/auth/logout', { sessionId }), // Note: Not explicitly in serverless.yml
    refreshToken: (refreshToken) => apiClient.post('/auth/refresh', { refreshToken }), // Note: Not explicitly in serverless.yml
    googleLogin: (googleData) => apiClient.post('/auth/google', googleData),
};

// ==================== CLUBS API ====================
export const clubsAPI = {
    getAll: (params) => apiClient.get('/clubes', { params }),
    create: (clubData) => apiClient.post('/clubes', clubData),
    // The following are not explicitly in serverlessClubes.yml but kept for future use
    getById: (id) => apiClient.get(`/clubes/${id}`),
    update: (clubData) => apiClient.put('/clubes', clubData),
    delete: (id) => apiClient.delete(`/clubes/${id}`),
};

// ==================== PLAYERS API ====================
export const playersAPI = {
    // Updated to match /clubes/{clubId}/jugadores
    getAll: (clubId, params) => apiClient.get(`/clubes/${clubId}/jugadores`, { params }),
    create: (clubId, playerData) => apiClient.post(`/clubes/${clubId}/jugadores`, playerData),

    // The following are not explicitly in serverlessJugadores.yml
    getById: (id) => apiClient.get(`/jugadores/${id}`),
    update: (playerData) => apiClient.put('/jugadores/actualizar', playerData),
    delete: (id) => apiClient.delete(`/jugadores/${id}`),
};

// ==================== FINANCE API ====================
export const financeAPI = {
    // Updated to match /clubes/{clubId}/finanzas/movimientos
    getTransactions: (clubId, params) => apiClient.get(`/clubes/${clubId}/finanzas/movimientos`, { params }),
    createTransaction: (clubId, data) => apiClient.post(`/clubes/${clubId}/finanzas/movimientos`, data),

    // New endpoint found in serverlessFinanzas.yml
    closeMonth: (clubId, data) => apiClient.post(`/clubes/${clubId}/finanzas/cierre`, data),

    // The following are not explicitly in serverlessFinanzas.yml
    updateTransaction: (data) => apiClient.put('/finanzas', data),
    deleteTransaction: (id) => apiClient.delete(`/finanzas/${id}`),
};

// ==================== MATCHES API ====================
// Removed as per user instruction
/*
export const matchesAPI = {
    search: (params) => apiClient.get('/partidos/buscar', { params }),
    getPending: (params) => apiClient.get('/partidos/pendientes', { params }),
    getPast: (params) => apiClient.get('/partidos/pasados', { params }),
    getDetails: (id) => apiClient.get(`/partidos/detalle/${id}`),
    getMyAttendances: (params) => apiClient.get('/partidos/mis-asistencias', { params }),
    create: (matchData) => apiClient.post('/partidos', matchData),
    update: (matchData) => apiClient.put('/partidos', matchData),
    delete: (id) => apiClient.delete(`/partidos/${id}`),

    // Asistencias
    getAttendance: (partidoId) => apiClient.get('/partidos/asistencia', { params: { partido_id: partidoId } }),
    confirmAttendance: (data) => apiClient.post('/partidos/asistencia', data),
    updateAttendanceStatus: (data) => apiClient.post('/partidos/asistencia-estado', data),
    deleteAttendance: (partidoId, jugadorId) => apiClient.delete('/partidos/asistencia', {
        params: { partido_id: partidoId, jugador_id: jugadorId }
    }),

    // Solicitudes
    requestJoin: (data) => apiClient.post('/partidos/solicitud', data),
    getPendingRequests: (params) => apiClient.get('/partidos/solicitudes-pendientes', { params }),
    respondRequest: (data) => apiClient.put('/partidos/solicitud/responder', data),
};
*/

// ==================== PARAMETERS API ====================
// Removed as per user instruction
/*
export const parametersAPI = {
    // Organizations
    getOrganizations: () => apiClient.get('/parametros/organizations'),
    createOrganization: (data) => apiClient.post('/parametros/organizations', data),

    // Seasons
    getSeasons: (params) => apiClient.get('/parametros/seasons', { params }),
    createSeason: (data) => apiClient.post('/parametros/seasons', data),

    // Tournaments
    getTournaments: (params) => apiClient.get('/parametros/tournaments', { params }),
    createTournament: (data) => apiClient.post('/parametros/tournaments', data),

    // Categories
    getCategories: (params) => apiClient.get('/parametros/categories', { params }),
    createCategory: (data) => apiClient.post('/parametros/categories', data),
};
*/
