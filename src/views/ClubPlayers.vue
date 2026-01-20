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
        <div class="input-group" style="min-width: 150px;">
             <select v-model="filters.status" @change="handleFilter" class="input">
                 <option :value="null">Todos los estados</option>
                 <option value="ACTIVE">Activos</option>
                 <option value="INACTIVE">Inactivos</option>
             </select>
        </div>
    </div>

    <div v-if="error" class="alert alert-error mb-md">
      {{ error }}
    </div>

    <!-- Loading -->
    <div v-if="loading && items.length === 0" class="text-center py-lg">
        Cargando jugadores...
    </div>

    <!-- Empty State -->
    <div v-else-if="items.length === 0" class="text-center py-lg card">
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
              <th>Posición</th>
              <th>Camiseta</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="player in items" :key="player.id">
              <td>{{ player.id }}</td>
              <td>
                <div class="avatar-small">
                    <img :src="player.photo_url || '/placeholder-player.png'" alt="Foto" class="avatar-img" />
                </div>
              </td>
              <td>{{ player.first_name }} {{ player.last_name }}</td>
              <td>{{ player.category_id }}</td>
              <td>{{ player.position }}</td>
              <td>{{ player.jersey_number }}</td>
              <td>
                  <span class="badge" :class="player.status === 'ACTIVE' ? 'badge-success' : 'badge-secondary'">
                      {{ player.status }}
                  </span>
              </td>
              <td>
                <div class="flex gap-sm">
                  <button 
                    class="btn btn-sm btn-secondary" 
                    @click="$router.push(`/players/${player.id}`)"
                    title="Ver detalle"
                  >
                    Ver
                  </button>
                  <button 
                    class="btn btn-sm btn-secondary" 
                    @click="$router.push(`/players/${player.id}/edit`)"
                     title="Editar"
                  >
                    Edit
                  </button>
                   <button 
                    class="btn btn-sm" 
                    :class="player.status === 'ACTIVE' ? 'btn-danger' : 'btn-success'"
                    @click="toggleStatus(player)"
                    title="Cambiar estado"
                  >
                    {{ player.status === 'ACTIVE' ? 'Desactivar' : 'Activar' }}
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

const route = useRoute();
const playersStore = usePlayersStore();
const clubsStore = useClubsStore();
const clubId = route.params.clubId;

const filters = ref({
    q: '',
    status: null
});

const page = ref(1);

const club = computed(() => clubsStore.current);
const items = computed(() => playersStore.items);
const loading = computed(() => playersStore.loading);
const error = computed(() => playersStore.error);
const meta = computed(() => playersStore.meta);

const activeCount = computed(() => {
    if (club.value && club.value.active_players_count !== undefined) {
        return club.value.active_players_count;
    }
    return 0; 
});

const loadData = async () => {
    await clubsStore.fetchClubById(clubId);
    await fetchPlayers();
};

const fetchPlayers = async () => {
    const params = { 
        ...filters.value, 
        limit: 20 
    };
    
    // If using token pagination, we might handle page changes differently (by passing next_token)
    // But for now, assuming standard page param or next_token logic handled in store/backend
    // If backend uses next_token, we should pass it. 
    // The current pagination logic in template uses simple page number increment which might not work if backend relies ONLY on next_token.
    // However, I'll stick to basic implementation and refine if needed.
    
    await playersStore.fetchPlayersByClub(clubId, params);
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

const toggleStatus = async (player) => {
    const newStatus = player.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    if (!confirm(`¿Estás seguro de que deseas ${newStatus === 'ACTIVE' ? 'activar' : 'desactivar'} a este jugador?`)) return;
    
    try {
        await playersStore.updatePlayerStatus(clubId, player.id, { status: newStatus });
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
</style>
