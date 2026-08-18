<template>
  <div v-if="visible" class="modal-overlay" @click.self="close">
    <div class="modal-content card notify-modal" :class="`notify-modal--${type}`">
      <div class="notify-modal__icon">{{ icon }}</div>
      <h3 class="mb-sm text-center">{{ title || defaultTitle }}</h3>
      <p class="text-center mb-lg notify-modal__message">{{ message }}</p>
      <button class="btn btn-primary btn-full" @click="close">Aceptar</button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useNotifyStore } from '../stores/notify';

const { visible, type, title, message, close } = useNotifyStore();

const ICONS = { success: '✅', error: '⚠️', info: 'ℹ️' };
const TITLES = { success: '¡Listo!', error: 'Ocurrió un error', info: 'Aviso' };

const icon = computed(() => ICONS[type.value] || ICONS.info);
const defaultTitle = computed(() => TITLES[type.value] || TITLES.info);
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  backdrop-filter: blur(4px);
}

.modal-content {
  width: 100%;
  max-width: 400px;
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.notify-modal__icon {
  font-size: 2.5rem;
  text-align: center;
  margin-bottom: 0.5rem;
}

.notify-modal__message {
  white-space: pre-line;
  color: var(--text-secondary);
}

.notify-modal--error h3 { color: var(--accent-red); }
.notify-modal--success h3 { color: var(--primary-solid); }
</style>
