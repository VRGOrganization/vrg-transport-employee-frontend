# 04. Componentes e UI (Design System)

O frontend utiliza um ecossistema visual robusto construído fortemente no **Tailwind CSS v4** associado a primitivos extraídos do ecossistema moderno de React (similar a filosofias como a do **Shadcn UI**). O foco desta arquitetura é que **todos os estilos visuais são decididos por classes utilitárias no Tailwind** ao invés de arquivos CSS tradicionais ou Styled Components.

## Filosofia de Componentização

Separamos a responsabilidade visual e funcional em duas grandes famílias:

### 1. Componentes "Dumb" (`src/components/ui/`)
Esta pasta contém nossa biblioteca fundamental de Design System. Componentes aqui são estúpidos: eles recebem `props` e disparam `events`. Eles não sabem o que é um "Aluno" ou "Ônibus", nem conhecem serviços e API.
Exemplos essenciais no nosso sistema:
- `Button.tsx`: Botões primários, secundários, ícones. 
- `Input.tsx` / `FieldShell.tsx`: Campos de entrada tipados que abraçam formatação nativa ou máscaras.
- `Modal.tsx` / `ConfirmModal.tsx`: Envolve diálogos e overlays mantendo acessibilidade (foco preso, tecla Esc). `Modal` tem `dismissible: "free" | "confirm-only" | "read-required"` (ESC/backdrop/X liberados / só pelos botões / sem ESC-backdrop mas com X, respectivamente). `ConfirmModal` ganha `confirmation?: { kind: "checkbox" | "type-word" | "type-identifier"; ... }` para exigir um passo extra antes de liberar o botão de confirmar em ações destrutivas; sempre que `confirmation` é passado, o modal força `dismissible="confirm-only"`.
- `DataTable.tsx`: Motor de tabelas de listagem, suporte flexível a colunas genéricas.
- `StatusBanner.tsx`, `ResultState.tsx`, `states.tsx`: Feedbacks visuais consistentes de tela vazia, carregamentos e erros.

**Uso do Tailwind:** Estes componentes utilizam internamente `tailwind-merge` e `clsx` (`src/lib/utils.ts`) para permitirem que você adicione customizações por cima no momento do uso (ex: `<Button className="w-full mt-4" />`), sem que ocorra conflito de classes originais.

### 2. Componentes "Smart" ou "Domain" (`src/components/admin/`, `src/components/employee/`, etc.)
Estes são os blocos que ligam a UI aos dados de negócios da plataforma. Eles sabem o que o sistema é.
Por exemplo, o arquivo `src/components/admin/EmployeeTable.tsx`:
- Importa o `DataTable` genérico da biblioteca `ui/`.
- Importa ícones, botões e ações da `ui/`.
- Mas preenche e organiza tudo focado em "Employees" do sistema.
- Contém lógica interna atrelada à renderização visual específica daquele tipo de dado.

## Tratamento Visual da Aplicação

### Estilos Globais (`src/app/globals.css`)
Mantém primariamente definições de CSS Variables (Custom Properties) que configuram as paletas de cores do Tailwind (variáveis semânticas como `--color-primary`, `--color-surface`, `--color-danger`). Ele é o responsável por ligar os modos "Light/Dark" se houver.
Não coloque código utilitário livre aqui a não ser que não consiga aplicar utilizando Tailwind diretamente nos componentes.

### Tematização e `ThemeToggle.tsx`
No repositório, há predefinição via Tailwind para controlar dinamicamente a aparência global usando provedores de contexto de modo claro/escuro (`ThemeToggle`).

### Evitando Repetições de Classes Longas
Onde percebe-se que as mesmas 30 classes do tailwind são adicionadas frequentemente a certas `<div>` em vários arquivos, recomendamos fortemente o uso do encapsulamento dessas `<div>` em um componente customizado de `.tsx` novo ou no uso adequado do utilitário `cn()` para montar variantes.

---
> **Regra Crucial para Componentes:** Nunca chame uma API de banco/backend diretamente de dentro da renderização de um componente UI `(use client)`. Dados devem vir como `props` dos componentes pais ou devem usar Custom Hooks apropriados que centralizam as buscas BFF (`fetch`).
