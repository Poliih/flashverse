<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const router = useRouter()
const stats = ref({ total: 0, correct: 0, mastered: 0 })
const loadingStats = ref(true)
const showSettings = ref(false)

onMounted(async () => {
  const uid = auth.user?.id
  if (!uid) return

  const [results, mastered] = await Promise.all([
    supabase.from('daily_results').select('correct').eq('user_id', uid),
    supabase.from('verse_progress').select('id', { count: 'exact', head: true }).eq('user_id', uid).eq('mastered', true),
  ])

  const list = results.data || []
  stats.value = {
    total: list.length,
    correct: list.filter(r => r.correct).length,
    mastered: mastered.count ?? 0,
  }
  loadingStats.value = false
})

const accuracy = () => stats.value.total > 0 ? Math.round(stats.value.correct / stats.value.total * 100) : 0

async function signOut() {
  await auth.signOut()
  router.push('/login')
}

</script>

<template>
  <div class="min-h-screen bg-[#020817] overflow-y-auto">
    <div class="max-w-3xl mx-auto w-full p-6 pt-12 space-y-5">

      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-black">⚡ Perfil</h1>
          <p class="text-[10px] font-bold tracking-[2px] text-slate-500 uppercase">Seu Progresso</p>
        </div>
        <button @click="showSettings = !showSettings"
          class="w-10 h-10 rounded-2xl bg-[#1E293B] border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition">
          ⚙️
        </button>
      </div>

      <!-- Profile card -->
      <div class="bg-[#0F172A] border border-slate-800 rounded-3xl p-5 animate-fade-in">
        <div class="flex items-center gap-4">
          <div
            class="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl font-black text-white shadow-lg flex-shrink-0"
            style="background:linear-gradient(135deg,#6366F1,#A855F7)">
            {{ auth.profile?.username?.[0]?.toUpperCase() ?? '?' }}
          </div>
          <div>
            <p class="text-xl font-black text-white">{{ auth.profile?.username ?? 'Jogador' }}</p>
            <div class="flex items-center gap-2 mt-1">
              <span
                class="text-xs font-bold px-2 py-0.5 rounded-lg bg-indigo-900/40 text-indigo-300 border border-indigo-500/30">
                Nível {{ auth.level }}
              </span>
              <span v-if="auth.profile?.streak > 0" class="text-xs font-bold text-orange-400">
                🔥 {{ auth.profile?.streak }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- XP Progress -->
      <div class="bg-[#0F172A] border border-slate-800 rounded-2xl p-5 animate-fade-in">
        <div class="flex justify-between items-center mb-3">
          <span class="font-black text-white">Nível {{ auth.level }}</span>
          <span class="text-slate-400 text-sm font-semibold">Nível {{ auth.level + 1 }}</span>
        </div>
        <div class="h-3 bg-slate-800 rounded-full overflow-hidden">
          <div class="h-full rounded-full transition-all duration-700"
            style="background:linear-gradient(90deg,#6366F1,#A855F7)" :style="{ width: `${auth.xpProgress * 100}%` }" />
        </div>
        <div class="flex justify-between items-center mt-2">
          <span class="text-yellow-400 font-black text-sm">{{ auth.profile?.xp ?? 0 }} XP total</span>
          <span class="text-slate-500 text-xs">Faltam {{ auth.xpToNext }} XP</span>
        </div>
      </div>

      <!-- Stats -->
      <div v-if="!loadingStats">
        <p class="text-[10px] font-black uppercase tracking-[2px] text-slate-500 mb-3">Estatísticas</p>
        <div class="grid grid-cols-2 gap-3">
          <div v-for="stat in [
            { icon: '🎯', label: 'Total', value: stats.total },
            { icon: '✅', label: 'Acertos', value: stats.correct },
            { icon: '📊', label: 'Precisão', value: accuracy() + '%' },
            { icon: '🏅', label: 'Dominados', value: stats.mastered },
          ]" :key="stat.label" class="bg-[#0F172A] border border-slate-800 rounded-2xl p-4 animate-fade-in">
            <p class="text-2xl mb-2">{{ stat.icon }}</p>
            <p class="text-2xl font-black text-white">{{ stat.value }}</p>
            <p class="text-slate-400 text-xs font-semibold">{{ stat.label }}</p>
          </div>
        </div>
      </div>
      <div v-else class="h-32 flex items-center justify-center">
        <div class="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>

      <!-- Settings panel -->
      <transition name="fade">
        <div v-if="showSettings"
          class="bg-[#0F172A] border border-slate-800 rounded-2xl overflow-hidden animate-fade-in">
          <button v-for="item in [
            { icon: '🔔', label: 'Notificações' },
            { icon: '📤', label: 'Compartilhar app' },
            { icon: '⭐', label: 'Avaliar app' },
          ]" :key="item.label"
            class="w-full flex items-center gap-3 px-5 py-4 hover:bg-slate-800/50 transition border-b border-slate-800 last:border-0 text-left">
            <span class="text-xl">{{ item.icon }}</span>
            <span class="font-semibold text-white flex-1">{{ item.label }}</span>
            <span class="text-slate-500 text-sm">›</span>
          </button>

          <div class="border-t border-slate-700 mt-1" />

          <button @click="signOut"
            class="w-full flex items-center gap-3 px-5 py-4 hover:bg-rose-900/20 transition text-rose-400">
            <span class="text-xl">🚪</span>
            <span class="font-bold flex-1 text-left">Sair da conta</span>
          </button>
        </div>
      </transition>

    </div>
  </div>
</template>
