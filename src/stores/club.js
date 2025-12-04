import { reactive, computed } from 'vue';
import { clubsAPI } from '../api';
import { useAuthStore } from './auth';

const state = reactive({
    clubs: (() => {
        try {
            const stored = localStorage.getItem('userClubs');
            if (!stored || stored === 'undefined') return [];
            const clubs = JSON.parse(stored);
            console.log('🔍 Initial clubs from localStorage:', clubs);
            return clubs;
        } catch (e) {
            console.error('Error parsing stored clubs', e);
            return [];
        }
    })(),
    selectedClub: JSON.parse(localStorage.getItem('selectedClub')) || null,
    loading: false,
    error: null,
});

export const useClubStore = () => {
    const authStore = useAuthStore();


    const loadClubs = async () => {
        state.loading = true;
        state.error = null;

        try {
            const userId = authStore.user.value?.id;
            if (!userId) {
                state.loading = false;
                return;
            }

            const response = await clubsAPI.getAll({ owner_id: userId });
            const freshClubs = Array.isArray(response.data) ? response.data : [];

            console.log('🔍 Clubs loaded from API:', freshClubs);

            state.clubs = freshClubs;
            // Update localStorage
            localStorage.setItem('userClubs', JSON.stringify(freshClubs));

            // If selected club is not in the list (e.g. deleted), clear it
            if (state.selectedClub && !state.clubs.find(c => c.id === state.selectedClub.id)) {
                setSelectedClub(null);
            }
        } catch (error) {
            console.error('Error loading clubs:', error);
            // If we have stored clubs, don't show error, just log it
            if (state.clubs.length === 0) {
                state.error = 'Error al cargar los clubes';
            }
        } finally {
            state.loading = false;
        }
    };

    const setSelectedClub = (club) => {
        state.selectedClub = club;
        if (club) {
            localStorage.setItem('selectedClub', JSON.stringify(club));
        } else {
            localStorage.removeItem('selectedClub');
        }
    };

    const clearState = () => {
        state.clubs = [];
        state.selectedClub = null;
        state.loading = false;
        state.error = null;
        localStorage.removeItem('selectedClub');
    };

    return {
        state,
        clubs: computed(() => state.clubs),
        selectedClub: computed(() => state.selectedClub),
        loading: computed(() => state.loading),
        loadClubs,
        setSelectedClub,
        clearState,
    };
};
