import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

import GameView from '../views/GameView.vue'
import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import ForgotPasswordView from '../views/ForgotPasswordView.vue'
import RankingView from '../views/RankingView.vue'
import FriendsView from '../views/FriendsView.vue'
import FavoritesView from '../views/FavoritesView.vue'
import ProfileView from '../views/ProfileView.vue'

const routes = [
  { path: '/', redirect: '/game' },
  { path: '/game', component: GameView, meta: { requiresAuth: true } },
  { path: '/ranking', component: RankingView, meta: { requiresAuth: true } },
  { path: '/friends', component: FriendsView, meta: { requiresAuth: true } },
  { path: '/favorites', component: FavoritesView, meta: { requiresAuth: true } },
  { path: '/profile', component: ProfileView, meta: { requiresAuth: true } },
  { path: '/login', component: LoginView },
  { path: '/register', component: RegisterView },
  { path: '/forgot-password', component: ForgotPasswordView },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach(async (to) => {
  const authStore = useAuthStore()

  // Wait for auth init
  if (authStore.loading) {
    await new Promise(resolve => {
      const unwatch = setInterval(() => {
        if (!authStore.loading) { clearInterval(unwatch); resolve() }
      }, 50)
    })
  }

  if (to.meta.requiresAuth && !authStore.isLoggedIn) return '/login'
  if (['/login', '/register', '/forgot-password'].includes(to.path) && authStore.isLoggedIn) return '/game'
})

export default router
