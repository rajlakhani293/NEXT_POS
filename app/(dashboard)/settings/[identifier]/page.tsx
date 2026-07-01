"use client"

import { useParams } from "next/navigation"

import { SourceSettingsPage } from "@/components/settings/source-settings-page"

export default function DynamicSourceSettingsPage() {
  const params = useParams()
  return <SourceSettingsPage identifier={String(params.identifier || "")} />
}
