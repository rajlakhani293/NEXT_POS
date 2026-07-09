"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { BiLoaderCircle } from "react-icons/bi"

import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { UniFieldInput } from "@/components/ui/unifield-input"
import { auth } from "@/lib/api/auth"
import { useTranslation } from "@/lib/contexts/TranslationContext"
import { showToast } from "@/lib/toast"

type PageProps = {
  params: {
    user: string
    token: string
  }
}

export default function NewPasswordPage({ params }: PageProps) {
  const router = useRouter()
  const { t } = useTranslation()
  const [password, setPassword] = useState("")
  const [passwordConfirm, setPasswordConfirm] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [newPassword, newPasswordState] = auth.useNewPasswordMutation()

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextErrors: Record<string, string> = {}
    if (password.length < 6) nextErrors.password = t("Password must contain at least 6 characters.")
    if (password !== passwordConfirm) nextErrors.passwordConfirm = t("Password confirmation does not match.")
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    try {
      const response = await newPassword({
        user_id: params.user,
        token: params.token,
        password,
        password_confirm: passwordConfirm,
      }).unwrap()
      showToast.success(response?.message || t("Your password has been updated."))
      router.replace("/login")
    } catch (err: any) {
      showToast.error(err?.data?.message || t("Unable to proceed, the form is not valid."))
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
            <h1 className="text-lg font-semibold">{t("New Password")}</h1>
          </div>
          <form onSubmit={submit} className="p-3">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="password">{t("New Password")}</FieldLabel>
                <UniFieldInput
                  id="password"
                  type="password"
                  value={password}
                  placeholder={t("define your new password.")}
                  autoComplete="new-password"
                  disabled={newPasswordState.isLoading}
                  error={errors.password}
                  onChange={(event) => {
                    setPassword(event.target.value)
                    setErrors((current) => ({ ...current, password: "" }))
                  }}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="password_confirm">{t("Confirm Password")}</FieldLabel>
                <UniFieldInput
                  id="password_confirm"
                  type="password"
                  value={passwordConfirm}
                  placeholder={t("confirm your new password.")}
                  autoComplete="new-password"
                  disabled={newPasswordState.isLoading}
                  error={errors.passwordConfirm}
                  onChange={(event) => {
                    setPasswordConfirm(event.target.value)
                    setErrors((current) => ({ ...current, passwordConfirm: "" }))
                  }}
                />
              </Field>
              <div className="flex justify-end border-t pt-3">
                <Button type="submit" variant="blue" disabled={newPasswordState.isLoading}>
                  {newPasswordState.isLoading ? <BiLoaderCircle className="mr-2 size-5 animate-spin" /> : null}
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
