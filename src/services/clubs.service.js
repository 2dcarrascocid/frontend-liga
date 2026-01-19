import apiClient from '../api';

export const getClubs = (params) => apiClient.get('/clubs', { params });

export const createClub = (data) => apiClient.post('/clubs', data);

export const getClubById = (clubId) => apiClient.get(`/clubs/${clubId}`);

export const updateClub = (clubId, data) => apiClient.patch(`/clubs/${clubId}`, data);

export const addClubUser = (clubId, data) => apiClient.post(`/clubs/${clubId}/users`, data);

export const removeClubUser = (clubId, userId) => apiClient.delete(`/clubs/${clubId}/users/${userId}`);

