<template>
  <div class="container mt-md">
    <!-- Header -->
    <div class="flex justify-between items-center mb-lg">
      <button class="btn btn-secondary btn-sm" @click="goBack">
        &larr; Volver
      </button>
      <div class="flex gap-sm">
        <button v-if="player" class="btn btn-secondary" @click="$router.push(`/players/${player.id}/edit`)">
           Editar
        </button>
        <button v-if="player" class="btn btn-primary" @click="$router.push(`/players/${player.id}/change-club`)">
           Cambiar Club
        </button>
      </div>
    </div>

    <div v-if="loading && !player" class="text-center py-lg">
      Cargando...
    </div>

    <div v-else-if="error" class="alert alert-error">
      {{ error }}
    </div>

    <div v-else-if="player" class="grid grid-cols-1 md:grid-cols-3 gap-lg">
      <!-- Left Column: Photo & Status -->
      <div class="col-span-1">
        <div class="card flex flex-col items-center text-center p-lg">
           <div class="player-photo-large mb-md relative group">
               <img :src="player.photo_url || '/placeholder-player.png'" alt="Foto" class="photo-img" />
               <div class="photo-overlay" @click="triggerPhotoUpload">
                   <span>Cambiar Foto</span>
               </div>
               <input type="file" ref="fileInput" class="hidden" accept="image/*" @change="handlePhotoUpload" />
           </div>
           <h2 class="mb-xs">{{ player.first_name }} {{ player.last_name }}</h2>
           <p class="text-muted mb-md">Folio: {{ player.id }}</p>
           
           <div class="w-full border-t border-border py-md">
               <div class="mb-sm">
                   <span class="text-xs text-muted uppercase tracking-wider">Club Actual</span>
                   <p class="font-bold text-lg">{{ player.club?.name || 'Sin Club' }}</p>
               </div>
               <div class="flex justify-center gap-md">
                   <div v-if="player.club_id">
                       <span class="text-xs text-muted">ID Club</span>
                       <p>{{ player.club_id }}</p>
                   </div>
                    <div>
                       <span class="text-xs text-muted">Estado</span>
                       <div class="mt-xs">
                           <span class="badge" :class="player.status === 'ACTIVE' ? 'badge-success' : 'badge-secondary'">
                               {{ player.status }}
                           </span>
                       </div>
                   </div>
               </div>
           </div>
        </div>
      </div>

      <!-- Right Column: Details -->
      <div class="col-span-1 md:col-span-2 space-y-md">
          <!-- Sports Info -->
          <div class="card">
              <h3 class="mb-md border-b border-border pb-sm">Información Deportiva</h3>
              <div class="grid grid-cols-2 md:grid-cols-3 gap-md">
                  <div>
                      <span class="label block mb-xs">Categoría</span>
                      <p>{{ player.category_id || '-' }}</p>
                  </div>
                   <div>
                      <span class="label block mb-xs">Posición</span>
                      <p>{{ player.position || '-' }}</p>
                  </div>
                   <div>
                      <span class="label block mb-xs">Camiseta</span>
                      <p class="text-xl font-bold">{{ player.jersey_number || '-' }}</p>
                  </div>
              </div>
          </div>

          <!-- Personal Info -->
           <div class="card">
              <h3 class="mb-md border-b border-border pb-sm">Información Personal</h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-md">
                  <div>
                      <span class="label block mb-xs">Fecha de Nacimiento</span>
                      <p>{{ formatDate(player.birth_date) }}</p>
                  </div>
                   <div>
                      <span class="label block mb-xs">Identificación</span>
                      <p>{{ player.national_id || '-' }}</p>
                  </div>
                   <div>
                      <span class="label block mb-xs">Email</span>
                      <p>{{ player.email || '-' }}</p>
                  </div>
                   <div>
                      <span class="label block mb-xs">Teléfono</span>
                      <p>{{ player.phone || '-' }}</p>
                  </div>
                   <div class="col-span-1 md:col-span-2">
                      <span class="label block mb-xs">Dirección</span>
                      <p>{{ player.address || '-' }}</p>
                  </div>
              </div>
          </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { usePlayersStore } from '../stores/players';

const route = useRoute();
const router = useRouter();
const playersStore = usePlayersStore();
const fileInput = ref(null);

const player = computed(() => playersStore.current);
const loading = computed(() => playersStore.loading);
const error = computed(() => playersStore.error);

const goBack = () => {
    // If we have history, go back, else go to club list if club_id available
    if (window.history.length > 1) {
        router.back();
    } else if (player.value && player.value.club_id) {
        router.push(`/clubs/${player.value.club_id}/players`);
    } else {
        router.push('/home');
    }
};

const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
};

const triggerPhotoUpload = () => {
    fileInput.value.click();
};

const handlePhotoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
        await playersStore.uploadPlayerPhoto(player.value.id, file);
        // Refresh player to get new photo url if needed, or store updates it
        await playersStore.fetchPlayerById(player.value.id);
    } catch (e) {
        // Error handled in store
    }
};

onMounted(() => {
    const playerId = route.params.playerId;
    if (playerId) {
        playersStore.fetchPlayerById(playerId);
    }
});
</script>

<style scoped>
.player-photo-large {
    width: 150px;
    height: 150px;
    border-radius: 50%;
    overflow: hidden;
    border: 4px solid var(--bg-secondary);
    background: var(--bg-secondary);
    cursor: pointer;
}
.photo-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}
.photo-overlay {
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.2s;
    color: white;
    font-weight: bold;
    font-size: 0.8rem;
}
.player-photo-large:hover .photo-overlay {
    opacity: 1;
}
</style>
