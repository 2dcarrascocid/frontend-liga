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
    isAuthenticated: !!localStorage.getItem('accessToken'),
    loading: false,
    error: null,
});

export const useAuthStore = () => {
    
    const setSession = (data) => {
        const { access_token, refresh_token, user, orgs } = data;
        
        state.accessToken = access_token;
        state.refreshToken = refresh_token;
        state.user = user;
        state.orgs = orgs || [];
        state.isAuthenticated = true;
        
        localStorage.setItem('accessToken', access_token);
        localStorage.setItem('refreshToken', refresh_token);
        localStorage.setItem('user', JSON.stringify(user));
        
        if (orgs && orgs.length > 0) {
            localStorage.setItem('orgs', JSON.stringify(orgs));
            // Default to first org if not set
            if (!state.org) {
                state.org = orgs[0];
                localStorage.setItem('org', JSON.stringify(state.org));
            }
        } else {
            localStorage.removeItem('orgs');
            localStorage.removeItem('org');
            state.orgs = [];
            state.org = null;
        }
    };

    const loginLocal = async (credentials) => {
        state.loading = true;
        state.error = null;
        try {
            const response = await authAPI.loginLocal(credentials);
            setSession(response.data);
            return response.data;
        } catch (error) {
            state.error = error.response?.data?.message || 'Error al iniciar sesión';
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
            setSession(response.data);
            return response.data;
        } catch (error) {
            state.error = error.response?.data?.message || 'Error al iniciar sesión con Google';
            throw error;
        } finally {
            state.loading = false;
        }
    };

    const loginFacebook = async (accessToken) => {
        state.loading = true;
        state.error = null;
        try {
            // Adapt payload based on backend requirement, user said "{ access_token } o { id_token }"
            const response = await authAPI.loginFacebook({ access_token: accessToken });
            setSession(response.data);
            return response.data;
        } catch (error) {
            state.error = error.response?.data?.message || 'Error al iniciar sesión con Facebook';
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
        state.isAuthenticated = false;
        
        localStorage.removeItem('user');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('org');
        localStorage.removeItem('orgs');
        
        // Redirect is handled by router or caller
    };

    return {
        ...toRefs(state),
        state,
        loginLocal,
        loginGoogle,
        loginFacebook,
        bootstrap,
        logout
    };
};
