<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const entries = ref([])
const loading = ref(true)

onMounted(async () => {
  const { data } = await supabase
    .from('profiles')
    .select('id, username, xp, streak')
    .order('xp', { ascending: false })
    .limit(50)

  entries.value = (data || []).map((e, i) => ({ ...e, rank: i + 1 }))
  loading.value = false
})

function formatXP(xp) {
  return xp >= 1000 ? `${(xp / 1000).toFixed(1)}k` : `${xp}`
}

const podiumColors = [
  { bg: 'from-yellow-600 to-yellow-800', text: 'text-yellow-300', medal: '🥇' },
  { bg: 'from-slate-400 to-slate-600', text: 'text-slate-200', medal: '🥈' },
  { bg: 'from-amber-700 to-amber-900', text: 'text-amber-300', medal: '🥉' },
]
const podiumOrder = [1, 0, 2] // 2nd, 1st, 3rd visual order
const podiumHeights = ['h-16', 'h-24', 'h-12']
</script>

<template>
  <div class="min-h-screen bg-[#020817] flex flex-col max-w-3xl mx-auto w-full pt-12">
    <div class="p-6 flex-shrink-0">
      <h1 class="text-3xl font-black">🏆 Ranking</h1>
      <p class="text-[10px] font-bold tracking-[2px] text-slate-500 uppercase">TOP GLOBAL</p>
    </div>

    <div v-if="loading" class="flex-1 flex items-center justify-center">
      <div class="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>

    <div v-else class="flex-1 overflow-y-auto custom-scrollbar px-4 pb-4">

      <!-- Podium -->
      <div v-if="entries.length >= 3" class="flex items-end justify-center gap-3 mb-6 pt-2">
        <div v-for="i in podiumOrder" :key="i" class="flex flex-col items-center w-24">
          <span class="text-2xl mb-1">{{ podiumColors[i].medal }}</span>
          <p class="text-xs font-bold text-center text-slate-300 mb-1 truncate w-full text-center">
            {{ entries[i]?.username }}
          </p>
          <div
            class="w-full rounded-t-xl flex flex-col items-center justify-center bg-gradient-to-b"
            :class="[podiumColors[i].bg, podiumHeights[i]]"
          >
            <span class="text-xs font-black" :class="podiumColors[i].text">{{ formatXP(entries[i]?.xp ?? 0) }} XP</span>
          </div>
        </div>
      </div>

      <!-- List -->
      <div class="space-y-2">
        <div
          v-for="e in entries" :key="e.id"
          class="flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all"
          :class="e.id === auth.user?.id
            ? 'bg-indigo-900/20 border-indigo-500/40'
            : 'bg-[#0F172A] border-slate-800'"
        >
          <!-- Rank -->
          <div class="w-8 text-center flex-shrink-0">
            <span v-if="e.rank <= 3" class="text-xl">{{ ['🥇','🥈','🥉'][e.rank-1] }}</span>
            <span v-else class="text-slate-500 text-sm font-bold">#{{ e.rank }}</span>
          </div>

          <!-- Avatar -->
          <div class="w-9 h-9 rounded-full flex items-center justify-center text-base font-black text-white flex-shrink-0"
            style="background:linear-gradient(135deg,#6366F1,#A855F7)">
            {{ e.username?.[0]?.toUpperCase() ?? '?' }}
          </div>

          <!-- Name -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <p class="font-bold text-sm truncate" :class="e.id === auth.user?.id ? 'text-indigo-300' : 'text-white'">{{ e.username }}</p>
              <span v-if="e.id === auth.user?.id" class="text-[9px] font-black bg-indigo-800/60 text-indigo-300 px-1.5 py-0.5 rounded uppercase tracking-wider">você</span>
            </div>
            <p v-if="e.streak > 0" class="text-xs text-orange-400 font-semibold">🔥 {{ e.streak }} combo</p>
          </div>

          <!-- XP -->
          <div class="text-right flex-shrink-0">
            <p class="font-black text-yellow-400 text-base">{{ formatXP(e.xp) }}</p>
            <p class="text-[10px] text-slate-500 uppercase tracking-wider font-bold">XP</p>
          </div>
        </div>
      </div>

      <!-- Sticky user row if far from top -->
      <div v-if="entries.find(e => e.id === auth.user?.id)?.rank > 10"
        class="sticky bottom-0 mt-3 bg-indigo-900/30 border border-indigo-500/50 rounded-2xl px-4 py-3 flex items-center gap-3">
        <span class="text-indigo-300 font-bold text-sm">📍 Você está em</span>
        <span class="font-black text-white">#{{ entries.find(e => e.id === auth.user?.id)?.rank }}</span>
        <span class="ml-auto text-yellow-400 font-black">{{ formatXP(entries.find(e => e.id === auth.user?.id)?.xp ?? 0) }} XP</span>
      </div>
    </div>
  </div>
</template>
