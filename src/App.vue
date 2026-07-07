<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from './stores/auth'
import { Zap, Trophy, Users, Bookmark, Settings } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const showNav = computed(() => auth.isLoggedIn && !['/login','/register','/forgot-password'].includes(route.path))

const tabs = [
  { path: '/game',      icon: Zap,      label: 'Jogar' },
  { path: '/ranking',   icon: Trophy,   label: 'Ranking' },
  { path: '/friends',   icon: Users,    label: 'Amigos' },
  { path: '/favorites', icon: Bookmark, label: 'Favoritos' },
  { path: '/profile',   icon: Settings, label: 'Perfil' },
]

function navigate(path) {
  if (route.path !== path) router.push(path)
}
</script>

<template>
  <div class="flex flex-col min-h-screen min-h-dvh bg-[#020817]">
    <main class="flex-1 overflow-hidden" :class="showNav ? 'pb-[68px]' : ''">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <nav
      v-if="showNav"
      class="fixed bottom-0 left-0 right-0 bg-[#0F172A] border-t border-slate-800 z-50"
    >
      <div class="flex items-stretch h-[68px] max-w-lg mx-auto">
        <button
          v-for="tab in tabs"
          :key="tab.path"
          @click="navigate(tab.path)"
          class="flex-1 flex flex-col items-center justify-center gap-0.5 transition-all duration-200 relative"
          :class="route.path === tab.path ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'"
        >
          <span
            v-if="route.path === tab.path"
            class="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-indigo-500"
          />
          
          <component
            :is="tab.icon"
            class="w-6 h-6 transition-transform duration-200 mb-1"
            :class="route.path === tab.path ? 'scale-110' : ''"
          />
            
          <span class="text-[10px] font-bold tracking-wide" :class="route.path === tab.path ? 'text-indigo-400' : ''">
            {{ tab.label }}
          </span>
        </button>
      </div>
    </nav>
  </div>
</template>

<style>
.fade-enter-active, .fade-leave-active { transition: opacity 0.15s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>