import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '../lib/supabase'
import { useAuthStore } from './auth'
import confetti from 'canvas-confetti'

export const useGameStore = defineStore('game', () => {
  const authStore = useAuthStore()

  // ─── State ────────────────────────────────────────────────
  const verse = ref(null)
  const books = ref([])
  const isLoading = ref(true)
  const isFlipped = ref(false)
  const isCorrect = ref(false)
  const isShaking = ref(false)

  // Selection
  const step = ref(1) // 1=book 2=chapter 3=verse 4=confirm
  const selection = ref({ book: null, chapter: null, verse: null })

  // Combo / score
  const streak = ref(0)
  const maxStreak = ref(0)
  const sessionScore = ref(0)

  // Hints
  const hintsLeft = ref(5)
  const isHintMode = ref(false)
  const hintStep = ref(1)
  const hintTitle = ref('')
  const hintOptions = ref([])
  const hintSelected = ref(null)
  const hintErrors = ref(0)

  // ─── Computed ─────────────────────────────────────────────
  const selectionLabel = computed(() => {
    if (step.value === 1) return 'Qual o Livro?'
    if (step.value === 2) return `Cap. de ${selection.value.book?.name}?`
    if (step.value === 3) return 'Qual o Versículo?'
    return `${selection.value.book?.name} ${selection.value.chapter}:${selection.value.verse}`
  })

  const oldTestament = computed(() => books.value.filter(b => b.testament === 'Old'))
  const newTestament = computed(() => books.value.filter(b => b.testament === 'New'))

  // ─── Init ─────────────────────────────────────────────────
  async function init() {
    await fetchBooks()
    await fetchVerse()
  }

  async function fetchBooks() {
    const { data } = await supabase.from('books').select('*').order('book_order')
    if (data) books.value = data
  }

  async function fetchVerse() {
    isLoading.value = true
    isFlipped.value = false
    isHintMode.value = false
    step.value = 1
    selection.value = { book: null, chapter: null, verse: null }
    hintErrors.value = 0
    hintSelected.value = null

    let data = null

    // Try favorites first if logged in
    if (authStore.isLoggedIn) {
      const { data: favCount } = await supabase
        .from('favorite_verses')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', authStore.user.id)

      if (favCount !== null) {
        const { data: favVerse } = await supabase.rpc('get_random_favorite_verse', {
          p_user_id: authStore.user.id
        })
        if (favVerse && favVerse.length > 0) data = favVerse[0]
      }
    }

    // Fallback: random verse
    if (!data) {
      const { data: random } = await supabase.rpc('get_random_verse')
      if (random && random.length > 0) data = random[0]
    }

    verse.value = data
    isLoading.value = false
  }

  // ─── Selection steps ──────────────────────────────────────
  function selectBook(book) { selection.value.book = book; step.value = 2 }
  function selectChapter(n) { selection.value.chapter = n; step.value = 3 }
  function selectVerse(n) { selection.value.verse = n; step.value = 4 }
  function goBack() {
    if (step.value === 2) { step.value = 1; selection.value.book = null }
    else if (step.value === 3) { step.value = 2; selection.value.chapter = null }
    else if (step.value === 4) { step.value = 3; selection.value.verse = null }
  }

  // ─── Verify answer ────────────────────────────────────────
  async function verifyAnswer() {
    const normalize = s => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    const correct =
      normalize(verse.value.book_name) === normalize(selection.value.book?.name ?? '') &&
      Number(verse.value.chapter) === Number(selection.value.chapter) &&
      Number(verse.value.verse_number) === Number(selection.value.verse)

    isCorrect.value = correct
    isFlipped.value = true

    if (correct) {
      streak.value++
      if (streak.value > maxStreak.value) maxStreak.value = streak.value
      const gained = 100 + Math.min(streak.value * 25, 500)
      sessionScore.value += gained
      fireConfetti()
    } else {
      streak.value = 0
      shake()
    }

    await persistResult(correct, 0)
  }

  // ─── Hints ────────────────────────────────────────────────
  function startHint() {
    if (hintsLeft.value <= 0) return
    hintsLeft.value--
    isHintMode.value = true
    hintStep.value = 1
    hintErrors.value = 0
    generateHintOptions()
  }

  function generateHintOptions() {
    hintSelected.value = null
    const shuffle = arr => [...arr].sort(() => Math.random() - 0.5)

    let correct, wrong

    if (hintStep.value === 1) {
      hintTitle.value = 'Qual é o Livro?'
      correct = { text: verse.value.book_name, isCorrect: true }
      const opposite = verse.value.testament === 'Old' ? 'New' : 'Old'
      const pool = books.value.filter(b => b.testament === opposite)
      wrong = { text: pool[Math.floor(Math.random() * pool.length)].name, isCorrect: false }
    } else if (hintStep.value === 2) {
      hintTitle.value = 'Qual é o Capítulo?'
      const c = verse.value.chapter
      let w = c + (Math.random() > 0.5 ? 1 : -1)
      if (w < 1 || w === c) w = c + 2
      correct = { text: `Capítulo ${c}`, isCorrect: true }
      wrong = { text: `Capítulo ${w}`, isCorrect: false }
    } else {
      hintTitle.value = 'Qual é o Versículo?'
      const v = verse.value.verse_number
      const w = v + Math.floor(Math.random() * 15) + 1
      correct = { text: `Versículo ${v}`, isCorrect: true }
      wrong = { text: `Versículo ${w}`, isCorrect: false }
    }

    hintOptions.value = shuffle([correct, wrong])
  }

  async function answerHint(option) {
    if (hintSelected.value !== null) return
    hintSelected.value = option

    if (!option.isCorrect) {
      streak.value = 0
      hintErrors.value++
      shake()
    }

    setTimeout(async () => {
      if (hintStep.value < 3) {
        hintStep.value++
        generateHintOptions()
      } else {
        // Done with hint minigame
        isHintMode.value = false
        const won = hintErrors.value === 0
        isCorrect.value = won
        isFlipped.value = true

        if (won) {
          streak.value++
          if (streak.value > maxStreak.value) maxStreak.value = streak.value
          const gained = 75 + Math.min(streak.value * 15, 300)
          sessionScore.value += gained
          fireConfetti()
        } else {
          shake()
        }

        await persistResult(won, 1)
      }
    }, 1200)
  }

  function hintOptionClass(op) {
    if (!hintSelected.value) return 'bg-slate-800 border-purple-500/40 hover:bg-slate-700 hover:border-purple-400 text-white'
    if (op.isCorrect) return 'bg-green-900/80 border-green-500 text-green-300 shadow-[0_0_20px_rgba(34,197,94,0.4)]'
    if (hintSelected.value === op && !op.isCorrect) return 'bg-rose-900/80 border-rose-500 text-rose-300 shadow-[0_0_20px_rgba(244,63,94,0.4)]'
    return 'bg-slate-900 border-slate-800 opacity-30 text-slate-600'
  }

  // ─── Persist ──────────────────────────────────────────────
  async function persistResult(correct, hintsUsed) {
    if (!authStore.isLoggedIn || !verse.value) return

    const userId = authStore.user.id
    const today = new Date().toISOString().substring(0, 10)

    // Log result
    await supabase.from('daily_results').insert({
      user_id: userId,
      verse_id: verse.value.id,
      session_date: today,
      correct,
      hints_used: hintsUsed,
    })

    // Verse progress (upsert)
    const { data: existing } = await supabase
      .from('verse_progress')
      .select('id, correct_streak')
      .eq('user_id', userId)
      .eq('verse_id', verse.value.id)
      .maybeSingle()

    if (existing) {
      const newStreak = correct ? existing.correct_streak + 1 : 0
      await supabase.from('verse_progress').update({
        correct_streak: newStreak,
        last_seen: today,
        next_review: new Date(Date.now() + 86400000).toISOString().substring(0, 10),
        mastered: newStreak >= 5,
      }).eq('id', existing.id)
    } else {
      await supabase.from('verse_progress').insert({
        user_id: userId,
        verse_id: verse.value.id,
        correct_streak: correct ? 1 : 0,
        last_seen: today,
        next_review: new Date(Date.now() + 86400000).toISOString().substring(0, 10),
        mastered: false,
      })
    }

    // Update profile XP and streak
    if (correct) {
      await supabase.rpc('update_player_stats', {
        p_user_id: userId,
        p_xp_gained: correct ? 10 : 0,
        p_new_streak: streak.value,
      })
      await authStore.refreshProfile()
    }
  }

  // ─── Effects ──────────────────────────────────────────────
  function fireConfetti() {
    const end = Date.now() + 2000
    const frame = () => {
      confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#6366F1', '#A855F7', '#22C55E', '#EAB308'] })
      confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#6366F1', '#A855F7', '#22C55E', '#EAB308'] })
      if (Date.now() < end) requestAnimationFrame(frame)
    }
    frame()
  }

  function shake() {
    isShaking.value = true
    setTimeout(() => { isShaking.value = false }, 450)
  }

  return {
    verse, books, isLoading, isFlipped, isCorrect, isShaking,
    step, selection, selectionLabel, oldTestament, newTestament,
    streak, maxStreak, sessionScore,
    hintsLeft, isHintMode, hintStep, hintTitle, hintOptions, hintSelected, hintErrors,
    init, fetchVerse, selectBook, selectChapter, selectVerse, goBack,
    verifyAnswer, startHint, answerHint, hintOptionClass,
  }
})
