<script setup>
import { ref } from 'vue'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const email = ref('')
const sent = ref(false)
const loading = ref(false)
const error = ref('')

async function submit() {
  if (!email.value.trim()) return
  loading.value = true
  error.value = ''
  try {
    await auth.resetPassword(email.value.trim())
    sent.value = true
  } catch (e) {
    error.value = 'Erro ao enviar email. Tente novamente.'
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
      </div>

      <template v-if="!sent">
        <h2 class="text-3xl font-black mb-1">Recuperar senha 🔑</h2>
        <p class="text-slate-400 text-sm mb-8">Enviaremos um link para seu email</p>

        <div v-if="error" class="mb-4 px-4 py-3 rounded-xl bg-rose-900/50 border border-rose-500/50 text-rose-300 text-sm">{{ error }}</div>

        <label class="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Email</label>
        <input v-model="email" type="email" placeholder="seu@email.com" @keyup.enter="submit"
          class="w-full bg-[#1E293B] border border-slate-700 rounded-2xl px-4 py-4 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition" />

        <button @click="submit" :disabled="loading"
          class="mt-6 w-full py-4 rounded-2xl font-black text-white text-lg transition-all active:scale-95 disabled:opacity-60"
          style="background:linear-gradient(135deg,#6366F1,#A855F7)">
          {{ loading ? '...' : '📨 Enviar link' }}
        </button>
      </template>

      <template v-else>
        <div class="text-center animate-scale-in">
          <div class="w-20 h-20 rounded-full flex items-center justify-center text-4xl mx-auto mb-6 border-2 border-green-500 bg-green-900/30">✉️</div>
          <h2 class="text-2xl font-black mb-2">Email enviado!</h2>
          <p class="text-slate-400 text-sm mb-8">Verifique sua caixa de entrada e siga as instruções.</p>
          <router-link to="/login"
            class="block w-full py-4 rounded-2xl font-black text-white text-lg text-center transition-all"
            style="background:linear-gradient(135deg,#6366F1,#A855F7)">
            Voltar ao login
          </router-link>
        </div>
      </template>
    </div>
  </div>
</template>
