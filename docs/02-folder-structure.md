# 02. Estrutura de Pastas e Organização

Esta seção descreve o esqueleto do projeto e fornece uma bússola de onde cada arquivo pertence dentro de `src/`. O repositório segue convenções do ecossistema Next.js com App Router, isolando de forma estrita o que é lógica de UI, roteamento, chamadas de serviço e infraestrutura BFF.

## Raiz do Projeto
- `docs/`: Documentação do projeto (este local).
- `public/`: Assets estáticos expostos publicamente (imagens base, ícones, arquivos PWA, manifestos). Tudo que for salvo aqui está disponível pela raiz do site `/`.
- `package.json` / `next.config.ts`: Configurações principais do ecossistema Node e regras de compilação do Next.js (Turbopack, aliases, variáveis).
- `vitest.config.ts`: Configuração do ambiente de testes utilizando o Vitest.
- `AGENTS.md`: Arquivo global contendo diretrizes do que a IA pode e não pode fazer com relação a este repositório. Sempre consulte ele!

## O Coração: Diretório `src/`

Todas as lógicas, páginas e componentes residem dentro de `src`.

### `src/app/` (App Router)
Contém toda a estrutura de rotas da aplicação (Roteamento baseado em arquivos).
- **`(auth)/`**: Route group para rotas protegidas que demandam que o usuário esteja logado. Engloba áreas exclusivas.
  - `admin/`: Telas e fluxos exclusivos para o papel (role) de "Administrador".
  - `employee/`: Telas e fluxos exclusivos para o papel (role) de "Funcionário".
  - `layout.tsx`: Layout wrapper para a aplicação inteira (sidebar, providers, context raiz).
- **`api/`**: É o Backend interno do Frontend (os endpoints do BFF).
  - `auth/`: Endpoints de manipulação de sessão, login e csrf.
  - `v1/[...path]/`: Endpoint catch-all de proxy para a API NestJS real.
- **`login/`**: Rota e UI desprotegida para a tela de autenticação.
- **`globals.css`**: CSS global utilizando Tailwind. Importado na raiz.

### `src/components/` (O Design System & UI)
Pedaços reutilizáveis de interface. Eles raramente mantêm o estado de uma rota, recebem via `props`.
- **`ui/`**: Componentes básicos e estúpidos ("dumb components") construídos sob a biblioteca Shadcn/UI (ex: `Button`, `Input`, `Dialog`, `Table`, `Card`). Totalmente estilizáveis via Tailwind.
- **`admin/` / `employee/`**: Componentes específicos de módulo (como por exemplo `EmployeeTable.tsx`), que unem os componentes `ui/` em lógicas complexas e layouts específicos de cada painel.
- **`shell/` / `layout/`**: Componentes de envolvimento de página, cabeçalhos de tela, sidebars e navegação.

### `src/hooks/` (Lógica de Reatividade)
Regras de negócio que o frontend executa via React Hooks Customizados.
- **`use...`**: Exemplo, hooks de fetch de API, manipulação local de estado ou formatação sob demanda em renderizações reativas. Centraliza a lógica para que as páginas (`page.tsx`) não fiquem infladas com muito código JavaScript.

### `src/lib/` (Utilitários, Core e Helpers)
Funções puras e lógicas reutilizáveis que não são componentes do React nem Hooks.
- **`server/`**: Códigos desenhados **apenas** para serem rodados no lado do Servidor Node do Next.js. Funções de roteamento de BFF, proteção CSRF (`csrf.ts`), e limite de requisições (`rate-limit.ts`). Importar algo daqui em um componente com `"use client"` causará quebra de compilação.
- **`validation/`**: Schemas do Zod para validação tipada e em runtime (ex: formulário de cadastro de alunos, formulário de login). Usados tanto para validação Client-side como para sanitização em Server Actions se houver.
- **`utils.ts`**: Helper Functions comuns como class-merging (`cn()` do Tailwind), formatadores de data, formatadores de moeda, etc.
- **`constants.ts`**: Valores literais do sistema. Constantes globais (ex: limites de tamanho de imagens, variáveis fixas do sistema).

### `src/services/`
Se necessário para isolar a complexidade de chamadas via fetch para o `/api/v1/`, os services estruturam a forma que o frontend chama seu próprio BFF, servindo de interface (wrapper) baseada em Promessas.

### `src/types/`
Tipagem de TypeScript isolada (`Interfaces` e `Types`). Define o contrato de dados que a aplicação espera das chamadas de rede do backend, estruturas de dados de contexto, e props complexas de componentes.

### `src/mocks/`
Dados falsos para rodar a aplicação em um ambiente de demonstração, ou para interceptação durante suítes de teste (Vitest).

### `src/test/`
Suítes de teste unitários e de integração de ferramentas e de componentes. Geralmente acompanha arquivos `.spec.tsx` e utilitários de montagem customizados do Testing Library.

### `src/proxy.ts` (O Gatekeeper)
Apesar do nome, o Next.js mapeia este arquivo como o **Middleware Global** da aplicação. Discutimos ele na seção de Arquitetura. Fica solto na raiz do `src`. Não mova este arquivo ou o Next.js não irá encontrá-lo.
