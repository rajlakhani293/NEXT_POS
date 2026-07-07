"use client"

import Link from "next/link"

import { Button } from "@/components/ui/button"
import { auth } from "@/lib/api/auth"
import { useTranslation } from "@/lib/contexts/TranslationContext"

type PageProps = {
  params: {
    user: string
    token: string
  }
}

export default function ActivateAccountPage({ params }: PageProps) {
  const { t } = useTranslation()
  const { data, error, isFetching } = auth.useActivateAccountQuery({
    user_id: params.user,
    token: params.token,
  })

  const errorMessage = (error as any)?.data?.message

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-8">
      <div className="w-full max-w-md overflow-hidden rounded bg-white shadow">
        <div className="border-b bg-slate-50 p-3">
          <h1 className="text-lg font-semibold">{t("Account Activation")}</h1>
        </div>
        <div className="space-y-4 p-5 text-sm text-slate-700">
          {isFetching ? (
            <p>{t("Loading...")}</p>
          ) : error ? (
            <p className="text-red-600">{t(errorMessage || "Invalid activation token.")}</p>
          ) : (
            <p className="text-emerald-700">
              {t(data?.message || "Your account is now activated.")}
            </p>
          )}
          <div className="flex justify-end border-t pt-4">
            <Button asChild variant="blue">
              <Link href="/sign-in">{t("Sign In")}</Link>
            </Button>
          </div>
        </div>
      </div>
    </main>
  )
}
