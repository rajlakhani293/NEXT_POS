"use client"

import { notFound } from "next/navigation"
import { useParams } from "next/navigation"

import { SourceSettingsPage } from "@/components/settings/source-settings-page"

const allowedSettingsIdentifiers = new Set([
  "general",
  "pos",
  "customers",
  "orders",
  "reports",
  "invoices",
  "workers",
  "about",
])

export default function DynamicSourceSettingsPage() {
  const params = useParams()
  const identifier = String(params.identifier || "")

  if (!allowedSettingsIdentifiers.has(identifier)) {
    notFound()
  }

  return <SourceSettingsPage identifier={identifier} />
}
