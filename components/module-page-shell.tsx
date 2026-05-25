import { ArrowUpRight, SparklesIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

type ModulePageShellProps = {
  title: string
  description: string
  primaryAction: string
  highlights: string[]
}

export function ModulePageShell({
  title,
  description,
  primaryAction,
  highlights,
}: ModulePageShellProps) {
  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-slate-200 bg-linear-to-br from-white via-white to-slate-50 p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <Badge className="rounded-full border border-[#d7e0ff] bg-[#eff3ff] px-3 py-1 text-[#2648db]">
              POS module
            </Badge>
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold tracking-tight text-slate-950 md:text-3xl">
                {title}
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-slate-500 md:text-base">
                {description}
              </p>
            </div>
          </div>

          <Button variant="blue" className="rounded-2xl px-5">
            {primaryAction}
            <ArrowUpRight className="size-4" />
          </Button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {highlights.map((highlight) => (
          <Card
            key={highlight}
            className="gap-4 rounded-[24px] border-slate-200 py-5 shadow-sm"
          >
            <CardHeader className="px-5">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                <SparklesIcon className="size-5" />
              </div>
              <CardTitle className="pt-2 text-base font-semibold text-slate-950">
                {highlight}
              </CardTitle>
              <CardDescription>
                This block is ready for the real API-connected widget next.
              </CardDescription>
            </CardHeader>
          </Card>
        ))}
      </section>

      <Card className="rounded-[26px] border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Next build step</CardTitle>
          <CardDescription>
            The route is scaffolded and the layout is ready. Next we can connect
            this module to RTK Query and replace placeholders with live data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">
            We now have a real page for <span className="font-semibold text-slate-800">{title}</span>.
            The next move is wiring list APIs, filters, and create/edit flows.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
