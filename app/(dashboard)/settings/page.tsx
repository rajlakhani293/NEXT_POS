import { ModulePageShell } from "@/components/module-page-shell"

export default function SettingsPage() {
  return (
    <ModulePageShell
      title="Settings"
      description="Configure your business, branches, permissions, and system preferences from a single control area."
      primaryAction="Open configuration"
      highlights={[
        "Company and branch setup",
        "Role and permission control",
        "POS preferences",
        "System integrations",
      ]}
    />
  )
}
