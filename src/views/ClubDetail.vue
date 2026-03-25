<template>
  <div class="container mt-md">
    <!-- Header -->
    <div class="flex justify-between items-center mb-lg">
      <h2>Detalle de Club</h2>
      <button class="btn btn-secondary" @click="goBack">
        &larr; Clubes
      </button>
    </div>

    <div v-if="error" class="alert alert-error mb-md">
      {{ error }}
    </div>

    <!-- Club Info Card (always visible) -->
    <div v-if="current" class="card club-card-detail mb-md">
      <div class="club-card-header">
        <div class="club-logo-large">
          <span v-if="!current.logo_url" class="logo-placeholder">⚽</span>
          <img v-else :src="current.logo_url" :alt="current.name" />
        </div>
        <div class="club-card-title">
          <h3>{{ current.name }}</h3>
          <p class="text-muted text-sm">{{ current.short_name || 'Sin nombre corto' }}</p>
        </div>
        <div class="ml-auto flex items-center gap-md">
          <span class="badge" :class="activeCount >= 70 ? 'badge-danger' : 'badge-success'">
            Activos: {{ activeCount }} / 70
          </span>
        </div>
      </div>
    </div>

    <!-- Sub Menu / Tabs -->
    <div class="club-tabs mb-md">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        class="club-tab"
        :class="{ 'club-tab-active': activeTab === tab.key }"
        @click="switchTab(tab.key)"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- TAB: Jugadores -->
    <div v-if="activeTab === 'players'">
      <div class="card mb-lg">
        <div class="flex justify-between items-center mb-md flex-wrap gap-md">
          <h3>Jugadores del Club</h3>
          <div class="flex gap-sm">
            <button
              class="btn btn-secondary"
              @click="$router.push(`/clubs/${route.params.clubId}/players/import`)"
            >
              📥 Importar Excel
            </button>
            <button
              class="btn btn-primary"
              @click="$router.push(`/clubs/${route.params.clubId}/players/new`)"
            >
              Nuevo Jugador
            </button>
          </div>
        </div>

        <!-- Filters -->
        <div class="flex gap-md mb-md flex-wrap items-center">
          <div class="input-group flex-1" style="min-width: 200px;">
            <input
              v-model="playerFilters.q"
              @input="handlePlayerSearch"
              placeholder="Buscar por nombre o ID..."
              class="input"
            />
          </div>
          <div class="input-group" style="min-width: 160px;">
            <select v-model="playerFilters.category_id" @change="handlePlayerFilter" class="input">
              <option :value="null">Todas las categorías</option>
              <option v-for="cat in categories" :key="cat.id" :value="cat.id">
                {{ cat.name }}
              </option>
            </select>
          </div>
        </div>

        <!-- Loading -->
        <div v-if="playersLoading && filteredPlayers.length === 0" class="text-center py-lg">
          Cargando jugadores...
        </div>

        <!-- Empty -->
        <div v-else-if="filteredPlayers.length === 0" class="text-center py-lg">
          No hay jugadores registrados en este club.
        </div>

        <!-- Table -->
        <div v-else class="overflow-hidden">
          <div class="table-container">
            <table class="table">
              <thead>
                <tr>
                  <th>Folio</th>
                  <th>Foto</th>
                  <th>Nombre</th>
                  <th>Categoría</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in filteredPlayers" :key="item.id">
                  <td>{{ item.club_folio || '—' }}</td>
                  <td>
                    <div class="avatar-small">
                      <img :src="item.player?.photo_url || '/placeholder-player.svg'" alt="Foto" class="avatar-img" />
                    </div>
                  </td>
                  <td>{{ item.player?.first_name }} {{ item.player?.last_name }}</td>
                  <td>
                    <span
                      v-if="getPlayerCategory(item.player?.birth_date)"
                      class="badge"
                      :style="{ backgroundColor: getPlayerCategory(item.player?.birth_date).color, color: '#fff' }"
                    >
                      {{ getPlayerCategory(item.player?.birth_date).name }}
                    </span>
                    <span v-else class="text-muted">—</span>
                  </td>
                  <td>
                    <div class="flex gap-sm">
                      <button
                        class="btn btn-sm btn-secondary"
                        @click="$router.push(`/players/${item.player_id}`)"
                        title="Ver detalle"
                      >
                        Ver
                      </button>
                      <button
                        class="btn btn-sm btn-secondary"
                        @click="$router.push(`/players/${item.player_id}/edit`)"
                        title="Editar"
                      >
                        Editar
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div class="pagination-center" v-if="filteredPlayers.length > 0">
            <div class="pagination">
              <div class="pagination-controls">
                <button
                  class="pagination-btn"
                  :disabled="playerPage === 1"
                  @click="changePlayerPage(playerPage - 1)"
                >
                  &larr; Anterior
                </button>
                <span class="pagination-info">Página {{ playerPage }}</span>
                <button
                  class="pagination-btn"
                  :disabled="!playersMeta.next_token"
                  @click="changePlayerPage(playerPage + 1)"
                >
                  Siguiente &rarr;
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- TAB: Jugadores Inactivos -->
    <div v-if="activeTab === 'inactive_players'">
      <div class="card mb-lg">
        <div class="flex justify-between items-center mb-md">
          <h3>Jugadores Inactivos</h3>
          <span class="text-sm text-muted">Solo lectura — se reactivan al recibir un traspaso</span>
        </div>

        <div v-if="inactiveLoading" class="text-center py-lg">
          Cargando jugadores inactivos...
        </div>
        <div v-else-if="inactivePlayers.length === 0" class="text-center py-lg text-muted">
          No hay jugadores inactivos en este club.
        </div>
        <div v-else class="overflow-hidden">
          <div class="table-container">
            <table class="table">
              <thead>
                <tr>
                  <th>Folio</th>
                  <th>Foto</th>
                  <th>Nombre</th>
                  <th>Categoría</th>
                  <th>Traspasado el</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in inactivePlayers" :key="item.id">
                  <td>{{ item.club_folio || '—' }}</td>
                  <td>
                    <div class="avatar-small">
                      <img :src="item.player?.photo_url || '/placeholder-player.svg'" alt="Foto" class="avatar-img" />
                    </div>
                  </td>
                  <td>{{ item.player?.first_name }} {{ item.player?.last_name }}</td>
                  <td>
                    <span
                      v-if="getPlayerCategory(item.player?.birth_date)"
                      class="badge"
                      :style="{ backgroundColor: getPlayerCategory(item.player?.birth_date).color, color: '#fff' }"
                    >
                      {{ getPlayerCategory(item.player?.birth_date).name }}
                    </span>
                    <span v-else class="text-muted">—</span>
                  </td>
                  <td class="text-muted text-sm">
                    {{ item.valid_to ? formatDate(item.valid_to) : '—' }}
                  </td>
                  <td>
                    <button
                      class="btn btn-sm btn-secondary"
                      @click="$router.push(`/players/${item.player_id}`)"
                      title="Ver detalle"
                    >
                      Ver
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- TAB: Editar Club -->
    <div v-if="activeTab === 'edit'">
      <div class="card mb-lg">
        <h3 class="mb-md">Editar Club</h3>
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

            <div class="section-divider">Configuración de Nómina</div>
            <div class="folio-config-row">
              <div class="input-group">
                <label class="label">Folio inicio</label>
                <input v-model.number="editForm.folio_start" type="number" min="1" class="input" />
              </div>
              <div class="input-group">
                <label class="label">Folio término</label>
                <input v-model.number="editForm.folio_end" type="number" min="1" class="input" />
              </div>
              <div class="input-group">
                <label class="label">Máx. jugadores</label>
                <input v-model.number="editForm.max_players" type="number" min="1" max="200" class="input" />
              </div>
            </div>
            <p class="folio-config-hint">
              Rango: {{ editForm.folio_start }} – {{ editForm.folio_end }}
              ({{ editForm.folio_end - editForm.folio_start + 1 }} folios / máx. {{ editForm.max_players }} jugadores)
            </p>
          </div>
          <div class="flex justify-end gap-sm mt-md">
            <button type="button" class="btn btn-secondary" @click="syncEditForm">
              Restablecer
            </button>
            <button type="submit" class="btn btn-primary" :disabled="loading">
              {{ loading ? 'Guardando...' : 'Guardar cambios' }}
            </button>
          </div>
        </form>

        <!-- Accesos -->
        <div class="border-t border-border mt-lg pt-lg">
          <div class="flex justify-between items-center cursor-pointer mb-md" @click="showUserAccess = !showUserAccess">
            <h4 class="mb-0">Configuración de Accesos</h4>
            <span>{{ showUserAccess ? '−' : '+' }}</span>
          </div>
          <div v-if="showUserAccess">
            <form class="flex flex-col gap-md mb-md" @submit.prevent="handleAddUser">
              <div class="input-group">
                <label class="label">Email usuario</label>
                <input v-model="userEmail" type="email" required class="input" />
              </div>
              <div class="flex justify-end">
                <button type="submit" class="btn btn-primary" :disabled="loading">
                  {{ loading ? 'Agregando...' : 'Agregar usuario' }}
                </button>
              </div>
            </form>
            <div v-if="users.length === 0" class="text-muted text-sm">
              No hay usuarios asignados a este club.
            </div>
            <div v-else class="users-table">
              <div v-for="user in users" :key="user.id" class="user-row">
                <div class="user-info">
                  <div class="user-name">{{ user.name || user.email }}</div>
                  <div class="text-muted text-sm">{{ user.email }}</div>
                </div>
                <button class="btn btn-secondary" @click="confirmRemoveUser(user.id)">
                  Quitar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- TAB: Traspasos -->
    <div v-if="activeTab === 'transfers'">

      <!-- Formulario nuevo traspaso -->
      <div class="card mb-md">
        <div class="flex justify-between items-center mb-md">
          <h3>Traspasos</h3>
          <button class="btn btn-primary btn-sm" @click="trFormVisible = !trFormVisible">
            {{ trFormVisible ? 'Cancelar' : '+ Nuevo Traspaso' }}
          </button>
        </div>

        <div v-if="trFormVisible" class="tr-form mb-md">
          <h4 class="mb-md">Solicitar traspaso</h4>
          <div class="flex flex-col gap-md">
            <div class="input-group">
              <label class="label">Jugador *</label>
              <select v-model="trForm.player_id" class="input">
                <option :value="null">Seleccionar jugador...</option>
                <option v-for="item in filteredPlayers" :key="item.player_id" :value="item.player_id">
                  {{ item.player?.first_name }} {{ item.player?.last_name }} — Folio {{ item.club_folio || '—' }}
                </option>
              </select>
            </div>
            <div class="input-group">
              <label class="label">Club destino *</label>
              <select v-model="trForm.to_club_id" class="input">
                <option :value="null">Seleccionar club...</option>
                <option v-for="club in allClubs" :key="club.id" :value="club.id">
                  {{ club.name }}
                </option>
              </select>
            </div>
            <div class="input-group">
              <label class="label">Notas</label>
              <textarea v-model="trForm.notes" class="input" rows="2" placeholder="Observaciones opcionales..." />
            </div>
          </div>
          <div class="flex justify-end gap-sm mt-md">
            <button class="btn btn-secondary" @click="trFormVisible = false">Cancelar</button>
            <button
              class="btn btn-primary"
              :disabled="trLoading || !trForm.player_id || !trForm.to_club_id"
              @click="submitTransfer"
            >
              {{ trLoading ? 'Enviando...' : 'Enviar traspaso' }}
            </button>
          </div>
        </div>

        <div v-if="trError" class="alert alert-error mb-md">{{ trError }}</div>
      </div>

      <!-- Traspasos enviados (salientes) -->
      <div class="card mb-md">
        <h4 class="mb-md">Enviados</h4>
        <div v-if="trLoading && !outgoingTransfers.length" class="text-center py-md text-muted">Cargando...</div>
        <div v-else-if="!outgoingTransfers.length" class="text-center py-md text-muted">No hay traspasos enviados.</div>
        <div v-else class="table-container">
          <table class="table">
            <thead>
              <tr>
                <th>Jugador</th>
                <th>Club destino</th>
                <th>Estado</th>
                <th>Fecha</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="t in outgoingTransfers" :key="t.id">
                <td>{{ t.player?.first_name }} {{ t.player?.last_name }}</td>
                <td>{{ t.to_club?.name }}</td>
                <td>
                  <span class="badge" :class="transferBadgeClass(t.status)">{{ t.status }}</span>
                </td>
                <td>{{ formatDate(t.created_at) }}</td>
                <td>
                  <button
                    v-if="t.status === 'ENVIADO'"
                    class="btn btn-sm btn-danger"
                    @click="cancelar(t)"
                  >
                    Cancelar
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Traspasos recibidos (entrantes) -->
      <div class="card mb-lg">
        <h4 class="mb-md">Recibidos</h4>
        <div v-if="!incomingTransfers.length" class="text-center py-md text-muted">No hay traspasos recibidos.</div>
        <div v-else class="table-container">
          <table class="table">
            <thead>
              <tr>
                <th>Jugador</th>
                <th>Club origen</th>
                <th>Estado</th>
                <th>Fecha</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="t in incomingTransfers" :key="t.id">
                <td>{{ t.player?.first_name }} {{ t.player?.last_name }}</td>
                <td>{{ t.from_club?.name }}</td>
                <td>
                  <span class="badge" :class="transferBadgeClass(t.status)">{{ t.status }}</span>
                </td>
                <td>{{ formatDate(t.created_at) }}</td>
                <td>
                  <div v-if="t.status === 'ENVIADO'" class="flex gap-sm">
                    <button class="btn btn-sm btn-success" @click="aceptar(t)">Aceptar</button>
                    <button class="btn btn-sm btn-danger"  @click="rechazar(t)">Rechazar</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>

    <!-- TAB: Categorías -->
    <div v-if="activeTab === 'categories'">
      <div class="card mb-lg">
        <div class="flex justify-between items-center mb-md">
          <h3>Categorías</h3>
          <button class="btn btn-primary btn-sm" @click="openCategoryForm()">
            + Nueva Categoría
          </button>
        </div>

        <!-- Formulario crear / editar -->
        <div v-if="catFormVisible" class="cat-form mb-lg">
          <h4 class="mb-md">{{ catEditing ? 'Editar categoría' : 'Nueva categoría' }}</h4>
          <div class="flex flex-col gap-md">
            <div class="flex gap-md flex-wrap">
              <div class="input-group flex-1" style="min-width:180px">
                <label class="label">Nombre *</label>
                <input v-model="catForm.name" class="input" placeholder="Ej: Sub-15, Infantil..." />
              </div>
              <div class="input-group" style="min-width:160px">
                <label class="label">Color etiqueta</label>
                <div class="color-picker-row">
                  <input type="color" v-model="catForm.color" class="color-picker-input" />
                  <span class="color-picker-hex">{{ catForm.color }}</span>
                  <span class="badge" :style="{ backgroundColor: catForm.color, color: '#fff' }">
                    {{ catForm.name || 'Previa' }}
                  </span>
                </div>
              </div>
            </div>
            <div class="flex gap-md flex-wrap">
              <div class="input-group flex-1" style="min-width:120px">
                <label class="label">Edad desde</label>
                <input v-model.number="catForm.age_from" type="number" min="0" max="99" class="input" placeholder="Ej: 13" />
              </div>
              <div class="input-group flex-1" style="min-width:120px">
                <label class="label">Edad hasta</label>
                <input v-model.number="catForm.age_to" type="number" min="0" max="99" class="input" placeholder="Ej: 15" />
              </div>
            </div>
            <div class="input-group">
              <label class="label">Descripción</label>
              <textarea v-model="catForm.description" class="input" rows="2" placeholder="Descripción de la categoría..." />
            </div>
          </div>
          <div class="flex justify-end gap-sm mt-md">
            <button class="btn btn-secondary" @click="closeCategoryForm">Cancelar</button>
            <button class="btn btn-primary" :disabled="catLoading || !catForm.name" @click="saveCategory">
              {{ catLoading ? 'Guardando...' : (catEditing ? 'Actualizar' : 'Crear') }}
            </button>
          </div>
        </div>

        <!-- Error -->
        <div v-if="catError" class="alert alert-error mb-md">{{ catError }}</div>

        <!-- Loading -->
        <div v-if="catLoading && categories.length === 0" class="text-center py-lg">
          Cargando categorías...
        </div>

        <!-- Empty -->
        <div v-else-if="!catFormVisible && categories.length === 0" class="text-center py-lg text-muted">
          No hay categorías registradas. Crea la primera.
        </div>

        <!-- Lista -->
        <div v-else-if="categories.length > 0" class="cat-list">
          <div v-for="cat in categories" :key="cat.id" class="cat-row">
            <div class="cat-color-bar" :style="{ backgroundColor: cat.color }"></div>
            <div class="cat-info">
              <div class="flex items-center gap-sm">
                <span class="badge" :style="{ backgroundColor: cat.color, color: '#fff' }">{{ cat.name }}</span>
                <span v-if="cat.age_from || cat.age_to" class="text-sm text-muted">
                  {{ cat.age_from ?? '—' }} – {{ cat.age_to ?? '—' }} años
                </span>
              </div>
              <p v-if="cat.description" class="text-sm text-muted mt-xs">{{ cat.description }}</p>
            </div>
            <div class="flex gap-sm ml-auto">
              <button class="btn btn-sm btn-secondary" @click="openCategoryForm(cat)">Editar</button>
              <button class="btn btn-sm btn-danger" @click="removeCategory(cat)">Eliminar</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, reactive } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useClubsStore } from '../stores/clubs';
import { usePlayersStore } from '../stores/players';
import { useAuthStore } from '../stores/auth';
import { uploadImage } from '../services/cloudinary.service';
import * as categoriesService from '../services/categories.service.js';
import * as transfersService  from '../services/transfers.service.js';

const route  = useRoute();
const router = useRouter();
const { current, users, loading, error, fetchClubById, addUserToClub, removeUserFromClub, createOrUpdateClub } = useClubsStore();
const playersStore = usePlayersStore();
const authStore    = useAuthStore();

// ── Tabs ──────────────────────────────────────────────
const tabs = [
  { key: 'players',          label: 'Jugadores' },
  { key: 'inactive_players', label: 'Jugadores Inactivos' },
  { key: 'transfers',        label: 'Traspasos' },
  { key: 'categories',       label: 'Categorías' },
  { key: 'edit',             label: 'Editar Club' },
];
const activeTab = ref('players');

// ── Club edit ─────────────────────────────────────────
const userEmail    = ref('');
const editUploading = ref(false);
const showUserAccess = ref(false);

const editForm = reactive({
  id: null,
  name: '',
  short_name: '',
  colors: '',
  description: '',
  logo_url: '',
  folio_start:  1,
  folio_end:    70,
  max_players:  70,
});

const syncEditForm = () => {
  if (!current.value) return;
  editForm.id          = current.value.id;
  editForm.name        = current.value.name        || '';
  editForm.short_name  = current.value.short_name  || '';
  editForm.colors      = current.value.colors      || '';
  editForm.description = current.value.description || '';
  editForm.logo_url    = current.value.logo_url    || '';
  editForm.folio_start = current.value.folio_start ?? 1;
  editForm.folio_end   = current.value.folio_end   ?? 70;
  editForm.max_players = current.value.max_players ?? 70;
};

const saveEdit = async () => {
  if (!current.value) return;
  const payload = { ...current.value, ...editForm, org_id: authStore.state.org?.id };
  await createOrUpdateClub(payload);
  await fetchClubById(route.params.clubId);
  syncEditForm();
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

const removeEditLogo = () => { editForm.logo_url = ''; };

const handleAddUser = async () => {
  await addUserToClub(route.params.clubId, { email: userEmail.value });
  userEmail.value = '';
  await fetchClubById(route.params.clubId);
};

const confirmRemoveUser = async (userId) => {
  if (!window.confirm('¿Quitar acceso a este usuario?')) return;
  await removeUserFromClub(route.params.clubId, userId);
  await fetchClubById(route.params.clubId);
};

// ── Active count ──────────────────────────────────────
const activeCount = computed(() => {
  if (current.value && current.value.active_players_count !== undefined) {
    return current.value.active_players_count;
  }
  return 0;
});

// ── Players ───────────────────────────────────────────
const playerFilters = ref({ q: '', category_id: null });
const playerPage    = ref(1);
const playerLimit   = 10;
// Tokens por página: índice 0 = página 1 (sin token), índice 1 = token para página 2, etc.
const pageTokens    = ref([null]);

const rosterItems    = playersStore.items;
const playersLoading = playersStore.loading;
const playersMeta    = playersStore.meta;

const filteredPlayers = computed(() => {
  if (!Array.isArray(rosterItems.value)) return [];
  return rosterItems.value.filter(item => {
    if (!item?.id) return false;
    if (playerFilters.value.category_id) {
      const cat = getPlayerCategory(item.player?.birth_date);
      if (!cat || cat.id !== playerFilters.value.category_id) return false;
    }
    return true;
  });
});

const playersByCategory = computed(() => {
  const items = filteredPlayers.value;
  if (!items.length) return [];

  // Grupos en el orden de las categorías configuradas
  const groups = categories.value.map(cat => ({ category: cat, players: [] }));
  const uncategorized = { category: null, players: [] };

  for (const item of items) {
    const cat = getPlayerCategory(item.player?.birth_date);
    if (cat) {
      const group = groups.find(g => g.category.id === cat.id);
      if (group) group.players.push(item);
    } else {
      uncategorized.players.push(item);
    }
  }

  const result = groups.filter(g => g.players.length > 0);
  if (uncategorized.players.length > 0) result.push(uncategorized);
  return result;
});

const getPlayerCategory = (birthDate) => {
  if (!birthDate || !categories.value.length) return null;
  const age = Math.floor((Date.now() - new Date(birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  return categories.value.find(cat => {
    const fromOk = cat.age_from == null || age >= cat.age_from;
    const toOk   = cat.age_to   == null || age <= cat.age_to;
    return fromOk && toOk;
  }) ?? null;
};

const fetchPlayers = async (token = null) => {
  const params = {
    ...playerFilters.value,
    status: 'ACTIVE',
    limit: playerLimit,
  };
  if (token) params.next_token = token;
  await playersStore.fetchPlayersByClub(route.params.clubId, params);
  // Guardar token de la página siguiente si existe
  if (playersMeta.value?.next_token) {
    pageTokens.value[playerPage.value] = playersMeta.value.next_token;
  }
};

const handlePlayerSearch = () => {
  playerPage.value = 1;
  pageTokens.value = [null];
  fetchPlayers();
};
const handlePlayerFilter = () => {
  playerPage.value = 1;
  pageTokens.value = [null];
  fetchPlayers();
};
const changePlayerPage = async (n) => {
  const token = pageTokens.value[n - 1] ?? null;
  playerPage.value = n;
  await fetchPlayers(token);
};

// ── Jugadores Inactivos ────────────────────────────────
const inactivePlayers = ref([]);
const inactiveLoading = ref(false);

const fetchInactivePlayers = async () => {
  inactiveLoading.value = true;
  try {
    const { listPlayersByClub } = await import('../services/players.service.js');
    const res = await listPlayersByClub(route.params.clubId, { status: 'INACTIVE', limit: 100 });
    inactivePlayers.value = res.data?.data ?? [];
  } catch (e) {
    console.error('[ClubDetail] fetchInactivePlayers error:', e);
  } finally {
    inactiveLoading.value = false;
  }
};

// ── Switch tab ────────────────────────────────────────
const switchTab = (key) => {
  activeTab.value = key;
  if (key === 'inactive_players' && inactivePlayers.value.length === 0) {
    fetchInactivePlayers();
  }
};

const togglePlayerStatus = async (item) => {
  const newStatus = item.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
  if (!confirm(`¿Deseas ${newStatus === 'ACTIVE' ? 'activar' : 'desactivar'} a este jugador?`)) return;
  try {
    await playersStore.updatePlayerStatus(route.params.clubId, item.player_id, { status: newStatus });
    await fetchClubById(route.params.clubId);
    await fetchPlayers();
  } catch (e) { /* handled in store */ }
};

// ── Categorías ────────────────────────────────────────
const categories   = ref([]);
const catLoading   = ref(false);
const catError     = ref(null);
const catFormVisible = ref(false);
const catEditing   = ref(null); // null = crear, object = editar

const catForm = reactive({
  name:        '',
  color:       '#6366f1',
  age_from:    null,
  age_to:      null,
  description: '',
});

const resetCatForm = () => {
  catForm.name        = '';
  catForm.color       = '#6366f1';
  catForm.age_from    = null;
  catForm.age_to      = null;
  catForm.description = '';
};

const openCategoryForm = (cat = null) => {
  catEditing.value = cat;
  if (cat) {
    catForm.name        = cat.name;
    catForm.color       = cat.color       ?? '#6366f1';
    catForm.age_from    = cat.age_from    ?? null;
    catForm.age_to      = cat.age_to      ?? null;
    catForm.description = cat.description ?? '';
  } else {
    resetCatForm();
  }
  catError.value = null;
  catFormVisible.value = true;
};

const closeCategoryForm = () => {
  catFormVisible.value = false;
  catEditing.value = null;
  resetCatForm();
};

const fetchCategories = async () => {
  catLoading.value = true;
  catError.value   = null;
  try {
    const res = await categoriesService.listCategories(route.params.clubId);
    categories.value = res.data?.data ?? [];
  } catch (e) {
    catError.value = e.response?.data?.error?.message || e.message || 'Error al cargar categorías';
  } finally {
    catLoading.value = false;
  }
};

const saveCategory = async () => {
  if (!catForm.name) return;
  catLoading.value = true;
  catError.value   = null;
  try {
    const payload = { ...catForm };
    if (!payload.age_from)    delete payload.age_from;
    if (!payload.age_to)      delete payload.age_to;
    if (!payload.description) delete payload.description;

    if (catEditing.value) {
      await categoriesService.updateCategory(route.params.clubId, catEditing.value.id, payload);
    } else {
      await categoriesService.createCategory(route.params.clubId, payload);
    }
    closeCategoryForm();
    await fetchCategories();
  } catch (e) {
    catError.value = e.response?.data?.error?.message || e.message || 'Error al guardar';
  } finally {
    catLoading.value = false;
  }
};

const removeCategory = async (cat) => {
  if (!confirm(`¿Eliminar la categoría "${cat.name}"?`)) return;
  catLoading.value = true;
  catError.value   = null;
  try {
    await categoriesService.deleteCategory(route.params.clubId, cat.id);
    await fetchCategories();
  } catch (e) {
    catError.value = e.response?.data?.error?.message || e.message || 'Error al eliminar';
  } finally {
    catLoading.value = false;
  }
};

// ── Traspasos ─────────────────────────────────────────
const outgoingTransfers = ref([]);
const incomingTransfers = ref([]);
const trLoading   = ref(false);
const trError     = ref(null);
const trFormVisible = ref(false);
const allClubs    = ref([]);

const trForm = reactive({
  player_id:  null,
  to_club_id: null,
  notes:      '',
});

const transferBadgeClass = (status) => ({
  'badge-warning': status === 'ENVIADO',
  'badge-success': status === 'ACEPTADO',
  'badge-danger':  status === 'RECHAZADO',
});

const fetchTransfers = async () => {
  trLoading.value = true;
  trError.value   = null;
  try {
    const res = await transfersService.listTransfers(route.params.clubId);
    outgoingTransfers.value = res.data?.outgoing ?? [];
    incomingTransfers.value = res.data?.incoming ?? [];
  } catch (e) {
    trError.value = e.response?.data?.error?.message || e.message || 'Error al cargar traspasos';
  } finally {
    trLoading.value = false;
  }
};

const fetchAllClubs = async () => {
  try {
    const { getClubs } = await import('../services/clubs.service.js');
    const orgId = current.value?.org_id;
    const r = await getClubs({ limit: 100, ...(orgId ? { org_id: orgId } : {}) });
    allClubs.value = (r.data?.data ?? []).filter(c => c.id !== route.params.clubId);
    console.log('[transfers] allClubs:', allClubs.value.length);
  } catch (e) {
    console.error('[transfers] fetchAllClubs error:', e);
  }
};

const submitTransfer = async () => {
  if (!trForm.player_id || !trForm.to_club_id) return;
  trLoading.value = true;
  trError.value   = null;
  try {
    await transfersService.createTransfer(route.params.clubId, { ...trForm });
    trFormVisible.value = false;
    trForm.player_id  = null;
    trForm.to_club_id = null;
    trForm.notes      = '';
    await fetchTransfers();
  } catch (e) {
    trError.value = e.response?.data?.error?.message || e.message || 'Error al enviar traspaso';
  } finally {
    trLoading.value = false;
  }
};

const aceptar = async (t) => {
  if (!confirm(`¿Aceptar el traspaso de ${t.player?.first_name} ${t.player?.last_name}?`)) return;
  trLoading.value = true;
  try {
    await transfersService.acceptTransfer(route.params.clubId, t.id);
    await Promise.all([fetchTransfers(), fetchPlayers(), fetchClubById(route.params.clubId)]);
  } catch (e) {
    trError.value = e.response?.data?.error?.message || e.message || 'Error al aceptar';
  } finally {
    trLoading.value = false;
  }
};

const rechazar = async (t) => {
  if (!confirm(`¿Rechazar el traspaso de ${t.player?.first_name} ${t.player?.last_name}?`)) return;
  trLoading.value = true;
  try {
    await transfersService.rejectTransfer(route.params.clubId, t.id);
    await fetchTransfers();
  } catch (e) {
    trError.value = e.response?.data?.error?.message || e.message || 'Error al rechazar';
  } finally {
    trLoading.value = false;
  }
};

const cancelar = async (t) => {
  if (!confirm(`¿Cancelar el traspaso de ${t.player?.first_name} ${t.player?.last_name}?`)) return;
  trLoading.value = true;
  try {
    await transfersService.cancelTransfer(route.params.clubId, t.id);
    await fetchTransfers();
  } catch (e) {
    trError.value = e.response?.data?.error?.message || e.message || 'Error al cancelar';
  } finally {
    trLoading.value = false;
  }
};

const formatDate = (val) => {
  if (!val) return '—';
  const d = new Date(val);
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
};

// ── Init ──────────────────────────────────────────────
const goBack = () => router.push('/clubs');

onMounted(async () => {
  await fetchClubById(route.params.clubId);
  syncEditForm();
  await Promise.all([fetchPlayers(), fetchCategories()]);
  fetchTransfers();
  fetchAllClubs();
});
</script>

<style scoped>
/* ── Folio config ── */
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
.folio-config-hint {
  font-size: 0.8rem;
  color: var(--text-muted);
  margin-top: -4px;
}

/* ── Tabs ── */
.club-tabs {
  display: flex;
  gap: 2px;
  border-bottom: 2px solid var(--border-color);
}

.club-tab {
  padding: var(--spacing-sm) var(--spacing-md);
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  cursor: pointer;
  color: var(--text-muted);
  font-size: 0.9rem;
  font-weight: 500;
  transition: color 0.15s, border-color 0.15s;
}

.club-tab:hover {
  color: var(--text-primary);
}

.club-tab-active {
  color: var(--color-primary);
  border-bottom-color: var(--color-primary);
}

/* ── Club card ── */
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
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
}

.club-logo-large img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.club-card-title h3 { margin-bottom: 0.2rem; }

/* ── Avatar ── */
.avatar-small {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  overflow: hidden;
  background: var(--bg-secondary);
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* ── Pagination ── */
.pagination-center {
  display: flex;
  justify-content: center;
  padding: var(--spacing-md);
  border-top: 1px solid var(--border-color);
}

/* ── Logo preview ── */
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

/* ── Users ── */
.users-table { display: flex; flex-direction: column; gap: 0.75rem; }

.user-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  border-radius: var(--radius-md);
  background: var(--bg-secondary);
}

.user-info { display: flex; flex-direction: column; }
.user-name { font-weight: 500; }

/* ── Categorías ── */
.cat-form {
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
  border: 1px solid var(--border-color);
}

.color-picker-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-xs);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background: var(--bg-primary);
}

.color-picker-input {
  width: 48px;
  height: 40px;
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  padding: 2px;
  background: none;
  flex-shrink: 0;
}

.color-picker-hex {
  font-size: 0.8rem;
  color: var(--text-muted);
  font-family: monospace;
  flex: 1;
}

.cat-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.cat-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-md);
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
}

.cat-color-bar {
  width: 4px;
  height: 40px;
  border-radius: 4px;
  flex-shrink: 0;
}

.cat-info {
  flex: 1;
  min-width: 0;
}

/* ── Category group header row ── */
.category-group-header td {
  background: var(--bg-secondary);
  padding: var(--spacing-xs) var(--spacing-md);
  border-top: 2px solid var(--border-color);
  font-size: 0.85rem;
}

.category-group-header:first-child td {
  border-top: none;
}
</style>
