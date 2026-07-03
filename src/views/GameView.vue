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

    <div v-else-if="game.verse" class="flex-1 flex flex-col gap-4 sm:gap-8 min-h-0">

      <div class="flex-1 flex items-center justify-center min-h-[35vh]">
        <div class="perspective-1200 w-full flex items-stretch justify-center h-full max-h-[450px]">
          <div
            class="relative w-full max-w-2xl h-full min-h-[250px] transform-3d transition-transform duration-500"
            :class="{ flipped: game.isFlipped }"
          >

            <div class="backface-hidden absolute inset-0 flex flex-col bg-[#0F172A] rounded-[2rem] border border-slate-800 overflow-hidden shadow-xl">
              <div class="flex-1 overflow-y-auto custom-scrollbar flex items-center justify-center p-6 sm:p-10">
                <p class="text-lg sm:text-2xl font-semibold italic leading-relaxed text-slate-100 text-center w-full">
                  "{{ game.verse.text }}"
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
                  class="w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center text-4xl sm:text-5xl mb-4 border-4 animate-scale-in"
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
                  @click="game.fetchVerse()"
                  class="w-full bg-slate-700 hover:bg-slate-600 text-white font-black text-lg py-4 rounded-2xl transition-all active:scale-95"
                >
                  Próximo Versículo →
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>

      <div class="flex-shrink-0 w-full max-w-3xl mx-auto pb-2">

        <div v-if="game.isHintMode" class="animate-fade-in">
          <div class="flex items-center justify-center gap-2 mb-3">
            <div v-for="i in 3" :key="i"
              class="h-2 rounded-full transition-all duration-300"
              :class="[
                i < game.hintStep ? 'w-5 bg-green-500' :
                i === game.hintStep ? 'w-8 bg-purple-500' : 'w-2 bg-slate-700'
              ]"
            />
          </div>
          <p class="text-center text-purple-400 font-bold text-xs uppercase tracking-widest mb-1">
            Dica passo {{ game.hintStep }}/3
          </p>
          <p class="text-center text-white font-black text-xl sm:text-2xl mb-4">{{ game.hintTitle }}</p>

          <div class="space-y-3 max-h-[35vh] overflow-y-auto custom-scrollbar pr-2">
            <button
              v-for="(op, i) in game.hintOptions" :key="i"
              @click="game.answerHint(op)"
              :disabled="game.hintSelected !== null"
              class="w-full p-4 rounded-2xl font-bold border-2 transition-all flex items-center justify-between text-base"
              :class="game.hintOptionClass(op)"
            >
              <span>{{ op.text }}</span>
              <span v-if="game.hintSelected">{{ op.isCorrect ? '✅' : (game.hintSelected === op ? '❌' : '') }}</span>
            </button>
          </div>
        </div>

        <div v-else>
          <div class="flex items-center justify-between mb-4">
            <button
              v-if="game.step > 1 && game.step < 4"
              @click="game.goBack()"
              class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-sm font-bold rounded-xl border border-slate-700 transition"
            >← Voltar</button>
            <div v-else class="w-20" /> <span class="text-sm font-black text-slate-400 uppercase tracking-wide text-center">
              {{ game.selectionLabel }}
            </span>

            <button
              v-if="game.step < 4 && !game.isFlipped"
              @click="game.startHint()"
              :disabled="game.hintsLeft <= 0"
              class="flex items-center justify-center gap-1.5 w-20 py-2 rounded-xl border font-bold text-sm transition-all"
              :class="game.hintsLeft > 0
                ? 'bg-purple-900/30 border-purple-500/40 text-purple-300 hover:bg-purple-800/40'
                : 'bg-slate-800/50 border-slate-700 text-slate-600 opacity-40 cursor-not-allowed'"
            >
              💡 <span>{{ game.hintsLeft }}</span>
            </button>
            <div v-else class="w-20" />
          </div>

          <div v-if="game.step === 1" class="max-h-[40vh] overflow-y-auto custom-scrollbar pr-2 animate-fade-in">
            <div class="mb-4">
              <p class="text-[10px] font-black uppercase tracking-[2px] text-amber-500/70 mb-2 flex items-center gap-1">
                <span class="w-1 h-3 bg-amber-500 rounded inline-block" /> Antigo Testamento
              </p>
              <div class="flex flex-wrap gap-2">
                <button v-for="b in game.oldTestament" :key="b.id" @click="game.selectBook(b)"
                  class="flex-1 min-w-[100px] px-3 py-2 bg-slate-800 hover:bg-amber-900/40 hover:border-amber-500/50 text-sm font-bold rounded-xl border border-slate-700 transition-all active:scale-95">
                  {{ b.name }}
                </button>
              </div>
            </div>
            <div>
              <p class="text-[10px] font-black uppercase tracking-[2px] text-indigo-500/70 mb-2 flex items-center gap-1">
                <span class="w-1 h-3 bg-indigo-500 rounded inline-block" /> Novo Testamento
              </p>
              <div class="flex flex-wrap gap-2">
                <button v-for="b in game.newTestament" :key="b.id" @click="game.selectBook(b)"
                  class="flex-1 min-w-[100px] px-3 py-2 bg-slate-800 hover:bg-indigo-900/40 hover:border-indigo-500/50 text-sm font-bold rounded-xl border border-slate-700 transition-all active:scale-95">
                  {{ b.name }}
                </button>
              </div>
            </div>
          </div>

          <div v-if="game.step === 2" class="max-h-[40vh] overflow-y-auto custom-scrollbar pr-2 animate-fade-in">
            <div class="grid grid-cols-4 sm:grid-cols-6 gap-2">
              <button v-for="n in game.selection.book?.total_chapters" :key="n" @click="game.selectChapter(n)"
                class="h-12 flex items-center justify-center bg-slate-800 hover:bg-indigo-700 font-bold rounded-xl text-base border border-slate-700 transition-all active:scale-90">
                {{ n }}
              </button>
            </div>
          </div>

          <div v-if="game.step === 3" class="max-h-[40vh] overflow-y-auto custom-scrollbar pr-2 animate-fade-in">
            <div class="grid grid-cols-4 sm:grid-cols-6 gap-2">
              <button v-for="n in 150" :key="n" @click="game.selectVerse(n)"
                class="h-12 flex items-center justify-center bg-slate-800 hover:bg-indigo-700 font-bold rounded-xl text-base border border-slate-700 transition-all active:scale-90">
                {{ n }}
              </button>
            </div>
          </div>

          <div v-if="game.step === 4" class="animate-fade-in mt-2">
            <div class="bg-slate-800 border border-indigo-500/30 rounded-2xl p-5 text-center mb-4 shadow-lg">
              <p class="font-black text-xl sm:text-2xl text-white">{{ game.selection.book?.name }}</p>
              <p class="text-indigo-400 font-bold text-lg mt-1">{{ game.selection.chapter }}:{{ game.selection.verse }}</p>
            </div>
            <button
              @click="game.verifyAnswer()"
              class="w-full py-5 rounded-2xl font-black text-white text-xl uppercase tracking-widest transition-all active:scale-95"
              style="background:linear-gradient(135deg,#6366F1,#A855F7);box-shadow:0 8px 28px rgba(99,102,241,0.4)"
            >
              ✨ Revelar
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="flex-1 flex flex-col items-center justify-center gap-4">
      <p class="text-5xl mb-2">😔</p>
      <p class="text-slate-400 text-lg">Nenhum versículo encontrado</p>
      <button @click="game.fetchVerse()" class="px-8 py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 transition-colors text-white font-bold shadow-lg shadow-indigo-500/20">
        Tentar novamente
      </button>
    </div>

  </div>
</template>
