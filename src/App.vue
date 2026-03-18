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
  if (etapaAtual.value === 3) return `Ver?`
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
  <div class="flex flex-col items-center justify-center min-h-screen bg-slate-950 p-4 font-sans text-slate-200 overflow-hidden">
    
    <header class="text-center mb-8 relative w-full max-w-md flex justify-between items-end flex-shrink-0">
      <div class="text-left">
        <h1 class="text-4xl font-extrabold mb-1 tracking-tighter text-white">
          Flash <span class="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Verse</span>
        </h1>
        <p class="text-slate-400 text-sm font-medium">Memorize com estilo.</p>
      </div>
      
      <div class="flex flex-col items-center bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 shadow-[0_0_15px_rgba(0,0,0,0.5)]" :class="{ 'animate-pulse border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.4)]': streak > 2 }">
        <span class="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Combo</span>
        <div class="flex items-center gap-1 text-2xl font-black" :class="streak > 0 ? 'text-orange-500' : 'text-slate-600'">
          🔥 {{ streak }}
        </div>
      </div>
    </header>

    <div v-if="isLoading" class="flex flex-col items-center justify-center h-64">
      <div class="w-14 h-14 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4 shadow-[0_0_15px_rgba(168,85,247,0.5)]"></div>
      <p class="text-lg text-slate-400 font-semibold animate-pulse">Sincronizando...</p>
    </div>

    <div v-else-if="verse" class="relative w-full max-w-md perspective-1000 z-10 h-[500px] max-h-[80vh] flex-shrink-0" :class="{ 'animate-shake': isShaking }">
      
      <div 
        class="w-full h-full duration-700 ease-out transform-style-3d relative"
        :class="{ '[transform:rotateY(180deg)]': isFlipped }"
      >

        <div class="absolute inset-0 backface-hidden bg-slate-900 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-5 flex flex-col border border-slate-800 border-t-4 border-t-purple-500 overflow-hidden">
          
          <div class="bg-slate-800/60 p-5 rounded-2xl mb-4 border border-slate-700/50 shadow-inner relative flex flex-col h-[60%]">
            <span class="absolute -top-4 -left-2 text-6xl text-slate-700/30 font-serif leading-none opacity-50 z-0">"</span>
            <div class="overflow-y-auto custom-scrollbar pr-2 z-10 h-full flex items-center justify-center">
                <p class="text-lg font-medium text-slate-100 text-center leading-relaxed italic select-none break-words w-full">
                {{ verse.text }}
                </p>
            </div>
          </div>

          <div v-if="isHintMode" class="flex-grow flex flex-col items-center justify-center h-[55%] animate-fade-in">
            <h3 class="text-xs font-bold text-purple-400 mb-2 uppercase tracking-widest text-center">
              Passo {{ hintStep }}/3
            </h3>
            <p class="text-xl font-black text-white text-center mb-4">{{ hintTitulo }}</p>
            
            <div class="w-full flex flex-col gap-3">
              <button 
                v-for="(op, index) in hintOptions" 
                :key="index"
                @click="responderDica(op)"
                :disabled="hintSelectedOption !== null"
                class="p-4 rounded-xl font-bold text-lg border-2 transition-all shadow-lg active:scale-95 flex items-center justify-between"
                :class="getDicaButtonClass(op)"
              >
                <span>{{ op.text }}</span>
                <span v-if="hintSelectedOption && op.isCorrect" class="text-xl">✅</span>
                <span v-if="hintSelectedOption === op && !op.isCorrect" class="text-xl">❌</span>
              </button>
            </div>
          </div>

          <div v-else class="flex-grow flex flex-col h-[55%] overflow-hidden">
            
            <div class="flex items-center justify-between mb-3 border-b border-slate-700/60 pb-2 flex-shrink-0">
              <button v-if="etapaAtual > 1 && etapaAtual < 4" @click="voltarEtapa" class="group flex items-center gap-1 px-2 py-1 bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-[10px] font-bold uppercase tracking-wider rounded-full border border-slate-600 shadow-sm transition-all active:scale-95">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 text-purple-400 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                Voltar
              </button>
              <div v-else class="w-16"></div>

              <span class="font-semibold text-slate-300 tracking-tight text-xs md:text-sm flex items-center gap-1 text-center truncate px-2">
                {{ selecaoTexto }}
              </span>
              
              <button 
                v-if="dicasRestantes > 0 && etapaAtual < 4" 
                @click="iniciarDica" 
                class="group flex items-center gap-1 px-2 py-1 bg-purple-900/50 hover:bg-purple-800 text-purple-300 text-[10px] font-bold uppercase tracking-wider rounded-full border border-purple-500/50 shadow-[0_0_10px_rgba(168,85,247,0.3)] transition-all active:scale-95 flex-shrink-0"
              >
                💡 {{ dicasRestantes }}/5
              </button>
              <div v-else class="w-12 opacity-0 pointer-events-none flex-shrink-0">💡</div>
            </div>

            <div class="flex-grow overflow-y-auto custom-scrollbar pr-1 pb-2">
                <div v-if="etapaAtual === 1" class="flex flex-wrap gap-2">
                <button v-for="livro in livrosDoBanco" :key="livro.id" @click="escolherLivro(livro)" class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-full text-xs transition-all active:scale-95 border border-slate-700/50 hover:border-purple-500/50">{{ livro.name }}</button>
                </div>
                <div v-if="etapaAtual === 2" class="flex flex-wrap gap-2">
                <button v-for="n in selecao.livro.total_chapters" :key="n" @click="escolherCapitulo(n)" class="w-10 h-10 flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold rounded-xl text-sm transition-all active:scale-95 border border-slate-700/50 hover:border-purple-500/50">{{ n }}</button>
                </div>
                <div v-if="etapaAtual === 3" class="flex flex-wrap gap-2">
                <button v-for="n in 100" :key="n" @click="escolherVersiculo(n)" class="w-10 h-10 flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold rounded-xl text-sm transition-all active:scale-95 border border-slate-700/50 hover:border-purple-500/50">{{ n }}</button>
                </div>
            </div>

            <div v-if="etapaAtual === 4" class="flex flex-col items-center justify-center h-full mt-auto pt-2 pb-2">
              <p class="text-slate-400 mb-3 text-center text-sm font-medium">Tudo pronto. Preparado?</p>
              <button @click="verificarResposta" class="relative w-full overflow-hidden group bg-gradient-to-r from-blue-600 to-purple-600 text-white font-black text-lg p-4 rounded-xl shadow-[0_10px_20px_rgba(37,99,235,0.3)] hover:shadow-[0_10px_30px_rgba(168,85,247,0.6)] transition-all active:scale-95 tracking-widest uppercase">
                <span class="absolute top-0 left-0 w-full h-full bg-white/20 skew-x-[45deg] -translate-x-[150%] group-hover:animate-shine"></span>
                Revelar ✨
              </button>
            </div>

          </div>
        </div>

        <div class="absolute inset-0 backface-hidden [transform:rotateY(180deg)] bg-black rounded-3xl shadow-2xl p-6 flex flex-col items-center justify-center border-2 border-slate-800 text-white z-0 overflow-hidden">
          <div class="absolute inset-0 rounded-3xl opacity-20 bg-[radial-gradient(#4f46e5_1px,transparent_1px)] [background-size:16px_16px]"></div>

          <div class="w-20 h-20 flex items-center justify-center rounded-full mb-4 relative z-10 transition-all duration-500 scale-in flex-shrink-0" :class="isCorrect ? 'bg-green-950 text-green-400 border-2 border-green-500 shadow-[0_0_30px_rgba(34,197,94,0.6)]' : 'bg-rose-950 text-rose-400 border-2 border-rose-500 shadow-[0_0_30px_rgba(244,63,94,0.6)]'">
            <span class="text-4xl">{{ isCorrect ? '🎯' : '💀' }}</span>
          </div>

          <h3 class="text-4xl font-black mb-1 tracking-tighter relative z-10 uppercase" :class="isCorrect ? 'text-green-400' : 'text-rose-400'">
            {{ isCorrect ? 'PERFEITO!' : 'FALHOU' }}
          </h3>
          
          <p v-if="isCorrect && streak > 1" class="text-orange-400 font-bold text-base mb-2 animate-bounce relative z-10">COMBO {{ streak }}x 🔥</p>
          <p v-else-if="!isCorrect && streak === 0" class="text-rose-500/80 font-bold text-xs mb-2 relative z-10">Combo quebrado! 💔</p>
          <div v-else class="mb-2"></div>

          <p class="text-slate-400 text-xs mb-1 mt-auto relative z-10 uppercase tracking-widest">Alvo Correto:</p>
          <div class="bg-slate-800/80 px-6 py-3 rounded-2xl mb-6 text-center border border-slate-700 relative z-10 shadow-lg w-full">
            <p class="font-extrabold text-2xl text-white tracking-tight">{{ verse.book_name }}</p>
            <p class="text-2xl font-black text-blue-400">{{ verse.chapter }}:{{ verse.verse_number }}</p>
          </div>

          <button @click="buscarNovoVersiculo" class="bg-slate-800 text-white font-bold text-base px-6 py-3 rounded-xl border border-slate-600 hover:bg-slate-700 hover:border-slate-400 transition-all w-full active:scale-95 mt-auto relative z-10">
            Próximo Nível ➔
          </button>
        </div>

      </div>
    </div>

    <div class="fixed top-0 left-0 w-full h-full pointer-events-none z-0 overflow-hidden">
        <div class="absolute -top-40 -left-40 w-96 h-96 bg-purple-900 rounded-full opacity-20 blur-[100px]"></div>
        <div class="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-900 rounded-full opacity-20 blur-[100px]"></div>
    </div>

  </div>
</template>

<style>
.perspective-1000 { perspective: 1000px; }
.transform-style-3d { transform-style: preserve-3d; }
.backface-hidden { backface-visibility: hidden; }

.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: #1e293b; border-radius: 4px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #475569; border-radius: 4px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #a855f7; }

@keyframes shine { 100% { transform: translateX(150%) skewX(45deg); } }
.animate-shine { animation: shine 0.6s ease-in-out; }

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-10px) rotate(-1deg); }
  40% { transform: translateX(10px) rotate(1deg); }
  60% { transform: translateX(-10px) rotate(-1deg); }
  80% { transform: translateX(10px) rotate(1deg); }
}
.animate-shake { animation: shake 0.4s ease-in-out; }

@keyframes scaleIn {
  0% { transform: scale(0); opacity: 0; }
  70% { transform: scale(1.2); }
  100% { transform: scale(1); opacity: 1; }
}
.scale-in { animation: scaleIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fade-in { animation: fadeIn 0.3s ease-out; }
</style>