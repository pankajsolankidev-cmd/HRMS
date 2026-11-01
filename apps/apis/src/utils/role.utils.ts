export function hasRole(roles: string[] | undefined, role: string): boolean {
  if (!roles || roles.length === 0) return false;
  return roles.includes(role);
}

export function hasContainedRole(
  roles: string[] | undefined,
  allowedRoles: string[],
): boolean {
  if (!roles || roles.length === 0) return false;
  return allowedRoles.some((r) => roles.includes(r));
}
