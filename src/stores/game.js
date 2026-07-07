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

  const verse = ref(null)
  const books = ref([])
  const isLoading = ref(true)
  const isFlipped = ref(false)
  const isCorrect = ref(false)
  const isSaving = ref(false)
  const isShaking = ref(false)
  const isStudying = ref(true)

  const deck = ref([])
  const currentCardIndex = ref(0) 
  const isDeckFinished = ref(false) 
  

  const gameStage = ref(1) 
  const stageTitle = ref('')
  const options = ref([])
  const selectedOption = ref(null)
  const errors = ref(0)

  // Combo / score
  const streak = ref(0)
  const maxStreak = ref(0)
  const sessionScore = ref(0)
  

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

  async function fetchDailyDeck() {
    isLoading.value = true;
    isSaving.value = false;
    isDeckFinished.value = false;
    currentCardIndex.value = 0;
    verse.value = null;

    try {
      if (!authStore.isLoggedIn) return;

      const { data, error } = await supabase.rpc('get_or_create_daily_stack', {
        p_user_id: authStore.user.id
      });

      if (error) throw error;

      if (data && data.length > 0) {
        deck.value = data.map(v => ({
          ...v,
          book_name: bibleBooksMap[v.book_name] || v.book_name, 
          id: v.verse_id
        }));
        
        isStudying.value = true;
      } else {
        isDeckFinished.value = true;
      }
      //   loadNextCard(); 
    } catch (error) {
    } finally {
      isLoading.value = false;
    }
  }

  function loadNextCard() {
    isFlipped.value = false;
    isCorrect.value = false;
    isShaking.value = false;
    selectedOption.value = null;

    if (currentCardIndex.value < deck.value.length) {
      verse.value = deck.value[currentCardIndex.value];
      startGame();
    } else {
      isDeckFinished.value = true; 
    }
  }

  function startQuiz() {
    isStudying.value = false;
    loadNextCard();
  }

  async function fetchVerse() {

    if (isSaving.value) {
      return; 
    }

    isLoading.value = true;
    isFlipped.value = false;
    isCorrect.value = false;
    isShaking.value = false;
    selectedOption.value = null;
    
    isSaving.value = false;
    verse.value = null; 

    try {
      let data = null;

      if (authStore.isLoggedIn) {
        const { count: favCount, error: countErr } = await supabase
          .from('favorite_verses')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', authStore.user.id);

        if (countErr) console.error('Erro ao checar favoritos:', countErr);

        if (favCount && favCount > 0) {
          const { data: favVerse, error: favErr } = await supabase.rpc('get_random_favorite_verse', {
            p_user_id: authStore.user.id
          });
          
          if (favErr) console.error('Erro na RPC de favorito:', favErr);
          if (favVerse) data = Array.isArray(favVerse) ? favVerse[0] : favVerse;
        }
      }

      if (!data) {
        const { data: random, error: randErr } = await supabase.rpc('get_random_verse');
        if (randErr) console.error('Erro na RPC geral:', randErr);
        
        if (random) data = Array.isArray(random) ? random[0] : random;
      }

      if (data && data.book_name) {
        data.book_name = bibleBooksMap[data.book_name] || data.book_name;
      }

      verse.value = data || null;

      if (verse.value) {
        startGame();
      } else {
      }

    } catch (error) {
      verse.value = null;
    } finally {
      isLoading.value = false;
    }
  }

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

  let savePromise = null
  if (gameStage.value === 3) {
    const won = errors.value === 0
    savePromise = persistResult(won, verse.value) 
  }

  setTimeout(async () => {
    try {
      if (gameStage.value < 3) {
        gameStage.value++
        generateOptions()
      } else {
        const won = errors.value === 0
        isCorrect.value = won
        isFlipped.value = true

        if (won) {
          streak.value++
          if (streak.value > maxStreak.value) maxStreak.value = streak.value
          const gained = 100 + Math.min(streak.value * 25, 500)
          sessionScore.value += gained
          
          try {
            fireConfetti()
          } catch (confettiError) {
            console.warn('Erro na animação ignorado:', confettiError)
          }
        } else {
          shake()
        }

        if (savePromise) await savePromise
      }
    } catch (err) {
      console.error('Erro grave na transição de estágio:', err)
      isLoading.value = false 
    }
  }, 1200)
}

  function nextCard() {
      currentCardIndex.value++;
      loadNextCard();
    }

  function optionClass(op) {
    if (!selectedOption.value) return 'bg-slate-800 border-indigo-500/40 hover:bg-slate-700 hover:border-indigo-400 text-white'
    if (op.isCorrect) return 'bg-green-900/80 border-green-500 text-green-300 shadow-[0_0_20px_rgba(34,197,94,0.4)]'
    if (selectedOption.value === op && !op.isCorrect) return 'bg-rose-900/80 border-rose-500 text-rose-300 shadow-[0_0_20px_rgba(244,63,94,0.4)]'
    return 'bg-slate-900 border-slate-800 opacity-30 text-slate-600'
  }

async function persistResult(correct, currentVerse) {
  if (!authStore.isLoggedIn || !currentVerse) return

  isSaving.value = true 

  try {
    const userId = authStore.user.id
    const today = new Date().toISOString().substring(0, 10)

    await supabase.from('daily_results').insert({
      user_id: userId,
      verse_id: currentVerse.id, 
      session_date: today,
      correct,
      hints_used: 0,
    })

    const { data: existing } = await supabase
      .from('verse_progress')
      .select('id, correct_streak')
      .eq('user_id', userId)
      .eq('verse_id', currentVerse.id) 
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
        verse_id: currentVerse.id,
        correct_streak: correct ? 1 : 0,
        last_seen: today,
        next_review: new Date(Date.now() + 86400000).toISOString().substring(0, 10),
        mastered: false,
      })
    }

    if (correct) {
      try {
        await supabase.rpc('update_player_stats', {
          p_user_id: userId,
          p_xp_gained: 10,
          p_new_streak: streak.value,
        })
        await authStore.refreshProfile()
      } catch (innerError) {
        console.error('Erro ao atualizar stats:', innerError)
      }
    }
  } catch (error) {
    console.error('Erro geral ao salvar os resultados:', error)
  } finally {
    isSaving.value = false 
  }
}

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
    verse, deck, isDeckFinished, currentCardIndex, 
    books, isLoading, isFlipped, isCorrect, isShaking, isSaving,
    gameStage, stageTitle, options, selectedOption,
    streak, maxStreak, sessionScore, isStudying, startQuiz,
    init: fetchDailyDeck, 
    fetchDailyDeck, nextCard, chooseOption, optionClass
  }
})