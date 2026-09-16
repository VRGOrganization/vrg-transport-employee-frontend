# 03. Roteamento, Pages e Layouts

O frontend administrativo aproveita o máximo potencial do **App Router do Next.js (`src/app`)**, permitindo uma arquitetura robusta baseada em pastas para rotas, Server Components nativos, layouts aninhados e hierarquia de acesso limpa.

Este arquivo detalha como a navegação está estruturada e a filosofia por trás dela.

## Entendendo o App Router (`/src/app`)

No App Router, o mapeamento de URL não ocorre por arquivos estáticos soltos, e sim por **pastas** contendo arquivos `page.tsx` (que renderizam a UI da rota) ou `route.ts` (que renderizam a resposta de API JSON/HTTP).

### Roteamento Base e Pública

- `/login` (`src/app/login/page.tsx`): 
  Rota inteiramente pública. É onde o usuário (seja funcionário ou administrador) aterrissa caso não possua uma sessão. O Middleware (`src/proxy.ts`) automaticamente os chuta para cá se tentarem acesso restrito. Após um login bem-sucedido, o sistema verifica a `role` deles e os direciona para o respectivo dashboard.

### Route Groups e Áreas Autenticadas `(auth)`

A pasta `(auth)` tem parênteses porque é um **Route Group**. Isso significa que a pasta não adiciona um path na URL final (não existe `/auth/admin/...`), mas serve apenas para organizar arquivos logicamente e agrupar componentes que necessitam estar dentro de um mesmo `layout.tsx`.

Todas as páginas dentro do Route Group `(auth)` estão submetidas ao `src/app/(auth)/layout.tsx`. Esse arquivo cuida da injeção do esqueleto da interface (Menu Lateral / Sidebar, Header Superior) para usuários logados, e injeta os Providers globais de estado da aplicação.

Dentro de `(auth)`, existem divisões explícitas baseadas na **Autorização (Role-based access)**:

1. **`src/app/(auth)/admin/...`**
   Área estritamente dedicada a administradores. 
   - Acesso controlado pelo `src/proxy.ts`. Funcionários normais que tentem entrar aqui são interceptados e devolvidos ao seu próprio dashboard.
   - Rotas Internas Exemplo: `/admin/students`, `/admin/buses`, `/admin/employees`, `/admin/stats`.
   - Pode possuir um próprio `layout.tsx` aninhado se necessário (para adicionar contextos ou estilos únicos da área Admin).

2. **`src/app/(auth)/employee/...`**
   Área dedicada aos funcionários operacionais.
   - Embora administradores também possam acessar essa área caso a regra de proxy permita, ela é projetada para o uso diário dos funcionários.
   - Rotas Internas Exemplo: `/employee/cards`, `/employee/students`, `/employee/buses`, `/employee/bus-pass`, `/employee/system-notice-templates`.
   - Páginas compartilhadas com o admin recebem a prop `role` e escondem o que o backend reserva ao admin: na frota, desativar ônibus e liberar vagas; nos passes, a tela de configurações; nas mensagens de sistema, editar o endereço do setor.
   - Limita o número de visualizações e fluxos operacionais para que o funcionário padrão do VRG não veja nem manipule configurações sensíveis (como permissões de sistema).

### Páginas Especiais do Next.js

Além de `page.tsx`, nossa árvore utiliza arquivos especiais fundamentais fornecidos pelo Next.js para tratamento de exceções de UI:

- **`layout.tsx`**: Ao longo da árvore, define pedaços da interface que persistem (não são re-renderizados) enquanto o usuário navega pelas sub-páginas de uma pasta (ex: menu de navegação que nunca fecha/pisca ao mudar a página de contexto).
- **`error.tsx`**: Capta erros em tempo de renderização de componentes filhos do diretório em que está e exibe uma tela amigável ao usuário (Feedback Visual) ao invés do clássico "Error 500 branco na tela". Os erros não vazam para componentes pai.
- **`global-error.tsx`**: Localizado no nível raiz absoluto, é o catch-all final ("tela de pânico") se um erro fatal destruir até mesmo o layout raiz.
- **`loading.tsx`**: Usado para renderizar esqueletos UI temporários instantaneamente (Suspense boundaries) enquanto o servidor resolve os dados demorados da requisição assíncrona da respectiva `page.tsx`.

## Dinâmica "Server Component" vs "Client Component"

No App Router, o comportamento de todos os componentes listados aqui por padrão é **Server Component** (Eles renderizam no terminal do node em HTML bruto e entregam a página pronta).

- **Benefício**: Zero tamanho de pacote JavaScript na rede, rapidez extrema e segurança para ler variáveis nativas (banco, segredos) diretamente em tela.
- **Limitação**: Eles não possuem iteratividade de Javascript DOM (Não podem usar `onClick`, `useState`, `useEffect` nem Contexts dinâmicos).

Para usar interatividade, os cabeçalhos do componente (em seu arquivo `tsx`) devem ser marcados com `"use client"`.
Componentes do diretório `src/components/...` que envolvem formulários, modais abertos, ou controle de estado local geralmente carregam a diretiva `"use client"` e são importados pelos "Server Components" das páginas.
