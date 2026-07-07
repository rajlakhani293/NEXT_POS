"use client"

import { useRouter } from "next/navigation"
import { ArrowRight } from "lucide-react"

import { useTranslation } from "@/lib/contexts/TranslationContext"
import { usePermissions } from "@/hooks/use-permissions"
import { reportCards, reportGroups } from "./report-config"

export default function ReportsPage() {
  const router = useRouter()
  const { t } = useTranslation()
  const { hasPermission } = usePermissions()

  const visibleCards = reportCards.filter((report) =>
    hasPermission(report.permission, report.permissionMatch)
  )
  const visibleGroups = reportGroups.filter((group) =>
    visibleCards.some((report) => report.group === group)
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">{t("Reports")}</h1>
        <p className="text-sm font-medium text-muted-foreground">
          {t("Choose a report to view sales, stock, due and ledger data.")}
        </p>
      </div>

      {visibleGroups.map((group) => (
        <section key={group} className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
            {t(group)}
          </h2>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {visibleCards
              .filter((report) => report.group === group)
              .map((report) => (
                <button
                  key={report.key}
                  type="button"
                  onClick={() => router.push(`/reports/${report.key}`)}
                  className="group rounded-xl border border-gray-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-bold text-gray-950">
                        {t(report.title)}
                      </h3>
                      <p className="mt-1 text-sm font-medium leading-6 text-muted-foreground">
                        {t(report.description)}
                      </p>
                    </div>
                    <span className="rounded-full bg-gray-100 p-2 text-gray-500 transition group-hover:bg-black group-hover:text-white">
                      <ArrowRight className="size-4" />
                    </span>
                  </div>
                </button>
              ))}
          </div>
        </section>
      ))}
    </div>
  )
}
