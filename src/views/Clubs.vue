<template>
  <div class="clubs-page">
    <div class="container">
      <div class="page-header">
        <div>
          <h1>🏆 Mis Clubes</h1>
          <p>Administra tus clubes deportivos</p>
        </div>
        <button class="btn btn-primary" @click="showCreateModal = true">
          ➕ Nuevo Club
        </button>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Cargando clubes...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="clubs.length === 0" class="empty-state">
        <span class="empty-icon">🏆</span>
        <h3>No tienes clubes registrados</h3>
        <p>Crea tu primer club para comenzar a gestionar jugadores y finanzas</p>
        <button class="btn btn-primary" @click="showCreateModal = true">
          Crear Primer Club
        </button>
      </div>

      <!-- Clubs Grid -->
      <div v-else class="clubs-grid">
        <div v-for="club in clubs" :key="club.id" class="club-card">
          <div class="club-header">
            <div class="club-icon">
              {{ club.nombre.charAt(0).toUpperCase() }}
            </div>
            <div class="club-actions">
              <button class="btn-icon" @click="editClub(club)">✏️</button>
              <button class="btn-icon delete" @click="deleteClub(club.id)">🗑️</button>
            </div>
          </div>
          
          <div class="club-body">
            <h3>{{ club.nombre }}</h3>
            <p class="club-location">📍 {{ club.direccion || 'Sin dirección' }}</p>
            <div class="club-stats">
              <div class="stat">
                <span class="label">Miembros</span>
                <span class="value">{{ club.miembros_count || 0 }}</span>
              </div>
              <div class="stat">
                <span class="label">Fundado</span>
                <span class="value">{{ new Date(club.created_at).getFullYear() }}</span>
              </div>
            </div>
          </div>

          <div class="club-footer">
            <router-link :to="`/players?club=${club.id}`" class="btn btn-outline btn-sm">
              Jugadores
            </router-link>
            <router-link :to="`/finance?club=${club.id}`" class="btn btn-outline btn-sm">
              Finanzas
            </router-link>
          </div>
        </div>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <div v-if="showCreateModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>{{ isEditing ? 'Editar Club' : 'Nuevo Club' }}</h2>
          <button class="close-btn" @click="closeModal">×</button>
        </div>
        
        <form @submit.prevent="handleSubmit">
          <div class="form-group">
            <label>Nombre del Club</label>
            <input 
              type="text" 
              v-model="form.nombre" 
              placeholder="Ej: Los Galácticos FC"
              required
              class="form-input"
            >
          </div>

          <div class="form-group">
            <label>Dirección</label>
            <input 
              type="text" 
              v-model="form.direccion" 
              placeholder="Ej: Av. Siempre Viva 123"
              class="form-input"
            >
          </div>

          <div class="form-actions">
            <button type="button" class="btn btn-outline" @click="closeModal">Cancelar</button>
            <button type="submit" class="btn btn-primary" :disabled="submitting">
              {{ submitting ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Crear Club') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useAuthStore } from '../stores/auth';
import { clubsAPI } from '../api';

const authStore = useAuthStore();
const clubs = ref([]);
const loading = ref(true);
const showCreateModal = ref(false);
const submitting = ref(false);
const isEditing = ref(false);
const editingId = ref(null);

const form = reactive({
  nombre: '',
  direccion: ''
});

onMounted(() => {
  loadClubs();
});

const loadClubs = async () => {
  loading.value = true;
  try {
    const userId = authStore.user.value?.id;
    const response = await clubsAPI.getAll({ owner_id: userId });
    clubs.value = response.data.clubes || [];
  } catch (error) {
    console.error('Error loading clubs:', error);
  } finally {
    loading.value = false;
  }
};

const handleSubmit = async () => {
  submitting.value = true;
  try {
    const userId = authStore.user.value?.id;
    const clubData = {
      ...form,
      owner_id: userId
    };

    if (isEditing.value) {
      await clubsAPI.update({ ...clubData, id: editingId.value });
    } else {
      await clubsAPI.create(clubData);
    }

    await loadClubs();
    closeModal();
  } catch (error) {
    console.error('Error saving club:', error);
    alert('Error al guardar el club');
  } finally {
    submitting.value = false;
  }
};

const editClub = (club) => {
  isEditing.value = true;
  editingId.value = club.id;
  form.nombre = club.nombre;
  form.direccion = club.direccion;
  showCreateModal = true;
};

const deleteClub = async (id) => {
  if (!confirm('¿Estás seguro de eliminar este club?')) return;
  
  try {
    await clubsAPI.delete(id);
    await loadClubs();
  } catch (error) {
    console.error('Error deleting club:', error);
    alert('Error al eliminar el club');
  }
};

const closeModal = () => {
  showCreateModal = false;
  isEditing.value = false;
  editingId.value = null;
  form.nombre = '';
  form.direccion = '';
};
</script>

<style scoped>
.clubs-page {
  min-height: 100vh;
  padding: var(--spacing-2xl) 0;
  background: var(--bg-primary);
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-2xl);
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

.clubs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--spacing-xl);
}

.club-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-xl);
  padding: var(--spacing-xl);
  transition: all var(--transition-base);
}

.club-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
  border-color: var(--primary-light);
}

.club-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--spacing-lg);
}

.club-icon {
  width: 50px;
  height: 50px;
  background: var(--primary-gradient);
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: 700;
  color: white;
}

.club-actions {
  display: flex;
  gap: var(--spacing-xs);
}

.btn-icon {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.2rem;
  padding: 4px;
  border-radius: var(--radius-md);
  transition: background 0.2s;
}

.btn-icon:hover {
  background: var(--bg-hover);
}

.btn-icon.delete:hover {
  background: rgba(239, 68, 68, 0.1);
}

.club-body h3 {
  margin: 0 0 var(--spacing-xs) 0;
  color: var(--text-primary);
}

.club-location {
  color: var(--text-muted);
  font-size: 0.875rem;
  margin-bottom: var(--spacing-lg);
}

.club-stats {
  display: flex;
  gap: var(--spacing-xl);
  margin-bottom: var(--spacing-lg);
  padding: var(--spacing-md) 0;
  border-top: 1px solid var(--border-color);
  border-bottom: 1px solid var(--border-color);
}

.stat {
  display: flex;
  flex-direction: column;
}

.stat .label {
  font-size: 0.75rem;
  color: var(--text-muted);
  text-transform: uppercase;
}

.stat .value {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
}

.club-footer {
  display: flex;
  gap: var(--spacing-md);
}

.btn-sm {
  flex: 1;
  padding: 0.5rem;
  font-size: 0.875rem;
  text-align: center;
}

/* Modal Styles */
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

.modal-header h2 {
  margin: 0;
  font-size: 1.5rem;
}

.close-btn {
  background: none;
  border: none;
  font-size: 2rem;
  color: var(--text-muted);
  cursor: pointer;
  line-height: 1;
}

.form-group {
  margin-bottom: var(--spacing-lg);
}

.form-group label {
  display: block;
  margin-bottom: var(--spacing-xs);
  color: var(--text-secondary);
}

.form-input {
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
</style>
