import { useSelector } from "react-redux";
import type { RootState } from "../../context";

type CanProps = {
  permission?: string;
  permissions?: string[];
  requireAll?: boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

export default function Can({
  permission,
  permissions = [],
  requireAll = false,
  children,
  fallback = null,
}: CanProps) {
  const userPermissions = useSelector(
    (state: RootState) => state.auth.permissions,
  );

  const permsToCheck = permission ? [permission] : permissions;

  const isAllowed = requireAll
    ? permsToCheck.every((p) => userPermissions.includes(p))
    : permsToCheck.some((p) => userPermissions.includes(p));

  if (!isAllowed) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
