"use client"

import { useRouter } from "next/navigation"
import { ArrowRight } from "lucide-react"

import { reportCards, reportGroups } from "./report-config"

export default function ReportsPage() {
  const router = useRouter()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Reports</h1>
        <p className="text-sm font-medium text-muted-foreground">
          Choose a report to view sales, stock, due and ledger data.
        </p>
      </div>

      {reportGroups.map((group) => (
        <section key={group} className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
            {group}
          </h2>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {reportCards
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
                        {report.title}
                      </h3>
                      <p className="mt-1 text-sm font-medium leading-6 text-muted-foreground">
                        {report.description}
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
