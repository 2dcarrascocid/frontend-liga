<template>
  <div class="container mt-md">
    <div class="flex justify-between items-center mb-lg">
      <h2>{{ current?.name || 'Torneo' }}</h2>
      <button class="btn btn-secondary" @click="$router.push('/tournaments')">&larr; Torneos</button>
    </div>

    <div v-if="error" class="alert alert-error mb-md">{{ error }}</div>

    <div v-if="current" class="card mb-md">
      <div class="flex justify-between items-center flex-wrap gap-md">
        <div>
          <span class="status-badge" :class="`status-badge--${current.status?.toLowerCase()}`">{{ statusLabel(current.status) }}</span>
          <span class="type-badge" :class="`type-badge--${current.type?.toLowerCase()}`">{{ typeLabel(current.type) }}</span>
          <p class="text-muted text-sm mt-sm mb-0">
            {{ formatLabel(current.format) }} · {{ current.season?.name || 'Sin temporada' }} ·
            {{ current.teams_count }} equipo(s) inscrito(s)
          </p>
        </div>
        <div class="flex gap-sm flex-wrap">
          <button class="btn btn-sm btn-secondary" @click="$router.push(`/tournaments/${tournamentId}/fixture`)">Ver Fixture</button>
          <button class="btn btn-sm btn-secondary" @click="$router.push(`/tournaments/${tournamentId}/standings`)">Tabla de Posiciones</button>
          <button class="btn btn-sm btn-secondary" @click="$router.push(`/tournaments/${tournamentId}/top-scorers`)">Goleadores</button>
          <button class="btn btn-sm btn-secondary" @click="$router.push(`/tournaments/${tournamentId}/fairplay`)">Fairplay</button>
        </div>
      </div>
    </div>

    <!-- Acciones de sorteo / fixture -->
    <div class="card mb-md">
      <h3 class="mb-md">Sorteo y Fixture</h3>
      <div class="flex gap-sm flex-wrap items-center">
        <button class="btn btn-primary" :disabled="loading || teams.length < 2" @click="onGenerateFixture(false)">
          Generar Sorteo / Fixture
        </button>
        <button class="btn btn-secondary" :disabled="loading" @click="onGenerateFixture(true)">
          Regenerar (force)
        </button>
        <button
          v-if="current?.format === 'GROUPS_KNOCKOUT'"
          class="btn btn-secondary"
          :disabled="loading"
          @click="onGenerateKnockout"
        >
          Generar Playoffs desde Grupos
        </button>
        <button
          v-if="current?.has_consolation"
          class="btn btn-secondary"
          :disabled="loading"
          @click="onGenerateConsolation"
        >
          Generar {{ current.consolation_name || 'Liguilla' }}
        </button>
      </div>
      <p class="text-muted text-sm mt-sm mb-0">
        Se requieren al menos 2 equipos inscritos. El sorteo arma automáticamente las jornadas y partidos según el formato del torneo.
      </p>
    </div>

    <!-- Equipos inscritos -->
    <div class="card">
      <h3 class="mb-md">Equipos Inscritos</h3>

      <form class="team-register-row" @submit.prevent="onRegisterTeam">
        <div class="input-group flex-1 series-search">
          <label class="label">Serie (Club — Serie)</label>
          <input
            v-model="seriesQuery"
            class="input"
            placeholder="Buscar serie por nombre..."
            autocomplete="off"
            required
            @input="onSeriesSearch"
            @focus="onSeriesSearch"
          />
          <div v-if="seriesResults.length > 0" class="series-search__dropdown">
            <button
              v-for="s in seriesResults"
              :key="s.id"
              type="button"
              class="series-search__item"
              @click="selectSeries(s)"
            >
              {{ s.club?.name }} — {{ s.name }}
            </button>
          </div>
        </div>
        <div class="input-group" style="max-width: 140px;">
          <label class="label">Grupo</label>
          <input v-model="teamForm.group_name" class="input" placeholder="A" />
        </div>
        <div class="input-group" style="max-width: 120px;">
          <label class="label">Seed</label>
          <input v-model.number="teamForm.seed" type="number" min="1" class="input" />
        </div>
        <button type="submit" class="btn btn-primary" style="align-self: flex-end;" :disabled="!teamForm.series_id">Inscribir</button>
      </form>

      <div class="table-container mt-md">
        <table class="table">
          <thead>
            <tr>
              <th>Club — Serie</th>
              <th>Grupo</th>
              <th>Seed</th>
              <th class="text-center">Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="teams.length === 0">
              <td colspan="5" class="text-center py-lg">Aún no hay equipos inscritos.</td>
            </tr>
            <tr v-for="team in teams" :key="team.id">
              <td class="font-medium">{{ team.series?.club?.name }} — {{ team.series?.name }}</td>
              <td>{{ team.group_name || '—' }}</td>
              <td>{{ team.seed ?? '—' }}</td>
              <td class="text-center">
                <span class="status-badge" :class="`status-badge--team-${team.status?.toLowerCase()}`">{{ teamStatusLabel(team.status) }}</span>
              </td>
              <td>
                <button class="btn btn-sm btn-danger" @click="onRemoveTeam(team)">Quitar</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useTournamentsStore } from '../stores/tournaments';
import { useAuthStore } from '../stores/auth';
import { useNotifyStore } from '../stores/notify';
import { useClubSeriesStore } from '../stores/clubSeries';

const route = useRoute();
const tournamentId = route.params.tournamentId;

const { current, teams, loading, error, fetchTournamentById, fetchTeams, addTeam, removeTeam, runGenerateFixture, runGenerateKnockoutFromGroups, runGenerateConsolation } = useTournamentsStore();
const authStore = useAuthStore();
const { notifySuccess } = useNotifyStore();
const { searchResults: seriesResults, searchAllSeries } = useClubSeriesStore();

const seriesQuery = ref('');

const FORMAT_LABELS = {
  ROUND_ROBIN: 'Todos contra Todos',
  KNOCKOUT: 'Eliminación Directa',
  GROUPS_KNOCKOUT: 'Formato Mixto',
};
const STATUS_LABELS = {
  DRAFT: 'Borrador', REGISTRATION: 'Inscripciones', IN_PROGRESS: 'En curso', FINISHED: 'Finalizado', CANCELLED: 'Cancelado',
};
const TEAM_STATUS_LABELS = {
  ACTIVE: 'Activo', ELIMINATED: 'Eliminado', WITHDRAWN: 'Retirado', CHAMPION: 'Campeón',
};
const TYPE_LABELS = {
  OFICIAL: 'Oficial', AMISTOSO: 'Amistoso',
};

const formatLabel = (v) => FORMAT_LABELS[v] || v;
const statusLabel = (v) => STATUS_LABELS[v] || v;
const teamStatusLabel = (v) => TEAM_STATUS_LABELS[v] || v;
const typeLabel = (v) => TYPE_LABELS[v] || v;

const teamForm = reactive({ series_id: '', group_name: '', seed: null });

const loadAll = async () => {
  await Promise.all([
    fetchTournamentById(tournamentId),
    fetchTeams(tournamentId),
  ]);
};

const onSeriesSearch = async () => {
  await searchAllSeries({ org_id: authStore.state.org?.id, q: seriesQuery.value });
};

const selectSeries = (series) => {
  teamForm.series_id = series.id;
  seriesQuery.value = `${series.club?.name} — ${series.name}`;
  seriesResults.value = [];
};

const onRegisterTeam = async () => {
  try {
    await addTeam(tournamentId, teamForm);
    teamForm.series_id = '';
    teamForm.group_name = '';
    teamForm.seed = null;
    seriesQuery.value = '';
  } catch (e) {
    // Error manejado en el store
  }
};

const onRemoveTeam = async (team) => {
  if (!confirm(`¿Quitar a "${team.series?.club?.name} — ${team.series?.name}" del torneo?`)) return;
  try {
    await removeTeam(tournamentId, team.id);
  } catch (e) {
    // Error manejado en el store
  }
};

const onGenerateFixture = async (force) => {
  try {
    const result = await runGenerateFixture(tournamentId, { force });
    notifySuccess(`Fixture generado: ${result.matchesCreated} partido(s) creados.`);
    await fetchTournamentById(tournamentId);
  } catch (e) {
    // Error manejado en el store
  }
};

const onGenerateKnockout = async () => {
  try {
    const result = await runGenerateKnockoutFromGroups(tournamentId, {});
    notifySuccess(`Llave de playoffs generada: ${result.matchesCreated} partido(s) creados.`);
  } catch (e) {
    // Error manejado en el store
  }
};

const onGenerateConsolation = async () => {
  try {
    const result = await runGenerateConsolation(tournamentId, {});
    notifySuccess(`Liguilla generada: ${result.matchesCreated} partido(s) creados.`);
  } catch (e) {
    // Error manejado en el store
  }
};

onMounted(() => {
  loadAll();
});
</script>

<style scoped>
.team-register-row {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  flex-wrap: wrap;
}
.flex-1 { flex: 1; min-width: 220px; }

.series-search { position: relative; }
.series-search__dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 20;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  max-height: 240px;
  overflow-y: auto;
  margin-top: 4px;
}
.series-search__item {
  display: block;
  width: 100%;
  text-align: left;
  padding: 0.6rem 0.9rem;
  background: none;
  border: none;
  color: var(--text-primary);
  cursor: pointer;
  font-size: 0.9rem;
}
.series-search__item:hover { background: var(--bg-hover); }
.font-medium { font-weight: 500; }
.py-lg { padding-top: var(--spacing-lg); padding-bottom: var(--spacing-lg); }
.btn-sm { padding: 0.4rem 0.8rem; font-size: 0.875rem; }

.status-badge {
  display: inline-flex; align-items: center; justify-content: center;
  padding: 0.2rem 0.6rem; border-radius: var(--radius-full);
  font-size: 0.75rem; font-weight: 700;
}
.status-badge--draft        { background: rgba(255, 255, 255, 0.08); color: var(--text-muted); }
.status-badge--registration { background: rgba(79, 195, 247, 0.16); color: #4fc3f7; }
.status-badge--in_progress  { background: rgba(0, 230, 118, 0.14); color: var(--primary-solid, #00e676); }
.status-badge--finished     { background: rgba(255, 213, 79, 0.16); color: #ffd54f; }
.status-badge--cancelled    { background: rgba(239, 83, 80, 0.14); color: #ef5350; }

.status-badge--team-active     { background: rgba(0, 230, 118, 0.14); color: var(--primary-solid, #00e676); }
.status-badge--team-eliminated { background: rgba(239, 83, 80, 0.14); color: #ef5350; }
.status-badge--team-withdrawn  { background: rgba(255, 255, 255, 0.08); color: var(--text-muted); }
.status-badge--team-champion   { background: rgba(255, 213, 79, 0.16); color: #ffd54f; }

.type-badge {
  display: inline-flex; align-items: center; justify-content: center;
  padding: 0.2rem 0.6rem; border-radius: var(--radius-full);
  font-size: 0.75rem; font-weight: 700; margin-left: 8px;
}
.type-badge--oficial  { background: rgba(0, 230, 118, 0.14); color: var(--primary-solid, #00e676); }
.type-badge--amistoso { background: rgba(79, 195, 247, 0.16); color: #4fc3f7; }
</style>
