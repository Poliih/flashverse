import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '../lib/supabase'
import { useAuthStore } from './auth'
import confetti from 'canvas-confetti'

const bibleBooksMap = {
  "Livro 1": "Gênesis", "Livro 2": "Êxodo", "Livro 3": "Levítico",
  "Livro 4": "Números", "Livro 5": "Deuteronômio", "Livro 6": "Josué",
  "Livro 7": "Juízes", "Livro 8": "Rute", "Livro 9": "1 Samuel",
  "Livro 10": "2 Samuel", "Livro 11": "1 Reis", "Livro 12": "2 Reis",
  "Livro 13": "1 Crônicas", "Livro 14": "2 Crônicas", "Livro 15": "Esdras",
  "Livro 16": "Neemias", "Livro 17": "Ester", "Livro 18": "Jó",
  "Livro 19": "Salmos", "Livro 20": "Provérbios", "Livro 21": "Eclesiastes",
  "Livro 22": "Cânticos", "Livro 23": "Isaías", "Livro 24": "Jeremias",
  "Livro 25": "Lamentações", "Livro 26": "Ezequiel", "Livro 27": "Daniel",
  "Livro 28": "Oséias", "Livro 29": "Joel", "Livro 30": "Amós",
  "Livro 31": "Obadias", "Livro 32": "Jonas", "Livro 33": "Miquéias",
  "Livro 34": "Naum", "Livro 35": "Habacuque", "Livro 36": "Sofonias",
  "Livro 37": "Ageu", "Livro 38": "Zacarias", "Livro 39": "Malaquias",
  "Livro 40": "Mateus", "Livro 41": "Marcos", "Livro 42": "Lucas",
  "Livro 43": "João", "Livro 44": "Atos", "Livro 45": "Romanos",
  "Livro 46": "1 Coríntios", "Livro 47": "2 Coríntios", "Livro 48": "Gálatas",
  "Livro 49": "Efésios", "Livro 50": "Filipenses", "Livro 51": "Colossenses",
  "Livro 52": "1 Tessalonicenses", "Livro 53": "2 Tessalonicenses", "Livro 54": "1 Timóteo",
  "Livro 55": "2 Timóteo", "Livro 56": "Tito", "Livro 57": "Filemom",
  "Livro 58": "Hebreus", "Livro 59": "Tiago", "Livro 60": "1 Pedro",
  "Livro 61": "2 Pedro", "Livro 62": "1 João", "Livro 63": "2 João",
  "Livro 64": "3 João", "Livro 65": "Judas", "Livro 66": "Apocalipse"
}

export const useGameStore = defineStore('game', () => {
  const authStore = useAuthStore()

  // ─── State ────────────────────────────────────────────────
  const verse = ref(null)
  const books = ref([])
  const isLoading = ref(true)
  const isFlipped = ref(false)
  const isCorrect = ref(false)
  const isShaking = ref(false)

  // Game Flow (Antigo "Hint Mode")
  const gameStage = ref(1) // 1=book 2=chapter 3=verse
  const stageTitle = ref('')
  const options = ref([])
  const selectedOption = ref(null)
  const errors = ref(0)

  // Combo / score
  const streak = ref(0)
  const maxStreak = ref(0)
  const sessionScore = ref(0)
  

  // ─── Init ─────────────────────────────────────────────────
  async function init() {
    await fetchBooks()
    await fetchVerse()
  }

  async function fetchBooks() {
    const { data } = await supabase.from('books').select('*').order('book_order')
    if (data) {
      books.value = data.map(book => ({
        ...book,
        name: bibleBooksMap[book.name] || book.name
      }))
    }
  }

  async function fetchVerse() {
    isLoading.value = true
    isFlipped.value = false
    
    let data = null

    // Tentar favoritos primeiro se estiver logado
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

    if (!data) {
      const { data: random } = await supabase.rpc('get_random_verse')
      if (random && random.length > 0) data = random[0]
    }

    if (data) {
      data.book_name = bibleBooksMap[data.book_name] || data.book_name
    }

    verse.value = data
    isLoading.value = false
    
    // Iniciar o jogo
    startGame()
  }

  // ─── Lógica Principal do Jogo ─────────────────────────────
  function startGame() {
    gameStage.value = 1
    errors.value = 0
    generateOptions()
  }

  function generateOptions() {
    selectedOption.value = null
    const shuffle = arr => [...arr].sort(() => Math.random() - 0.5)

    let correct, wrong

    if (gameStage.value === 1) {
      stageTitle.value = 'Qual é o Livro?'
      
      const correctBookName = verse.value?.book_name ?? 'Desconhecido'
      
      correct = {
        text: correctBookName,
        isCorrect: true
      }

      const allBooks = Object.values(bibleBooksMap)

      const pool = allBooks.filter(bookName => bookName !== correctBookName)

      const randomBookName = pool[Math.floor(Math.random() * pool.length)]

      wrong = { 
        text: randomBookName, 
        isCorrect: false 
      }
    } else if (gameStage.value === 2) {
      stageTitle.value = 'Qual é o Capítulo?'
      const c = verse.value.chapter
      let w = c + (Math.random() > 0.5 ? 1 : -1)
      if (w < 1 || w === c) w = c + 2
      correct = { text: `Capítulo ${c}`, isCorrect: true }
      wrong = { text: `Capítulo ${w}`, isCorrect: false }
    } else {
      stageTitle.value = 'Qual é o Versículo?'
      const v = verse.value.verse_number
      const w = v + Math.floor(Math.random() * 15) + 1
      correct = { text: `Versículo ${v}`, isCorrect: true }
      wrong = { text: `Versículo ${w}`, isCorrect: false }
    }

    options.value = shuffle([correct, wrong])
  }

  async function chooseOption(option) {
    if (selectedOption.value !== null) return
    selectedOption.value = option

    if (!option.isCorrect) {
      streak.value = 0
      errors.value++
      shake()
    }

    setTimeout(async () => {
      if (gameStage.value < 3) {
        gameStage.value++
        generateOptions()
      } else {
        // Fim da rodada
        const won = errors.value === 0
        isCorrect.value = won
        isFlipped.value = true

        if (won) {
          streak.value++
          if (streak.value > maxStreak.value) maxStreak.value = streak.value
          const gained = 100 + Math.min(streak.value * 25, 500)
          sessionScore.value += gained
          fireConfetti()
        } else {
          shake()
        }

        await persistResult(won)
      }
    }, 1200)
  }

  function optionClass(op) {
    if (!selectedOption.value) return 'bg-slate-800 border-indigo-500/40 hover:bg-slate-700 hover:border-indigo-400 text-white'
    if (op.isCorrect) return 'bg-green-900/80 border-green-500 text-green-300 shadow-[0_0_20px_rgba(34,197,94,0.4)]'
    if (selectedOption.value === op && !op.isCorrect) return 'bg-rose-900/80 border-rose-500 text-rose-300 shadow-[0_0_20px_rgba(244,63,94,0.4)]'
    return 'bg-slate-900 border-slate-800 opacity-30 text-slate-600'
  }

  // ─── Persistência ─────────────────────────────────────────
  async function persistResult(correct) {
    if (!authStore.isLoggedIn || !verse.value) return

    const userId = authStore.user.id
    const today = new Date().toISOString().substring(0, 10)

    // Log result (removido a coluna hints_used, ou você pode passar 0 fixo se preferir manter o DB atual)
    await supabase.from('daily_results').insert({
      user_id: userId,
      verse_id: verse.value.id,
      session_date: today,
      correct,
      hints_used: 0,
    })

    // Atualizar progresso
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

    // Atualizar perfil
    if (correct) {
      await supabase.rpc('update_player_stats', {
        p_user_id: userId,
        p_xp_gained: 10,
        p_new_streak: streak.value,
      })
      await authStore.refreshProfile()
    }
  }

  // ─── Efeitos ──────────────────────────────────────────────
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
    gameStage, stageTitle, options, selectedOption,
    streak, maxStreak, sessionScore,
    init, fetchVerse, chooseOption, optionClass
  }
})