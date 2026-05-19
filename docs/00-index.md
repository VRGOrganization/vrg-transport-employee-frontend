# Documentação do Frontend (Employee/Admin) - Índice

Bem-vindo à documentação oficial do repositório `vrg-transport-employee-frontend`. Este sistema foi projetado para ser utilizado por **Funcionários** e **Administradores** do VRG Transport, oferecendo um portal administrativo completo para a gestão de alunos, rotas, ônibus, contratos e outras configurações vitais da plataforma.

Esta documentação foi elaborada para ser extremamente rica e detalhada, guiando qualquer desenvolvedor, desde a arquitetura fundamental até o comportamento de componentes específicos.

## Sumário da Documentação

A documentação está dividida em módulos focados em diferentes aspectos do projeto. Siga a ordem abaixo para um entendimento linear, ou acesse diretamente o tópico de seu interesse:

1. **[01. Arquitetura e Padrão BFF (Backend for Frontend)](./01-architecture-and-bff.md)**
   Explicação detalhada sobre como o Next.js se comunica com o backend NestJS, gerenciamento de segredos, cookies, e o porquê de o browser nunca acessar a API diretamente.

2. **[02. Estrutura de Pastas e Organização](./02-folder-structure.md)**
   Um raio-x de cada diretório dentro do repositório (especialmente `src/`), explicando o propósito de cada pasta e onde encontrar ou colocar novos arquivos.

3. **[03. Roteamento, Pages e Layouts](./03-routing-and-pages.md)**
   Análise do App Router do Next.js 16 (`src/app`), middlewares locais (`proxy.ts`), e como o sistema lida com a separação de rotas protegidas `(auth)`, fluxos de `/admin`, `/employee` e áreas públicas (`/login`).

4. **[04. Componentes e UI (Design System)](./04-components-and-ui.md)**
   Detalhes sobre a criação de interfaces de usuário. Aprofundamento no diretório `src/components`, a pasta `ui/` (primitivos baseados em Tailwind + Radix/Shadcn), modais, tabelas e a filosofia de design adotada.

5. **[05. Gerenciamento de Estado e Data Fetching](./05-state-and-data.md)**
   Como lidamos com a obtenção de dados via Server Components e Client Components, chamadas de API através do BFF, custom hooks (`src/hooks`), e caching.

6. **[06. Segurança, Autenticação e Autorização](./06-security-and-auth.md)**
   Um mergulho profundo no login, controle de sessão, cookies `HttpOnly`, mitigação de CSRF, roteamento baseado em permissão (Roles: Admin vs Employee), e o diretório `src/lib/server/`.

7. **[07. Validações, Utils e Formatação](./07-validation-and-utils.md)**
   Como validamos dados antes de enviá-los ao servidor (Zod schemas em `src/lib/validation`), formatação de valores e constantes compartilhadas.

---

## Como Contribuir ou Modificar o Sistema

- **Leia o [`AGENTS.md`](../AGENTS.md) na raiz do projeto** antes de fazer qualquer modificação estrutural. Lá constam as regras absolutas (o que fazer e o que NUNCA fazer).
- **Mantenha esta documentação atualizada.** Se você criar um novo domínio, uma nova rota principal, ou alterar a lógica do BFF, reflita as mudanças nos respectivos arquivos `.md` listados acima.


> **Dica de Navegação:** Utilize os links fornecidos no sumário acima para pular entre os arquivos no seu editor ou visualizador de Markdown.
