<template>
  <div class="container mt-md">
    <div class="flex justify-between items-center mb-lg">
      <h2>Series — {{ club?.name || '' }}</h2>
      <button class="btn btn-secondary" @click="$router.push(`/clubs/${clubId}`)">&larr; Club</button>
    </div>

    <div v-if="error" class="alert alert-error mb-md">{{ error }}</div>

    <!-- Alta de serie -->
    <div class="card mb-md">
      <h3 class="mb-md">Nueva Serie</h3>
      <form class="series-row" @submit.prevent="onCreateSeries">
        <div class="input-group flex-1">
          <label class="label">Nombre de la serie</label>
          <input v-model="newSeries.name" class="input" placeholder="Serie Honor" required />
        </div>
        <div class="input-group flex-2">
          <label class="label">Descripción</label>
          <textarea v-model="newSeries.description" class="input" rows="1" placeholder="Ej: Serie Honor - jugadores mayores de 18 años" />
        </div>
        <div class="input-group">
          <label class="label">Edad</label>
          <input v-model.number="newSeries.min_age" type="number" min="1" max="100" class="input" placeholder="Ej: 15" style="width: 90px;" />
        </div>
        <div class="input-group">
          <label class="label">Restricción de año</label>
          <select v-model="newSeries.age_restriction" class="input" style="width: 140px;">
            <option :value="true">Sí (edad cumplida)</option>
            <option :value="false">No (por año de nacimiento)</option>
          </select>
        </div>
        <button type="submit" class="btn btn-primary" style="align-self: flex-end;">Crear Serie</button>
      </form>
      <p class="text-muted text-sm mt-sm">
        <strong>Restricción de año = Sí:</strong> el jugador debe tener la edad cumplida (edad real) para jugar.
        <strong>Restricción de año = No:</strong> la elegibilidad se calcula por año de nacimiento, usando la Edad como parámetro (categoría por año, sin exigir cumpleaños).
      </p>
    </div>

    <div class="content-cols">
      <!-- Listado de series -->
      <div class="card">
        <h3 class="mb-md">Series del Club</h3>
        <div class="table-container">
          <table class="table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Edad</th>
                <th>Restricción de año</th>
                <th class="text-center">Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="items.length === 0">
                <td colspan="5" class="text-center py-lg">Este club aún no tiene series creadas.</td>
              </tr>
              <tr
                v-for="series in items"
                :key="series.id"
                class="clickable-row"
                :class="{ 'row--selected': selectedSeries?.id === series.id }"
                @click="selectSeries(series)"
              >
                <td class="font-medium">
                  {{ series.name }}
                  <div v-if="series.description" class="text-muted text-sm">{{ series.description }}</div>
                </td>
                <td>{{ series.min_age ?? '—' }}</td>
                <td>{{ series.age_restriction ? 'Sí (edad cumplida)' : 'No (por año)' }}</td>
                <td class="text-center">
                  <span class="status-badge" :class="series.active ? 'status-badge--active' : 'status-badge--inactive'">
                    {{ series.active ? 'Activa' : 'Inactiva' }}
                  </span>
                </td>
                <td>
                  <button class="btn btn-sm btn-danger" @click.stop="onDeleteSeries(series)">Eliminar</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Nómina de la serie seleccionada -->
      <div class="card">
        <h3 class="mb-md">Nómina — {{ selectedSeries?.name || 'Selecciona una serie' }}</h3>

        <template v-if="selectedSeries">
          <form class="series-row mb-md" @submit.prevent="onAssignPlayer">
            <div class="input-group flex-1">
              <label class="label">Agregar jugador del club</label>
              <select v-model="playerToAssign" class="input">
                <option value="" disabled>Selecciona un jugador</option>
                <option v-for="p in unassignedClubPlayers" :key="p.id" :value="p.id">
                  {{ p.first_name }} {{ p.last_name }} ({{ playerAgeLabel(p.birth_date) }})
                </option>
              </select>
            </div>
            <button type="submit" class="btn btn-primary" :disabled="!playerToAssign">Asignar</button>
          </form>
          <p v-if="selectedSeries.min_age" class="text-muted text-sm mb-md">
            Edad mínima de la serie: {{ selectedSeries.min_age }} ({{ selectedSeries.age_restriction ? 'edad cumplida' : 'por año de nacimiento' }}).
            Solo se listan jugadores del club que cumplen este requisito.
          </p>

          <div class="table-container">
            <table class="table">
              <thead>
                <tr><th>Jugador</th><th>Posición</th><th>Estado</th><th></th></tr>
              </thead>
              <tbody>
                <tr v-if="roster.length === 0">
                  <td colspan="4" class="text-center py-lg">Sin jugadores asignados a esta serie.</td>
                </tr>
                <tr v-for="r in roster" :key="r.id">
                  <td>
                    {{ r.player?.first_name }} {{ r.player?.last_name }} ({{ playerAgeLabel(r.player?.birth_date) }})
                  </td>
                  <td>{{ r.player?.position || '—' }}</td>
                  <td><span class="status-badge status-badge--active">{{ r.series_status || 'INSCRITO' }}</span></td>
                  <td><button class="btn btn-sm btn-danger" @click="onUnassignPlayer(r)">Quitar</button></td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>
        <p v-else class="text-muted text-sm">Elige una serie del listado para gestionar su nómina.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useClubSeriesStore } from '../stores/clubSeries';
import { getClubById } from '../services/clubs.service';
import { getRosterByClub } from '../services/roster.service';

const route = useRoute();
const clubId = route.params.clubId;

const { items, roster, error, fetchClubSeries, createOrUpdateSeries, removeSeries, fetchSeriesRoster, assignPlayer, unassignPlayer } = useClubSeriesStore();

const club = ref(null);
const clubRoster = ref([]);
const selectedSeries = ref(null);
const newSeries = ref({ name: '', description: '', min_age: null, age_restriction: false });
const playerToAssign = ref('');

const unassignedClubPlayers = computed(() => {
  const assignedIds = new Set(roster.value.map((r) => r.player?.id));
  return clubRoster.value
    .map((r) => r.player)
    .filter((p) => p && !assignedIds.has(p.id) && meetsMinAge(p.birth_date));
});

// Edad cumplida: años reales, considerando si ya pasó el cumpleaños de este año.
const exactAge = (birthDate) => {
  const b = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - b.getFullYear();
  const hadBirthdayThisYear = today.getMonth() > b.getMonth()
    || (today.getMonth() === b.getMonth() && today.getDate() >= b.getDate());
  if (!hadBirthdayThisYear) age--;
  return age;
};

// Edad por año de nacimiento: categoría, sin exigir cumpleaños ya pasado.
const ageByBirthYear = (birthDate) => new Date().getFullYear() - new Date(birthDate).getFullYear();

// Calcula la edad de un jugador según el modo configurado en la serie seleccionada.
const playerAge = (birthDate) => {
  if (!birthDate) return null;
  return selectedSeries.value?.age_restriction ? exactAge(birthDate) : ageByBirthYear(birthDate);
};

const meetsMinAge = (birthDate) => {
  const minAge = selectedSeries.value?.min_age;
  if (!minAge) return true;
  const age = playerAge(birthDate);
  return age === null ? true : age >= minAge;
};

// "EDAD-AÑO" (ej: 15-2011) para que se pueda validar a simple vista la regla de la serie.
const playerAgeLabel = (birthDate) => {
  if (!birthDate) return 'sin edad';
  const age = playerAge(birthDate);
  const year = new Date(birthDate).getFullYear();
  return `${age}-${year}`;
};

const loadClub = async () => {
  const response = await getClubById(clubId);
  club.value = response.data?.data?.club ?? null;
};

const loadClubRoster = async () => {
  const response = await getRosterByClub(clubId);
  clubRoster.value = response.data?.data?.roster ?? [];
};

const selectSeries = async (series) => {
  selectedSeries.value = series;
  playerToAssign.value = '';
  await fetchSeriesRoster(series.id);
};

const onCreateSeries = async () => {
  try {
    await createOrUpdateSeries({
      clubId,
      name: newSeries.value.name,
      description: newSeries.value.description || null,
      min_age: newSeries.value.min_age || null,
      age_restriction: newSeries.value.age_restriction,
    });
    newSeries.value = { name: '', description: '', min_age: null, age_restriction: false };
  } catch (e) {
    // Error manejado en el store
  }
};

const onDeleteSeries = async (series) => {
  if (!confirm(`¿Eliminar la serie "${series.name}"?`)) return;
  try {
    await removeSeries(series.id);
    if (selectedSeries.value?.id === series.id) selectedSeries.value = null;
  } catch (e) {
    // Error manejado en el store
  }
};

const onAssignPlayer = async () => {
  if (!playerToAssign.value || !selectedSeries.value) return;
  try {
    await assignPlayer(selectedSeries.value.id, playerToAssign.value);
    playerToAssign.value = '';
  } catch (e) {
    // Error manejado en el store
  }
};

const onUnassignPlayer = async (rosterRow) => {
  if (!selectedSeries.value) return;
  try {
    await unassignPlayer(selectedSeries.value.id, rosterRow.player.id);
  } catch (e) {
    // Error manejado en el store
  }
};

onMounted(() => {
  loadClub();
  loadClubRoster();
  fetchClubSeries(clubId);
});
</script>

<style scoped>
.series-row { display: flex; gap: 12px; align-items: flex-start; flex-wrap: wrap; }
.flex-1 { flex: 1; min-width: 200px; }
.flex-2 { flex: 2; min-width: 240px; }

.content-cols {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}
@media (max-width: 900px) {
  .content-cols { grid-template-columns: 1fr; }
}

.clickable-row { cursor: pointer; }
.clickable-row:hover { background: var(--bg-hover); }
.row--selected { background: rgba(0, 230, 118, 0.08); }

.font-medium { font-weight: 500; }
.py-lg { padding-top: var(--spacing-lg); padding-bottom: var(--spacing-lg); }
.btn-sm { padding: 0.4rem 0.8rem; font-size: 0.875rem; }

.status-badge {
  display: inline-flex; align-items: center; justify-content: center;
  padding: 0.2rem 0.6rem; border-radius: var(--radius-full);
  font-size: 0.75rem; font-weight: 700;
}
.status-badge--active   { background: rgba(0, 230, 118, 0.14); color: var(--primary-solid, #00e676); }
.status-badge--inactive { background: rgba(239, 83, 80, 0.14); color: #ef5350; }
</style>
