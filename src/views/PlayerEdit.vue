<template>
  <div class="container mt-md">
    <div class="flex items-center gap-md mb-lg">
       <button class="btn btn-secondary btn-sm" @click="$router.go(-1)">
           &larr; Volver
       </button>
       <h2>Editar Jugador</h2>
    </div>

    <div v-if="loading && !form.id" class="text-center py-lg">
        Cargando datos...
    </div>

    <div v-else-if="error" class="alert alert-error mb-md">
      {{ error }}
    </div>

    <div v-else class="card">
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
            <label class="label">Fecha de Nacimiento</label>
            <input v-model="form.birth_date" type="date" class="input" />
          </div>
          <div class="input-group">
            <label class="label">Identificación (RUT/DNI)</label>
            <input v-model="form.national_id" class="input" />
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

          <!-- Sports Info -->
          <div class="input-group">
            <label class="label">Categoría</label>
            <select v-model="form.category_id" class="input">
                <option value="">Seleccione...</option>
                <option value="ADULTOS">Adultos</option>
                <option value="JUVENIL">Juvenil</option>
                <option value="SENIOR">Senior</option>
                <option value="FEMENINO">Femenino</option>
            </select>
          </div>
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
          <div class="input-group">
            <label class="label">Número de Camiseta</label>
            <input v-model="form.jersey_number" type="number" class="input" />
          </div>
        </div>
        
        <div class="input-group mt-md">
            <label class="label">Foto (Actualizar)</label>
             <input type="file" @change="handleFileChange" accept="image/*" class="input" />
        </div>

        <div class="flex justify-end gap-md mt-lg">
          <button type="button" class="btn btn-secondary" @click="$router.go(-1)">
            Cancelar
          </button>
          <button type="submit" class="btn btn-primary" :disabled="loading">
            {{ loading ? 'Guardando...' : 'Guardar Cambios' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { usePlayersStore } from '../stores/players';

const route = useRoute();
const router = useRouter();
const playersStore = usePlayersStore();
const playerId = route.params.playerId;

const form = ref({
    id: null,
    first_name: '',
    last_name: '',
    birth_date: '',
    national_id: '',
    address: '',
    phone: '',
    email: '',
    category_id: '',
    position: '',
    jersey_number: null
});

const selectedFile = ref(null);
const loading = computed(() => playersStore.loading);
const error = computed(() => playersStore.error);

const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
        selectedFile.value = file;
    }
};

const loadPlayer = async () => {
    await playersStore.fetchPlayerById(playerId);
    const p = playersStore.current;
    if (p) {
        // Map fields. Ensure dates are formatted for input[type="date"] (YYYY-MM-DD)
        form.value = {
            id: p.id,
            first_name: p.first_name,
            last_name: p.last_name,
            birth_date: p.birth_date ? p.birth_date.split('T')[0] : '',
            national_id: p.national_id,
            address: p.address,
            phone: p.phone,
            email: p.email,
            category_id: p.category_id,
            position: p.position,
            jersey_number: p.jersey_number
        };
    }
};

const savePlayer = async () => {
    try {
        // 1. Update Player
        await playersStore.createOrUpdatePlayer(form.value);
        
        // 2. Upload photo if selected
        if (selectedFile.value) {
            await playersStore.uploadPlayerPhoto(playerId, selectedFile.value);
        }
        
        router.push(`/players/${playerId}`);
    } catch (e) {
        // Error handled in store
    }
};

onMounted(() => {
    loadPlayer();
});
</script>
