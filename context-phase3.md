Memoria de contexto - Fase 3 (frontend employee, BFF session-first)
Data: 2026-04-06

Objetivo da fase
Migrar o frontend employee para autenticacao session-first via BFF, removendo dependencia de token JWT no browser.

Decisoes aplicadas
- Browser nao escreve nem le access token.
- Cookie sid (httpOnly) e criado e removido apenas nas rotas server-side do Next.
- Frontend cliente usa /api/auth/* para autenticacao e /api/v1/* para dominio.
- Proxy BFF injeta x-service-secret e x-session-id nas chamadas para backend.
- /api/v1/auth/* bloqueado para forcar uso de /api/auth/*.

Implementacoes realizadas
1) Camada server-side de auth (BFF)
- Criado utilitario:
  - src/lib/server/bff-auth.ts
- Criadas rotas:
  - src/app/api/auth/login/route.ts
  - src/app/api/auth/logout/route.ts
  - src/app/api/auth/session/route.ts

2) Proxy BFF para dominio
- Criado:
  - src/app/api/v1/[...path]/route.ts
- Comportamento:
  - encaminha para backend API
  - injeta x-service-secret
  - injeta x-session-id quando houver sid
  - preserva metodo/body/headers essenciais
  - bloqueia auth via /api/v1/auth/*

3) Auth client-side migrada para sessao
- Atualizado:
  - src/lib/employeeApi.ts
  - src/types/employeeAuth.ts
  - src/components/hooks/useEmployeeAuth.tsx
- Mudancas:
  - removido bearer token no cliente
  - bootstrap de sessao via GET /api/auth/session
  - login via POST /api/auth/login
  - logout via POST /api/auth/logout
  - tratamento centralizado de 401 com callback de unauthorized

4) Protecao de rotas frontend
- Atualizado:
  - src/middleware.ts
- Mudanca principal:
  - criterio de sessao agora e cookie sid (nao employee_access_token)

5) Correcoes auxiliares de qualidade
- Atualizado:
  - src/providers/ThemeProvider.tsx
- Mudanca:
  - removido setState dentro de useEffect para atender regra react-hooks/set-state-in-effect

Validacao executada (lote unico)
- Backend:
  - build ok
  - testes criticos de auth ok
- Student frontend:
  - lint ok
  - build ok
- Employee frontend:
  - lint ok (sem erros)
  - build com compilacao ok (warning deprecacao middleware->proxy)

Riscos e pontos de atencao
- Necessario garantir BFF_SERVICE_SECRET configurado no frontend employee.
- Necessario garantir SERVICE_SECRET identico entre frontend employee e backend.
- Warning de framework: convencao middleware esta depreciada em Next 16; migrar para proxy em fase de cleanup.

Checklist da fase (employee)
- [x] BFF routes de auth criadas
- [x] Proxy server-side /api/v1 criado
- [x] Hook de auth migrado para sessao
- [x] Middleware migrado para sid
- [x] Lint sem erros
- [x] Build com compilacao ok
- [ ] Validacao funcional manual ponta a ponta no browser (login/admin, login/employee, logout, navegacao protegida)
