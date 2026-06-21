// Compatibility shim — all consumers can migrate to @/services/* directly
export { http as employeeApi, configureHttp as configureEmployeeApi, resetHttpState as resetEmployeeApiState, API_BASE_URL } from "@/services/http";

// No-ops kept for call-site compat
export function setTokens(): void {}
export function clearTokens(): void {}
