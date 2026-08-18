<template>
  <div class="container mt-md">
    <div class="flex justify-between items-center mb-lg">
      <h2>Torneos</h2>
      <button class="btn" :class="viewMode === 'list' ? 'btn-primary' : 'btn-secondary'" @click="toggleViewMode">
        {{ viewMode === 'list' ? 'Nuevo Torneo' : 'Volver al listado' }}
      </button>
    </div>

    <div v-if="error" class="alert alert-error">{{ error }}</div>

    <!-- Formulario de creación -->
    <div v-if="viewMode === 'form'" class="mb-lg card">
      <h3 class="mb-md">Nuevo Torneo</h3>
      <form @submit.prevent="saveTournament">
        <div class="flex flex-col gap-md">
          <div class="input-group">
            <label class="label">Nombre del torneo *</label>
            <input v-model="form.name" class="input" required />
          </div>

          <div class="form-row-2">
            <div class="input-group">
              <label class="label">Formato *</label>
              <select v-model="form.format" class="input" required>
                <option value="ROUND_ROBIN">Todos contra Todos</option>
                <option value="KNOCKOUT">Eliminación Directa (Playoffs)</option>
                <option value="GROUPS_KNOCKOUT">Formato Mixto (Grupos + Playoffs)</option>
              </select>
            </div>
            <div class="input-group">
              <label class="label">Temporada</label>
              <input v-model="form.season" class="input" placeholder="2026" />
            </div>
          </div>

          <div class="form-row-2">
            <div class="input-group">
              <label class="label">Fecha de inicio</label>
              <input v-model="form.start_date" type="date" class="input" />
            </div>
            <div class="input-group">
              <label class="label">Fecha de término</label>
              <input v-model="form.end_date" type="date" class="input" />
            </div>
          </div>

          <div class="input-group" v-if="form.format !== 'KNOCKOUT'">
            <label class="label">Ida y vuelta</label>
            <select v-model="form.rounds_type" class="input">
              <option value="SINGLE">Rueda simple</option>
              <option value="DOUBLE">Ida y vuelta</option>
            </select>
          </div>

          <div class="folio-config-row">
            <div class="input-group">
              <label class="label">Puntos por Victoria</label>
              <input v-model.number="form.points_win" type="number" min="0" class="input" />
            </div>
            <div class="input-group">
              <label class="label">Puntos por Empate</label>
              <input v-model.number="form.points_draw" type="number" min="0" class="input" />
            </div>
            <div class="input-group">
              <label class="label">Puntos por Derrota</label>
              <input v-model.number="form.points_loss" type="number" min="0" class="input" />
            </div>
          </div>

          <div class="form-row-2" v-if="form.format === 'GROUPS_KNOCKOUT'">
            <div class="input-group">
              <label class="label">Cantidad de grupos</label>
              <input v-model.number="form.group_count" type="number" min="2" class="input" />
            </div>
            <div class="input-group">
              <label class="label">Clasifican por grupo</label>
              <input v-model.number="form.teams_advance_per_group" type="number" min="1" class="input" />
            </div>
          </div>

          <div class="folio-config-row" v-if="form.format !== 'ROUND_ROBIN'">
            <label class="checkbox-row">
              <input type="checkbox" v-model="form.two_legged_knockout" />
              Playoffs a ida y vuelta
            </label>
            <label class="checkbox-row">
              <input type="checkbox" v-model="form.has_third_place_match" />
              Partido por el 3er lugar
            </label>
            <label class="checkbox-row">
              <input type="checkbox" v-model="form.has_consolation" />
              Liguilla / Ronda de consuelo
            </label>
          </div>

          <div class="input-group" v-if="form.has_consolation">
            <label class="label">Nombre de la liguilla</label>
            <input v-model="form.consolation_name" class="input" placeholder="Liguilla" />
          </div>

          <div class="input-group">
            <label class="label">Notas</label>
            <textarea v-model="form.notes" class="input" rows="2" />
          </div>
        </div>
        <div class="flex justify-between items-center mt-md">
          <span class="text-muted text-sm">* Campos requeridos</span>
          <div class="flex gap-sm">
            <button type="button" class="btn btn-secondary" @click="cancelForm">Cancelar</button>
            <button type="submit" class="btn btn-primary" :disabled="loading">
              {{ loading ? 'Guardando...' : 'Crear Torneo' }}
            </button>
          </div>
        </div>
      </form>
    </div>

    <!-- Listado -->
    <template v-if="viewMode === 'list'">
      <div class="card p-0">
        <div class="flex justify-between items-center p-md" style="border-bottom: 1px solid var(--border-color);">
          <h3 class="m-0">Todos los torneos</h3>
          <span class="text-muted text-sm">{{ items.length }} en total</span>
        </div>

        <div class="table-container">
          <table class="table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Formato</th>
                <th>Temporada</th>
                <th class="text-center">Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="loading && items.length === 0">
                <td colspan="5" class="text-center py-lg">Cargando...</td>
              </tr>
              <tr v-else-if="items.length === 0">
                <td colspan="5" class="text-center py-lg">Aún no hay torneos creados.</td>
              </tr>
              <tr v-for="tournament in items" :key="tournament.id" class="clickable-row" @click="openTournament(tournament.id)">
                <td><span class="font-medium">{{ tournament.name }}</span></td>
                <td>{{ formatLabel(tournament.format) }}</td>
                <td>{{ tournament.season || '—' }}</td>
                <td class="text-center">
                  <span class="status-badge" :class="`status-badge--${tournament.status?.toLowerCase()}`">
                    {{ statusLabel(tournament.status) }}
                  </span>
                </td>
                <td>
                  <div class="flex gap-sm">
                    <button class="btn btn-sm btn-secondary" @click.stop="openTournament(tournament.id)">Administrar</button>
                    <button class="btn btn-sm btn-danger" @click.stop="confirmDelete(tournament)">Eliminar</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useTournamentsStore } from '../stores/tournaments';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const { items, loading, error, fetchTournaments, createOrUpdateTournament, removeTournament } = useTournamentsStore();
const authStore = useAuthStore();

const viewMode = ref('list');

const FORMAT_LABELS = {
  ROUND_ROBIN: 'Todos contra Todos',
  KNOCKOUT: 'Eliminación Directa',
  GROUPS_KNOCKOUT: 'Formato Mixto',
};

const STATUS_LABELS = {
  DRAFT: 'Borrador',
  REGISTRATION: 'Inscripciones',
  IN_PROGRESS: 'En curso',
  FINISHED: 'Finalizado',
  CANCELLED: 'Cancelado',
};

const formatLabel = (v) => FORMAT_LABELS[v] || v;
const statusLabel = (v) => STATUS_LABELS[v] || v;

const defaultForm = () => ({
  name: '',
  format: 'ROUND_ROBIN',
  season: '',
  start_date: '',
  end_date: '',
  rounds_type: 'SINGLE',
  points_win: 3,
  points_draw: 1,
  points_loss: 0,
  group_count: 2,
  teams_advance_per_group: 2,
  two_legged_knockout: false,
  has_third_place_match: false,
  has_consolation: false,
  consolation_name: 'Liguilla',
  notes: '',
});

const form = reactive(defaultForm());

const loadTournaments = async () => {
  await fetchTournaments({ org_id: authStore.state.org?.id, limit: 100 });
};

const toggleViewMode = () => {
  if (viewMode.value === 'list') {
    Object.assign(form, defaultForm());
    viewMode.value = 'form';
  } else {
    cancelForm();
  }
};

const cancelForm = () => {
  Object.assign(form, defaultForm());
  viewMode.value = 'list';
};

const saveTournament = async () => {
  const payload = { ...form, org_id: authStore.state.org?.id };
  try {
    const tournament = await createOrUpdateTournament(payload);
    viewMode.value = 'list';
    router.push(`/tournaments/${tournament.id}`);
  } catch (e) {
    // Error manejado en el store
  }
};

const confirmDelete = async (tournament) => {
  if (!confirm(`¿Eliminar el torneo "${tournament.name}"? Esta acción no se puede deshacer.`)) return;
  try {
    await removeTournament(tournament.id);
  } catch (e) {
    // Error manejado en el store
  }
};

const openTournament = (tournamentId) => router.push(`/tournaments/${tournamentId}`);

onMounted(() => {
  loadTournaments();
});
</script>

<style scoped>
.form-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.folio-config-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }

.checkbox-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.875rem;
  color: var(--text-secondary, var(--text-muted));
}

.font-medium { font-weight: 500; }
.p-0 { padding: 0 !important; }
.py-lg { padding-top: var(--spacing-lg); padding-bottom: var(--spacing-lg); }

.clickable-row { cursor: pointer; }
.clickable-row:hover { background: var(--surface-hover, rgba(255,255,255,0.03)); }

.btn-sm { padding: 0.4rem 0.8rem; font-size: 0.875rem; }

.status-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.2rem 0.6rem;
  border-radius: var(--radius-full);
  font-size: 0.75rem;
  font-weight: 700;
}
.status-badge--draft        { background: rgba(255, 255, 255, 0.08); color: var(--text-muted); }
.status-badge--registration { background: rgba(79, 195, 247, 0.16); color: #4fc3f7; }
.status-badge--in_progress  { background: rgba(0, 230, 118, 0.14); color: var(--primary-solid, #00e676); }
.status-badge--finished     { background: rgba(255, 213, 79, 0.16); color: #ffd54f; }
.status-badge--cancelled    { background: rgba(239, 83, 80, 0.14); color: #ef5350; }
</style>
