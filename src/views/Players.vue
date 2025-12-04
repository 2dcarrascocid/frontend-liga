<template>
  <div class="players-page">
    <div class="container">
      <div class="page-header">
        <div>
          <h1>👥 Jugadores</h1>
          <p>Gestiona tu equipo de jugadores</p>
        </div>
        <div class="header-actions">
          <select v-model="selectedClubId" class="club-select" @change="loadPlayers">
            <option value="" disabled>Selecciona un club</option>
            <option v-for="club in clubs" :key="club.id" :value="club.id">
              {{ club.nombre }}
            </option>
          </select>
          <button class="btn btn-primary" @click="showCreateModal = true" :disabled="!selectedClubId">
            ➕ Nuevo Jugador
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Cargando jugadores...</p>
      </div>

      <!-- No Club Selected -->
      <div v-else-if="!selectedClubId" class="empty-state">
        <span class="empty-icon">👆</span>
        <h3>Selecciona un club</h3>
        <p>Elige un club para ver sus jugadores</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="players.length === 0" class="empty-state">
        <span class="empty-icon">👥</span>
        <h3>No hay jugadores</h3>
        <p>Agrega jugadores a tu club para comenzar</p>
        <button class="btn btn-primary" @click="showCreateModal = true">
          Agregar Primer Jugador
        </button>
      </div>

      <!-- Players Grid -->
      <div v-else class="players-grid">
        <div v-for="player in players" :key="player.id" class="player-card">
          <div class="player-avatar">
            {{ getInitials(player.nombre_completo) }}
          </div>
          <div class="player-info">
            <h3>{{ player.nombre_completo }}</h3>
            <p class="player-role">{{ player.email || 'Sin email' }}</p>
            <div class="player-stats">
              <span v-if="player.rut">🆔 {{ player.rut }}</span>
              <span v-if="player.es_socio">⭐ Socio</span>
            </div>
          </div>
          <div class="player-actions">
            <button class="btn-icon" @click="editPlayer(player)">✏️</button>
            <button class="btn-icon delete" @click="deletePlayer(player.id)">🗑️</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <div v-if="showCreateModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>{{ isEditing ? 'Editar Jugador' : 'Nuevo Jugador' }}</h2>
          <button class="close-btn" @click="closeModal">×</button>
        </div>
        
        <form @submit.prevent="handleSubmit">
          <div class="form-group">
            <label>Nombre Completo *</label>
            <input 
              type="text" 
              v-model="form.nombre_completo" 
              placeholder="Ej: Alexis Sánchez"
              required
              class="form-input"
            >
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>RUT</label>
              <input 
                type="text" 
                v-model="form.rut" 
                placeholder="12.345.678-9"
                class="form-input"
              >
            </div>
            <div class="form-group">
              <label>Fecha de Nacimiento</label>
              <input 
                type="date" 
                v-model="form.fecha_nacimiento" 
                class="form-input"
              >
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Email</label>
              <input 
                type="email" 
                v-model="form.email" 
                placeholder="jugador@email.com"
                class="form-input"
              >
            </div>
            <div class="form-group">
              <label>Teléfono</label>
              <input 
                type="tel" 
                v-model="form.telefono" 
                placeholder="+56 9 1234 5678"
                class="form-input"
              >
            </div>
          </div>

          <div class="form-group">
            <label class="checkbox-label">
              <input 
                type="checkbox" 
                v-model="form.es_socio"
              >
              <span>Es socio del club</span>
            </label>
          </div>

          <div class="form-actions">
            <button type="button" class="btn btn-outline" @click="closeModal">Cancelar</button>
            <button type="submit" class="btn btn-primary" :disabled="submitting">
              {{ submitting ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Guardar') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { useClubStore } from '../stores/club';
import { clubsAPI, playersAPI } from '../api';

const route = useRoute();
const authStore = useAuthStore();
const clubStore = useClubStore();

const clubs = ref([]);
const players = ref([]);
const selectedClubId = ref('');
const loading = ref(false);
const showCreateModal = ref(false);
const submitting = ref(false);
const isEditing = ref(false);
const editingId = ref(null);

const form = reactive({
  nombre_completo: '',
  rut: '',
  email: '',
  telefono: '',
  fecha_nacimiento: '',
  es_socio: false,
  usuario_id: null
});

onMounted(async () => {
  await loadClubs();
  
  // Priority: URL param > Store selected club > First club
  if (route.query.club) {
    selectedClubId.value = route.query.club;
  } else if (clubStore.selectedClub.value) {
    selectedClubId.value = clubStore.selectedClub.value.id;
  } else if (clubs.value.length > 0) {
    selectedClubId.value = clubs.value[0].id;
  }
  
  await loadPlayers();
});

const loadClubs = async () => {
  try {
    const userId = authStore.user.value?.id;
    const response = await clubsAPI.getAll({ owner_id: userId });
    clubs.value = Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error('Error loading clubs:', error);
  }
};

const loadPlayers = async () => {
  if (!selectedClubId.value) return;
  
  loading.value = true;
  try {
    const response = await playersAPI.getAll(selectedClubId.value);
    players.value = Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error('Error loading players:', error);
  } finally {
    loading.value = false;
  }
};

const handleSubmit = async () => {
  submitting.value = true;
  try {
    const playerData = { ...form };

    if (isEditing.value) {
      await playersAPI.update({ ...playerData, id: editingId.value });
    } else {
      await playersAPI.create(selectedClubId.value, playerData);
    }

    await loadPlayers();
    closeModal();
  } catch (error) {
    console.error('Error saving player:', error);
    alert('Error al guardar el jugador');
  } finally {
    submitting.value = false;
  }
};

const editPlayer = (player) => {
  isEditing.value = true;
  editingId.value = player.id;
  form.nombre_completo = player.nombre_completo;
  form.rut = player.rut;
  form.email = player.email;
  form.telefono = player.telefono;
  form.fecha_nacimiento = player.fecha_nacimiento;
  form.es_socio = player.es_socio;
  form.usuario_id = player.usuario_id;
  showCreateModal.value = true;
};

const deletePlayer = async (id) => {
  if (!confirm('¿Estás seguro de eliminar este jugador?')) return;
  
  try {
    await playersAPI.delete(id);
    await loadPlayers();
  } catch (error) {
    console.error('Error deleting player:', error);
    alert('Error al eliminar el jugador');
  }
};

const closeModal = () => {
  showCreateModal = false;
  isEditing.value = false;
  editingId.value = null;
  form.nombre = '';
  form.posicion = 'Mediocampista';
  form.dorsal = '';
  form.email = '';
};

const getInitials = (name) => {
  if (!name) return '??';
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
};
</script>

<style scoped>
.players-page {
  min-height: 100vh;
  padding: var(--spacing-2xl) 0;
  background: var(--bg-primary);
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-2xl);
  flex-wrap: wrap;
  gap: var(--spacing-lg);
}

.page-header h1 {
  font-size: 2.5rem;
  margin-bottom: var(--spacing-xs);
  background: var(--primary-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.page-header p {
  color: var(--text-muted);
  margin: 0;
}

.header-actions {
  display: flex;
  gap: var(--spacing-md);
  align-items: center;
}

.club-select {
  padding: 0.75rem;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  min-width: 200px;
}

.players-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: var(--spacing-lg);
}

.player-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-xl);
  padding: var(--spacing-lg);
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  transition: all var(--transition-base);
}

.player-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-md);
  border-color: var(--primary-light);
}

.player-avatar {
  width: 50px;
  height: 50px;
  background: var(--primary-gradient);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 700;
  font-size: 1.2rem;
  flex-shrink: 0;
}

.player-info {
  flex: 1;
}

.player-info h3 {
  margin: 0;
  font-size: 1.1rem;
  color: var(--text-primary);
}

.player-role {
  font-size: 0.875rem;
  color: var(--text-muted);
  margin: 2px 0;
}

.player-stats {
  font-size: 0.8rem;
  color: var(--text-secondary);
  display: flex;
  gap: var(--spacing-sm);
}

.player-actions {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.btn-icon {
  background: none;
  border: none;
  cursor: pointer;
  opacity: 0.7;
  transition: opacity 0.2s;
}

.btn-icon:hover {
  opacity: 1;
}

/* Modal and Form Styles (Reused) */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal-content {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-xl);
  padding: var(--spacing-xl);
  width: 100%;
  max-width: 500px;
  animation: slideUp 0.3s ease-out;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-xl);
}

.close-btn {
  background: none;
  border: none;
  font-size: 2rem;
  color: var(--text-muted);
  cursor: pointer;
}

.form-group {
  margin-bottom: var(--spacing-lg);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-lg);
}

.form-group label {
  display: block;
  margin-bottom: var(--spacing-xs);
  color: var(--text-secondary);
}

.form-input, .form-select {
  width: 100%;
  padding: 0.75rem;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-primary);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-md);
  margin-top: var(--spacing-xl);
}

.loading-state, .empty-state {
  text-align: center;
  padding: var(--spacing-2xl);
  color: var(--text-muted);
}

.empty-icon {
  font-size: 4rem;
  display: block;
  margin-bottom: var(--spacing-md);
  opacity: 0.5;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .header-actions {
    width: 100%;
    flex-direction: column;
  }
  
  .club-select {
    width: 100%;
  }
}
</style>
