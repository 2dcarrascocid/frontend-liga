<template>
  <nav class="navbar">
    <div class="container navbar-content">

      <!-- Logo -->
      <div class="navbar-brand">
        <router-link to="/home" class="logo">
          <span class="logo-icon">⚽</span>
          <span class="logo-text">Liga App</span>
        </router-link>
      </div>

      <!-- Menu principal -->
      <div class="navbar-menu" :class="{ 'is-active': mobileMenuOpen }">

        <!-- Home -->
        <router-link to="/home" class="nav-link" @click="closeMobileMenu">
          <span class="nav-icon">🏠</span>
          Home
        </router-link>

        <!-- Clubes (con dropdown) -->
        <div
          class="nav-item-dropdown"
          :class="{ 'is-open': clubesMenuOpen, 'is-active-section': isClubesSection }"
        >
          <button class="nav-link nav-dropdown-trigger" @click="toggleClubesMenu">
            <span class="nav-icon">🛡️</span>
            Clubes
            <span class="dropdown-chevron" :class="{ 'is-rotated': clubesMenuOpen }">▾</span>
          </button>

          <div class="nav-dropdown" v-show="clubesMenuOpen">
            <router-link
              to="/clubs"
              class="nav-dropdown-item"
              @click="closeAll"
            >
              <span class="dropdown-item-icon">📋</span>
              <span>
                <strong>Lista de Clubes</strong>
                <small>Ver y gestionar clubes</small>
              </span>
            </router-link>

            <div class="nav-dropdown-divider"></div>

            <router-link
              to="/players"
              class="nav-dropdown-item"
              @click="closeAll"
            >
              <span class="dropdown-item-icon">👥</span>
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
        <div class="user-menu" @click="toggleUserMenu">
          <div class="user-avatar">{{ userInitials }}</div>
          <span class="user-name">{{ userName }}</span>
          <span class="dropdown-arrow">▼</span>

          <div class="user-dropdown" v-if="userMenuOpen">
            <button @click="handleLogout" class="dropdown-item logout">
              <span>🚪</span> Cerrar Sesión
            </button>
          </div>
        </div>

        <button class="mobile-menu-toggle" @click="toggleMobileMenu">
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
  top: 0;
  left: 0;
  right: 0;
  height: 70px;
  background: rgba(30, 41, 59, 0.95);
  border-bottom: 1px solid var(--border-color);
  box-shadow: var(--shadow-md);
  z-index: 1000;
  backdrop-filter: blur(10px);
}

.navbar-content {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-xl);
}

/* ── Logo ────────────────────────────────────────────────────────────────── */
.navbar-brand { flex-shrink: 0; }

.logo {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  text-decoration: none;
  color: var(--text-primary);
  font-weight: 700;
  font-size: 1.25rem;
  transition: all var(--transition-base);
}
.logo:hover { color: var(--primary-light); transform: scale(1.05); }
.logo-icon { font-size: 1.75rem; filter: drop-shadow(0 0 10px rgba(102,126,234,0.5)); }
.logo-text {
  background: var(--primary-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* ── Nav menu container ──────────────────────────────────────────────────── */
.navbar-menu {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  flex: 1;
}

/* ── Nav link base ───────────────────────────────────────────────────────── */
.nav-link {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: 0.5rem 1rem;
  color: var(--text-secondary);
  text-decoration: none;
  border-radius: var(--radius-md);
  font-weight: 500;
  transition: all var(--transition-base);
  position: relative;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1rem;
}

.nav-link::before {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  width: 0;
  height: 2px;
  background: var(--primary-gradient);
  transform: translateX(-50%);
  transition: width var(--transition-base);
}

.nav-link:hover            { color: var(--text-primary); background: var(--bg-hover); }
.nav-link:hover::before    { width: 80%; }
.nav-link.router-link-active {
  color: var(--primary-light);
  background: rgba(102, 126, 234, 0.1);
}
.nav-link.router-link-active::before { width: 80%; }

.nav-icon { font-size: 1.25rem; }

/* ── Dropdown wrapper ────────────────────────────────────────────────────── */
.nav-item-dropdown {
  position: relative;
}

/* Cuando la sección está activa, el trigger muestra estado activo */
.nav-item-dropdown.is-active-section .nav-dropdown-trigger {
  color: var(--primary-light);
  background: rgba(102, 126, 234, 0.1);
}
.nav-item-dropdown.is-active-section .nav-dropdown-trigger::before {
  width: 80%;
}

.nav-dropdown-trigger {
  font-family: inherit;
}

.dropdown-chevron {
  font-size: 0.7rem;
  margin-left: 2px;
  color: var(--text-muted);
  display: inline-block;
  transition: transform var(--transition-base);
}
.dropdown-chevron.is-rotated { transform: rotate(180deg); }

/* ── Dropdown panel ──────────────────────────────────────────────────────── */
.nav-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  min-width: 220px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl);
  padding: var(--spacing-sm);
  animation: dropdownIn 0.15s ease-out;
  z-index: 10;
}

@keyframes dropdownIn {
  from { opacity: 0; transform: translateY(-6px); }
  to   { opacity: 1; transform: translateY(0); }
}

.nav-dropdown-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: 0.625rem 0.875rem;
  border-radius: var(--radius-md);
  text-decoration: none;
  color: var(--text-secondary);
  transition: all var(--transition-base);
}
.nav-dropdown-item:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}
.nav-dropdown-item.router-link-active {
  color: var(--primary-light);
  background: rgba(102, 126, 234, 0.1);
}

.dropdown-item-icon {
  font-size: 1.25rem;
  width: 28px;
  text-align: center;
  flex-shrink: 0;
}

.nav-dropdown-item span:not(.dropdown-item-icon) {
  display: flex;
  flex-direction: column;
  gap: 1px;
}
.nav-dropdown-item strong {
  font-size: 0.9rem;
  font-weight: 600;
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
  margin: var(--spacing-xs) 0;
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
  gap: var(--spacing-sm);
  padding: 0.5rem 1rem;
  background: var(--bg-tertiary);
  border-radius: var(--radius-full);
  cursor: pointer;
  transition: all var(--transition-base);
}
.user-menu:hover { background: var(--bg-hover); box-shadow: var(--shadow-md); }

.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--primary-gradient);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.875rem;
  color: white;
  box-shadow: var(--shadow-md);
}

.user-name   { font-weight: 600; color: var(--text-primary); }
.dropdown-arrow {
  font-size: 0.625rem;
  color: var(--text-muted);
  transition: transform var(--transition-base);
}
.user-menu:hover .dropdown-arrow { transform: translateY(2px); }

.user-dropdown {
  position: absolute;
  top: calc(100% + 0.5rem);
  right: 0;
  min-width: 200px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl);
  padding: var(--spacing-sm);
  animation: dropdownIn 0.15s ease-out;
  z-index: 10;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  width: 100%;
  padding: 0.75rem 1rem;
  background: none;
  border: none;
  color: var(--text-secondary);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-base);
  font-size: 0.875rem;
  font-weight: 500;
  text-align: left;
}
.dropdown-item:hover        { background: var(--bg-hover); color: var(--text-primary); }
.dropdown-item.logout       { color: var(--accent-red); }
.dropdown-item.logout:hover { background: rgba(239,68,68,0.1); }

/* ── Mobile hamburger ────────────────────────────────────────────────────── */
.mobile-menu-toggle {
  display: none;
  flex-direction: column;
  gap: 4px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
}
.mobile-menu-toggle span {
  width: 24px;
  height: 2px;
  background: var(--text-primary);
  border-radius: 2px;
  transition: all var(--transition-base);
}

/* ── Responsive ──────────────────────────────────────────────────────────── */
@media (max-width: 768px) {
  .navbar-menu {
    position: fixed;
    top: 70px;
    left: 0;
    right: 0;
    flex-direction: column;
    align-items: stretch;
    background: var(--bg-secondary);
    border-bottom: 1px solid var(--border-color);
    padding: var(--spacing-lg);
    gap: var(--spacing-sm);
    transform: translateY(-110%);
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

  /* En mobile el dropdown de Clubes se muestra como lista expandida */
  .nav-item-dropdown { width: 100%; }
  .nav-dropdown {
    position: static;
    box-shadow: none;
    border: none;
    background: var(--bg-tertiary);
    margin-top: var(--spacing-xs);
    animation: none;
    border-radius: var(--radius-md);
  }

  .mobile-menu-toggle { display: flex; }
  .user-name { display: none; }
}
</style>
