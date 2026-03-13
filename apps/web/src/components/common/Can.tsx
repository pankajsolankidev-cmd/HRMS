import { useSelector } from "react-redux";
import type { RootState } from "../../context";

type CanProps = {
  permissions: string[];
  requireAll?: boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

export default function Can({
  permissions,
  requireAll = false,
  children,
  fallback = null,
}: CanProps) {
  const userPermissions = useSelector(
    (state: RootState) => state.auth.permissions
  );

  const isAllowed = requireAll
    ? permissions.every((p) => userPermissions.includes(p))
    : permissions.some((p) => userPermissions.includes(p));

  return isAllowed ? <>{children}</> : <>{fallback}</>;
}