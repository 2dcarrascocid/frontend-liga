<template>
  <div class="container mt-md">
    <!-- Header -->
    <div class="flex justify-between items-center mb-lg">
      <h2>Clubes</h2>
      <button 
        class="btn" 
        :class="viewMode === 'list' ? 'btn-primary' : 'btn-secondary'"
        @click="toggleViewMode"
      >
        {{ viewMode === 'list' ? 'Nuevo Club' : 'Volver al listado' }}
      </button>
    </div>

    <div v-if="error" class="alert alert-error">
      {{ error }}
    </div>

    <!-- Create/Edit Form -->
    <div v-if="viewMode === 'form'" class="mb-lg card">
      <h3 class="mb-md">{{ form.id ? 'Editar Club' : 'Crear Nuevo Club' }}</h3>
      <form @submit.prevent="saveClub">
        <div class="flex flex-col gap-md">
          <div class="input-group">
            <label class="label">Nombre</label>
            <input v-model="form.name" class="input" required />
          </div>
          <div class="input-group">
            <label class="label">Nombre corto</label>
            <input v-model="form.short_name" class="input" />
          </div>
          <div class="input-group">
            <label class="label">Colores</label>
            <input v-model="form.colors" class="input" placeholder="Ej: Azul / Blanco" />
          </div>
          
          <!-- Logo Upload -->
          <div class="input-group">
            <label class="label">Logo del Club</label>
            <div class="flex items-center gap-md">
              <div v-if="form.logo_url" class="logo-preview">
                <img :src="form.logo_url" alt="Logo preview" />
                <button type="button" class="btn-icon-remove" @click="removeLogo">×</button>
              </div>
              <div class="flex-1">
                <input 
                  type="file" 
                  accept="image/*" 
                  @change="handleFileChange" 
                  class="input"
                  :disabled="uploading"
                />
                <p v-if="uploading" class="text-sm text-info mt-xs">Subiendo imagen...</p>
              </div>
            </div>
          </div>

          <div class="input-group">
            <label class="label">Descripción</label>
            <textarea v-model="form.description" class="input" rows="3" />
          </div>
          <div class="section-divider">Configuración de Nómina</div>
          <div class="folio-config-row">
            <div class="input-group">
              <label class="label">Folio inicio *</label>
              <input v-model.number="form.folio_start" type="number" min="1" class="input" required />
            </div>
            <div class="input-group">
              <label class="label">Folio término *</label>
              <input v-model.number="form.folio_end" type="number" min="1" class="input" required />
            </div>
            <div class="input-group">
              <label class="label">Máx. jugadores</label>
              <input v-model.number="form.max_players" type="number" min="1" max="200" class="input" />
            </div>
          </div>
          <p v-if="form.folio_start && form.folio_end" class="field-hint">
            Rango: {{ form.folio_start }} – {{ form.folio_end }}
            ({{ form.folio_end - form.folio_start + 1 }} folios)
          </p>
        </div>
        <div class="flex justify-between items-center mt-md">
          <span class="text-muted text-sm">
            * Campos requeridos
          </span>
          <div class="flex gap-sm">
            <button type="button" class="btn btn-secondary" @click="cancelForm">
              Cancelar
            </button>
            <button type="submit" class="btn btn-primary" :disabled="loading || uploading">
              {{ loading ? 'Guardando...' : 'Guardar' }}
            </button>
          </div>
        </div>
      </form>
    </div>

    <div v-if="viewMode === 'list'" class="card p-0">
      <div class="table-container">
        <table class="table">
          <thead>
            <tr>
              <th>Logo</th>
              <th>Nombre</th>
              <th>Nombre Corto</th>
              <th>Colores</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading && items.length === 0">
              <td colspan="5" class="text-center py-lg">Cargando...</td>
            </tr>
            <tr v-else-if="items.length === 0">
              <td colspan="5" class="text-center py-lg">No hay clubes registrados.</td>
            </tr>
            <tr v-for="club in paginatedItems" :key="club.id">
              <td>
                <div class="club-logo-small">
                  <img v-if="club.logo_url" :src="club.logo_url" :alt="club.name" />
                  <span v-else class="logo-placeholder">⚽</span>
                </div>
              </td>
              <td>
                <span class="font-medium">{{ club.name }}</span>
              </td>
              <td>{{ club.short_name }}</td>
              <td>
                <span class="badge">{{ club.colors || 'N/A' }}</span>
              </td>
              <td>
                <button class="btn btn-sm btn-secondary" @click="goToDetail(club.id)">
                  Ver Detalle
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="cards-container-mobile">
        <div
          v-for="club in paginatedItems"
          :key="club.id"
          class="club-card-mobile"
        >
          <div class="club-card-mobile-header">
            <div class="club-logo-small">
              <img v-if="club.logo_url" :src="club.logo_url" :alt="club.name" />
              <span v-else class="logo-placeholder">⚽</span>
            </div>
            <div class="club-card-mobile-title">
              <div class="font-medium">
                {{ club.name }}
              </div>
              <div class="text-sm text-muted">
                {{ club.short_name }}
              </div>
            </div>
          </div>
          <div class="club-card-mobile-body">
            <span class="badge">{{ club.colors || 'N/A' }}</span>
          </div>
          <div class="club-card-mobile-footer">
            <button class="btn btn-sm btn-secondary btn-full" @click="goToDetail(club.id)">
              Ver Detalle
            </button>
          </div>
        </div>
      </div>
      
      <div v-if="items.length > 0" class="pagination mb-md">
        <button 
          class="pagination-btn" 
          :disabled="!hasPrevPage" 
          @click="goToPrevPage"
        >
          Anterior
        </button>

        <div class="pagination-center">
          <select
            class="input pagination-size"
            :value="itemsPerPage"
            @change="handlePageSizeChange($event.target.value)"
          >
            <option v-for="size in pageSizeOptions" :key="size" :value="size">
              {{ size }}
            </option>
          </select>
          <span class="pagination-info">
            Página {{ currentPage }} de {{ totalPages }}
          </span>
        </div>

        <button 
          class="pagination-btn" 
          :disabled="!hasNextPage" 
          @click="goToNextPage"
        >
          Siguiente
        </button>
      </div>
    </div>

    <!-- Post Save Modal/Dialog Overlay -->
    <div v-if="showPostSaveDialog" class="modal-overlay">
      <div class="modal-content card">
        <h3 class="mb-md text-center">¡Club Guardado con Éxito!</h3>
        <p class="text-center mb-lg">¿Qué deseas hacer ahora?</p>
        <div class="flex flex-col gap-md">
          <button class="btn btn-primary btn-full" @click="handlePostSaveOption('create_another')">
            Ingresar otro club
          </button>
          <button class="btn btn-secondary btn-full" @click="handlePostSaveOption('back')">
            Volver al listado
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useClubsStore } from '../stores/clubs';
import { useAuthStore } from '../stores/auth';
import { uploadImage } from '../services/cloudinary.service';

const router = useRouter();
const { items, loading, error, meta, fetchClubs, createOrUpdateClub } = useClubsStore();
const authStore = useAuthStore();

const viewMode = ref('list');
const uploading = ref(false);
const showPostSaveDialog = ref(false);

const currentPage = ref(1);
const itemsPerPage = ref(10);
const pageSizeOptions = [10, 20, 50];
const tokensHistory = ref([null]);

const paginatedItems = computed(() => items.value);

const totalPages = computed(() => {
  const total = meta.value?.total_registros || 0;
  const limit = itemsPerPage.value || meta.value?.limit || 10;
  if (!total || !limit) return 1;
  return Math.ceil(total / limit);
});

const hasNextPage = computed(() => !!meta.value?.next_token);
const hasPrevPage = computed(() => currentPage.value > 1);

const form = reactive({
  id:          null,
  name:        '',
  short_name:  '',
  colors:      '',
  description: '',
  logo_url:    '',
  folio_start: null,
  folio_end:   null,
  max_players: 70,
});

const loadClubs = async () => {
  await fetchClubs({ limit: itemsPerPage.value });
  currentPage.value = 1;
  tokensHistory.value = [null];
};

const toggleViewMode = () => {
  if (viewMode.value === 'list') {
    startCreate();
  } else {
    cancelForm();
  }
};

const startCreate = () => {
  resetForm();
  viewMode.value = 'form';
};

const cancelForm = () => {
  resetForm();
  viewMode.value = 'list';
};

const resetForm = () => {
  form.id          = null;
  form.name        = '';
  form.short_name  = '';
  form.colors      = '';
  form.description = '';
  form.logo_url    = '';
  form.folio_start = null;
  form.folio_end   = null;
  form.max_players = 70;
  showPostSaveDialog.value = false;
};

const handleFileChange = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  uploading.value = true;
  try {
    const data = await uploadImage(file);
    form.logo_url = data.secure_url;
  } catch (e) {
    alert('Error al subir imagen: ' + e.message);
  } finally {
    uploading.value = false;
    // Clear input
    event.target.value = '';
  }
};

const removeLogo = () => {
  form.logo_url = '';
};

const saveClub = async () => {
  const payload = { 
    ...form,
    org_id: authStore.state.org?.id
  };
  try {
    await createOrUpdateClub(payload);
    await loadClubs();
    // Show post-save dialog instead of immediate reset
    showPostSaveDialog.value = true;
  } catch (e) {
    // Error is handled in store
  }
};

const handlePostSaveOption = (option) => {
  if (option === 'create_another') {
    resetForm();
  } else {
    resetForm();
    viewMode.value = 'list';
  }
};

const goToDetail = (id) => {
  router.push(`/clubs/${id}`);
};

const goToNextPage = async () => {
  if (!hasNextPage.value) return;
  const token = meta.value?.next_token;
  if (!token) return;
  tokensHistory.value[currentPage.value] = token;
  await fetchClubs({ limit: itemsPerPage.value, next_token: token });
  currentPage.value += 1;
};

const goToPrevPage = async () => {
  if (!hasPrevPage.value) return;
  const targetPage = currentPage.value - 1;
  const tokenForTargetPage = tokensHistory.value[targetPage - 1] ?? null;
  if (tokenForTargetPage) {
    await fetchClubs({ limit: itemsPerPage.value, next_token: tokenForTargetPage });
  } else {
    await fetchClubs({ limit: itemsPerPage.value });
  }
  currentPage.value = targetPage;
};

const handlePageSizeChange = async (value) => {
  const size = Number(value);
  if (!pageSizeOptions.includes(size)) return;
  itemsPerPage.value = size;
  currentPage.value = 1;
  tokensHistory.value = [null];
  await fetchClubs({ limit: size });
};

onMounted(() => {
  loadClubs();
});
</script>

<style scoped>
.field-hint {
  font-size: 0.78rem;
  color: var(--text-muted);
  margin-top: 4px;
}

.section-divider {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 4px;
  margin-top: 4px;
}

.folio-config-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 12px;
}

/* Modal Overlay */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal-content {
  width: 100%;
  max-width: 400px;
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.badge {
  padding: 0.25rem 0.75rem;
  border-radius: var(--radius-full);
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  font-size: 0.75rem;
}

.logo-preview {
  position: relative;
  width: 80px;
  height: 80px;
  border-radius: var(--radius-md);
  overflow: hidden;
  border: 1px solid var(--border-color);
}

.logo-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.btn-icon-remove {
  position: absolute;
  top: 2px;
  right: 2px;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  border: none;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 14px;
}

.club-logo-small {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--bg-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 1px solid var(--border-color);
}

.club-logo-small img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.logo-placeholder {
  font-size: 1.25rem;
}

.font-medium {
  font-weight: 500;
}

.btn-sm {
  padding: 0.4rem 0.8rem;
  font-size: 0.875rem;
}

.p-0 {
  padding: 0 !important;
}

.py-lg {
  padding-top: var(--spacing-lg);
  padding-bottom: var(--spacing-lg);
}

.list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem 0;
  gap: var(--spacing-md);
}

.list-header-right {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.cards-container-mobile {
  display: none;
}

.club-card-mobile {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: 1rem 1.25rem;
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-md);
}

.club-card-mobile + .club-card-mobile {
  margin-top: 0.75rem;
}

.club-card-mobile-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin-bottom: 0.75rem;
}

.club-card-mobile-body {
  margin-bottom: 0.75rem;
}

.club-card-mobile-footer {
  margin-top: 0.25rem;
}

.pagination-center {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin-inline: var(--spacing-md);
}

.pagination-size {
  width: auto;
  padding-top: 0.35rem;
  padding-bottom: 0.35rem;
  font-size: 0.8rem;
}

.pagination-info {
  font-size: 0.8rem;
  color: var(--text-muted);
}

@media (max-width: 768px) {
  .table-container {
    display: none;
  }

  .cards-container-mobile {
    display: block;
    padding: 1rem 1.5rem 0.5rem;
  }

  .list-header {
    padding-inline: 1rem;
  }
  
.tag {
  background: rgba(255, 255, 255, 0.1);
  padding: 0.5rem 1rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  color: var(--color-dark-text);
  border: 1px solid rgba(255, 255, 255, 0.2);
}
}
</style>
