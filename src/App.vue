<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from './supabase'
import confetti from 'canvas-confetti'

const verse = ref(null)
const isLoading = ref(true)
const isFlipped = ref(false)
const isCorrect = ref(false)
const streak = ref(0)
const isShaking = ref(false)

const livrosDoBanco = ref([])
const etapaAtual = ref(1)
const selecao = ref({ livro: null, capitulo: null, versiculo: null })

const dicasRestantes = ref(5) 
const isHintMode = ref(false)
const hintStep = ref(1) 
const hintTitulo = ref('')
const hintOptions = ref([])
const hintSelectedOption = ref(null)

const hintErros = ref(0)

const selecaoTexto = computed(() => {
  if (etapaAtual.value === 1) return "Livro"
  if (!selecao.value.livro) return "..."
  if (etapaAtual.value === 2) return `Cap de ${selecao.value.livro.name}?`
  if (etapaAtual.value === 3) return `Versículo?`
  return `${selecao.value.livro.name} ${selecao.value.capitulo}:${selecao.value.versiculo}`
})

const escolherLivro = (livroObjeto) => { selecao.value.livro = livroObjeto; etapaAtual.value = 2 }
const escolherCapitulo = (capitulo) => { selecao.value.capitulo = capitulo; etapaAtual.value = 3 }
const escolherVersiculo = (versiculo) => { selecao.value.versiculo = versiculo; etapaAtual.value = 4 }
const voltarEtapa = () => { if (etapaAtual.value > 1) etapaAtual.value-- }

onMounted(async () => {
  await buscarLivros()
  await buscarNovoVersiculo()
})

const buscarLivros = async () => {
  const { data } = await supabase.from('books').select('*').order('book_order')
  if (data) livrosDoBanco.value = data
}

const buscarNovoVersiculo = async () => {
  isLoading.value = true
  isFlipped.value = false
  isHintMode.value = false
  etapaAtual.value = 1
  selecao.value = { livro: null, capitulo: null, versiculo: null }
  hintErros.value = 0
  
  const { data } = await supabase.rpc('get_random_favorite_verse')
  if (data && data.length > 0) verse.value = data[0]
  
  isLoading.value = false
}

const iniciarDica = () => {
  if (dicasRestantes.value <= 0) return
  dicasRestantes.value--
  isHintMode.value = true
  hintStep.value = 1
  hintErros.value = 0 
  gerarOpcoesDaDica()
}

const gerarOpcoesDaDica = () => {
  hintSelectedOption.value = null
  const shuffle = (array) => [...array].sort(() => Math.random() - 0.5)
  let correto, errado

  if (hintStep.value === 1) {
    hintTitulo.value = "Qual é o Livro?"
    correto = { text: verse.value.book_name, isCorrect: true }
    const oppositeTestament = verse.value.testament === 'Old' ? 'New' : 'Old'
    const wrongBooks = livrosDoBanco.value.filter(l => l.testament === oppositeTestament)
    errado = { text: wrongBooks[Math.floor(Math.random() * wrongBooks.length)].name, isCorrect: false }
  } 
  else if (hintStep.value === 2) {
    hintTitulo.value = "Qual é o Capítulo?"
    const capCorreto = verse.value.chapter
    let capErrado = capCorreto + (Math.random() > 0.5 ? 1 : -1)
    if (capErrado < 1 || capErrado === capCorreto) capErrado = capCorreto + 2
    correto = { text: `Capítulo ${capCorreto}`, isCorrect: true }
    errado = { text: `Capítulo ${capErrado}`, isCorrect: false }
  } 
  else if (hintStep.value === 3) {
    hintTitulo.value = "Qual é o Versículo?"
    const verCorreto = verse.value.verse_number
    let verErrado = verCorreto + Math.floor(Math.random() * 15) + 1
    correto = { text: `Versículo ${verCorreto}`, isCorrect: true }
    errado = { text: `Versículo ${verErrado}`, isCorrect: false }
  }

  hintOptions.value = shuffle([correto, errado])
}

const responderDica = (opcao) => {
  if (hintSelectedOption.value !== null) return
  hintSelectedOption.value = opcao
  
  if (!opcao.isCorrect) {
    streak.value = 0
    hintErros.value++ 
    tremerTela()
  }

  setTimeout(() => {
    if (hintStep.value === 1) { hintStep.value = 2; gerarOpcoesDaDica() } 
    else if (hintStep.value === 2) { hintStep.value = 3; gerarOpcoesDaDica() } 
    else if (hintStep.value === 3) {
      isHintMode.value = false
      if (hintErros.value === 0) {
        isCorrect.value = true
        streak.value++
        dispararConfetes()
      } else {
        isCorrect.value = false
        tremerTela()
      }
      isFlipped.value = true 
    }
  }, 1200)
}

const getDicaButtonClass = (op) => {
  if (!hintSelectedOption.value) return 'bg-slate-800 border-purple-500/50 hover:bg-slate-700 text-white hover:border-purple-400 hover:shadow-[0_0_15px_rgba(168,85,247,0.4)]'
  if (op.isCorrect) return 'bg-green-900/90 border-green-500 text-green-300 shadow-[0_0_20px_rgba(34,197,94,0.6)]'
  if (hintSelectedOption.value === op && !op.isCorrect) return 'bg-rose-900/90 border-rose-500 text-rose-300 shadow-[0_0_20px_rgba(244,63,94,0.6)]'
  return 'bg-slate-900 border-slate-800 opacity-30 text-slate-600 grayscale'
}

const verificarResposta = () => {
  const removeAcentos = (str) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  const dbLivro = removeAcentos(verse.value.book_name.toLowerCase())
  const userLivro = removeAcentos(selecao.value.livro.name.toLowerCase())
  
  const acertouTudo = (
    dbLivro === userLivro &&
    Number(verse.value.chapter) === Number(selecao.value.capitulo) &&
    Number(verse.value.verse_number) === Number(selecao.value.versiculo)
  )

  isCorrect.value = acertouTudo
  isFlipped.value = true

  if (acertouTudo) { streak.value++; dispararConfetes() } 
  else { streak.value = 0; tremerTela() }
}

const dispararConfetes = () => {
  const duration = 2000; const end = Date.now() + duration;
  const frame = () => {
    confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#3b82f6', '#a855f7', '#22c55e'] });
    confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#3b82f6', '#a855f7', '#22c55e'] });
    if (Date.now() < end) requestAnimationFrame(frame);
  }; frame();
}

const tremerTela = () => {
  isShaking.value = true
  setTimeout(() => isShaking.value = false, 400)
}
</script>

<template>
  <div class="flex flex-col items-center justify-start sm:justify-center min-h-screen bg-slate-950 p-4 sm:p-6 font-sans text-slate-200 overflow-hidden">
    
    <!-- HEADER -->
    <header class="text-center mb-4 sm:mb-8 relative w-full max-w-2xl flex justify-between items-end px-2 flex-shrink-0">
      <div class="text-left">
        <h1 class="text-3xl sm:text-5xl font-extrabold tracking-tighter text-white">
          Flash <span class="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Verse</span>
        </h1>
        <p class="text-slate-400 text-xs uppercase font-bold tracking-widest">Memorize com estilo</p>
      </div>
      
      <div class="bg-slate-900 border border-slate-700 rounded-2xl px-4 py-3 shadow-2xl" :class="{ 'animate-pulse border-orange-500': streak > 2 }">
        <div class="text-[10px] text-slate-500 font-bold uppercase text-center">Combo</div>
        <div class="text-3xl font-black text-orange-500">🔥 {{ streak }}</div>
      </div>
    </header>

    <!-- LOADING -->
    <div v-if="isLoading" class="flex flex-col items-center justify-center h-64">
      <div class="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
    </div>

    <!-- CARD -->
    <div v-else-if="verse" class="relative w-full max-w-2xl h-[700px] max-h-[90vh] perspective-1000 z-10 flex-shrink-0" :class="{ 'animate-shake': isShaking }">
      
      <div class="w-full h-full duration-700 transform-style-3d relative" :class="{ 'flipped': isFlipped }">

        <!-- FRENTE -->
        <div class="card-face card-front bg-slate-900 rounded-[2.5rem] shadow-[0_0_50px_rgba(0,0,0,0.4)] p-6 sm:p-8 flex flex-col border border-slate-800 border-t-8 border-t-purple-600">
          
          <!-- TEXTO -->
          <div class="bg-slate-800/40 p-6 rounded-3xl mb-6 border border-slate-700/30 relative h-[55%] flex flex-col shadow-inner">
            <span class="absolute -top-2 -left-1 text-7xl text-slate-700/20 font-serif leading-none select-none">"</span>
            <div class="overflow-y-auto custom-scrollbar pr-2 z-10 h-full flex items-center justify-center">
              <p class="text-2xl sm:text-3xl font-semibold text-slate-100 text-center italic leading-relaxed">
                {{ verse.text }}
              </p>
            </div>
          </div>

          <!-- DICA -->
          <div v-if="isHintMode" class="flex-grow flex flex-col items-center justify-center animate-fade-in h-[45%]">
            <p class="text-sm font-bold text-purple-400 uppercase tracking-widest mb-2">Dica passo {{ hintStep }}/3</p>
            <p class="text-3xl font-black text-white text-center mb-6 leading-none">{{ hintTitulo }}</p>

            <div class="w-full flex flex-col gap-4 max-w-md mx-auto">
              <button 
                v-for="(op, index) in hintOptions" 
                :key="index" 
                @click="responderDica(op)" 
                :disabled="hintSelectedOption !== null" 
                class="p-6 rounded-2xl font-bold border-2 transition-all flex items-center justify-between text-xl"
                :class="getDicaButtonClass(op)"
              >
                <span>{{ op.text }}</span>
                <span v-if="hintSelectedOption && op.isCorrect">✅</span>
                <span v-if="hintSelectedOption === op && !op.isCorrect">❌</span>
              </button>
            </div>
          </div>

          <!-- SELEÇÃO -->
          <div v-else class="flex-grow flex flex-col h-[45%] overflow-hidden">

            <!-- TOP BAR -->
            <div class="flex items-center justify-between mb-4 border-b border-slate-800 pb-3 flex-shrink-0">
              <button 
                v-if="etapaAtual > 1 && etapaAtual < 4" 
                @click="voltarEtapa" 
                class="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-sm font-bold rounded-xl border border-slate-700 transition-colors">
                Voltar
              </button>

              <div v-else class="w-10"></div>

              <span class="text-base font-black text-slate-400 uppercase tracking-widest text-center">
                {{ selecaoTexto }}
              </span>

              <button 
                v-if="dicasRestantes > 0 && etapaAtual < 4" 
                @click="iniciarDica" 
                class="flex items-center justify-center gap-2 px-6 py-4 bg-purple-900/40 text-purple-300 font-bold rounded-xl border border-purple-500/30 shadow-lg hover:bg-purple-800 transition-all active:scale-95"
              >
                <span class="text-2xl sm:text-3xl leading-none drop-shadow-md">💡</span> 
                
                <span class="text-sm sm:text-base mt-1">{{ dicasRestantes }}</span>
              </button>
            </div>

            <!-- LISTAS -->
            <div class="flex-grow overflow-y-auto custom-scrollbar pt-2">

              <!-- LIVROS -->
              <div v-if="etapaAtual === 1" class="flex flex-wrap gap-3 justify-center pb-4">
                <button 
                  v-for="livro in livrosDoBanco" 
                  :key="livro.id" 
                  @click="escolherLivro(livro)" 
                  class="px-6 py-4 bg-slate-800 hover:bg-purple-600 text-base font-bold rounded-full border border-slate-700 transition-all active:scale-90 w-[45%] sm:w-auto">
                  {{ livro.name }}
                </button>
              </div>

              <!-- CAPÍTULOS -->
              <div v-if="etapaAtual === 2" class="grid grid-cols-4 gap-3 justify-center pb-4">
                <button 
                  v-for="n in selecao.livro.total_chapters" 
                  :key="n" 
                  @click="escolherCapitulo(n)" 
                  class="h-14 flex items-center justify-center bg-slate-800 hover:bg-purple-600 font-bold rounded-2xl text-xl border border-slate-700 transition-all active:scale-90">
                  {{ n }}
                </button>
              </div>

              <!-- VERSÍCULOS -->
              <div v-if="etapaAtual === 3" class="grid grid-cols-4 gap-3 justify-center pb-4">
                <button 
                  v-for="n in 100" 
                  :key="n" 
                  @click="escolherVersiculo(n)" 
                  class="h-14 flex items-center justify-center bg-slate-800 hover:bg-purple-600 font-bold rounded-2xl text-xl border border-slate-700 transition-all active:scale-90">
                  {{ n }}
                </button>
              </div>

              <!-- REVELAR -->
              <div v-if="etapaAtual === 4" class="h-full flex flex-col items-center justify-center">
                <button 
                  @click="verificarResposta" 
                  class="w-full max-w-md bg-gradient-to-r from-blue-600 to-purple-600 text-white font-black py-6 rounded-3xl uppercase tracking-[0.2em] text-xl shadow-[0_10px_30px_rgba(168,85,247,0.4)] hover:scale-[1.02] transition-all active:scale-95">
                  Revelar ✨
                </button>
              </div>

            </div>
          </div>
        </div>

        <!-- VERSO -->
        <div class="card-face card-back bg-black rounded-[2.5rem] shadow-2xl p-8 flex flex-col items-center justify-center border-4 border-slate-800 text-white overflow-hidden">

          <div class="w-28 h-28 flex items-center justify-center rounded-full mb-6 border-4 scale-in"
            :class="isCorrect ? 'bg-green-950 text-green-400 border-green-500' : 'bg-rose-950 text-rose-400 border-rose-500'">
            <span class="text-6xl">{{ isCorrect ? '🎯' : '💀' }}</span>
          </div>

          <h3 class="text-4xl sm:text-5xl font-black mb-2 uppercase"
            :class="isCorrect ? 'text-green-400' : 'text-rose-400'">
            {{ isCorrect ? 'PERFEITO' : 'FALHOU' }}
          </h3>

          <div v-if="isCorrect && streak > 1" class="text-orange-400 font-black text-xl mb-6">
            Combo {{ streak }}x 🔥
          </div>

          <div class="bg-slate-900 px-8 py-5 rounded-2xl mb-8 text-center border border-slate-800 w-full max-w-sm">
            <p class="font-black text-2xl text-white">{{ verse.book_name }}</p>
            <p class="text-2xl font-bold text-blue-400">{{ verse.chapter }}:{{ verse.verse_number }}</p>
          </div>

          <button 
            @click="buscarNovoVersiculo" 
            class="bg-slate-700 text-white font-black text-xl py-6 px-10 rounded-2xl w-full max-w-xs">
            Próximo Versículo
          </button>
        </div>

      </div>
    </div>
  </div>
</template>

<style scoped>
.perspective-1000 { perspective: 1200px; }
.transform-style-3d { transform-style: preserve-3d; }

.card-face {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}

.card-back { transform: rotateY(180deg); }
.flipped { transform: rotateY(180deg); }

.card-front { z-index: 2; }
.flipped .card-front {
  visibility: hidden;
  transition: visibility 0s 0.3s;
}

.custom-scrollbar::-webkit-scrollbar { width: 6px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; border: 2px solid transparent; background-clip: content-box; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; background-clip: content-box; }

@keyframes shine { 100% { transform: translateX(150%) skewX(45deg); } }
.animate-shine { animation: shine 0.6s ease-in-out; }

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-8px); }
  75% { transform: translateX(8px); }
}
.animate-shake { animation: shake 0.15s ease-in-out 2; }

@keyframes scaleIn {
  0% { transform: scale(0.8); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}
.scale-in { animation: scaleIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fade-in { animation: fadeIn 0.4s ease-out; }
</style>