# ⚡ Flash Verse

> **Memorize a Palavra com estilo.** Um aplicativo de flashcards bíblicos gamificado, desenvolvido com foco extremo na experiência do usuário (UX) e design imersivo.

![Vue.js](https://img.shields.io/badge/Vue.js-35495E?style=for-the-badge&logo=vue.js&logoColor=4FC08D)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-181818?style=for-the-badge&logo=supabase&logoColor=3ECF8E)

## 📖 Sobre o Projeto

O **Flash Verse** transforma a memorização de versículos bíblicos em um desafio dinâmico e recompensador. Em vez de apenas ler, o usuário é testado a lembrar a referência exata (Livro, Capítulo e Versículo) de textos selecionados, utilizando uma interface moderna de cartões 3D.

## ✨ Funcionalidades Principais

* 🃏 **Cartões 3D Interativos:** Animações fluidas de *flip* (frente e verso) construídas puramente com CSS e Tailwind, otimizadas para performance.
* 📱 **Design Imersivo (Edge-to-Edge):** Interface responsiva que atua como um "App Nativo". No mobile, o cartão se expande para utilizar 70% da tela, garantindo conforto na leitura de textos longos. No desktop, mantém um visual elegante de painel central.
* 🔥 **Sistema de Combos (Streak):** Gamificação em tempo real. Acertos consecutivos aumentam o seu multiplicador de chamas. Um erro zera o combo instantaneamente com um efeito de tela tremendo (Screen Shake).
* 💡 **Minigame de Dicas (50/50):** O usuário possui 5 dicas limitadas por sessão. Ao ativar, a interface muda para um minigame de 3 etapas (Livro, Capítulo, Versículo), oferecendo a resposta correta contra uma opção falsa (incluindo "pegadinhas" entre o Antigo e Novo Testamento).
* 🎉 **Recompensas Visuais:** Integração com `canvas-confetti` para celebrar acertos de forma explosiva e satisfatória.

## 🛠️ Tecnologias Utilizadas

* **[Vue.js 3](https://vuejs.org/)** (Composition API & `<script setup>`)
* **[Tailwind CSS](https://tailwindcss.com/)** (Estilização utilitária, Animações customizadas e Responsividade agressiva)
* **[Supabase](https://supabase.com/)** (Backend-as-a-Service para o banco de dados de Livros e Versículos)
* **[Canvas Confetti](https://www.npmjs.com/package/canvas-confetti)** (Efeitos de partículas)

## 🚀 Como Executar o Projeto Localmente

### Pré-requisitos
* [Node.js](https://nodejs.org/) instalado na sua máquina.
* Um banco de dados configurado no Supabase com as tabelas `books` e uma função `get_random_favorite_verse`.

### Passo a Passo

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/Poliih/flashverse.git
   cd flash-verse
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Configure as Variáveis de Ambiente:**
   Crie um arquivo `.env` na raiz do projeto e adicione as suas chaves do Supabase:
   ```env
   VITE_SUPABASE_URL=sua_url_do_supabase_aqui
   VITE_SUPABASE_ANON_KEY=sua_chave_anonima_aqui
   ```

4. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```

5. **Acesse no navegador:**
   Abra `http://localhost:5173` para ver o Flash Verse em ação.

## 🛣️ Roadmap (Próximos Passos)

- [ ] **Catálogo de Favoritos:** Tela dedicada para pesquisa de versículos na Bíblia completa, permitindo ao usuário "favoritar" textos que entrarão na rotação do jogo.
- [ ] **Modo Escuro/Claro:** Alternância de temas.
- [ ] **Autenticação:** Perfis de usuário para salvar o maior Combo (High Score) no banco de dados.

---
*Desenvolvido com dedicação.*
