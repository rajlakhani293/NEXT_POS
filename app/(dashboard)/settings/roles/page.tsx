"use client"

import { useRouter } from "next/navigation"

import DynamicTable from "@/components/DynamicTable"
import { PermissionGuard } from "@/components/permission-guard"
import { settings } from "@/lib/api/settings"
import { PERMISSIONS } from "@/lib/permissions"
import { usePermissions } from "@/hooks/use-permissions"

const columns = [
  { key: "name", title: "Name" },
  { key: "code", title: "Code" },
  { key: "description", title: "Description" },
  {
    key: "permissions",
    title: "Permissions",
    render: (value: string[]) => value?.length || 0,
  },
]

export default function RolesPage() {
  const router = useRouter()
  const { hasPermission } = usePermissions()
  const roles = (settings as any).useGetRolesQuery()
  const [deleteRole] = (settings as any).useDeleteRoleMutation()

  const roleRows = roles.data?.data || []
  const canCreate = hasPermission(PERMISSIONS.roles.create)
  const canUpdate = hasPermission(PERMISSIONS.roles.update)
  const canDelete = hasPermission(PERMISSIONS.roles.delete)

  return (
    <PermissionGuard permission={PERMISSIONS.roles.view}>
      <div className="h-full space-y-4">
        <DynamicTable
          data={roleRows}
          columns={columns}
          tableTitle="Roles"
          title={canCreate ? "Add Role" : undefined}
          setAddEntityOpen={canCreate ? () => router.push("/settings/roles/create") : undefined}
          showSearch
          showEdit={canUpdate}
          onEdit={(record: any) => router.push(`/settings/roles/${record.id}`)}
          showDelete={canDelete}
          deleteMutation={async ({ ids }: any) => deleteRole({ id: ids[0] })}
          triggerRefresh={() => roles.refetch()}
          deleteModalTitle="Delete Role"
          deleteModalDescription="Are you sure you want to delete this role?"
          currentPage={1}
          itemsPerPage={10}
          totalItems={roleRows.length}
        />
      </div>
    </PermissionGuard>
  )
}
