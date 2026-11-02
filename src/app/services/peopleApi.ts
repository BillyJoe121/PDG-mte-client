import { api } from "./strategicApi";

export type DirectoryAccessRole = "ADMIN" | "MANAGER" | "CONTRIBUTOR" | "VISITOR";

export interface DirectoryUser {
  id: number;
  name: string;
  email: string;
  departmentId: number;
  departmentName: string;
  accessRole: DirectoryAccessRole;
  active: boolean;
  lastAccessAt?: string | null;
}

export interface DirectoryUserRequest {
  name: string;
  email: string;
  departmentId: number;
  accessRole: DirectoryAccessRole;
  active: boolean;
}

/** Enlace de un solo uso para que la persona defina su contraseña. El MTE no envía correos. */
export interface AccessLinkResponse {
  professorId: number;
  email: string;
  url: string;
  accountCreated: boolean;
}

export interface DirectoryUserFilters {
  search?: string;
  departmentId?: number;
  accessRole?: DirectoryAccessRole;
  active?: boolean;
}

function query(filters: DirectoryUserFilters) {
  const params = new URLSearchParams();
  if (filters.search?.trim()) params.set("search", filters.search.trim());
  if (filters.departmentId !== undefined) params.set("departmentId", String(filters.departmentId));
  if (filters.accessRole) params.set("accessRole", filters.accessRole);
  if (filters.active !== undefined) params.set("active", String(filters.active));
  const suffix = params.toString();
  return suffix ? `?${suffix}` : "";
}

export const directoryUsersApi = {
  list: (filters: DirectoryUserFilters = {}) => api<DirectoryUser[]>(`/directory-users${query(filters)}`),
  create: (request: DirectoryUserRequest) => api<DirectoryUser>("/directory-users", {
    method: "POST",
    body: JSON.stringify(request),
  }),
  update: (id: number, request: DirectoryUserRequest) => api<DirectoryUser>(`/directory-users/${id}`, {
    method: "PUT",
    body: JSON.stringify(request),
  }),
  setActive: (id: number, active: boolean) => api<DirectoryUser>(`/directory-users/${id}/active`, {
    method: "PATCH",
    body: JSON.stringify({ active }),
  }),
  remove: (id: number) => api<void>(`/directory-users/${id}`, { method: "DELETE" }),
  accessLink: (id: number) => api<AccessLinkResponse>(`/directory-users/${id}/access-link`, { method: "POST" }),
};
