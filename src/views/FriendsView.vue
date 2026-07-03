<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const tab = ref('ranking')
const showAdd = ref(false)
const inviteInput = ref('')
const sendLoading = ref(false)
const sendMsg = ref('')
const sendError = ref('')

const friends = ref([])
const pending = ref([])
const loadingFriends = ref(true)

const myCode = computed(() => auth.user?.id?.substring(0, 8).toUpperCase() ?? '...')

onMounted(async () => {
  await loadFriends()
  await loadPending()
  loadingFriends.value = false
})

async function loadFriends() {
  const uid = auth.user?.id
  if (!uid) return

  const { data } = await supabase
    .from('friendships')
    .select(`
      id, requester_id, receiver_id,
      requester:profiles!friendships_requester_id_fkey(id, username, xp, streak),
      receiver:profiles!friendships_receiver_id_fkey(id, username, xp, streak)
    `)
    .or(`requester_id.eq.${uid},receiver_id.eq.${uid}`)
    .eq('status', 'accepted')

  friends.value = (data || []).map(row => {
    const isReq = row.requester_id === uid
    return isReq ? row.receiver : row.requester
  }).filter(Boolean).sort((a, b) => b.xp - a.xp)
}

async function loadPending() {
  const uid = auth.user?.id
  if (!uid) return

  const { data } = await supabase
    .from('friendships')
    .select(`id, requester:profiles!friendships_requester_id_fkey(id, username)`)
    .eq('receiver_id', uid)
    .eq('status', 'pending')

  pending.value = data || []
}

async function sendRequest() {
  sendMsg.value = ''
  sendError.value = ''
  const code = inviteInput.value.trim().toLowerCase()
  if (!code) return
  sendLoading.value = true

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username')
    .ilike('id', `${code}%`)
    .limit(1)

  if (!profiles || profiles.length === 0) {
    sendError.value = 'Código inválido ou não encontrado'
    sendLoading.value = false
    return
  }
  const target = profiles[0]
  if (target.id === auth.user?.id) {
    sendError.value = 'Não é possível adicionar a si mesmo'
    sendLoading.value = false
    return
  }

  await supabase.from('friendships').insert({
    requester_id: auth.user?.id,
    receiver_id: target.id,
    status: 'pending',
  })

  sendMsg.value = `Pedido enviado para ${target.username}! ✅`
  inviteInput.value = ''
  sendLoading.value = false
}

async function accept(id) {
  await supabase.from('friendships').update({ status: 'accepted' }).eq('id', id)
  await loadPending()
  await loadFriends()
}

async function reject(id) {
  await supabase.from('friendships').delete().eq('id', id)
  await loadPending()
}

function copyCode() {
  navigator.clipboard.writeText(myCode.value)
}
</script>

<template>
  <div class="min-h-screen bg-[#020817] flex flex-col max-w-3xl mx-auto w-full pt-12">

    <!-- Header -->
    <div class="p-6 flex items-center justify-between flex-shrink-0">
      <div>
        <h1 class="text-3xl font-black">👥 Amigos</h1>
        <p class="text-[10px] font-bold tracking-[2px] text-slate-500 uppercase">Competição Social</p>
      </div>
      <button @click="showAdd = !showAdd"
        class="w-10 h-10 rounded-2xl flex items-center justify-center font-black text-white transition-all"
        :style="showAdd ? 'background:linear-gradient(135deg,#6366F1,#A855F7)' : 'background:#1E293B'">
        {{ showAdd ? '✕' : '➕' }}
      </button>
    </div>

    <!-- Add friend panel -->
    <transition name="slide-up">
      <div v-if="showAdd" class="mx-4 mb-4 bg-[#1E293B] border border-slate-700 rounded-2xl p-5 animate-slide-up flex-shrink-0">
        <!-- My code -->
        <div class="flex items-center justify-between mb-4">
          <div>
            <p class="text-xs text-slate-400 uppercase tracking-wider font-bold mb-0.5">Meu código de convite</p>
            <p class="font-black text-white text-lg tracking-widest">{{ myCode }}</p>
          </div>
          <button @click="copyCode"
            class="px-4 py-2 rounded-xl text-sm font-bold text-white transition-all active:scale-95"
            style="background:linear-gradient(135deg,#6366F1,#A855F7)">
            📋 Copiar
          </button>
        </div>

        <div class="border-t border-slate-700 my-3" />

        <!-- Input -->
        <p class="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2">Adicionar por código</p>
        <div class="flex gap-2">
          <input v-model="inviteInput" type="text" placeholder="Código do amigo" maxlength="8"
            class="flex-1 bg-[#0F172A] border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 text-sm font-bold uppercase tracking-widest focus:outline-none focus:border-indigo-500 transition" />
          <button @click="sendRequest" :disabled="sendLoading"
            class="px-4 py-3 rounded-xl text-white font-black transition-all active:scale-95 disabled:opacity-50"
            style="background:linear-gradient(135deg,#6366F1,#A855F7)">
            {{ sendLoading ? '…' : '→' }}
          </button>
        </div>
        <p v-if="sendMsg" class="text-green-400 text-sm font-medium mt-2">{{ sendMsg }}</p>
        <p v-if="sendError" class="text-rose-400 text-sm font-medium mt-2">{{ sendError }}</p>
      </div>
    </transition>

    <!-- Tabs -->
    <div class="px-4 mb-4 flex-shrink-0">
      <div class="bg-[#1E293B] rounded-xl p-1 flex gap-1">
        <button v-for="t in [{id:'ranking',label:'Ranking'},{id:'pending',label:`Pedidos${pending.length ? ` (${pending.length})` : ''}`}]"
          :key="t.id" @click="tab = t.id"
          class="flex-1 py-2.5 rounded-lg text-sm font-bold transition-all"
          :class="tab === t.id ? 'text-white' : 'text-slate-500 hover:text-slate-300'"
          :style="tab === t.id ? 'background:linear-gradient(135deg,#6366F1,#A855F7)' : ''">
          {{ t.label }}
        </button>
      </div>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-y-auto custom-scrollbar px-4 pb-4">

      <!-- Friends ranking -->
      <div v-if="tab === 'ranking'">
        <div v-if="loadingFriends" class="flex justify-center py-8">
          <div class="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
        <div v-else-if="friends.length === 0" class="text-center py-12">
          <p class="text-4xl mb-3">🤝</p>
          <p class="text-white font-bold">Nenhum amigo ainda</p>
          <p class="text-slate-400 text-sm mt-1">Compartilhe seu código!</p>
        </div>
        <div v-else class="space-y-2">
          <div v-for="(f, i) in friends" :key="f.id"
            class="flex items-center gap-3 px-4 py-3 rounded-2xl bg-[#0F172A] border border-slate-800">
            <span class="text-xl w-8 text-center">{{ i===0?'🥇':i===1?'🥈':i===2?'🥉':`#${i+1}` }}</span>
            <div class="w-9 h-9 rounded-full flex items-center justify-center font-black text-white flex-shrink-0"
              style="background:linear-gradient(135deg,#6366F1,#A855F7)">
              {{ f.username?.[0]?.toUpperCase() }}
            </div>
            <div class="flex-1">
              <p class="font-bold text-white text-sm">{{ f.username }}</p>
              <p v-if="f.streak > 0" class="text-xs text-orange-400">🔥 {{ f.streak }}</p>
            </div>
            <p class="font-black text-yellow-400">{{ f.xp >= 1000 ? `${(f.xp/1000).toFixed(1)}k` : f.xp }} XP</p>
          </div>
        </div>
      </div>

      <!-- Pending -->
      <div v-if="tab === 'pending'">
        <div v-if="pending.length === 0" class="text-center py-12">
          <p class="text-4xl mb-3">✅</p>
          <p class="text-slate-400 text-sm">Nenhum pedido pendente</p>
        </div>
        <div v-else class="space-y-2">
          <div v-for="req in pending" :key="req.id"
            class="flex items-center gap-3 px-4 py-3 rounded-2xl bg-[#0F172A] border border-slate-800">
            <div class="w-9 h-9 rounded-full flex items-center justify-center font-black text-white flex-shrink-0"
              style="background:linear-gradient(135deg,#6366F1,#A855F7)">
              {{ req.requester?.username?.[0]?.toUpperCase() }}
            </div>
            <p class="flex-1 font-bold text-white text-sm">{{ req.requester?.username }}</p>
            <button @click="reject(req.id)" class="w-9 h-9 rounded-xl bg-rose-900/40 border border-rose-500/30 flex items-center justify-center text-rose-400 font-bold hover:bg-rose-800/40 transition">✕</button>
            <button @click="accept(req.id)" class="w-9 h-9 rounded-xl bg-green-900/40 border border-green-500/30 flex items-center justify-center text-green-400 font-bold hover:bg-green-800/40 transition">✓</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
