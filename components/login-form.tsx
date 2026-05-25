"use client"

import { cn } from "@/lib/utils"
import { Card, CardContent } from "./ui/card"
import { Field, FieldDescription, FieldGroup, FieldSeparator } from "./ui/field"
import { GalleryVerticalEnd } from "lucide-react"
import { BiLoaderCircle } from "react-icons/bi";
import { MdEdit } from "react-icons/md";
import { UniFieldInput } from "./ui/unifield-input"
import { Button } from "./ui/button"
import { useRouter } from "next/navigation"
import { useAppDispatch } from "@/lib/redux/hooks"
import { useSession } from "@/lib/redux/session-provider"
import { useCallback, useEffect, useRef, useState } from "react"
import { auth, AuthUser } from "@/lib/api/auth"
import Cookies from "js-cookie"
import { setSessionData } from "@/lib/redux/sessionSlice"
import { showToast } from "@/lib/toast"
import { FaAngleDoubleRight } from "react-icons/fa"
import { FcGoogle } from "react-icons/fc"

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string
            callback: (response: { credential?: string }) => void
          }) => void
          renderButton: (
            element: HTMLElement,
            options: Record<string, unknown>
          ) => void
        }
      }
    }
  }
}

const defaultDeviceName = "Web App"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { refreshSession } = useSession()
  const googleButtonRef = useRef<HTMLDivElement | null>(null)
  const googleInitializedRef = useRef(false)
  const [step, setStep] = useState<"phone" | "otp">("phone")
  const [phone, setPhone] = useState("")
  const [phoneError, setPhoneError] = useState("")
  const [otpCode, setOtpCode] = useState("")
  const [otpError, setOtpError] = useState("")
  const [devOtp, setDevOtp] = useState("")
  const [sendOtp, { isLoading: isSendingOtp }] = auth.useSendOtpMutation()
  const [verifyOtp, { isLoading: isVerifyingOtp }] = auth.useVerifyOtpMutation()
  const [googleLogin, { isLoading: isGoogleLoading }] = auth.useGoogleLoginMutation()
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

  const completeLogin = useCallback(async (token: string, user: AuthUser) => {
    Cookies.set("token", token, { expires: 1, path: "/" })
    dispatch(setSessionData({ user }))
    await refreshSession()
    router.replace("/dashboard")
  }, [dispatch, refreshSession, router])

  const handleGoogleCredential = useCallback(async (credential: string) => {
    try {
      const response = await googleLogin({
        provider: "google",
        id_token: credential,
        device_name: defaultDeviceName,
      }).unwrap()
      await completeLogin(response.data.token, response.data.user)
    } catch {
    }
  }, [googleLogin, completeLogin])

  useEffect(() => {
    if (!googleClientId) {
      return
    }

    let observer: ResizeObserver | null = null

    const initializeGoogle = () => {
      if (!window.google?.accounts?.id || !googleButtonRef.current) {
        return
      }

      if (googleInitializedRef.current) {
        return
      }

      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: (response: { credential?: string }) => {
          if (response?.credential) {
            void handleGoogleCredential(response.credential)
          }
        },
      })

      const renderButton = () => {
        if (!googleButtonRef.current || !window.google?.accounts?.id) return
        const parentElement = googleButtonRef.current.parentElement
        if (!parentElement) return
        const width = parentElement.offsetWidth
        googleButtonRef.current.innerHTML = ""
        window.google.accounts.id.renderButton(googleButtonRef.current, {
          theme: "outline",
          size: "large",
          text: "continue_with",
          shape: "rectangular",
          width: width
        })
      }

      renderButton()
      googleInitializedRef.current = true

      if (googleButtonRef.current.parentElement && typeof ResizeObserver !== "undefined") {
        observer = new ResizeObserver(() => {
          renderButton()
        })
        observer.observe(googleButtonRef.current.parentElement)
      }
    }

    if (window.google?.accounts?.id) {
      initializeGoogle()
    } else {
      const existingScript = document.querySelector<HTMLScriptElement>(
        'script[src="https://accounts.google.com/gsi/client"]',
      )

      if (existingScript) {
        existingScript.addEventListener("load", initializeGoogle)
      } else {
        const script = document.createElement("script")
        script.src = "https://accounts.google.com/gsi/client"
        script.async = true
        script.defer = true
        script.onload = initializeGoogle
        document.head.appendChild(script)
      }
    }

    return () => {
      if (observer) {
        observer.disconnect()
      }
    }
  }, [googleClientId, handleGoogleCredential])

  const handleSendOtp = async () => {
    const cleanPhone = phone.trim()
    if (!cleanPhone) {
      setPhoneError("Mobile number is required")
      return
    }
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      setPhoneError("Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9")
      return
    }
    setPhoneError("")
    try {
      const response = await sendOtp({ phone: cleanPhone }).unwrap()
      setDevOtp(response.data.otp_code)
      setStep("otp")
      showToast.success(response.data.message || "OTP sent successfully.")
    } catch {
    }
  }

  const handleVerifyOtp = async () => {
    const cleanOtp = otpCode.trim()
    if (!cleanOtp) {
      setOtpError("Please enter a valid OTP")
      return
    }
    if (cleanOtp.length !== 6) {
      setOtpError("Please enter a valid 6-digit OTP")
      return
    }
    setOtpError("")
    try {
      const response = await verifyOtp({
        phone,
        code: cleanOtp,
        device_name: defaultDeviceName,
      }).unwrap()
      await completeLogin(response.data.token, response.data.user)
    } catch {
    }
  }

  return (
    <div className={cn("flex flex-col gap-6 w-full max-w-lg px-4", className)} {...props}>
      <Card className="w-full">
        <CardContent>
          <form
            onSubmit={(event) => {
              event.preventDefault()
              if (step === "phone") {
                void handleSendOtp()
              } else {
                void handleVerifyOtp()
              }
            }}
          >
            <FieldGroup>
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="flex size-11 items-center justify-center rounded-2xl bg-[#3155f6] text-white shadow-sm">
                  <GalleryVerticalEnd className="size-6" />
                </div>
                <div className="space-y-1">
                  <h1 className="text-2xl font-bold tracking-tight text-zinc-950">
                    Welcome to Next POS
                  </h1>
                </div>
              </div>

              {step === "phone" ? (
                <Field>
                  <UniFieldInput
                    type="number"
                    placeholder="10 digit mobile number"
                    value={phone}
                    maxLength={10}
                    prefix="+91"
                    className="h-12 rounded-xl text-gray-800 text-lg md:text-lg font-semibold"
                    onChange={(event) => {
                      setPhone(event.target.value)
                      setPhoneError("")
                    }}
                    error={phoneError}
                    disabled={isSendingOtp}
                  />
                  <FieldDescription>
                    We will be sending an OTP to this number.
                  </FieldDescription>
                </Field>
              ) : (
                <Field>
                  <UniFieldInput
                    type="number"
                    placeholder="6 digit OTP"
                    value={otpCode}
                    maxLength={6}
                    className="h-12 rounded-xl text-gray-800 text-lg md:text-lg font-semibold"
                    onChange={(event) => {
                      setOtpCode(event.target.value)
                      setOtpError("")
                    }}
                    disabled={isVerifyingOtp}
                    error={otpError}
                  />
                  <FieldDescription className="flex items-center gap-1.5 font-semibold text-gray-600">
                    <span>Verification code sent to {phone}.</span>
                    <button
                      type="button"
                      className="inline-flex items-center justify-center text-[#3155f6] hover:bg-[#3155f6]/10 rounded-md transition-colors"
                      onClick={() => {
                        setStep("phone")
                        setOtpCode("")
                        setDevOtp("")
                        setOtpError("")
                      }}
                    >
                      <MdEdit className="size-4" />
                    </button>
                  </FieldDescription>
                  {devOtp ? (
                    <FieldDescription className="font-medium text-emerald-700">
                      Dev OTP: {devOtp}
                    </FieldDescription>
                  ) : null}
                </Field>
              )}

              <Field>
                <Button
                  type="submit"
                  variant="blue"
                  size="lg"
                  disabled={
                    step === "phone"
                      ? isSendingOtp
                      : isVerifyingOtp
                  }
                  className="text-base font-semibold hover:scale-105"
                >
                  {step === "phone" ? (
                    isSendingOtp ? (
                      <BiLoaderCircle className="animate-spin size-5" />
                    ) : (
                      <>
                        Continue with Mobile Number
                        <FaAngleDoubleRight className="size-5" />
                      </>
                    )
                  ) : isVerifyingOtp ? (
                    <BiLoaderCircle className="animate-spin size-5" />
                  ) : (
                    "Confirm OTP"
                  )}
                </Button>
              </Field>

              <FieldSeparator>Or</FieldSeparator>

              <Field>
                <div className="space-y-3">
                  <div className="relative">
                    <Button
                      variant="outline"
                      type="button"
                      className="h-10 w-full justify-center rounded-lg border-zinc-300 bg-zinc-50 text-base font-semibold text-zinc-700 hover:bg-zinc-100"
                      disabled={isGoogleLoading}
                    >
                      {isGoogleLoading ? (
                        <BiLoaderCircle className="size-5 animate-spin" />
                      ) : (
                        <FcGoogle className="size-5" />
                      )}
                      {isGoogleLoading
                        ? "Signing in with Google..."
                        : "Continue with Google"}
                    </Button>
                    <div
                      ref={googleButtonRef}
                      className="absolute inset-0 overflow-hidden rounded-2xl opacity-0"
                      aria-hidden="true"
                    />
                  </div>
                  {isGoogleLoading ? (
                    <FieldDescription className="text-center text-sm text-zinc-500">
                      Signing in with Google...
                    </FieldDescription>
                  ) : null}
                </div>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
