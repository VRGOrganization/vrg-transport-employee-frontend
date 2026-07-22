// Fix #04: marcador estruturado (header dedicado) que o proxy de negócio
// ([...path]/route.ts) usa pra sinalizar "rejeitei antes de chamar o
// backend" e que services/http.ts usa pra decidir se um 403 é seguro
// reenviar. Não usar a mensagem humana como marcador — evita colisão
// acidental com um 403 legítimo de negócio.
export const PROXY_CSRF_ERROR_HEADER = "x-proxy-csrf-error";
