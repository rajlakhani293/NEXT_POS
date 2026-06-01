
import { PermissionGuard } from "@/components/permission-guard"
import { PERMISSIONS } from "@/lib/permissions"

export default function SettingsPage() {
  return (
    <PermissionGuard
      permission={[PERMISSIONS.settings.view, PERMISSIONS.products.view]}
      match="any"
    >
      <h1>Settings</h1>
    </PermissionGuard>
  )
}
