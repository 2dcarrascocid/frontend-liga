import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const Login = () => import('../views/Login.vue');
const Bootstrap = () => import('../views/Bootstrap.vue');
const Home = () => import('../views/Home.vue');
const ClubsList = () => import('../views/ClubsList.vue');
const ClubDetail = () => import('../views/ClubDetail.vue');
const RosterView = () => import('../views/RosterView.vue');
const PlayersList = () => import('../views/PlayersList.vue');
const PlayerDetail = () => import('../views/PlayerDetail.vue');

const routes = [
    {
        path: '/',
        redirect: '/home',
    },
    {
        path: '/login',
        name: 'Login',
        component: Login,
        meta: { requiresAuth: false, guestOnly: true },
    },
    {
        path: '/bootstrap',
        name: 'Bootstrap',
        component: Bootstrap,
        meta: { requiresAuth: true, requiresNoOrg: true },
    },
    {
        path: '/home',
        name: 'Home',
        component: Home,
        meta: { requiresAuth: true, requiresOrg: true },
    },
    {
        path: '/clubs',
        name: 'ClubsList',
        component: ClubsList,
        meta: { requiresAuth: true, requiresOrg: true },
    },
    {
        path: '/clubs/:clubId',
        name: 'ClubDetail',
        component: ClubDetail,
        meta: { requiresAuth: true, requiresOrg: true },
    },
    {
        path: '/clubs/:clubId/roster',
        name: 'ClubRoster',
        component: RosterView,
        meta: { requiresAuth: true, requiresOrg: true },
    },
    {
        path: '/players',
        name: 'PlayersList',
        component: PlayersList,
        meta: { requiresAuth: true, requiresOrg: true },
    },
    {
        path: '/players/:playerId',
        name: 'PlayerDetail',
        component: PlayerDetail,
        meta: { requiresAuth: true, requiresOrg: true },
    },
    // Catch-all
    {
        path: '/:pathMatch(.*)*',
        redirect: '/home'
    }
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

// Navigation guards
router.beforeEach((to, from, next) => {
    const authStore = useAuthStore();
    const isAuthenticated = authStore.state.isAuthenticated;
    const hasOrg = !!authStore.state.org;

    // 1. If route requires auth and user is not authenticated -> Login
    if (to.meta.requiresAuth && !isAuthenticated) {
        return next('/login');
    }

    // 2. If route is for guests only (Login) and user is authenticated
    if (to.meta.guestOnly && isAuthenticated) {
        // If they have an org, go home. If not, go bootstrap.
        return next(hasOrg ? '/home' : '/bootstrap');
    }

    // 3. If route requires an Org (Home) but user doesn't have one -> Bootstrap
    if (to.meta.requiresOrg && !hasOrg) {
        return next('/bootstrap');
    }

    // 4. If route requires NO Org (Bootstrap) but user has one -> Home
    // (Prevent going back to bootstrap if already set up)
    if (to.meta.requiresNoOrg && hasOrg) {
        return next('/home');
    }

    next();
});

export default router;
