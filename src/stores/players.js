import { reactive, toRefs } from 'vue';
import { getPlayers, createPlayer, getPlayerById, updatePlayer } from '../services/players.service';
import { requestLoan, approveLoan, rejectLoan, returnLoan } from '../services/loans.service';

const state = reactive({
  items: [],
  current: null,
  loading: false,
  error: null,
  filters: {
    clubId: null,
    category: null,
  },
});

export const usePlayersStore = () => {
  const setError = (message) => {
    state.error = message;
  };

  const fetchPlayers = async (params = {}) => {
    state.loading = true;
    state.error = null;
    try {
      const response = await getPlayers({ ...state.filters, ...params });
      const data = response.data;
      if (Array.isArray(data)) {
        state.items = data;
      } else if (data && Array.isArray(data.data)) {
        state.items = data.data;
      } else if (data && Array.isArray(data.items)) {
        state.items = data.items;
      } else {
        console.warn('Unexpected players response format:', data);
        state.items = [];
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Error al cargar jugadores');
      throw error;
    } finally {
      state.loading = false;
    }
  };

  const fetchPlayerById = async (playerId) => {
    state.loading = true;
    state.error = null;
    try {
      const response = await getPlayerById(playerId);
      state.current = response.data;
    } catch (error) {
      setError(error.response?.data?.message || 'Error al cargar jugador');
      throw error;
    } finally {
      state.loading = false;
    }
  };

  const createOrUpdatePlayer = async (payload) => {
    state.loading = true;
    state.error = null;
    try {
      if (payload.id) {
        const response = await updatePlayer(payload.id, payload);
        state.current = response.data;
        const index = state.items.findIndex((p) => p.id === payload.id);
        if (index !== -1) {
          state.items[index] = response.data;
        }
        return response.data;
      }
      const response = await createPlayer(payload);
      state.items.push(response.data);
      return response.data;
    } catch (error) {
      setError(error.response?.data?.message || 'Error al guardar jugador');
      throw error;
    } finally {
      state.loading = false;
    }
  };

  const setFilters = (filters) => {
    state.filters = { ...state.filters, ...filters };
  };

  const requestPlayerLoan = async (playerId, data) => {
    state.loading = true;
    state.error = null;
    try {
      const response = await requestLoan(playerId, data);
      return response.data;
    } catch (error) {
      setError(error.response?.data?.message || 'Error al solicitar préstamo');
      throw error;
    } finally {
      state.loading = false;
    }
  };

  const approvePlayerLoan = async (loanId) => {
    state.loading = true;
    state.error = null;
    try {
      const response = await approveLoan(loanId);
      return response.data;
    } catch (error) {
      setError(error.response?.data?.message || 'Error al aprobar préstamo');
      throw error;
    } finally {
      state.loading = false;
    }
  };

  const rejectPlayerLoan = async (loanId) => {
    state.loading = true;
    state.error = null;
    try {
      const response = await rejectLoan(loanId);
      return response.data;
    } catch (error) {
      setError(error.response?.data?.message || 'Error al rechazar préstamo');
      throw error;
    } finally {
      state.loading = false;
    }
  };

  const returnPlayerLoan = async (loanId) => {
    state.loading = true;
    state.error = null;
    try {
      const response = await returnLoan(loanId);
      return response.data;
    } catch (error) {
      setError(error.response?.data?.message || 'Error al devolver jugador');
      throw error;
    } finally {
      state.loading = false;
    }
  };

  return {
    ...toRefs(state),
    state,
    fetchPlayers,
    fetchPlayerById,
    createOrUpdatePlayer,
    setFilters,
    requestPlayerLoan,
    approvePlayerLoan,
    rejectPlayerLoan,
    returnPlayerLoan,
  };
};

