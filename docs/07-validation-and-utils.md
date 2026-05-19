# 07. Validações, Utils e Formatação

Manter a consistência na maneira como mostramos os dados aos usuários na interface de Employee/Admin e barrar dados sujos originários de digitação incorreta de humanos são o objetivo desta camada.

## Zod: O Motor de Schemas e Validação

Todas as checagens rigorosas se dados num formulário estão aderentes aos formatos desejados residem em `src/lib/validation/`.

O **Zod** é usado para declarar os "Schemas" base. 
1. Ao invés de criarmos dezenas de mensagens de `if (input.length < 5) return 'erro'`, nós declaramos objetos de validação Zod.
2. Esses Schemas (ex: formulário do aluno `student.ts`) são acoplados às bibliotecas de Forms de react que usamos nos formulários do sistema.
3. Elas atuam de barreira. Nenhuma função de requisição (Service, submit do componente) roda e aciona o BFF enquanto o Zod não aprovar.
4. Caso falhe, a biblioteca já providencia as mensagens de erro prontas que os componentes `Input.tsx` mostrarão visualmente sublinhados em vermelho com dicas.

A adoção do Zod é uma instrução inegociável porque garante um "Single Source of Truth". O Schema não apenas valida como deduz um TypeScript Object nativo do modelo sem redundância.

## Tratamento Visual (Helpers e Utils)

A pasta `src/lib/` concentra uma suíte de manipuladores puramente de lógica solta, não ligada ao React em si, fáceis de testar de modo isolado.

### `formatters.ts` & `license-formatters.ts`
Estes arquivos contêm lógicas de tradução para consumo humano. O Backend armazena datas no formato `2026-05-18T10:00:00Z`, o componente não sabe o que isso é, ele chama a função nestes arquivos formatadores que converte isso para `18 de maio de 2026, 10h00` ou utiliza o pacote nativo `date-fns` para isso.
Da mesma forma, formatar dinheiros, números de celular, CPF (colocando pontos e traços onde devem ficar), CNH para exibição no card do motorista, sem precisar poluir os blocos de HTML dos arquivos `.tsx`.

### `utils.ts` (O utilitário Tailwind)
Neste arquivo a função mais consumida disparada no ecossistema inteiro é `cn(...inputs: ClassValue[])`. Ela funde arrays de classes condicionais `clsx` de react com o pacote `tailwind-merge`. Ela elimina todos os conflitos visuais quando nós (ou um agente) injeta por exemplo uma classe `bg-red-500` por cima de um componente base da `ui` que já continha `bg-blue-500`, certificando-se de que a última injetada ganha primazia sem deixar "lixo" na tag final enviada ao DOM do navegador.

### `constants.ts`
Valores soltos que precisam ser garantidos que não terão erros de digitação soltos pelos arquivos do projeto. Configurações numéricas globais, limites de envios de arquivos, tempo limite de espera em componentes. Se repete em mais de um arquivo? Coloque como constante literal exportada daqui.
