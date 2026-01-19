import { reactive, toRefs } from 'vue';
import { getClubs, createClub, getClubById, updateClub, addClubUser, removeClubUser } from '../services/clubs.service';

const state = reactive({
  items: [],
  current: null,
  users: [],
  loading: false,
  error: null,
  meta: {
    limit: 10,
    next_token: null,
    total_registros: 0,
  },
});

export const useClubsStore = () => {
  const setError = (message) => {
    state.error = message;
  };

  const fetchClubs = async (params) => {
    state.loading = true;
    state.error = null;
    try {
      const response = await getClubs(params);
      const data = response.data;

      if (Array.isArray(data)) {
        state.items = data;
        state.meta.next_token = null;
        state.meta.total_registros = data.length;
      } else if (data && Array.isArray(data.data)) {
        state.items = data.data;
        state.meta.limit = data.limit ?? state.meta.limit;
        state.meta.next_token = data.next_token ?? null;
        state.meta.total_registros =
          data.total_registros ?? data.total ?? state.meta.total_registros;
      } else if (data && Array.isArray(data.items)) {
        state.items = data.items;
        state.meta.limit = data.limit ?? state.meta.limit;
        state.meta.next_token = data.next_token ?? null;
        state.meta.total_registros =
          data.total_registros ?? data.total ?? state.meta.total_registros;
      } else {
        console.warn('Unexpected clubs response format:', data);
        state.items = [];
        state.meta.next_token = null;
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Error al cargar clubes');
      throw error;
    } finally {
      state.loading = false;
    }
  };

  const fetchClubById = async (clubId) => {
    state.loading = true;
    state.error = null;
    try {
      const response = await getClubById(clubId);
      const data = response.data;
      const club = data?.club || data;
      state.current = club;
      state.users = club?.users || [];
    } catch (error) {
      setError(error.response?.data?.message || 'Error al cargar club');
      throw error;
    } finally {
      state.loading = false;
    }
  };

  const createOrUpdateClub = async (payload) => {
    state.loading = true;
    state.error = null;
    try {
      if (payload.id) {
        const response = await updateClub(payload.id, payload);
        state.current = response.data;
        const index = state.items.findIndex((c) => c.id === payload.id);
        if (index !== -1) {
          state.items[index] = response.data;
        }
        return response.data;
      }
      const response = await createClub(payload);
      state.items.push(response.data);
      return response.data;
    } catch (error) {
      setError(error.response?.data?.message || 'Error al guardar club');
      throw error;
    } finally {
      state.loading = false;
    }
  };

  const addUserToClub = async (clubId, data) => {
    state.loading = true;
    state.error = null;
    try {
      const response = await addClubUser(clubId, data);
      state.users = response.data?.users || state.users;
      return response.data;
    } catch (error) {
      setError(error.response?.data?.message || 'Error al agregar usuario');
      throw error;
    } finally {
      state.loading = false;
    }
  };

  const removeUserFromClub = async (clubId, userId) => {
    state.loading = true;
    state.error = null;
    try {
      await removeClubUser(clubId, userId);
      state.users = state.users.filter((u) => u.id !== userId);
    } catch (error) {
      setError(error.response?.data?.message || 'Error al quitar usuario');
      throw error;
    } finally {
      state.loading = false;
    }
  };

  return {
    ...toRefs(state),
    state,
    fetchClubs,
    fetchClubById,
    createOrUpdateClub,
    addUserToClub,
    removeUserFromClub,
  };
};
