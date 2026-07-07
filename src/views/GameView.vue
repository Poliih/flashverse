<script setup>
import { onMounted } from 'vue'
import { useGameStore } from '../stores/game'
import { useAuthStore } from '../stores/auth'

const game = useGameStore()
const auth = useAuthStore()

onMounted(() => game.init())
</script>

<template>
  <div
    class="flex flex-col h-screen overflow-hidden bg-[#020817] p-4 sm:p-6"
    :class="{ 'animate-shake': game.isShaking }"
  >

    <header class="flex justify-between items-center mb-2 sm:mb-6 flex-shrink-0 max-w-3xl mx-auto w-full pt-12">
      <div>
        <h1 class="text-2xl sm:text-3xl font-black leading-none">
          Flash <span class="gradient-text">Verse</span>
        </h1>
        <p class="text-[10px] font-bold tracking-[2px] text-slate-500 uppercase">Memorize com Estilo</p>
      </div>

      <div class="flex items-center gap-3">
        <div class="bg-[#1E293B] border border-slate-700 rounded-xl px-3 py-2 text-center">
          <div class="text-[9px] font-bold text-slate-500 uppercase tracking-widest">XP</div>
          <div class="text-lg font-black text-yellow-400">{{ game.sessionScore }}</div>
        </div>

        <div
          class="bg-[#1E293B] border rounded-xl px-3 py-2 text-center transition-all duration-300"
          :class="game.streak > 2 ? 'border-orange-500/60 shadow-[0_0_15px_rgba(234,88,12,0.3)]' : 'border-slate-700'"
        >
          <div class="text-[9px] font-bold uppercase tracking-widest" :class="game.streak > 2 ? 'text-orange-400' : 'text-slate-500'">Combo</div>
          <div class="text-lg font-black" :class="game.streak > 2 ? 'text-orange-400' : 'text-slate-300'">
            {{ game.streak > 2 ? '🔥' : '⚡' }} {{ game.streak }}
          </div>
        </div>
      </div>
    </header>

    <div v-if="game.isLoading" class="flex-1 flex items-center justify-center">
      <div class="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
    </div>

    <div v-else-if="game.isStudying" class="flex-1 flex flex-col min-h-0 max-w-3xl mx-auto w-full animate-fade-in pb-4">
      <div class="text-center mb-6 flex-shrink-0">
        <h2 class="text-2xl sm:text-3xl font-black text-white mb-2">Sala de Memorização</h2>
        <p class="text-slate-400 text-sm sm:text-base">Leia com atenção o seu deck de hoje antes de começar o desafio.</p>
      </div>
      
      <div class="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-2 pb-6">
        <div v-for="(v, index) in game.deck" :key="v.verse_id" class="bg-[#0F172A] border border-slate-700 rounded-2xl p-5 sm:p-6 shadow-lg relative overflow-hidden">
          <div class="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
          
          <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-3">
            <span class="w-max bg-indigo-500/20 text-indigo-400 text-[10px] sm:text-xs font-bold px-3 py-1.5 rounded-lg uppercase tracking-widest">
              Carta {{ v.stack_position }} de 5
            </span>
            <span class="text-slate-200 font-bold text-lg">
              {{ v.book_name }} {{ v.chapter }}:{{ v.verse_number }}
            </span>
          </div>
          
          <p class="text-slate-300 italic leading-relaxed text-base sm:text-lg">
            "{{ v.verse_text }}"
          </p>
        </div>
      </div>

      <div class="pt-4 flex-shrink-0 mt-auto">
        <button 
          @click="game.startQuiz()" 
          class="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black text-lg py-5 rounded-2xl transition-all active:scale-95 shadow-[0_0_20px_rgba(79,70,229,0.3)]"
        >
          Estou Pronto! Começar Desafio →
        </button>
      </div>
    </div>

    <div v-else-if="game.verse && !game.isLoading" :key="game.verse.verse_id || 'game-board'" class="flex-1 flex flex-col gap-4 sm:gap-8 min-h-0 animate-fade-in">

      <div class="flex-1 flex items-center justify-center min-h-[35vh]">
        <div class="perspective-1200 w-full flex items-stretch justify-center h-full max-h-[450px]">
          <div
            class="relative w-full max-w-2xl h-full min-h-[250px] transform-3d transition-transform duration-500"
            :class="{ flipped: game.isFlipped }"
          >

            <div class="backface-hidden absolute inset-0 flex flex-col bg-[#0F172A] rounded-[2rem] border border-slate-800 overflow-hidden shadow-xl">
              <div class="flex-1 overflow-y-auto custom-scrollbar flex items-center justify-center p-6 sm:p-10">
                <p class="text-lg sm:text-2xl font-semibold italic leading-relaxed text-slate-100 text-center w-full">
                  "{{ game.verse.verse_text }}"
                </p>
              </div>
            </div>

            <div
              class="backface-hidden rotate-y-180 absolute inset-0 flex flex-col items-center justify-center bg-[#0F172A] rounded-[2rem] border-2 overflow-hidden shadow-xl"
              :class="game.isCorrect ? 'border-green-500/60' : 'border-rose-500/60'"
            >
              <div
                class="absolute inset-0 opacity-10"
                :class="game.isCorrect ? 'bg-green-500' : 'bg-rose-500'"
              />

              <div class="relative z-10 text-center w-full px-6 sm:px-12 flex flex-col items-center justify-center h-full">
                <div
                  class="w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center text-4xl sm:text-5xl mb-4 border-4 animate-scale-in mx-auto"
                  :class="game.isCorrect ? 'bg-green-950 border-green-500' : 'bg-rose-950 border-rose-500'"
                >
                  {{ game.isCorrect ? '🎯' : '💀' }}
                </div>

                <h3
                  class="text-3xl sm:text-4xl font-black uppercase mb-1"
                  :class="game.isCorrect ? 'text-green-400' : 'text-rose-400'"
                >
                  {{ game.isCorrect ? 'PERFEITO!' : 'FALHOU!' }}
                </h3>

                <p v-if="game.isCorrect && game.streak > 1" class="text-orange-400 font-black text-lg mb-2">
                  Combo {{ game.streak }}x 🔥
                </p>

                <div class="bg-slate-900 border border-slate-700 rounded-2xl w-full py-4 mt-2 mb-6">
                  <p class="font-black text-xl sm:text-2xl text-white">{{ game.verse.book_name }}</p>
                  <p class="text-lg sm:text-xl font-bold text-indigo-400">
                    {{ game.verse.chapter }}:{{ game.verse.verse_number }}
                  </p>
                </div>

                <button
                  v-if="!game.isLoading"
                  @click="game.nextCard()"
                  :disabled="game.isSaving"
                  class="w-full bg-slate-700 hover:bg-slate-600 text-white font-black text-lg py-4 rounded-2xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {{ game.isSaving ? 'Salvando...' : 'Próximo Versículo →' }}
                </button>

                <div v-else class="w-full bg-slate-800 text-slate-400 font-black text-lg py-4 rounded-2xl text-center animate-pulse">
                  Carregando próximo...
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      <div class="flex-shrink-0 w-full max-w-3xl mx-auto pb-6">
        <div v-if="!game.isFlipped" class="animate-fade-in">
          
          <div class="flex items-center justify-center gap-2 mb-3">
            <div v-for="i in 3" :key="i"
              class="h-2 rounded-full transition-all duration-300"
              :class="[
                i < game.gameStage ? 'w-5 bg-green-500' :
                i === game.gameStage ? 'w-8 bg-indigo-500' : 'w-2 bg-slate-700'
              ]"
            />
          </div>
          
          <p class="text-center text-indigo-400 font-bold text-xs uppercase tracking-widest mb-1">
            Passo {{ game.gameStage }} de 3
          </p>
          <p class="text-center text-white font-black text-xl sm:text-2xl mb-6">{{ game.stageTitle }}</p>

          <div class="space-y-3">
            <button
              v-for="(op, i) in game.options"
              :key="i"
              @click="game.chooseOption(op)"
              class="w-full p-5 rounded-2xl border font-bold text-lg transition-all active:scale-[0.98]"
              :class="game.optionClass(op)"
              :disabled="game.selectedOption !== null"
            >
              {{ op.text }}
            </button>
          </div>
          
        </div>
      </div>
      
    </div>

    <div v-else class="flex-1 flex flex-col items-center justify-center gap-4 animate-fade-in text-center px-4">
      <div class="text-6xl mb-2">🏆</div>
      <h2 class="text-3xl font-black text-white">Sessão Concluída!</h2>
      <p class="text-slate-400 text-lg max-w-md">
        Você finalizou o seu deck de estudos diário. Volte amanhã para revisar e aprender novos versículos!
      </p>
      <div class="mt-4 px-6 py-3 bg-slate-800 rounded-xl border border-slate-700">
        <p class="text-sm text-slate-400 uppercase tracking-widest font-bold">XP Acumulado</p>
        <p class="text-2xl font-black text-yellow-400">{{ game.sessionScore }}</p>
      </div>
    </div>

  </div>
</template>