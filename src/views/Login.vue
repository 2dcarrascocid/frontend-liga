<template>
  <div class="flex items-center justify-center h-screen container-sm">
    <div class="card w-full">
      <div class="text-center mb-lg">
        <h2 class="mb-md">Bienvenido</h2>
        <p>Inicia sesión para gestionar tu liga</p>
      </div>

      <div class="tabs">
        <button 
          v-for="tab in ['Email', 'Google', 'Facebook']" 
          :key="tab"
          @click="currentTab = tab"
          class="tab-btn"
          :class="{ active: currentTab === tab }"
        >
          {{ tab }}
        </button>
      </div>

      <div v-if="authStore.state.error" class="alert alert-error">
        {{ authStore.state.error }}
      </div>

      <!-- Email Login -->
      <form v-if="currentTab === 'Email'" @submit.prevent="handleLogin">
        <div class="input-group">
          <label class="label">Email</label>
          <input 
            v-model="email" 
            type="email" 
            required
            class="input"
            placeholder="tu@email.com"
          />
        </div>
        <div class="input-group">
          <label class="label">Contraseña</label>
          <input 
            v-model="password" 
            type="password" 
            required
            minlength="8"
            class="input"
            placeholder="••••••••"
          />
        </div>
        <button 
          type="submit" 
          :disabled="authStore.state.loading"
          class="btn btn-primary btn-full"
        >
          <span v-if="authStore.state.loading">Cargando...</span>
          <span v-else>Ingresar</span>
        </button>
      </form>

      <!-- Google Login -->
      <div v-else-if="currentTab === 'Google'" class="text-center">
        <p class="mb-md">Accede con tu cuenta de Google</p>
        <button 
          @click="mockGoogleLogin" 
          :disabled="authStore.state.loading"
          class="btn btn-secondary btn-full"
          style="background: white; color: #333;"
        >
          Continuar con Google
        </button>
      </div>

      <!-- Facebook Login -->
      <div v-else-if="currentTab === 'Facebook'" class="text-center">
         <p class="mb-md">Accede con tu cuenta de Facebook</p>
         <button 
           @click="mockFacebookLogin" 
           :disabled="authStore.state.loading"
           class="btn btn-primary btn-full"
           style="background: #1877F2;"
         >
           Continuar con Facebook
         </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const authStore = useAuthStore();
const currentTab = ref('Email');
const email = ref('');
const password = ref('');

const handleLogin = async () => {
  try {
    await authStore.loginLocal({ email: email.value, password: password.value });
    checkRedirect();
  } catch (e) {
    // Error is handled in store
  }
};

const mockGoogleLogin = async () => {
    try {
        await authStore.loginGoogle('mock_google_id_token_123');
        checkRedirect();
    } catch (e) {}
};

const mockFacebookLogin = async () => {
    try {
        await authStore.loginFacebook('mock_fb_access_token_123');
        checkRedirect();
    } catch (e) {}
};

const checkRedirect = () => {
    if (authStore.state.org) {
        router.push('/home');
    } else {
        router.push('/bootstrap');
    }
};
</script>
