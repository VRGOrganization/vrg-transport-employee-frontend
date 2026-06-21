# 06. Segurança, Autenticação e Autorização

Um dos pilares críticos no `vrg-transport-employee-frontend` é a gestão segura de quem acessa as coisas e de que modo a comunicação cliente-servidor evita ataques conhecidos (XSS e CSRF).

## O Controle de Sessão Centralizado

Como as chamadas nunca batem no `backend` vindas do navegador, não há JWTs voando no Header `Authorization` pelo Javascript, nem os armazenamos no `localStorage`.

### 1. Cookies HttpOnly (Sessão Segura)
A implementação em `src/lib/server/bff-auth.ts` cuida para que, ao validar um usuário com sucesso (em `/api/auth/login`), os cookies recebidos pelo backend (`SID` de sessão) sejam definidos como cookies que transitam para o navegador do cliente marcados como `HttpOnly`. 
Isso previne que scripts maliciosos (XSS) injetados na tela através do navegador roubem a sessão de qualquer admin. O cookie será transmitido passivamente pelo navegador de volta para `/api/v1/...` no Next.js a cada nova chamada, e o Edge repassa ao backend internamente usando o `SERVICE_SECRET`.

### 2. Autorização por Roles e Segregação
A separação de permissões ocorre ativamente por uma triagem em Duplo-Layer:

**Layer Frontend (Middleware: `proxy.ts`)**
O primeiro portão é o Edge Middleware do Next.js. O middleware detecta uma tentativa de acesso (ex: uma URL como `/admin/dashboard`), decodifica o cookie passivo indicando a role (ex: cookie indica que o browser é um `employee`). Ele ativamente redireciona com um status `307` o usuário para o `/employee/dashboard`. Ele não sabe se aquele funcionário tem permissão profunda X ou Y (isso fica pro backend), apenas sabe separar o portal administrativo da operação básica e exigir login mínimo de acesso.

**Layer Backend (Role Guards no NestJS)**
O segundo portão. Se uma API `PATCH /api/v1/buses/123` é chamada via BFF, e o backend entende pelo Session ID que foi chamado por um Employee que só tem visão de leitura (e não escrita), o NestJS backend lança um Error (Http 403 Forbidden). O proxy BFF devolve o 403 pro componente que chamou, que mostrará ao usuário uma falha de permissão no design.

## Segurança Adicional de API

### Rate Limiting (`src/lib/server/rate-limit.ts`)
Para evitar que ataques automatizados de requisições sobrecarreguem o BFF enviando massas brutas à rede da aplicação real, existe uma proteção interna por taxa. As rotas cruciais (como submissão de formulário de login no proxy) são protegidas e rejeitadas precocemente no front com o Erro 429 (Too Many Requests).

### Falsificação de Requisição (CSRF Protection)
A comunicação que carrega cookies (que são anexados nativamente) necessita de garantias de que solicitações de escrita (POST, DELETE) se originaram do nosso próprio frontend e não de um site espelho falso submetendo um form e forçando os cookies passivos.
O utilitário em `src/lib/server/csrf.ts` pode gerar lógicas que vinculam tokens descartáveis ou utilizam cabeçalhos estritos (como origin headers, SameSite attributes nos cookies e custom headers obrigatórios). Todas essas barreiras protegem os formulários internos da interface de Employee.
