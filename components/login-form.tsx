"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Cookies from "js-cookie"
import { BiLoaderCircle } from "react-icons/bi"
import { AlertCircle } from "lucide-react"

import { auth, type AuthUser } from "@/lib/api/auth"
import { useTranslation } from "@/lib/contexts/TranslationContext"
import { useAppDispatch } from "@/lib/redux/hooks"
import { useSession } from "@/lib/redux/session-provider"
import { setSessionData } from "@/lib/redux/sessionSlice"
import { showToast } from "@/lib/toast"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { UniFieldInput } from "@/components/ui/unifield-input"

const defaultDeviceName = "Web App"

export function LoginForm({
  initialMode = "login",
  className,
  ...props
}: React.ComponentProps<"div"> & { initialMode?: "login" | "register" }) {
  const router = useRouter()
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const { refreshSession } = useSession()
  const mode = initialMode

  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [passwordConfirm, setPasswordConfirm] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const [login, { isLoading: isLoggingIn }] = auth.useLoginMutation()
  const [register, { isLoading: isRegistering }] = auth.useRegisterMutation()
  const isLoading = isLoggingIn || isRegistering

  const completeLogin = async (token: string, user: AuthUser) => {
    Cookies.set("token", token, { expires: 1, path: "/" })
    dispatch(setSessionData({ user }))
    await refreshSession()
    router.replace("/dashboard")
  }

  const validate = () => {
    const nextErrors: Record<string, string> = {}
    if (username.trim().length < 3) {
      nextErrors.username = t("Username must contain at least 3 characters.")
    }
    if (password.length < 6) {
      nextErrors.password = t("Password must contain at least 6 characters.")
    }
    if (mode === "register") {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        nextErrors.email = t("Enter a valid email address.")
      }
      if (password !== passwordConfirm) {
        nextErrors.passwordConfirm = t("Password confirmation does not match.")
      }
    }
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage(null)
    if (!validate()) return

    try {
      const payLoad = {
        username: username.trim(),
        password,
        device_name: defaultDeviceName,
        ...(mode === "register"
          ? { email: email.trim(), password_confirm: passwordConfirm }
          : {}),
      }
      const response =
        mode === "login"
          ? await login(payLoad).unwrap()
          : await register(payLoad).unwrap()

      showToast.success(
        response.message ||
        t(
          mode === "login"
            ? "You have successfully logged in."
            : "The account has been successfully created."
        )
      )
      await completeLogin(response.data.token, response.data.user)
    } catch (error) {
      const err = error as { data?: { message?: string }; message?: string }
      const msg =
        err?.data?.message ||
        err?.message ||
        t("Unable to process authentication request.")
      if (!err?.data?.message) {
        showToast.error(t("Unable to process authentication request."))
      }
      setErrorMessage(msg)
    }
  }

  return (
    <div
      className={cn("w-full max-w-sm", className)}
      {...props}
    >
      {/* Logo / App name */}
      <div className="mb-8 text-center">
        <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white text-lg font-bold shadow">
          P
        </div>
        <h1 className="text-xl font-semibold text-slate-900">
          {mode === "login" ? t("Sign in to your account") : t("Create an account")}
        </h1>
      </div>

      {/* Card */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="p-6">
          {/* Error message */}
          {errorMessage && (
            <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-red-100 bg-red-50 px-3 py-2.5 text-sm text-red-700">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form id="auth-form" onSubmit={handleSubmit}>
            <FieldGroup className="gap-4">
              <Field>
                <UniFieldInput
                  label={t("Username")}
                  id="username"
                  value={username}
                  placeholder={t("Enter your username")}
                  autoComplete="username"
                  disabled={isLoading}
                  error={errors.username}
                  onChange={(e) => {
                    setUsername(e.target.value)
                    setErrors((c) => ({ ...c, username: "" }))
                    setErrorMessage(null)
                  }}
                />
              </Field>

              {mode === "register" && (
                <Field>
                  <UniFieldInput
                    label={t("Email")}
                    id="email"
                    type="email"
                    value={email}
                    placeholder={t("Enter your email")}
                    autoComplete="email"
                    disabled={isLoading}
                    error={errors.email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      setErrors((c) => ({ ...c, email: "" }))
                      setErrorMessage(null)
                    }}
                  />
                </Field>
              )}

              <Field>
                <UniFieldInput
                  label={t("Password")}
                  id="password"
                  type="password"
                  value={password}
                  placeholder={t("Enter your password")}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  disabled={isLoading}
                  error={errors.password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    setErrors((c) => ({ ...c, password: "" }))
                    setErrorMessage(null)
                  }}
                />
              </Field>

              {mode === "register" && (
                <Field>
                  <UniFieldInput
                    label={t("Confirm Password")}
                    id="password-confirm"
                    type="password"
                    value={passwordConfirm}
                    placeholder={t("Re-enter your password")}
                    autoComplete="new-password"
                    disabled={isLoading}
                    error={errors.passwordConfirm}
                    onChange={(e) => {
                      setPasswordConfirm(e.target.value)
                      setErrors((c) => ({ ...c, passwordConfirm: "" }))
                      setErrorMessage(null)
                    }}
                  />
                </Field>
              )}
            </FieldGroup>

            <Button
              type="submit"
              variant="blue"
              disabled={isLoading}
              className="mt-6 w-full justify-center"
            >
              {isLoading && <BiLoaderCircle className="mr-2 size-4 animate-spin" />}
              {mode === "login" ? t("Sign In") : t("Register")}
            </Button>
          </form>
        </div>

        {/* Footer toggle */}
        <div className="border-t border-slate-100 px-6 py-4 text-center text-sm text-slate-500">
          {mode === "login" ? (
            <>
              {t("Don't have an account?")}{" "}
              <Link href="/register" className="font-medium text-slate-900 hover:underline">
                {t("Register")}
              </Link>
            </>
          ) : (
            <>
              {t("Already have an account?")}{" "}
              <Link href="/login" className="font-medium text-slate-900 hover:underline">
                {t("Sign In")}
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
