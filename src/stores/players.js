import { reactive, toRefs } from 'vue';
import { 
  getPlayers, 
  createPlayer, 
  getPlayerById, 
  updatePlayer,
  listPlayersByClub,
  listPlayersByOrg,
  createPlayerForClub,
  setPlayerStatus,
  changeClub,
  uploadPhoto
} from '../services/players.service';

const state = reactive({
  items: [],
  current: null,
  loading: false,
  error: null,
  meta: {
    total: 0,
    limit: 10,
    page: 1,
    next_token: null
  },
  filters: {
    clubId: null,
    category: null,
  },
});

export const usePlayersStore = () => {
  const setError = (message) => {
    state.error = message;
  };

  const processResponse = (response) => {
    const data = response.data;
    if (Array.isArray(data)) {
      state.items = data;
    } else if (data && Array.isArray(data.data)) {
      state.items = data.data;
      if (data.meta) {
        state.meta = data.meta;
      }
    } else if (data && Array.isArray(data.items)) {
      state.items = data.items;
      if (data.meta) {
        state.meta = data.meta;
      }
    } else if (data && Array.isArray(data.players)) {
       state.items = data.players;
       if (data.meta) {
         state.meta = data.meta;
       }
    } else {
      console.warn('Unexpected players response format:', data);
      state.items = [];
    }
  };

  const fetchPlayers = async (params = {}) => {
    state.loading = true;
    state.error = null;
    try {
      const response = await getPlayers({ ...state.filters, ...params });
      processResponse(response);
    } catch (error) {
      setError(error.response?.data?.message || 'Error al cargar jugadores');
      throw error;
    } finally {
      state.loading = false;
    }
  };

  const fetchPlayersByClub = async (clubId, params = {}) => {
    state.loading = true;
    state.error = null;
    try {
        const response = await listPlayersByClub(clubId, params);
        processResponse(response);
    } catch (error) {
        setError(error.response?.data?.message || 'Error al cargar jugadores del club');
        throw error;
    } finally {
        state.loading = false;
    }
  };

  const fetchPlayersByOrg = async (orgId, params = {}) => {
      state.loading = true;
      state.error = null;
      try {
          const response = await listPlayersByOrg(orgId, params);
          processResponse(response);
      } catch (error) {
          setError(error.response?.data?.message || 'Error al cargar jugadores de la organización');
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

  const createOrUpdatePlayer = async (payload, clubId = null) => {
    state.loading = true;
    state.error = null;
    try {
      if (payload.id) {
        const response = await updatePlayer(payload.id, payload);
        state.current = response.data;
        // Update in list if exists
        const index = state.items.findIndex((p) => p.id === payload.id);
        if (index !== -1) {
          state.items[index] = { ...state.items[index], ...response.data };
        }
        return response.data;
      }
      
      let response;
      if (clubId) {
          response = await createPlayerForClub(clubId, payload);
      } else {
          response = await createPlayer(payload);
      }
      
      // Add to list
      state.items.push(response.data);
      return response.data;
    } catch (error) {
      setError(error.response?.data?.message || 'Error al guardar jugador');
      throw error;
    } finally {
      state.loading = false;
    }
  };

  const updatePlayerStatus = async (clubId, playerId, statusPayload) => {
      state.loading = true;
      state.error = null;
      try {
          const response = await setPlayerStatus(clubId, playerId, statusPayload);
          // Update in list if exists
          const index = state.items.findIndex((p) => p.id === playerId);
          if (index !== -1) {
              state.items[index] = { ...state.items[index], ...response.data };
          }
           // Update current if matches
           if (state.current && state.current.id === playerId) {
               state.current = { ...state.current, ...response.data };
           }
          return response.data;
      } catch (error) {
          setError(error.response?.data?.message || 'Error al actualizar estado del jugador');
          throw error;
      } finally {
          state.loading = false;
      }
  };

  const changePlayerClub = async (playerId, payload) => {
      state.loading = true;
      state.error = null;
      try {
          const response = await changeClub(playerId, payload);
          return response.data;
      } catch (error) {
          setError(error.response?.data?.message || 'Error al cambiar de club');
          throw error;
      } finally {
          state.loading = false;
      }
  };

  const uploadPlayerPhoto = async (playerId, filePayload) => {
      state.loading = true;
      state.error = null;
      try {
          const response = await uploadPhoto(playerId, filePayload);
           // Update current if matches
           if (state.current && state.current.id === playerId) {
              // Assuming response contains the updated player or photo url
               // If response structure is different, adjust accordingly. 
               // Often upload returns the updated resource or just the url.
               // Let's assume it returns updated player object for now based on other endpoints.
              if (response.data && response.data.photo_url) {
                  state.current.photo_url = response.data.photo_url;
              }
           }
          return response.data;
      } catch (error) {
          setError(error.response?.data?.message || 'Error al subir foto');
          throw error;
      } finally {
          state.loading = false;
      }
  };

  const setFilters = (filters) => {
    state.filters = { ...state.filters, ...filters };
  };

  return {
    ...toRefs(state),
    fetchPlayers,
    fetchPlayersByClub,
    fetchPlayersByOrg,
    fetchPlayerById,
    createOrUpdatePlayer,
    updatePlayerStatus,
    changePlayerClub,
    uploadPlayerPhoto,
    setFilters
  };
};
