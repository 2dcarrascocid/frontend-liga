<template>
  <div class="container mt-md">
    <div class="flex items-center gap-md mb-lg">
       <button class="btn btn-secondary btn-sm" @click="$router.go(-1)">
           &larr; Volver
       </button>
       <h2>Nuevo Jugador</h2>
    </div>

    <div v-if="error" class="alert alert-error mb-md">
      {{ error }}
    </div>

    <div class="card">
      <form @submit.prevent="savePlayer">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-md">
          <!-- Personal Info -->
          <div class="input-group">
            <label class="label">Nombre *</label>
            <input v-model="form.first_name" class="input" required />
          </div>
          <div class="input-group">
            <label class="label">Apellido *</label>
            <input v-model="form.last_name" class="input" required />
          </div>
          <div class="input-group">
            <label class="label">RUT / DNI *</label>
            <input v-model="form.rut" class="input" required placeholder="Ej: 12345678-9" />
          </div>
          <div class="input-group">
            <label class="label">Fecha de Nacimiento</label>
            <input v-model="form.birth_date" type="date" class="input" />
          </div>
          <div class="input-group">
            <label class="label">Dirección</label>
            <input v-model="form.address" class="input" />
          </div>
          <div class="input-group">
            <label class="label">Teléfono</label>
            <input v-model="form.phone" class="input" />
          </div>
          <div class="input-group">
            <label class="label">Email</label>
            <input v-model="form.email" type="email" class="input" />
          </div>

          <!-- Folio -->
          <div class="input-group">
            <label class="label">
              Folio
              <span v-if="club" class="label-hint">
                Rango {{ club.folio_start ?? 1 }} – {{ club.folio_end ?? 70 }}
                (dejar vacío para auto-asignar)
              </span>
            </label>
            <input
              v-model.number="form.club_folio"
              type="number"
              class="input"
              :min="club?.folio_start ?? 1"
              :max="club?.folio_end ?? 70"
              placeholder="Auto"
            />
            <p v-if="folioError" class="input-error">{{ folioError }}</p>
          </div>

          <!-- Sports Info -->
          <div class="input-group">
            <label class="label">Posición</label>
            <select v-model="form.position" class="input">
                 <option value="">Seleccione...</option>
                 <option value="GK">Portero</option>
                 <option value="DEF">Defensa</option>
                 <option value="MID">Mediocampista</option>
                 <option value="FWD">Delantero</option>
            </select>
          </div>
        </div>

        <div class="input-group mt-md">
            <label class="label">Foto (Opcional)</label>
             <input type="file" @change="handleFileChange" accept="image/*" class="input" />
        </div>

        <div class="flex justify-end gap-md mt-lg">
          <button type="button" class="btn btn-secondary" @click="$router.go(-1)">
            Cancelar
          </button>
          <button type="submit" class="btn btn-primary" :disabled="loading">
            {{ loading ? 'Guardando...' : 'Guardar Jugador' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { usePlayersStore } from '../stores/players';
import { getClubById } from '../services/clubs.service.js';

const route = useRoute();
const router = useRouter();
const playersStore = usePlayersStore();
const clubId = route.params.clubId;

// Refs directas del store (ya son refs, no envolver en computed)
const { loading, error } = playersStore;

const club       = ref(null);
const folioError = ref(null);

const form = ref({
    first_name: '',
    last_name:  '',
    rut:        '',
    birth_date: '',
    address:    '',
    phone:      '',
    email:      '',
    position:   '',
    club_folio: null,
});

const selectedFile = ref(null);

const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) selectedFile.value = file;
};

const validateFolio = () => {
    folioError.value = null;
    const f = form.value.club_folio;
    if (f === null || f === '' || f === undefined) return true;
    const start = club.value?.folio_start ?? 1;
    const end   = club.value?.folio_end   ?? 70;
    if (f < start || f > end) {
        folioError.value = `El folio debe estar entre ${start} y ${end}`;
        return false;
    }
    return true;
};

const savePlayer = async () => {
    if (!validateFolio()) return;
    // Limpiar error previo
    error.value = null;
    try {
        const payload = { ...form.value };
        if (!payload.club_folio) delete payload.club_folio;
        if (!payload.birth_date) delete payload.birth_date;
        if (!payload.address)    delete payload.address;
        if (!payload.phone)      delete payload.phone;
        if (!payload.email)      delete payload.email;
        if (!payload.position)   delete payload.position;

        const result = await playersStore.createOrUpdatePlayer(payload, clubId);

        if (selectedFile.value && result?.player?.id) {
            await playersStore.uploadPlayerPhoto(result.player.id, selectedFile.value);
        }

        router.push(`/clubs/${clubId}/players`);
    } catch (e) {
        // El error ya queda en el store ref (error.value)
    }
};

onMounted(async () => {
    error.value = null;
    try {
        const res = await getClubById(clubId);
        club.value = res.data?.data ?? res.data ?? null;
    } catch (e) {
        console.error('[PlayerCreate] getClubById error:', e);
    }
});
</script>

<style scoped>
.label-hint {
    font-size: 0.78rem;
    font-weight: 400;
    color: var(--text-muted);
    margin-left: 0.4rem;
}
.input-error {
    font-size: 0.8rem;
    color: var(--color-danger, #ef4444);
    margin-top: 2px;
}
</style>
