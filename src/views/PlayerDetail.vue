<template>
  <div class="container mt-md">
    <div class="flex justify-between items-center mb-lg">
      <h2>{{ playerTitle }}</h2>
      <button class="btn btn-secondary" @click="goBack">
        Volver
      </button>
    </div>

    <div v-if="playersStore.error" class="alert alert-error">
      {{ playersStore.error }}
    </div>

    <div v-if="playersStore.current" class="card mb-lg">
      <div class="flex justify-between items-center mb-md">
        <div>
          <h3>{{ playersStore.current.full_name }}</h3>
          <p class="text-muted text-sm">
            {{ playersStore.current.position }} · {{ playersStore.current.category }}
          </p>
        </div>
        <div class="player-number">
          {{ playersStore.current.number || '-' }}
        </div>
      </div>
      <p class="text-muted text-sm mb-md">
        Club actual: {{ playersStore.current.club_name || 'Sin club' }}
      </p>
      <span class="badge" :class="statusClass(playersStore.current.status)">
        {{ playersStore.current.status || 'ACTIVE' }}
      </span>
    </div>

    <div class="card mb-lg">
      <h3 class="mb-md">Préstamo de jugador</h3>

      <div v-if="currentLoan">
        <p class="text-muted text-sm mb-md">
          Estado préstamo: {{ currentLoan.status }}
        </p>
        <div class="flex gap-sm mb-md">
          <button
            v-if="canApprove"
            class="btn btn-primary"
            @click="approveCurrentLoan"
          >
            Aprobar
          </button>
          <button
            v-if="canApprove"
            class="btn btn-secondary"
            @click="rejectCurrentLoan"
          >
            Rechazar
          </button>
          <button
            v-if="canReturn"
            class="btn btn-primary"
            @click="returnCurrentLoan"
          >
            Marcar devolución
          </button>
        </div>
      </div>

      <form class="flex flex-col gap-md" @submit.prevent="requestLoanAction">
        <div class="input-group">
          <label class="label">Club destino (ID)</label>
          <input v-model="loanForm.to_club_id" class="input" required />
        </div>
        <div class="flex gap-md">
          <div class="input-group" style="flex:1;">
            <label class="label">Fecha inicio</label>
            <input v-model="loanForm.start_date" type="date" class="input" />
          </div>
          <div class="input-group" style="flex:1;">
            <label class="label">Fecha fin</label>
            <input v-model="loanForm.end_date" type="date" class="input" />
          </div>
        </div>
        <button class="btn btn-primary" type="submit" :disabled="playersStore.loading">
          {{ playersStore.loading ? 'Enviando...' : 'Solicitar préstamo' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { usePlayersStore } from '../stores/players';

const route = useRoute();
const router = useRouter();
const playersStore = usePlayersStore();

const loanForm = reactive({
  to_club_id: '',
  start_date: '',
  end_date: '',
});

const playerTitle = computed(() => playersStore.current?.full_name || 'Detalle jugador');

const currentLoan = computed(() => playersStore.current?.current_loan || null);

const canApprove = computed(() => currentLoan.value?.status === 'REQUESTED');
const canReturn = computed(() => currentLoan.value?.status === 'APPROVED');

const loadPlayer = async () => {
  await playersStore.fetchPlayerById(route.params.playerId);
};

const requestLoanAction = async () => {
  await playersStore.requestPlayerLoan(route.params.playerId, { ...loanForm });
  await loadPlayer();
};

const approveCurrentLoan = async () => {
  if (!currentLoan.value) return;
  const ok = window.confirm('¿Aprobar solicitud de préstamo?');
  if (!ok) return;
  await playersStore.approvePlayerLoan(currentLoan.value.id);
  await loadPlayer();
};

const rejectCurrentLoan = async () => {
  if (!currentLoan.value) return;
  const ok = window.confirm('¿Rechazar solicitud de préstamo?');
  if (!ok) return;
  await playersStore.rejectPlayerLoan(currentLoan.value.id);
  await loadPlayer();
};

const returnCurrentLoan = async () => {
  if (!currentLoan.value) return;
  const ok = window.confirm('¿Confirmar devolución de jugador?');
  if (!ok) return;
  await playersStore.returnPlayerLoan(currentLoan.value.id);
  await loadPlayer();
};

const goBack = () => {
  router.push('/players');
};

const statusClass = (status) => {
  if (status === 'LOAN') return 'status-loan';
  if (status === 'INACTIVE') return 'status-inactive';
  return 'status-active';
};

onMounted(() => {
  loadPlayer();
});
</script>

<style scoped>
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
</style>

