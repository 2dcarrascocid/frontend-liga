import apiClient from '../api';

// Listados
export const getPlayers = (params) => apiClient.get('/players', { params });
export const listPlayersByClub = (clubId, params) => apiClient.get(`/clubs/${clubId}/players`, { params });
export const listPlayersByOrg = (orgId, params) => apiClient.get(`/orgs/${orgId}/players`, { params });

// Detalle
export const getPlayerById = (playerId) => apiClient.get(`/players/${playerId}`);

// Creación
export const createPlayer = (data) => apiClient.post('/players', data);
export const createPlayerForClub = (clubId, data) => apiClient.post(`/clubs/${clubId}/players`, data);

// Edición
export const updatePlayer = (playerId, data) => apiClient.patch(`/players/${playerId}`, data);

// Estado en club
export const setPlayerStatus = (clubId, playerId, data) => apiClient.patch(`/clubs/${clubId}/players/${playerId}/status`, data);

// Cambio de club
export const changeClub = (playerId, data) => apiClient.post(`/players/${playerId}/change-club`, data);

// Foto
export const uploadPhoto = (playerId, data) => {
    const formData = new FormData();
    formData.append('file', data);
    return apiClient.post(`/players/${playerId}/photo`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
};
