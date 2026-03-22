<template>
  <div class="container mt-md">
    <!-- Header -->
    <div class="flex justify-between items-center mb-lg flex-wrap gap-md">
      <div class="flex items-center gap-md">
         <button class="btn btn-secondary btn-sm" @click="$router.push('/clubs')">
             &larr; Clubes
         </button>
         <h2>Jugadores <span v-if="club"> - {{ club.name }}</span></h2>
         <span v-if="club" class="badge" :class="activeCount >= 70 ? 'badge-danger' : 'badge-success'">
             Activos: {{ activeCount }} / 70
         </span>
      </div>
      <button
        class="btn btn-secondary"
        @click="$router.push(`/clubs/${clubId}/players/import`)"
      >
        📥 Importar Excel
      </button>
      <button
        class="btn btn-primary"
        @click="$router.push(`/clubs/${clubId}/players/new`)"
      >
        Nuevo Jugador
      </button>
    </div>

    <!-- Filters -->
    <div class="card mb-md p-md flex gap-md flex-wrap items-center">
        <div class="input-group flex-1" style="min-width: 200px;">
            <input 
                v-model="filters.q" 
                @input="handleSearch" 
                placeholder="Buscar por nombre o ID..." 
                class="input"
            />
        </div>
        <div class="input-group" style="min-width: 160px;">
            <select v-model="filters.category_id" @change="handleFilter" class="input">
                <option :value="null">Todas las categorías</option>
                <option v-for="cat in categories" :key="cat.id" :value="cat.id">
                    {{ cat.name }}
                </option>
            </select>
        </div>
    </div>

    <div v-if="error" class="alert alert-error mb-md">
      {{ error }}
    </div>

    <!-- Loading -->
    <div v-if="loading && filteredItems.length === 0" class="text-center py-lg">
        Cargando jugadores...
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredItems.length === 0" class="text-center py-lg card">
        No hay jugadores registrados en este club.
    </div>

    <!-- List -->
    <div v-else class="card p-0 overflow-hidden">
      <div class="table-container">
        <table class="table">
          <thead>
            <tr>
              <th>Folio</th>
              <th>Foto</th>
              <th>Nombre</th>
              <th>Categoría</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in filteredItems" :key="item.id">
              <td>{{ item.club_folio }}</td>
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
                <span class="badge" :class="item.status === 'ACTIVE' ? 'badge-success' : 'badge-secondary'">
                  {{ item.status }}
                </span>
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
                    Edit
                  </button>
                  <button
                    class="btn btn-sm"
                    :class="item.status === 'ACTIVE' ? 'btn-danger' : 'btn-success'"
                    @click="toggleStatus(item)"
                    title="Cambiar estado"
                  >
                    {{ item.status === 'ACTIVE' ? 'Desactivar' : 'Activar' }}
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
       <!-- Pagination -->
       <div class="pagination-center" v-if="items.length > 0">
           <div class="pagination">
                <button 
                    class="btn btn-secondary btn-sm" 
                    :disabled="page === 1"
                    @click="changePage(page - 1)"
                >
                    Anterior
                </button>
                 <span class="text-sm mx-md">Página {{ page }}</span>
                <button 
                    class="btn btn-secondary btn-sm" 
                    :disabled="!meta.next_token"
                    @click="changePage(page + 1)"
                >
                    Siguiente
                </button>
           </div>
       </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { usePlayersStore } from '../stores/players';
import { useClubsStore } from '../stores/clubs';
import { listCategories } from '../services/categories.service.js';

const route = useRoute();
const playersStore = usePlayersStore();
const clubsStore = useClubsStore();
const clubId = route.params.clubId;

const filters = ref({
    q: '',
    category_id: null,
});

const page = ref(1);

const club    = clubsStore.current;
const items   = playersStore.items;
const loading = playersStore.loading;
const error   = playersStore.error;
const meta    = playersStore.meta;

const filteredItems = computed(() => {
    if (!Array.isArray(items.value)) return [];
    return items.value.filter(item => {
        if (!item?.id) return false;
        if (filters.value.category_id) {
            const cat = getPlayerCategory(item.player?.birth_date);
            if (!cat || cat.id !== filters.value.category_id) return false;
        }
        return true;
    });
});

const playersByCategory = computed(() => {
    const list = Array.isArray(items.value) ? items.value.filter(i => i && i.id) : [];
    if (!list.length) return [];

    const groups = categories.value.map(cat => ({ category: cat, players: [] }));
    const uncategorized = { category: null, players: [] };

    for (const item of list) {
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

const activeCount = computed(() => {
    if (club.value && club.value.active_players_count !== undefined) {
        return club.value.active_players_count;
    }
    return 0; 
});

const categories = ref([]);

const getPlayerCategory = (birthDate) => {
    if (!birthDate || !categories.value.length) return null;
    const age = Math.floor((Date.now() - new Date(birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    return categories.value.find(cat => {
        const fromOk = cat.age_from == null || age >= cat.age_from;
        const toOk   = cat.age_to   == null || age <= cat.age_to;
        return fromOk && toOk;
    }) ?? null;
};

const loadData = async () => {
    try {
        await clubsStore.fetchClubById(clubId);
    } catch (e) {
        console.error('[ClubPlayers] fetchClubById error:', e);
    }
    try {
        const res = await listCategories(clubId);
        categories.value = res.data?.data ?? [];
    } catch (e) {
        console.error('[ClubPlayers] listCategories error:', e);
    }
    await fetchPlayers();
};

const fetchPlayers = async () => {
    const params = { ...filters.value, limit: 20 };
    try {
        await playersStore.fetchPlayersByClub(clubId, params);
    } catch (e) {
        console.error('[ClubPlayers] fetchPlayersByClub error:', e?.response?.data || e?.message);
    }
};

const handleSearch = () => {
    page.value = 1;
    fetchPlayers();
};

const handleFilter = () => {
    page.value = 1;
    fetchPlayers();
};

const changePage = (newPage) => {
    page.value = newPage;
    // Here we would ideally pass the next_token if moving forward
    // For now re-fetching. Real implementation depends on backend pagination style.
    fetchPlayers();
};

const toggleStatus = async (item) => {
    const newStatus = item.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    if (!confirm(`¿Estás seguro de que deseas ${newStatus === 'ACTIVE' ? 'activar' : 'desactivar'} a este jugador?`)) return;
    try {
        await playersStore.updatePlayerStatus(clubId, item.player_id, { status: newStatus });
        await fetchPlayers();
    } catch (e) {
        // Error handled in store
    }
};

onMounted(() => {
    loadData();
});
</script>

<style scoped>
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
.pagination-center {
    display: flex;
    justify-content: center;
    padding: var(--spacing-md);
    border-top: 1px solid var(--border-color);
}

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
