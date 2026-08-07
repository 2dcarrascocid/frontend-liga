<template>
  <nav class="navbar" role="navigation" aria-label="Navegación principal">
    <div class="container navbar-content">

      <!-- Logo -->
      <div class="navbar-brand">
        <router-link to="/home" class="logo" aria-label="Liga App inicio">
          <svg class="logo-icon" width="30" height="30" viewBox="0 0 30 30" fill="none" aria-hidden="true">
            <circle cx="15" cy="15" r="14" fill="url(#nav-grad)"/>
            <path d="M9 15c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="white" stroke-width="2.2" stroke-linecap="round"/>
            <circle cx="15" cy="18.5" r="3" fill="white"/>
            <defs>
              <linearGradient id="nav-grad" x1="0" y1="0" x2="30" y2="30">
                <stop offset="0%" stop-color="#00c853"/>
                <stop offset="100%" stop-color="#00e676"/>
              </linearGradient>
            </defs>
          </svg>
          <span class="logo-text">Liga App</span>
        </router-link>
      </div>

      <!-- Menu principal -->
      <div class="navbar-menu" :class="{ 'is-active': mobileMenuOpen }">

        <!-- Home -->
        <router-link to="/home" class="nav-link" @click="closeMobileMenu" aria-label="Ir a inicio">
          <svg class="nav-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          Home
        </router-link>

        <!-- Clubes -->
        <router-link to="/clubs" class="nav-link" @click="closeMobileMenu" aria-label="Ir a clubes">
          <svg class="nav-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
          Clubes
        </router-link>

        <!-- Jugadores -->
        <router-link to="/players" class="nav-link" @click="closeMobileMenu" aria-label="Ir a jugadores">
          <svg class="nav-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          Jugadores
        </router-link>

      </div>

      <!-- Acciones de usuario -->
      <div class="navbar-actions">
        <div class="user-menu" @click="toggleUserMenu" role="button" tabindex="0" :aria-expanded="userMenuOpen" aria-haspopup="true" :aria-label="`Menú de ${userName}`">
          <div class="user-avatar" aria-hidden="true">{{ userInitials }}</div>
          <span class="user-name">{{ userName }}</span>
          <svg class="dropdown-arrow" :class="{ 'is-rotated': userMenuOpen }" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>

          <div class="user-dropdown" v-if="userMenuOpen" role="menu">
            <button @click="handleLogout" class="dropdown-item logout" role="menuitem">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              Cerrar Sesión
            </button>
          </div>
        </div>

        <button class="mobile-menu-toggle" @click="toggleMobileMenu" :aria-expanded="mobileMenuOpen" aria-label="Abrir menú" aria-controls="navbar-menu">
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>

    </div>
  </nav>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const authStore = useAuthStore();

const mobileMenuOpen = ref(false);
const userMenuOpen   = ref(false);

const userName = computed(() =>
  authStore.user?.value?.nombre || authStore.state?.user?.email || 'Usuario'
);

const userInitials = computed(() => {
  const name = authStore.user?.value?.nombre || authStore.state?.user?.email || 'U';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
});

const toggleMobileMenu = () => { mobileMenuOpen.value = !mobileMenuOpen.value; };
const closeMobileMenu  = () => { mobileMenuOpen.value = false; };
const toggleUserMenu   = () => { userMenuOpen.value = !userMenuOpen.value; };

// Cierra el menú de usuario al hacer click fuera del navbar
function onClickOutside(e) {
  if (!e.target.closest('.navbar')) {
    userMenuOpen.value = false;
  }
}
onMounted(()  => document.addEventListener('click', onClickOutside));
onUnmounted(() => document.removeEventListener('click', onClickOutside));

const handleLogout = async () => {
  authStore.logout();
  router.push('/login');
  userMenuOpen.value = false;
};
</script>

<style scoped>
/* ── Base navbar ─────────────────────────────────────────────────────────── */
.navbar {
  position: fixed;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  width: calc(100% - 32px);
  max-width: 1200px;
  height: 62px;
  background: rgba(13, 14, 20, 0.78);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border-radius: 60px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  box-shadow: 0 10px 32px rgba(0, 0, 0, 0.5);
  z-index: 1000;
}

.navbar-content {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  gap: var(--spacing-xl);
}

/* ── Logo ────────────────────────────────────────────────────────────────── */
.navbar-brand { flex-shrink: 0; }

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  color: var(--text-primary);
  font-family: 'Lora', serif;
  font-weight: 700;
  font-size: 1.2rem;
  transition: opacity var(--transition-fast);
}
.logo:hover { opacity: 0.8; }
.logo-icon { flex-shrink: 0; }
.logo-text {
  background: linear-gradient(135deg, #00e676, #4fc3f7);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* ── Nav menu container ──────────────────────────────────────────────────── */
.navbar-menu {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  flex: 1;
}

/* ── Nav link base ───────────────────────────────────────────────────────── */
.nav-link {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0.45rem 0.9rem;
  color: var(--text-muted);
  text-decoration: none;
  border-radius: var(--radius-full);
  font-family: 'Raleway', sans-serif;
  font-weight: 600;
  font-size: 0.9rem;
  transition: all var(--transition-base);
  background: none;
  border: none;
  cursor: pointer;
}

.nav-link:hover {
  color: var(--primary-solid);
  background: rgba(0, 230, 118, 0.1);
}
.nav-link.router-link-active {
  color: var(--primary-solid);
  background: rgba(0, 230, 118, 0.14);
  box-shadow: inset 0 0 0 1px rgba(0, 230, 118, 0.25);
}

.nav-icon { flex-shrink: 0; }

@keyframes dropdownIn {
  from { opacity: 0; transform: translateY(-8px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ── User menu ───────────────────────────────────────────────────────────── */
.navbar-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.user-menu {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px 6px 6px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: var(--radius-full);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.4);
  cursor: pointer;
  transition: all var(--transition-base);
}
.user-menu:hover {
  background: rgba(255, 255, 255, 0.1);
}

.user-avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: linear-gradient(135deg, #00c853, #4fc3f7);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.8125rem;
  color: #04120a;
  flex-shrink: 0;
}

.user-name {
  font-family: 'Raleway', sans-serif;
  font-weight: 600;
  font-size: 0.875rem;
  color: var(--text-primary);
}
.dropdown-arrow {
  color: var(--text-muted);
  transition: transform var(--transition-base);
  flex-shrink: 0;
}
.dropdown-arrow.is-rotated { transform: rotate(180deg); }

.user-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 200px;
  background: rgba(16, 17, 24, 0.97);
  backdrop-filter: blur(12px);
  border-radius: 18px;
  border: 1px solid var(--border-color);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.55);
  padding: var(--spacing-sm);
  animation: dropdownIn 0.18s ease-out;
  z-index: 20;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 0.7rem 1rem;
  background: none;
  border: none;
  color: var(--text-muted);
  border-radius: 12px;
  cursor: pointer;
  transition: all var(--transition-base);
  font-family: 'Raleway', sans-serif;
  font-size: 0.875rem;
  font-weight: 600;
  text-align: left;
}
.dropdown-item:hover        { background: rgba(0, 230, 118, 0.1); color: var(--primary-solid); }
.dropdown-item.logout       { color: var(--accent-red); }
.dropdown-item.logout:hover { background: rgba(248, 113, 113, 0.1); color: var(--accent-red); }

/* ── Mobile hamburger ────────────────────────────────────────────────────── */
.mobile-menu-toggle {
  display: none;
  flex-direction: column;
  gap: 5px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  border-radius: var(--radius-md);
  transition: box-shadow var(--transition-base);
}
.mobile-menu-toggle:hover {
  background: rgba(255, 255, 255, 0.07);
}
.mobile-menu-toggle span {
  width: 22px;
  height: 2px;
  background: var(--text-primary);
  border-radius: 2px;
  display: block;
  transition: all var(--transition-base);
}

/* ── Responsive ──────────────────────────────────────────────────────────── */
@media (max-width: 768px) {
  .navbar {
    top: 0;
    width: 100%;
    border-radius: 0 0 24px 24px;
  }

  .navbar-menu {
    position: fixed;
    top: 72px;
    left: 12px;
    right: 12px;
    flex-direction: column;
    align-items: stretch;
    background: rgba(16, 17, 24, 0.97);
    backdrop-filter: blur(14px);
    border-radius: 20px;
    border: 1px solid var(--border-color);
    box-shadow: 0 16px 40px rgba(0, 0, 0, 0.55);
    padding: var(--spacing-md);
    gap: 4px;
    transform: translateY(-10px);
    opacity: 0;
    transition: all var(--transition-base);
    pointer-events: none;
  }
  .navbar-menu.is-active {
    transform: translateY(0);
    opacity: 1;
    pointer-events: all;
  }

  .nav-link { width: 100%; justify-content: flex-start; }

  .mobile-menu-toggle { display: flex; }
  .user-name { display: none; }
}
</style>
