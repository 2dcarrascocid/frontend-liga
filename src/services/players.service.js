import apiClient from '../api';

export const getPlayers = (params) => apiClient.get('/players', { params });

export const createPlayer = (data) => apiClient.post('/players', data);

export const getPlayerById = (playerId) => apiClient.get(`/players/${playerId}`);

export const updatePlayer = (playerId, data) => apiClient.patch(`/players/${playerId}`, data);

