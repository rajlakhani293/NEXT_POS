"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"

import DynamicTable from "@/components/DynamicTable"
import { settings } from "@/lib/api/settings"
import { PERMISSIONS } from "@/lib/permissions"
import { usePermissions } from "@/hooks/use-permissions"
import { showToast } from "@/lib/toast"
import { useTranslation } from "@/lib/contexts/TranslationContext"
import { Copy } from "lucide-react"

export default function RolesPage() {
  const router = useRouter()
  const { hasPermission } = usePermissions()
  const { t } = useTranslation()
  const hasLoadedRolesRef = useRef(false)
  const [getRoles, roles] = (settings as any).useGetRolesMutation()
  const [deleteRole] = (settings as any).useDeleteRoleMutation()
  const [cloneRole] = (settings as any).useCloneRoleMutation()

  useEffect(() => {
    if (hasLoadedRolesRef.current) return
    hasLoadedRolesRef.current = true
    getRoles()
  }, [getRoles])

  const roleRows = roles.data?.data || []
  const canCreate = hasPermission(PERMISSIONS.roles.create)
  const canUpdate = hasPermission(PERMISSIONS.roles.update)
  const canDelete = hasPermission(PERMISSIONS.roles.delete)
  const columns = [
    { key: "name", title: t("Name") },
    { key: "namespace", title: t("Namespace") },
    {
      key: "created_at",
      title: t("Created At"),
      render: (value: any) => (value ? new Date(value).toLocaleDateString() : "-"),
    },
  ]
  const handleClone = async (id: string) => {
    const confirmed = window.confirm(t("Would you like to clone this role ?"))
    if (!confirmed) return
    const response = await cloneRole({ id }).unwrap()
    showToast.success(response?.message || t("Role cloned successfully."))
    getRoles()
  }

  return (
    <div className="h-full space-y-4">
      <DynamicTable
        data={roleRows}
        columns={columns}
        tableTitle={t("Roles List")}
        title={canCreate ? t("Add a new role") : undefined}
        setAddEntityOpen={canCreate ? () => router.push("/settings/roles/create") : undefined}
        showSearch
        showEdit={canUpdate}
        onEdit={(record: any) => router.push(`/settings/roles/${record.id}`)}
        showDelete={canDelete}
        rowActions={
          canCreate
            ? (id: string) => [
                {
                  key: "clone",
                  label: t("Clone"),
                  labelText: t("Clone"),
                  icon: <Copy className="size-4" />,
                  onClick: () => handleClone(id),
                  priority: 2,
                },
              ]
            : undefined
        }
        deleteMutation={async ({ ids }: any) => deleteRole({ id: ids[0] })}
        triggerRefresh={() => getRoles()}
        deleteModalTitle={t("Delete")}
        deleteModalDescription={t("Would you like to delete this ?")}
        currentPage={1}
        itemsPerPage={10}
        totalItems={roleRows.length}
      />
    </div>
  )
}
