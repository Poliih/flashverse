<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const auth = useAuthStore()

const email = ref('')
const password = ref('')
const showPw = ref(false)
const error = ref('')
const loading = ref(false)

async function submit() {
  error.value = ''
  loading.value = true
  try {
    await auth.signIn(email.value.trim(), password.value)
    router.push('/game')
  } catch (e) {
    error.value = e.message.includes('Invalid') ? 'Email ou senha incorretos' : 'Erro ao entrar. Tente novamente.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex flex-col items-center justify-center p-6 bg-[#020817]">
    <div class="w-full max-w-sm animate-fade-in">

      <!-- Logo -->
      <div class="flex items-center gap-3 mb-10">
        <div class="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-lg"
          style="background: linear-gradient(135deg,#6366F1,#A855F7)">⚡</div>
        <div>
          <h1 class="text-2xl font-black leading-none">
            Flash <span class="gradient-text">Verse</span>
          </h1>
          <p class="text-[10px] font-bold tracking-[2px] text-slate-500 uppercase">Memorize a Palavra</p>
        </div>
      </div>

      <h2 class="text-3xl font-black mb-1">Bem-vindo<br>de volta! 👋</h2>
      <p class="text-slate-400 text-sm mb-8">Continue sua jornada espiritual</p>

      <!-- Error -->
      <div v-if="error" class="mb-4 px-4 py-3 rounded-xl bg-rose-900/50 border border-rose-500/50 text-rose-300 text-sm font-medium animate-fade-in">
        {{ error }}
      </div>

      <div class="space-y-4">
        <div>
          <label class="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Email</label>
          <input v-model="email" type="email" placeholder="seu@email.com" @keyup.enter="submit"
            class="w-full bg-[#1E293B] border border-slate-700 rounded-2xl px-4 py-4 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition" />
        </div>
        <div>
          <label class="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Senha</label>
          <div class="relative">
            <input v-model="password" :type="showPw ? 'text' : 'password'" placeholder="••••••••" @keyup.enter="submit"
              class="w-full bg-[#1E293B] border border-slate-700 rounded-2xl px-4 py-4 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition pr-12" />
            <button @click="showPw = !showPw" class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition text-lg">
              {{ showPw ? '🙈' : '👁️' }}
            </button>
          </div>
        </div>
      </div>

      <div class="text-right mt-2">
        <router-link to="/forgot-password" class="text-indigo-400 text-sm font-semibold hover:text-indigo-300 transition">
          Esqueci minha senha
        </router-link>
      </div>

      <button @click="submit" :disabled="loading"
        class="mt-6 w-full py-4 rounded-2xl font-black text-white text-lg transition-all active:scale-95 disabled:opacity-60"
        style="background: linear-gradient(135deg,#6366F1,#A855F7); box-shadow: 0 8px 24px rgba(99,102,241,0.35)">
        {{ loading ? '...' : '⚡ Entrar' }}
      </button>

      <p class="text-center text-slate-400 text-sm mt-6">
        Não tem conta?
        <router-link to="/register" class="text-indigo-400 font-bold hover:text-indigo-300 transition ml-1">Criar conta</router-link>
      </p>
    </div>
  </div>
</template>
