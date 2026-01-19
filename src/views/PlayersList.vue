<template>
  <div class="container mt-md">
    <div class="flex justify-between items-center mb-lg">
      <h2>Jugadores</h2>
      <button class="btn btn-primary" @click="startCreate">
        Nuevo Jugador
      </button>
    </div>

    <div v-if="error" class="alert alert-error">
      {{ error }}
    </div>

    <div class="card mb-lg">
      <form @submit.prevent="savePlayer">
        <div class="flex flex-col gap-md">
          <div class="input-group">
            <label class="label">Nombre completo</label>
            <input v-model="form.full_name" class="input" required />
          </div>
          <div class="input-group">
            <label class="label">Documento</label>
            <input v-model="form.document" class="input" />
          </div>
          <div class="flex gap-md">
            <div class="input-group" style="flex:1;">
              <label class="label">Categoría</label>
              <input v-model="form.category" class="input" />
            </div>
            <div class="input-group" style="flex:1;">
              <label class="label">Posición</label>
              <input v-model="form.position" class="input" />
            </div>
            <div class="input-group" style="flex:0.5;">
              <label class="label">Número</label>
              <input v-model.number="form.number" type="number" class="input" min="0" />
            </div>
          </div>
        </div>
        <div class="flex justify-between items-center mt-md">
          <span class="text-muted text-sm">
            {{ form.id ? 'Editar jugador' : 'Crear nuevo jugador' }}
          </span>
          <div class="flex gap-sm">
            <button type="button" class="btn btn-secondary" @click="resetForm">
              Cancelar
            </button>
            <button type="submit" class="btn btn-primary" :disabled="loading">
              {{ loading ? 'Guardando...' : 'Guardar' }}
            </button>
          </div>
        </div>
      </form>
    </div>

    <div class="card mb-lg">
      <div class="flex flex-col gap-md">
        <div class="flex gap-md">
          <div class="input-group" style="flex:1;">
            <label class="label">Filtrar por club</label>
            <input v-model="filters.clubId" class="input" placeholder="ID club" />
          </div>
          <div class="input-group" style="flex:1;">
            <label class="label">Categoría</label>
            <input v-model="filters.category" class="input" />
          </div>
        </div>
        <div class="flex justify-between items-center">
          <span class="text-muted text-sm">Filtros</span>
          <div class="flex gap-sm">
            <button class="btn btn-secondary" @click="clearFilters">
              Limpiar
            </button>
            <button class="btn btn-primary" @click="applyFilters">
              Aplicar
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="players-list">
      <div
        v-for="player in items"
        :key="player.id"
        class="card player-card"
        @click="goToDetail(player.id)"
      >
        <div class="flex justify-between items-center mb-md">
          <div>
            <h3>{{ player.full_name }}</h3>
            <p class="text-muted text-sm">{{ player.position }} · {{ player.category }}</p>
          </div>
          <div class="player-number">
            {{ player.number || '-' }}
          </div>
        </div>
        <div class="flex justify-between items-center text-sm">
          <span class="badge" :class="statusClass(player.status)">
            {{ player.status || 'ACTIVE' }}
          </span>
          <span class="text-muted">
            {{ player.club_name || 'Sin club' }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { usePlayersStore } from '../stores/players';

const router = useRouter();
const { items, loading, error, fetchPlayers, createOrUpdatePlayer, setFilters } = usePlayersStore();

const form = reactive({
  id: null,
  full_name: '',
  document: '',
  category: '',
  position: '',
  number: null,
});

const filters = reactive({
  clubId: '',
  category: '',
});

const loadPlayers = async () => {
  await fetchPlayers();
};

const resetForm = () => {
  form.id = null;
  form.full_name = '';
  form.document = '';
  form.category = '';
  form.position = '';
  form.number = null;
};

const startCreate = () => {
  resetForm();
};

const savePlayer = async () => {
  const payload = { ...form };
  await createOrUpdatePlayer(payload);
  resetForm();
  await loadPlayers();
};

const clearFilters = () => {
  filters.clubId = '';
  filters.category = '';
  playersStore.setFilters({ clubId: null, category: null });
  loadPlayers();
};

const applyFilters = () => {
  playersStore.setFilters({
    clubId: filters.clubId || null,
    category: filters.category || null,
  });
  loadPlayers();
};

const goToDetail = (id) => {
  router.push(`/players/${id}`);
};

const statusClass = (status) => {
  if (status === 'LOAN') return 'status-loan';
  if (status === 'INACTIVE') return 'status-inactive';
  return 'status-active';
};

onMounted(() => {
  loadPlayers();
});
</script>

<style scoped>
.players-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1rem;
}

.player-card {
  cursor: pointer;
  transition: transform var(--transition-fast), box-shadow var(--transition-fast);
}

.player-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-glow);
}

.player-number {
  width: 40px;
  height: 40px;
  border-radius: 9999px;
  background: var(--bg-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
}

.badge {
  padding: 0.25rem 0.75rem;
  border-radius: var(--radius-full);
  font-size: 0.75rem;
}

.status-active {
  background: rgba(16, 185, 129, 0.15);
  color: #6ee7b7;
}

.status-inactive {
  background: rgba(148, 163, 184, 0.2);
  color: #cbd5e1;
}

.status-loan {
  background: rgba(59, 130, 246, 0.2);
  color: #93c5fd;
}

@media (max-width: 640px) {
  .players-list {
    grid-template-columns: 1fr;
  }
}
</style>

