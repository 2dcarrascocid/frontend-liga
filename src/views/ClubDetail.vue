<template>
  <div class="container mt-md">
    <div class="flex justify-between items-center mb-lg">
      <h2>Detalle de Club</h2>
      <div class="flex gap-sm">
        <button class="btn btn-secondary" @click="goBack">
          Volver
        </button>
        <button class="btn btn-primary" :disabled="!current" @click="startEdit">
          Editar club
        </button>
      </div>
    </div>

    <div v-if="error" class="alert alert-error">
      {{ error }}
    </div>

    <div v-if="current" class="card club-card-detail mb-lg">
      <div class="club-card-header">
        <div class="club-logo-large">
          <span v-if="!current.logo_url" class="logo-placeholder">⚽</span>
          <img v-else :src="current.logo_url" :alt="current.name" />
        </div>
        <div class="club-card-title">
          <h3>{{ current.name }}</h3>
          <p class="text-muted text-sm">
            {{ current.short_name || 'Sin nombre corto' }}
          </p>
        </div>
      </div>
      <div class="club-card-body">
        <div class="club-info-row">
          <span class="label-small">Colores</span>
          <span class="badge">
            {{ current.colors || 'Sin colores definidos' }}
          </span>
        </div>
        <div class="club-info-row">
          <span class="label-small">Descripción</span>
          <p class="text-muted">
            {{ current.description || 'Sin descripción registrada.' }}
          </p>
        </div>
      </div>
    </div>

    <div v-if="current && editMode" class="card mb-lg">
      <h3 class="mb-md">Editar club</h3>
      <form @submit.prevent="saveEdit">
        <div class="flex flex-col gap-md">
          <div class="input-group">
            <label class="label">Nombre</label>
            <input v-model="editForm.name" class="input" required />
          </div>
          <div class="input-group">
            <label class="label">Nombre corto</label>
            <input v-model="editForm.short_name" class="input" />
          </div>
          <div class="input-group">
            <label class="label">Colores</label>
            <input v-model="editForm.colors" class="input" />
          </div>
          <div class="input-group">
            <label class="label">Logo del Club</label>
            <div class="flex items-center gap-md">
              <div v-if="editForm.logo_url" class="logo-preview">
                <img :src="editForm.logo_url" alt="Logo preview" />
                <button type="button" class="btn-icon-remove" @click="removeEditLogo">×</button>
              </div>
              <div class="flex-1">
                <input 
                  type="file" 
                  accept="image/*" 
                  @change="handleEditFileChange" 
                  class="input"
                  :disabled="editUploading"
                />
                <p v-if="editUploading" class="text-sm text-info mt-xs">Subiendo imagen...</p>
              </div>
            </div>
          </div>
          <div class="input-group">
            <label class="label">Descripción</label>
            <textarea v-model="editForm.description" class="input" rows="3" />
          </div>
        </div>
        <div class="flex justify-between items-center mt-md">
          <span class="text-muted text-sm">
            Edita los datos principales del club
          </span>
          <div class="flex gap-sm">
            <button type="button" class="btn btn-secondary" @click="cancelEdit">
              Cancelar
            </button>
            <button type="submit" class="btn btn-primary" :disabled="loading">
              {{ loading ? 'Guardando...' : 'Guardar cambios' }}
            </button>
          </div>
        </div>
      </form>
    </div>

    <div class="card">
      <h3 class="mb-md">Accesos de usuarios</h3>

      <form class="flex flex-col gap-md mb-md" @submit.prevent="handleAddUser">
        <div class="input-group">
          <label class="label">Email usuario</label>
          <input v-model="userEmail" type="email" required class="input" />
        </div>
        <div class="flex justify-between items-center">
          <span class="text-muted text-sm">Agregar usuario con acceso al club</span>
          <button type="submit" class="btn btn-primary" :disabled="loading">
            {{ loading ? 'Agregando...' : 'Agregar' }}
          </button>
        </div>
      </form>

      <div v-if="users.length === 0" class="text-muted text-sm">
        No hay usuarios asignados a este club.
      </div>

      <div v-else class="users-table">
        <div
          v-for="user in users"
          :key="user.id"
          class="user-row"
        >
          <div class="user-info">
            <div class="user-name">{{ user.name || user.email }}</div>
            <div class="text-muted text-sm">{{ user.email }}</div>
          </div>
          <button
            class="btn btn-secondary"
            @click="confirmRemoveUser(user.id)"
          >
            Quitar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, reactive } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useClubsStore } from '../stores/clubs';
import { useAuthStore } from '../stores/auth';
import { uploadImage } from '../services/cloudinary.service';

const route = useRoute();
const router = useRouter();
const { current, users, loading, error, fetchClubById, addUserToClub, removeUserFromClub, createOrUpdateClub } = useClubsStore();
const authStore = useAuthStore();

const userEmail = ref('');
const editMode = ref(false);
const editUploading = ref(false);

const editForm = reactive({
  id: null,
  name: '',
  short_name: '',
  colors: '',
  description: '',
  logo_url: '',
});

const clubTitle = computed(() => current.value?.name || 'Detalle Club');

const syncEditForm = () => {
  if (!current.value) return;
  editForm.id = current.value.id;
  editForm.name = current.value.name || '';
  editForm.short_name = current.value.short_name || '';
  editForm.colors = current.value.colors || '';
  editForm.description = current.value.description || '';
  editForm.logo_url = current.value.logo_url || '';
};

const loadClub = async () => {
  await fetchClubById(route.params.clubId);
  syncEditForm();
};

const startEdit = () => {
  syncEditForm();
  editMode.value = true;
};

const cancelEdit = () => {
  syncEditForm();
  editMode.value = false;
};

const saveEdit = async () => {
  if (!current.value) return;
  const payload = {
    ...current.value,
    ...editForm,
    org_id: authStore.state.org?.id,
  };
  await createOrUpdateClub(payload);
  await loadClub();
  editMode.value = false;
};

const handleEditFileChange = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  editUploading.value = true;
  try {
    const data = await uploadImage(file);
    editForm.logo_url = data.secure_url;
  } catch (e) {
    alert('Error al subir imagen: ' + e.message);
  } finally {
    editUploading.value = false;
    event.target.value = '';
  }
};

const removeEditLogo = () => {
  editForm.logo_url = '';
};

const handleAddUser = async () => {
  await addUserToClub(route.params.clubId, { email: userEmail.value });
  userEmail.value = '';
  await loadClub();
};

const confirmRemoveUser = async (userId) => {
  const ok = window.confirm('¿Quitar acceso a este usuario?');
  if (!ok) return;
  await removeUserFromClub(route.params.clubId, userId);
  await loadClub();
};

const goBack = () => {
  router.push('/clubs');
};

onMounted(() => {
  loadClub();
});
</script>

<style scoped>
.users-table {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.user-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  border-radius: var(--radius-md);
  background: var(--bg-secondary);
}

.user-info {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-weight: 500;
}

.club-card-detail {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.club-card-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.club-logo-large {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  box-shadow: var(--shadow-md);
}

.club-logo-large img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.club-card-title h3 {
  margin-bottom: 0.25rem;
}

.label-small {
  font-size: 0.75rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.club-info-row {
  margin-top: var(--spacing-sm);
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

@media (max-width: 640px) {
  .club-card-header {
    align-items: flex-start;
  }
}
</style>
