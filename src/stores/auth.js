import { reactive, toRefs } from 'vue';
import { authAPI } from '../api';

const state = reactive({
    user: (() => {
        try {
            const stored = localStorage.getItem('user');
            if (!stored || stored === 'undefined') return null;
            return JSON.parse(stored);
        } catch (e) {
            return null;
        }
    })(),
    accessToken: localStorage.getItem('accessToken') || null,
    refreshToken: localStorage.getItem('refreshToken') || null,
    org: (() => {
        try {
            const stored = localStorage.getItem('org');
            if (!stored || stored === 'undefined') return null;
            return JSON.parse(stored);
        } catch (e) {
            return null;
        }
    })(),
    orgs: (() => {
        try {
            const stored = localStorage.getItem('orgs');
            if (!stored || stored === 'undefined') return [];
            return JSON.parse(stored);
        } catch (e) {
            return [];
        }
    })(),
    clubs: (() => {
        try {
            const stored = localStorage.getItem('clubs');
            if (!stored || stored === 'undefined') return [];
            return JSON.parse(stored);
        } catch (e) {
            return [];
        }
    })(),
    isAuthenticated: !!localStorage.getItem('accessToken'),
    loading: false,
    error: null,
});

export const useAuthStore = () => {
    
    const setSession = (data) => {
        // El backend retorna { session: { access_token, refresh_token }, user, orgs, clubs }
        const { session, user, orgs, clubs } = data;
        const access_token = session?.access_token;
        const refresh_token = session?.refresh_token;

        // orgs viene como [{ role, org: { id, name, slug, ... } }] → normalizar
        const normalizedOrgs = (orgs || []).map(m => ({ ...m.org, role: m.role }));
        // clubs viene como [{ role, club_id, club: { id, name, org_id } }] — hoy como mucho 1
        // (un usuario solo puede ser ADMIN_CLUB de un club a la vez)
        const normalizedClubs = clubs || [];

        state.accessToken = access_token;
        state.refreshToken = refresh_token;
        state.user = user;
        state.orgs = normalizedOrgs;
        state.clubs = normalizedClubs;
        state.isAuthenticated = true;

        localStorage.setItem('accessToken', access_token);
        localStorage.setItem('refreshToken', refresh_token);
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('clubs', JSON.stringify(normalizedClubs));

        if (normalizedOrgs.length > 0) {
            localStorage.setItem('orgs', JSON.stringify(normalizedOrgs));
            if (!state.org) {
                state.org = normalizedOrgs[0];
                localStorage.setItem('org', JSON.stringify(state.org));
            }
        } else {
            localStorage.removeItem('orgs');
            localStorage.removeItem('org');
            state.orgs = [];
            state.org = null;
        }
    };

    // Estricto: solo true si el rol en la organización activa es ADMIN.
    // Un usuario sin org (o con org pero rol distinto de ADMIN, ej. ADMIN_CLUB
    // puro) NO debe verse tratado como administrador de organización.
    const isOrgAdmin = () => state.org?.role === 'ADMIN';

    // El único club del que el usuario es ADMIN_CLUB (o null si no tiene ninguno).
    const myClub = () => state.clubs?.[0]?.club || null;

    const isClubAdminOnly = () => !isOrgAdmin() && !!myClub();

    const loginLocal = async (credentials) => {
        state.loading = true;
        state.error = null;
        try {
            const response = await authAPI.loginLocal(credentials);
            setSession(response.data.data);
            return response.data;
        } catch (error) {
            state.error = error.response?.data?.error?.message || 'Error al iniciar sesión';
            throw error;
        } finally {
            state.loading = false;
        }
    };

    const loginGoogle = async (idToken) => {
        state.loading = true;
        state.error = null;
        try {
            const response = await authAPI.loginGoogle({ id_token: idToken });
            setSession(response.data.data);
            return response.data;
        } catch (error) {
            state.error = error.response?.data?.error?.message || 'Error al iniciar sesión con Google';
            throw error;
        } finally {
            state.loading = false;
        }
    };

    const loginFacebook = async (accessToken) => {
        state.loading = true;
        state.error = null;
        try {
            const response = await authAPI.loginFacebook({ access_token: accessToken });
            setSession(response.data.data);
            return response.data;
        } catch (error) {
            state.error = error.response?.data?.error?.message || 'Error al iniciar sesión con Facebook';
            throw error;
        } finally {
            state.loading = false;
        }
    };

    const bootstrap = async (data) => {
        state.loading = true;
        state.error = null;
        try {
            const response = await authAPI.bootstrap(data);
            const { org } = response.data;
            
            state.org = org;
            state.orgs = [org]; // Assuming bootstrap creates the first org
            
            localStorage.setItem('org', JSON.stringify(org));
            localStorage.setItem('orgs', JSON.stringify(state.orgs));
            
            return response.data;
        } catch (error) {
            state.error = error.response?.data?.message || 'Error al crear organismo';
            throw error;
        } finally {
            state.loading = false;
        }
    };

    const logout = () => {
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.org = null;
        state.orgs = [];
        state.clubs = [];
        state.isAuthenticated = false;

        localStorage.removeItem('user');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('org');
        localStorage.removeItem('orgs');
        localStorage.removeItem('clubs');
        
        // Redirect is handled by router or caller
    };

    const forgotPassword = async (email) => {
        state.loading = true
        state.error = null
        try {
            const response = await authAPI.forgotPassword({ email })
            return response.data
        } catch (error) {
            state.error = error.response?.data?.error?.message || 'Error al solicitar recuperación de contraseña'
            throw error
        } finally {
            state.loading = false
        }
    }

    const resetPassword = async (token, newPassword) => {
        state.loading = true
        state.error = null
        try {
            const response = await authAPI.resetPassword({
                token,
                new_password: newPassword,
            })
            return response.data
        } catch (error) {
            state.error = error.response?.data?.error?.message || 'Error al restablecer la contraseña'
            throw error
        } finally {
            state.loading = false
        }
    }

    return {
        ...toRefs(state),
        state,
        loginLocal,
        loginGoogle,
        loginFacebook,
        bootstrap,
        logout,
        forgotPassword,
        resetPassword,
        isOrgAdmin,
        myClub,
        isClubAdminOnly,
    };
};
