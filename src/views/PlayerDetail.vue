<template>
  <div class="container mt-md">
    <!-- Header -->
    <div class="flex justify-between items-center mb-lg">
      <button class="btn btn-secondary btn-sm" @click="goBack">
        &larr; Volver
      </button>
      <div v-if="player" class="flex gap-sm">
        <button class="btn btn-secondary" @click="$router.push(`/players/${player.id}/edit`)">
          Editar
        </button>
      </div>
    </div>

    <div v-if="loading && !player" class="text-center py-lg">Cargando...</div>
    <div v-else-if="error" class="alert alert-error mb-md">{{ error }}</div>

    <div v-else-if="player" class="player-layout">

      <!-- Columna izquierda: foto + resumen -->
      <div class="player-sidebar">
        <div class="card flex flex-col items-center text-center p-lg">
          <!-- Foto -->
          <div class="player-photo-large mb-md" @click="triggerPhotoUpload">
            <img :src="player.photo_url || '/placeholder-player.svg'" alt="Foto" class="photo-img" />
            <div class="photo-overlay"><span>Cambiar foto</span></div>
            <input type="file" ref="fileInput" class="hidden" accept="image/*" @change="handlePhotoUpload" />
          </div>

          <!-- Nombre -->
          <h2 class="mb-xs">{{ player.first_name }} {{ player.last_name }}</h2>
          <p class="text-muted text-sm mb-md">{{ player.rut || '—' }}</p>

          <!-- Categoría -->
          <div v-if="playerCategory" class="mb-md">
            <span class="badge" :style="{ backgroundColor: playerCategory.color, color: '#fff' }">
              {{ playerCategory.name }}
            </span>
          </div>

          <!-- Estado roster -->
          <div class="w-full border-t border-border pt-md">
            <div class="info-row">
              <span class="info-label">Folio</span>
              <span class="info-value">{{ player.active_roster?.club_folio || '—' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Estado</span>
              <span
                class="badge"
                :class="player.active_roster?.status === 'ACTIVE' ? 'badge-success' : 'badge-secondary'"
              >
                {{ player.active_roster?.status || '—' }}
              </span>
            </div>
            <div class="info-row" v-if="clubName">
              <span class="info-label">Club</span>
              <span class="info-value">{{ clubName }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Columna derecha: datos -->
      <div class="player-body">

        <!-- Información Personal -->
        <div class="card mb-md">
          <h3 class="section-title">Información Personal</h3>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">RUT</span>
              <span class="info-value">{{ player.rut || '—' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Fecha de nacimiento</span>
              <span class="info-value">{{ formatDate(player.birth_date) }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Edad</span>
              <span class="info-value">{{ calcAge(player.birth_date) }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Teléfono</span>
              <span class="info-value">{{ player.phone || '—' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Email</span>
              <span class="info-value">{{ player.email || '—' }}</span>
            </div>
            <div class="info-item col-span-2">
              <span class="info-label">Dirección</span>
              <span class="info-value">{{ player.address || '—' }}</span>
            </div>
          </div>
        </div>

        <!-- Información Deportiva -->
        <div class="card">
          <h3 class="section-title">Información Deportiva</h3>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">Categoría</span>
              <span v-if="playerCategory">
                <span class="badge" :style="{ backgroundColor: playerCategory.color, color: '#fff' }">
                  {{ playerCategory.name }}
                </span>
              </span>
              <span v-else class="info-value">—</span>
            </div>
            <div class="info-item">
              <span class="info-label">Folio en club</span>
              <span class="info-value font-bold">{{ player.active_roster?.club_folio || '—' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Posición</span>
              <span class="info-value">{{ player.position || '—' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Camiseta</span>
              <span class="info-value font-bold">{{ player.jersey_number || '—' }}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { usePlayersStore } from '../stores/players';
import { listCategories } from '../services/categories.service.js';
import { getClubById } from '../services/clubs.service.js';

const route  = useRoute();
const router = useRouter();
const playersStore = usePlayersStore();
const fileInput = ref(null);

const player  = playersStore.current;
const loading = playersStore.loading;
const error   = playersStore.error;

const categories = ref([]);
const clubName   = ref('');

// Calcula edad en años a partir de birth_date
const calcAge = (birthDate) => {
    if (!birthDate) return '—';
    const age = Math.floor((Date.now() - new Date(birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    return `${age} años`;
};

// Busca la categoría que corresponde a la edad del jugador
const playerCategory = computed(() => {
    if (!player.value?.birth_date || !categories.value.length) return null;
    const age = Math.floor((Date.now() - new Date(player.value.birth_date).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    return categories.value.find(cat => {
        const fromOk = cat.age_from == null || age >= cat.age_from;
        const toOk   = cat.age_to   == null || age <= cat.age_to;
        return fromOk && toOk;
    }) ?? null;
});

const formatDate = (val) => {
    if (!val) return '—';
    const [y, m, d] = val.split('-');
    return `${d}/${m}/${y}`;
};

const goBack = () => {
    if (window.history.length > 1) router.back();
    else router.push('/clubs');
};

const triggerPhotoUpload = () => fileInput.value?.click();

const handlePhotoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    try {
        await playersStore.uploadPlayerPhoto(player.value.id, file);
        await playersStore.fetchPlayerById(player.value.id);
    } catch (e) { /* handled in store */ }
};

onMounted(async () => {
    const playerId = route.params.playerId;
    if (!playerId) return;

    await playersStore.fetchPlayerById(playerId);

    // Cargar club y categorías usando el club_id del roster activo
    const clubId = player.value?.active_roster?.club_id || player.value?.club_id;
    if (clubId) {
        try {
            const [catRes, clubRes] = await Promise.all([
                listCategories(clubId),
                getClubById(clubId),
            ]);
            categories.value = catRes.data?.data ?? [];
            clubName.value   = clubRes.data?.club?.name || '';
        } catch (e) {
            console.error('[PlayerDetail] load extras error:', e);
        }
    }
});
</script>

<style scoped>
.player-layout {
    display: grid;
    grid-template-columns: 260px 1fr;
    gap: var(--spacing-lg);
    align-items: start;
}

@media (max-width: 640px) {
    .player-layout {
        grid-template-columns: 1fr;
    }
}

.player-body { display: flex; flex-direction: column; gap: var(--spacing-md); }

/* Foto */
.player-photo-large {
    position: relative;
    width: 130px;
    height: 130px;
    border-radius: 50%;
    overflow: hidden;
    border: 3px solid var(--border-color);
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
    inset: 0;
    background: rgba(0,0,0,0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.2s;
    color: white;
    font-size: 0.8rem;
    font-weight: 600;
}
.player-photo-large:hover .photo-overlay { opacity: 1; }

/* Info rows (sidebar) */
.info-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacing-xs) 0;
    border-bottom: 1px solid var(--border-color);
    gap: var(--spacing-sm);
}
.info-row:last-child { border-bottom: none; }

/* Info grid (cards) */
.section-title {
    font-size: 0.95rem;
    font-weight: 600;
    padding-bottom: var(--spacing-sm);
    border-bottom: 1px solid var(--border-color);
    margin-bottom: var(--spacing-md);
}

.info-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: var(--spacing-md);
}

.info-item {
    display: flex;
    flex-direction: column;
    gap: 3px;
}

.col-span-2 { grid-column: span 2; }

.info-label {
    font-size: 0.72rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-muted);
}

.info-value {
    font-size: 0.95rem;
}

.font-bold { font-weight: 600; }
</style>
