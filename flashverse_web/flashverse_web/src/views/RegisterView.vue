<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const auth = useAuthStore()

const username = ref('')
const email = ref('')
const password = ref('')
const showPw = ref(false)
const error = ref('')
const loading = ref(false)

async function submit() {
  error.value = ''
  if (!username.value.trim() || username.value.length < 3) { error.value = 'Username mínimo 3 caracteres'; return }
  loading.value = true
  try {
    await auth.signUp(email.value.trim(), password.value, username.value.trim())
    router.push('/game')
  } catch (e) {
    error.value = e.message.includes('already') ? 'Email já cadastrado' : 'Erro ao criar conta.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex flex-col items-center justify-center p-6 bg-[#020817]">
    <div class="w-full max-w-sm animate-fade-in">

      <div class="flex items-center gap-2 mb-8">
        <router-link to="/login" class="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 transition text-slate-300">←</router-link>
        <div class="flex items-center gap-2 ml-2">
          <div class="w-9 h-9 rounded-xl flex items-center justify-center text-lg" style="background:linear-gradient(135deg,#6366F1,#A855F7)">⚡</div>
          <span class="text-xl font-black">Flash <span class="gradient-text">Verse</span></span>
        </div>
      </div>

      <h2 class="text-3xl font-black mb-1">Criar conta ✨</h2>
      <p class="text-slate-400 text-sm mb-8">Junte-se a quem já memoriza versículos</p>

      <div v-if="error" class="mb-4 px-4 py-3 rounded-xl bg-rose-900/50 border border-rose-500/50 text-rose-300 text-sm font-medium">
        {{ error }}
      </div>

      <div class="space-y-4">
        <div>
          <label class="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Username</label>
          <input v-model="username" type="text" placeholder="seu_usuario" @keyup.enter="submit"
            class="w-full bg-[#1E293B] border border-slate-700 rounded-2xl px-4 py-4 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition" />
        </div>
        <div>
          <label class="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Email</label>
          <input v-model="email" type="email" placeholder="seu@email.com" @keyup.enter="submit"
            class="w-full bg-[#1E293B] border border-slate-700 rounded-2xl px-4 py-4 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition" />
        </div>
        <div>
          <label class="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Senha</label>
          <div class="relative">
            <input v-model="password" :type="showPw ? 'text' : 'password'" placeholder="mín. 6 caracteres" @keyup.enter="submit"
              class="w-full bg-[#1E293B] border border-slate-700 rounded-2xl px-4 py-4 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition pr-12" />
            <button @click="showPw = !showPw" class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition">
              {{ showPw ? '🙈' : '👁️' }}
            </button>
          </div>
        </div>
      </div>

      <button @click="submit" :disabled="loading"
        class="mt-6 w-full py-4 rounded-2xl font-black text-white text-lg transition-all active:scale-95 disabled:opacity-60"
        style="background:linear-gradient(135deg,#6366F1,#A855F7);box-shadow:0 8px 24px rgba(99,102,241,0.35)">
        {{ loading ? '...' : '🚀 Criar conta' }}
      </button>

      <p class="text-center text-slate-400 text-sm mt-6">
        Já tem conta?
        <router-link to="/login" class="text-indigo-400 font-bold hover:text-indigo-300 transition ml-1">Entrar</router-link>
      </p>
    </div>
  </div>
</template>
