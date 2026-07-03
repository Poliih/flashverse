<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const favorites = ref([])
const loading = ref(true)

onMounted(load)

async function load() {
  loading.value = true
  const { data } = await supabase
    .from('favorite_verses')
    .select('id, verse_id, verses(book_name, chapter, verse_number, text)')
    .eq('user_id', auth.user?.id)
    .order('created_at', { ascending: false })

  favorites.value = (data || []).map(row => ({
    id: row.id,
    verseId: row.verse_id,
    ...row.verses,
  }))
  loading.value = false
}

async function remove(id) {
  await supabase.from('favorite_verses').delete().eq('id', id)
  favorites.value = favorites.value.filter(f => f.id !== id)
}
</script>

<template>
  <div class="min-h-screen bg-[#020817] flex flex-col max-w-3xl mx-auto w-full pt-12">
    <div class="p-6 flex-shrink-0">
      <h1 class="text-3xl font-black">🔖 Favoritos</h1>
      <p class="text-[10px] font-bold tracking-[2px] text-slate-500 uppercase">Versículos Salvos</p>
    </div>

    <div v-if="loading" class="flex-1 flex items-center justify-center">
      <div class="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>

    <div v-else-if="favorites.length === 0" class="flex-1 flex flex-col items-center justify-center gap-3 text-center p-8">
      <p class="text-5xl">🔖</p>
      <p class="text-white font-bold text-lg">Nenhum favorito ainda</p>
      <p class="text-slate-400 text-sm">Salve versículos durante o jogo!</p>
    </div>

    <div v-else class="flex-1 overflow-y-auto custom-scrollbar px-4 pb-4 space-y-3">
      <div v-for="f in favorites" :key="f.id"
        class="bg-[#0F172A] border border-slate-800 rounded-2xl p-4 animate-fade-in">
        <div class="flex items-start justify-between gap-3">
          <span
            class="text-xs font-bold px-3 py-1 rounded-lg flex-shrink-0"
            style="background:linear-gradient(135deg,#6366F1,#A855F7);color:white">
            {{ f.book_name }} {{ f.chapter }}:{{ f.verse_number }}
          </span>
          <button @click="remove(f.id)" class="text-slate-600 hover:text-rose-400 transition flex-shrink-0 mt-0.5">
            🗑️
          </button>
        </div>
        <p class="text-slate-300 text-sm italic leading-relaxed mt-3">"{{ f.text }}"</p>
      </div>
    </div>
  </div>
</template>
