<div align="center">

<br/>

<img src="public/favicon.svg" width="72" height="72" alt="Flash Verse logo" />

<br/>
<br/>

# ⚡ Flash Verse

**Memorização bíblica gamificada**

![Vue](https://img.shields.io/badge/Vue_3-4FC08D?style=for-the-badge&logo=vuedotjs&logoColor=white) ![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white) ![Pinia](https://img.shields.io/badge/Pinia-F7DC6F?style=for-the-badge&logo=vue.js&logoColor=black) ![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white) ![Tailwind](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white) ![License](https://img.shields.io/badge/License-MIT-6366F1?style=for-the-badge)
<br/>

[Demo](#) · [Funcionalidades](#-funcionalidades) · [Arquitetura](#-arquitetura) · [Setup](#-setup) · [Banco de Dados](#-banco-de-dados)

<br/>

</div>

---

# 📖 O que é?

O **Flash Verse** é um jogo de memorização bíblica baseado em **recall ativo**.

Diferente de um quiz tradicional, aqui você vê apenas o texto do versículo e precisa identificar sua origem em um sistema de **3 decisões sequenciais 50/50**:

* **Livro**
* **Capítulo**
* **Versículo**

Cada etapa apresenta apenas **duas opções**, uma correta e outra errada estrategicamente gerada.

Esse formato cria um equilíbrio entre:

* memorização real
* velocidade de decisão
* retenção de longo prazo
* gamificação competitiva

O objetivo é transformar estudo bíblico em hábito diário.

---

# ✨ Funcionalidades

## 🎮 Gameplay Principal

* Flip card 3D para exibição e revelação do versículo
* Mecânica principal em **3 rounds 50/50**
* Fluxo:

  * Livro
  * Capítulo
  * Versículo
* Alternativas embaralhadas dinamicamente
* Sistema de feedback visual por etapa
* Confete no acerto
* Shake no erro
* Progressão automática para o próximo versículo

---

## 🔥 Sistema de Pontuação

Pontuação baseada em streak:

```txt
XP = 100 + min(streak × 25, 500)
```

Quanto maior a sequência:

* mais XP
* maior multiplicador
* maior progressão no ranking

---

## ⚡ Combo System

* Streak acumulativo por acertos consecutivos
* Glow visual ao atingir combos altos
* Reset automático ao errar
* Persistido no perfil do usuário

---

## 💾 Persistência Inteligente

Cada rodada salva:

| Tabela           | Função                            |
| ---------------- | --------------------------------- |
| `daily_results`  | Histórico de tentativas           |
| `verse_progress` | Evolução individual por versículo |
| `profiles`       | XP e streak global                |

---

## 🔖 Favoritos

* Salvar versículos favoritos
* Remover favoritos
* Sorteio prioriza favoritos primeiro
* Reforço de repetição espaçada

RPC utilizada:

```sql
get_random_favorite_verse(p_user_id)
```

---

## 🏆 Ranking Global

* Top jogadores por XP
* Pódio visual
* Destaque para usuário logado
* Ranking em tempo real

---

## 👥 Sistema de Amigos

* Adicionar amigos por código
* Aceitar/recusar solicitações
* Ranking privado entre amigos
* Sistema baseado em UUID curto

---

## 👤 Perfil

* Avatar por inicial
* Nível baseado em XP
* Barra de progresso para próximo nível
* Estatísticas:

  * tentativas
  * acertos
  * precisão
  * versículos dominados

---

# 🔐 Autenticação

Feita com Supabase Auth:

* Cadastro
* Login
* Logout
* Persistência de sessão
* Recuperação de senha
* Guards de rota

---

# 🏗️ Arquitetura

```txt
src/
├── main.js
├── App.vue
│
├── lib/
│   └── supabase.js
│
├── router/
│   └── index.js
│
├── stores/
│   ├── auth.js
│   └── game.js
│
└── views/
    ├── LoginView.vue
    ├── RegisterView.vue
    ├── ForgotPasswordView.vue
    ├── GameView.vue
    ├── RankingView.vue
    ├── FriendsView.vue
    ├── FavoritesView.vue
    └── ProfileView.vue
```

---

# 🔄 Fluxo do jogo

```txt
fetchVerse()
    ↓
Step 1 → Escolher Livro (50/50)
    ↓
Step 2 → Escolher Capítulo (50/50)
    ↓
Step 3 → Escolher Versículo (50/50)
    ↓
Resultado
    ↓
Acerto → streak++ + XP + confetti
Erro   → streak = 0 + shake
    ↓
Próximo versículo
```

---

# 🗄️ Banco de Dados

## Tabelas principais

### `profiles`

```txt
id
username
xp
streak
last_login
updated_at
```

---

### `books`

```txt
id
testament
name
total_chapters
book_order
```

---

### `verses`

```txt
id
testament
book_name
chapter
verse_number
text
translation_id
book_id
```

---

### `daily_results`

```txt
id
user_id
verse_id
session_date
correct
hints_used
created_at
```

> `hints_used` foi mantido por compatibilidade histórica.

---

### `verse_progress`

```txt
id
user_id
verse_id
correct_streak
last_seen
next_review
mastered
```

---

### `favorite_verses`

```txt
id
user_id
verse_id
created_at
```

---

### `friendships`

```txt
id
requester_id
receiver_id
status
created_at
```

---

# ⚙️ RPCs

| Função                                 | Uso                                |
| -------------------------------------- | ---------------------------------- |
| `get_random_verse()`                   | Sorteio aleatório                  |
| `get_random_favorite_verse(p_user_id)` | Sorteio de favoritos               |
| `update_player_stats(...)`             | Atualização atômica de XP e streak |

---

# 🚀 Setup

## 1. Clone o projeto

```bash
git clone https://github.com/Poliih/flashverse.git
cd flashverse
```

---

## 2. Instale dependências

```bash
npm install
```

---

## 3. Configure o `.env`

```env
VITE_SUPABASE_URL=https://SEU_PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=SUA_ANON_KEY
```

---

## 4. Execute migration no Supabase

Arquivo:

```txt
supabase/migrations/001_initial_schema.sql
```

---

## 5. Rode localmente

```bash
npm run dev
```

---

# 📦 Build

```bash
npm run build
```

Saída:

```txt
/dist
```

---

# 🛠️ Stack

| Tecnologia      | Papel           |
| --------------- | --------------- |
| Vue 3           | Front-end       |
| Vite            | Build tool      |
| Pinia           | Estado global   |
| Vue Router      | Rotas           |
| Supabase        | Auth + Database |
| Tailwind CSS    | UI              |
| canvas-confetti | Feedback visual |

---

# 🗺️ Roadmap

* [ ] Modo offline
* [ ] Traduções bíblicas (NVI, ARA, ACF)
* [ ] PvP em tempo real
* [ ] PWA
* [ ] Sistema de conquistas
* [ ] Heatmap de sessões
* [ ] Notificações push

---

# 🤝 Contribuição

```bash
git checkout -b feat/minha-feature
git commit -m "feat: nova feature"
git push origin feat/minha-feature
```

Abra um Pull Request.

---

# 📄 Licença

MIT License.

---

<div align="center">

Feito com ❤️ e fé.

**⚡ Flash Verse**
Memorize a Palavra.

</div>
