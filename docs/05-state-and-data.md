# 05. Gerenciamento de Estado e Data Fetching

Sendo uma aplicação baseada em React/Next.js que consulta uma API através do seu BFF, lidamos fortemente com o fluxo de estado local, cache, e reatividade de dados provindos do servidor.

## Server-Side Fetching vs Client-Side Fetching

### 1. Fetching com Server Components (O ideal)
Componentes no diretório `app/` que não contenham `"use client"` renderizam puramente do lado Node.js do servidor (O Server Next.js).
Neles, nós utilizamos a API assíncrona base (ex: chamadas `fetch()` apontadas para os arquivos do `lib/server` ou diretamente instanciando uma consulta se for do lado do servidor) antes da UI existir.
- **Pró:** A resposta já vem como HTML, super rápido, e os usuários não aguardam chamadas client-side.
- **Como usamos:** Passamos os dados processados para os Client Components como prop inicial genérica (`initialData`).

### 2. Fetching via Client Components & Hooks (`src/hooks/`)
Diversas interfaces ricas deste repositório exigem carregar dados sem que a página inteira recarregue (Por exemplo, o painel de edição, pesquisa contínua e filtragens da tabela).

Para isso, empregamos requisições `fetch` nativas direcionadas aos endpoints do nosso Proxy: `/api/v1/...`. Toda lógica que diz "Buscar tal lista da API" não fica solta num `useEffect` na página, ela é extraída para a pasta `src/hooks/`.

#### Exemplo prático de Hook (`useEmployeeData` ou similar):
Um Hook customizado retorna o estado de `data`, estado de erro `error` e o estado de carregamento `isLoading`. O componente que chamar isso se redesenha sozinho quando a resposta assíncrona termina. O arquivo genérico `src/lib/createHookContext.ts` permite espalhar os valores do contexto desses dados na árvore sem que cada filho prop-drille seus pais.

### 3. Caching via `lru-cache`
Para mitigar a batida desenfreada de APIs com dados repetitivos no mesmo tempo de ciclo do servidor (Node.js runtime), adotou-se o `lru-cache`. 
Isso pode atuar em níveis de cache de BFF ou lógicas server-side que precisem guardar pedaços de memória curta sem envolver um Redis completo durante compilação ou execução do Node, permitindo que processos Next salvem milissegundos de requisições repetidas ao back.

## Mutação de Dados (Forms & Requests)

Quando um usuário Admin clica em "Salvar" no modal de um aluno, a página faz uma chamada de envio (`POST` / `PATCH`).
- A lógica reside tipicamente numa função interna atrelada aos eventos (`onSubmit`) ou em Services especializados `src/services/` e `src/lib/employeeApi.ts`.
- Essas funções chamam internamente `fetch('/api/v1/resource', { method: 'POST', body: JSON... })`.
- A resposta determina sucesso, avisando visualmente a tela através do disparo de `StatusBanner` ou Toast UI. A página que estava ouvindo a tabela (como o hook anterior) precisa invalidar os dados e rodar um re-fetch do array de listagem para demonstrar os novos valores para o usuário na tabela.

### Evitando Erros de Serialização no Next.js (Dica de Trato de Erro 500)
Sempre que trafegar propriedades de componentes servidor (Server Component) para clientes (Client Component `use client`), você **não pode** enviar funções anônimas, componentes react ou objetos cíclicos não formatáveis como JSON. O objeto enviado pelo servidor Next ao Front obrigatoriamente deve ser limpo e "Plain Data".
