// Read-only business rule: Administrador / Talento Humano are system
// management roles, never attendance subject personnel. They must not appear
// in the Personal module, attendance records, or any attendance report/PDF.
// Roles are identified by NAME (the stable natural key in seed.sql);
// roles.id is a random UUID and must never be used for this check.
// Every snippet below is parameter-free, so injecting it never shifts $n
// placeholder indexes in the surrounding query.

export const ROLES_EXCLUIDOS = ['Administrador', 'Talento Humano'] as const;

export function esRolExcluido(rol: string): boolean {
  return (ROLES_EXCLUIDOS as readonly string[]).includes(rol);
}

const ROLES_EXCLUIDOS_SQL = "('Administrador', 'Talento Humano')";

// Filter for queries that already LEFT JOIN roles (NULL-safe so users WITHOUT
// a role keep passing the filter). aliasRoles is the roles alias, default 'r'.
export function excluirRolesPorNombre(aliasRoles = 'r'): string {
  return ` AND (${aliasRoles}.name IS NULL OR ${aliasRoles}.name NOT IN ${ROLES_EXCLUIDOS_SQL})`;
}

// Filter for queries that count rows WITHOUT a users/roles join: NOT IN
// subquery on the user id column (default a.user_id). A user with no role
// (subquery returns no row) passes the filter.
export function excluirRolesPorUserId(columna = 'a.user_id'): string {
  return ` AND ${columna} NOT IN (SELECT ur.user_id FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE r.name IN ${ROLES_EXCLUIDOS_SQL})`;
}

// LEFT JOIN snippet to expose the role name for a given user id expression.
export function joinRoles(userIdExpr = 'u.id'): string {
  return ` LEFT JOIN user_roles ur ON ur.user_id = ${userIdExpr} LEFT JOIN roles r ON r.id = ur.role_id`;
}

// Dispatch between the two patterns; columna must match the query alias.
export function excluirRolesAcceso(
  filtro: 'rol' | 'user_id',
  columna: string
): string {
  return filtro === 'rol' ? excluirRolesPorNombre(columna) : excluirRolesPorUserId(columna);
}