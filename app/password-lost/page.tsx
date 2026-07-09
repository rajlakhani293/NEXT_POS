"use client"

import { useState } from "react"
import Link from "next/link"
import { BiLoaderCircle } from "react-icons/bi"

import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { UniFieldInput } from "@/components/ui/unifield-input"
import { auth } from "@/lib/api/auth"
import { useTranslation } from "@/lib/contexts/TranslationContext"
import { showToast } from "@/lib/toast"

export default function PasswordLostPage() {
  const { t } = useTranslation()
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [passwordLost, passwordLostState] = auth.usePasswordLostMutation()

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError(t("Enter a valid email address."))
      return
    }

    try {
      const response = await passwordLost({ email: email.trim() }).unwrap()
      showToast.success(response?.message || t("The recovery email has been send to your inbox."))
    } catch (err: any) {
      showToast.error(err?.data?.message || t("Unable to find a record matching your entry."))
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-8">
      <div className="flex w-full max-w-md flex-col gap-6">
        <div className="flex justify-center py-6">
          <div className="flex h-14 min-w-32 items-center justify-center rounded bg-white px-6 text-2xl font-semibold tracking-tight text-slate-950 shadow-sm">
            {t("POS")}
          </div>
        </div>
        <div className="overflow-hidden rounded bg-white shadow">
          <div className="border-b bg-slate-50 p-3">
            <h1 className="text-lg font-semibold">{t("Password Forgotten ?")}</h1>
          </div>
          <form onSubmit={submit} className="p-3">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">{t("Email")}</FieldLabel>
                <UniFieldInput
                  id="email"
                  type="email"
                  value={email}
                  placeholder={t("Provide your email.")}
                  autoComplete="email"
                  disabled={passwordLostState.isLoading}
                  error={error}
                  onChange={(event) => {
                    setEmail(event.target.value)
                    setError("")
                  }}
                />
              </Field>
              <div className="flex items-center justify-center py-4">
                <Link href="/login" className="text-sm text-blue-600 hover:underline">
                  {t("Sign In")}
                </Link>
              </div>
              <div className="flex justify-end border-t pt-3">
                <Button type="submit" variant="blue" disabled={passwordLostState.isLoading}>
                  {passwordLostState.isLoading ? <BiLoaderCircle className="mr-2 size-5 animate-spin" /> : null}
                  {t("Submit")}
                </Button>
              </div>
            </FieldGroup>
          </form>
        </div>
      </div>
    </div>
  )
}
