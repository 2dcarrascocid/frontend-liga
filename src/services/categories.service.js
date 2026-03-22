import apiClient from '../api/index.js';

export const listCategories  = (clubId)                   => apiClient.get(`/clubs/${clubId}/categories`);
export const createCategory  = (clubId, data)             => apiClient.post(`/clubs/${clubId}/categories`, data);
export const updateCategory  = (clubId, categoryId, data) => apiClient.patch(`/clubs/${clubId}/categories/${categoryId}`, data);
export const deleteCategory  = (clubId, categoryId)       => apiClient.delete(`/clubs/${clubId}/categories/${categoryId}`);
