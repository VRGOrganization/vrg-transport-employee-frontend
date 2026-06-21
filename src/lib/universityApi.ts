// Compatibility shim — migrate consumers to @/services/* directly
export { universityService as universityApi, courseService as courseApi } from "@/services/universityService";
export { busService as busApi, busRouteService as busRouteApi } from "@/services/busService";
