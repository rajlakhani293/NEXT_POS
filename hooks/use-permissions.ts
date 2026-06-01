"use client";

import { useMemo } from "react";

import { useAppSelector } from "@/lib/redux/hooks";
import {
  normalizePermissionCodes,
  type PermissionRequirement,
  userHasPermission,
} from "@/lib/permissions";

export function usePermissions() {
  const user = useAppSelector((state) => state.session.user);
  const isSessionLoaded = useAppSelector((state) => state.session.isSessionLoaded);

  const permissions = useMemo(
    () => normalizePermissionCodes(user?.permissions || user?.user_permissions),
    [user],
  );

  const hasPermission = (
    required: PermissionRequirement,
    match: "all" | "any" = "all",
  ) => userHasPermission(user, required, match);

  return {
    permissions,
    hasPermission,
    isSessionLoaded,
    isSuperUser: Boolean(user?.is_superuser),
  };
}
