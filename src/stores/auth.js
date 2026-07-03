import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '../lib/supabase'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const profile = ref(null)
  const loading = ref(true)

  const isLoggedIn = computed(() => !!user.value)

  async function init() {
    const { data: { session } } = await supabase.auth.getSession()
    user.value = session?.user ?? null
    if (user.value) await fetchProfile()

    supabase.auth.onAuthStateChange(async (_event, session) => {
      user.value = session?.user ?? null
      if (user.value) await fetchProfile()
      else profile.value = null
    })

    loading.value = false
  }

  async function fetchProfile() {
    if (!user.value) return
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.value.id)
      .single()
    profile.value = data
  }

  async function signIn(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  async function signUp(email, password, username) {
    const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { username } } })
    if (error) throw error
    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        username,
        xp: 0,
        streak: 0,
      })
    }
  }

  async function signOut() {
    await supabase.auth.signOut()
    user.value = null
    profile.value = null
  }

  async function resetPassword(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email)
    if (error) throw error
  }

  async function refreshProfile() {
    await fetchProfile()
  }

  // Computed level info
  const level = computed(() => Math.floor((profile.value?.xp ?? 0) / 500) + 1)
  const xpInLevel = computed(() => (profile.value?.xp ?? 0) % 500)
  const xpProgress = computed(() => xpInLevel.value / 500)
  const xpToNext = computed(() => 500 - xpInLevel.value)

  return {
    user, profile, loading, isLoggedIn,
    level, xpInLevel, xpProgress, xpToNext,
    init, signIn, signUp, signOut, resetPassword, refreshProfile,
  }
})
