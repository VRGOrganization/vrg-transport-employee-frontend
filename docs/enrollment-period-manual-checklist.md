# Checklist Objetivo de Validação Manual - Período de Inscrição

Data: 2026-04-11
Escopo: fluxo admin da tela de período de inscrição e impactos de fila de espera.

## 1. Pré-condições

- Backend rodando com as rotas de enrollment period habilitadas.
- Frontend employee/admin rodando.
- Usuário logado com perfil admin.
- Base com pelo menos:
  - 1 período encerrado (para cenário de reabertura), ou disponibilidade para criar/encerrar durante o teste.
  - Alunos ativos suficientes para gerar solicitações em fila.

## 2. Dados de apoio sugeridos

Use estes valores para reduzir ambiguidade:

- startDate: hoje (00:00:00.000Z)
- endDate: hoje + 30 dias (23:59:59.999Z)
- totalSlots: 2
- licenseValidityMonths: 6

## 3. Critérios globais de aceite

- A tela /admin/enrollment-period carrega sem erro de runtime.
- Ações admin refletem no estado da UI após atualização.
- Erros de API são exibidos ao usuário com feedback claro.
- Não há ação de período na navegação de employee.

## 4. Casos de teste (fluxo principal)

## Caso 01 - Abrir novo período

Objetivo: validar criação de período ativo.

Passos:
1. Acessar /admin/enrollment-period.
2. Clicar em Abrir novo período.
3. Preencher datas, vagas e validade.
4. Confirmar envio.

Esperado:
- Mensagem de sucesso de abertura.
- Estado atual mostra status ABERTO.
- Barra de vagas inicia com preenchidas/total.
- Histórico passa a exibir o novo período.

Evidência:
- Print do modal preenchido.
- Print da tela após sucesso.

## Caso 02 - Validações do modal (abrir/editar)

Objetivo: garantir validações de front.

Passos:
1. Tentar salvar com endDate <= startDate.
2. Tentar salvar com totalSlots < 1.
3. Tentar salvar com licenseValidityMonths < 1.
4. Se em edição, tentar totalSlots < filledSlots.

Esperado:
- Bloqueio de envio.
- Mensagens de erro por campo.

Evidência:
- Print de cada erro exibido.

## Caso 03 - Editar período ativo

Objetivo: validar patch de período.

Passos:
1. Com período ativo, clicar em Editar.
2. Alterar totalSlots e/ou licenseValidityMonths.
3. Salvar.

Esperado:
- Mensagem de sucesso de atualização.
- Estado atual reflete valores novos.
- Histórico mantém coerência do período editado.

Evidência:
- Print antes/depois dos valores.

## Caso 04 - Exibição de fila no período ativo

Objetivo: validar listagem e ordenação da fila.

Passos:
1. Garantir existência de requests waitlisted no período ativo.
2. Acessar seção Fila de espera.

Esperado:
- Tabela com posição, nome, e-mail, instituição e data.
- Ordenação por filaPosition crescente.

Evidência:
- Print da tabela da fila.

## Caso 05 - Preview de liberação de vagas

Objetivo: validar preview sem efeito colateral.

Passos:
1. Informar quantidade a liberar (ex.: 1 ou 2).
2. Clicar em Pré-visualizar.

Esperado:
- Modal de confirmação abre com alunos a promover.
- Nenhuma mudança efetiva na fila até confirmar.

Evidência:
- Print do modal com lista de promovíveis.

## Caso 06 - Confirmar liberação e notificação

Objetivo: validar promoção waitlisted -> pending.

Passos:
1. No modal de preview, clicar em Confirmar e notificar.
2. Aguardar retorno.

Esperado:
- Mensagem de sucesso.
- Fila reduz conforme promovidos.
- Alunos promovidos deixam de aparecer como waitlisted.
- Em /admin/cards e /employee/cards, os promovidos aparecem como pending (não waitlisted).

Evidência:
- Print da fila antes/depois.
- Print de um aluno promovido em cards.

## Caso 07 - Encerrar período

Objetivo: validar fechamento do ciclo do período.

Passos:
1. Com período ativo, clicar em Encerrar período.
2. Confirmar no dialog.

Esperado:
- Período deixa de estar ativo.
- Histórico marca como ENCERRADO.
- Se havia fila ativa, ela é encerrada para o período.

Evidência:
- Print da confirmação.
- Print do histórico após encerramento.

## Caso 08 - Reabrir período encerrado

Objetivo: validar reabertura quando permitida.

Passos:
1. Na tabela de histórico, escolher período encerrado.
2. Clicar em Reabrir.

Esperado:
- Mensagem de sucesso quando regras permitirem.
- Período volta para ativo.
- Estado atual reflete período reaberto.

Evidência:
- Print do histórico e estado atual após reabertura.

## 5. Casos de permissão e rota

## Caso 09 - Navegação admin

Passos:
1. Logar como admin.
2. Verificar menu lateral.

Esperado:
- Item Período de Inscrição visível.
- Navegação para /admin/enrollment-period funciona.

## Caso 10 - Navegação employee

Passos:
1. Logar como employee.
2. Verificar menu lateral.

Esperado:
- Item Período de Inscrição não visível.
- Employee não deve ter fluxo de gerenciamento de período no menu.

## Caso 11 - Regras de cards para waitlisted

Passos:
1. Abrir /admin/cards e /employee/cards com alunos em waitlisted.

Esperado:
- Filtro Na fila disponível.
- Badge de waitlisted com posição.
- Botão Aprovar indisponível para waitlisted.
- Texto de fila exibido no rodapé de aprovação.

## 6. Critério de saída (Go/No-Go)

A release está aprovada se:
- Casos 01 a 08 passarem.
- Casos 09 a 11 passarem.
- Nenhum erro bloqueante de UI/API durante os testes.

## 7. Registro de execução

Use o modelo abaixo para cada caso:

- Caso: <id>
- Resultado: PASS | FAIL
- Evidência: <link/print>
- Observações: <detalhes>
