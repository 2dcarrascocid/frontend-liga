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
                <stop offset="0%" stop-color="#0891B2"/>
                <stop offset="100%" stop-color="#22D3EE"/>
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

        <!-- Clubes (con dropdown) -->
        <div
          class="nav-item-dropdown"
          :class="{ 'is-open': clubesMenuOpen, 'is-active-section': isClubesSection }"
        >
          <button class="nav-link nav-dropdown-trigger" @click="toggleClubesMenu" :aria-expanded="clubesMenuOpen" aria-haspopup="true">
            <svg class="nav-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
            Clubes
            <svg class="dropdown-chevron" :class="{ 'is-rotated': clubesMenuOpen }" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>
          </button>

          <div class="nav-dropdown" v-show="clubesMenuOpen" role="menu">
            <router-link
              to="/clubs"
              class="nav-dropdown-item"
              @click="closeAll"
              role="menuitem"
            >
              <span class="dropdown-item-icon" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
              </span>
              <span>
                <strong>Lista de Clubes</strong>
                <small>Ver y gestionar clubes</small>
              </span>
            </router-link>

            <div class="nav-dropdown-divider" role="separator"></div>

            <router-link
              to="/players"
              class="nav-dropdown-item"
              @click="closeAll"
              role="menuitem"
            >
              <span class="dropdown-item-icon" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              </span>
              <span>
                <strong>Jugadores</strong>
                <small>Todos los jugadores de la org</small>
              </span>
            </router-link>
          </div>
        </div>

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
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const route  = useRoute();
const authStore = useAuthStore();

const mobileMenuOpen = ref(false);
const userMenuOpen   = ref(false);
const clubesMenuOpen = ref(false);

const isClubesSection = computed(() =>
  route.path.startsWith('/clubs') || route.path.startsWith('/players')
);

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
const toggleClubesMenu = () => { clubesMenuOpen.value = !clubesMenuOpen.value; };
const closeAll         = () => { clubesMenuOpen.value = false; mobileMenuOpen.value = false; };

// Cierra todos los dropdowns al hacer click fuera del navbar
function onClickOutside(e) {
  if (!e.target.closest('.navbar')) {
    clubesMenuOpen.value = false;
    userMenuOpen.value   = false;
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
  background: rgba(232, 240, 245, 0.88);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border-radius: 60px;
  box-shadow: -5px -5px 12px rgba(255,255,255,0.9), 5px 5px 12px rgba(184,197,208,0.7);
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
  background: linear-gradient(135deg, #0891B2, #0369A1);
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
  background: rgba(8, 145, 178, 0.08);
}
.nav-link.router-link-active {
  color: var(--primary-solid);
  background: rgba(8, 145, 178, 0.1);
  box-shadow: inset -2px -2px 5px rgba(255,255,255,0.7), inset 2px 2px 5px rgba(184,197,208,0.5);
}

.nav-icon { flex-shrink: 0; }

/* ── Dropdown wrapper ────────────────────────────────────────────────────── */
.nav-item-dropdown { position: relative; }

.nav-item-dropdown.is-active-section .nav-dropdown-trigger {
  color: var(--primary-solid);
  background: rgba(8, 145, 178, 0.1);
  box-shadow: inset -2px -2px 5px rgba(255,255,255,0.7), inset 2px 2px 5px rgba(184,197,208,0.5);
}

.nav-dropdown-trigger { font-family: 'Raleway', sans-serif; }

.dropdown-chevron {
  flex-shrink: 0;
  color: var(--text-muted);
  transition: transform var(--transition-base);
}
.dropdown-chevron.is-rotated { transform: rotate(180deg); }

/* ── Dropdown panel ──────────────────────────────────────────────────────── */
.nav-dropdown {
  position: absolute;
  top: calc(100% + 10px);
  left: 0;
  min-width: 230px;
  background: rgba(232, 240, 245, 0.96);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: 20px;
  box-shadow: -6px -6px 14px rgba(255,255,255,0.85), 6px 6px 14px rgba(184,197,208,0.7);
  padding: var(--spacing-sm);
  animation: dropdownIn 0.18s ease-out;
  z-index: 20;
}

@keyframes dropdownIn {
  from { opacity: 0; transform: translateY(-8px); }
  to   { opacity: 1; transform: translateY(0); }
}

.nav-dropdown-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0.625rem 0.875rem;
  border-radius: 12px;
  text-decoration: none;
  color: var(--text-muted);
  transition: all var(--transition-base);
  cursor: pointer;
}
.nav-dropdown-item:hover {
  background: rgba(8, 145, 178, 0.08);
  color: var(--primary-solid);
}
.nav-dropdown-item.router-link-active {
  color: var(--primary-solid);
  background: rgba(8, 145, 178, 0.1);
}

.dropdown-item-icon {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  background: rgba(8, 145, 178, 0.1);
  color: var(--primary-solid);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.nav-dropdown-item span:not(.dropdown-item-icon) {
  display: flex;
  flex-direction: column;
  gap: 1px;
}
.nav-dropdown-item strong {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
  line-height: 1.2;
}
.nav-dropdown-item small {
  font-size: 0.72rem;
  color: var(--text-muted);
  font-weight: 400;
}

.nav-dropdown-divider {
  height: 1px;
  background: var(--border-color);
  margin: 6px 8px;
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
  background: rgba(232, 240, 245, 1);
  border-radius: var(--radius-full);
  box-shadow: -3px -3px 7px rgba(255,255,255,0.9), 3px 3px 7px rgba(184,197,208,0.65);
  cursor: pointer;
  transition: all var(--transition-base);
}
.user-menu:hover {
  box-shadow: inset -3px -3px 6px rgba(255,255,255,0.8), inset 3px 3px 6px rgba(184,197,208,0.55);
}

.user-avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: linear-gradient(135deg, #0891B2, #22D3EE);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.8125rem;
  color: white;
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
  background: rgba(232, 240, 245, 0.97);
  backdrop-filter: blur(12px);
  border-radius: 18px;
  box-shadow: -6px -6px 14px rgba(255,255,255,0.85), 6px 6px 14px rgba(184,197,208,0.7);
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
.dropdown-item:hover        { background: rgba(8, 145, 178, 0.07); color: var(--primary-solid); }
.dropdown-item.logout       { color: var(--accent-red); }
.dropdown-item.logout:hover { background: rgba(220, 38, 38, 0.07); color: var(--accent-red); }

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
  box-shadow: inset -2px -2px 5px rgba(255,255,255,0.8), inset 2px 2px 5px rgba(184,197,208,0.55);
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
    background: rgba(232, 240, 245, 0.97);
    backdrop-filter: blur(14px);
    border-radius: 20px;
    box-shadow: -6px -6px 14px rgba(255,255,255,0.85), 6px 6px 14px rgba(184,197,208,0.7);
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

  .nav-link,
  .nav-dropdown-trigger { width: 100%; justify-content: flex-start; }

  .nav-item-dropdown { width: 100%; }
  .nav-dropdown {
    position: static;
    box-shadow: inset -3px -3px 6px rgba(255,255,255,0.7), inset 3px 3px 6px rgba(184,197,208,0.5);
    backdrop-filter: none;
    margin-top: 4px;
    animation: none;
    border-radius: var(--radius-md);
  }

  .mobile-menu-toggle { display: flex; }
  .user-name { display: none; }
}
</style>
