"use client"

import { useSelector } from "react-redux"

import { PermissionGuard } from "@/components/permission-guard"
import { Badge } from "@/components/ui/badge"
import { useTranslation } from "@/lib/contexts/TranslationContext"
import { PERMISSIONS } from "@/lib/permissions"
import type { RootState } from "@/lib/redux/store"

export default function UserProfilePage() {
  const { t } = useTranslation()
  const user = useSelector((state: RootState) => state.session.user)

  return (
    <PermissionGuard permission={PERMISSIONS.special.manageProfile}>
      <div className="max-w-2xl rounded-md border bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-slate-950">
              {user?.full_name || user?.username || t("My Profile")}
            </h1>
            <p className="mt-1 text-sm text-slate-500">{user?.email || "-"}</p>
          </div>
          <Badge>{user?.status === 1 ? t("Deactive") : t("Active")}</Badge>
        </div>
        <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <div className="font-semibold text-slate-500">{t("Username")}</div>
            <div>{user?.username || "-"}</div>
          </div>
          <div>
            <div className="font-semibold text-slate-500">{t("Phone")}</div>
            <div>{user?.phone || "-"}</div>
          </div>
          <div>
            <div className="font-semibold text-slate-500">{t("Roles")}</div>
            <div>{user?.roles?.map((role: any) => role.name).join(", ") || "-"}</div>
          </div>
        </div>
      </div>
    </PermissionGuard>
  )
}
