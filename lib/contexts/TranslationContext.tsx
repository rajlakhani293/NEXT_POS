"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { isRtlLanguage, isSupportedLanguage } from "@/lib/i18n/languages"
import { useAppSelector } from "@/lib/redux/hooks"
import en from "../locales/en.json"
import es from "../locales/es.json"
import fr from "../locales/fr.json"
import ar from "../locales/ar.json"
import sourceAr from "../locales/source/ar.json"
import sourceDe from "../locales/source/de.json"
import sourceEn from "../locales/source/en.json"
import sourceEs from "../locales/source/es.json"
import sourceFr from "../locales/source/fr.json"
import sourceId from "../locales/source/id.json"
import sourceIt from "../locales/source/it.json"
import sourceKm from "../locales/source/km.json"
import sourcePt from "../locales/source/pt.json"
import sourceSq from "../locales/source/sq.json"
import sourceTr from "../locales/source/tr.json"
import sourceVi from "../locales/source/vi.json"

const translations: Record<string, Record<string, string>> = {
  en: { ...sourceEn, ...en },
  de: sourceDe,
  fr: { ...sourceFr, ...fr },
  es: { ...sourceEs, ...es },
  it: sourceIt,
  id: sourceId,
  ar: { ...sourceAr, ...ar },
  pt: sourcePt,
  tr: sourceTr,
  km: sourceKm,
  vi: sourceVi,
  sq: sourceSq,
}

type TranslationContextType = {
  language: string
  t: (key: string) => string
  changeLanguage: (lang: string) => void
  isRtl: boolean
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined)

const updateDocumentDirection = (lang: string) => {
  const isRtl = isRtlLanguage(lang)
  document.documentElement.dir = isRtl ? "rtl" : "ltr"
  document.documentElement.lang = lang
}

export const TranslationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<string>("en")
  const storeLanguage = useAppSelector(
    (state) => state.session.businessSettings?.settings?.store_language
  )

  useEffect(() => {
    const savedLanguage = localStorage.getItem("pos_lang")
    let nextLanguage = "en"
    if (savedLanguage && isSupportedLanguage(savedLanguage)) {
      nextLanguage = savedLanguage
    } else if (storeLanguage && isSupportedLanguage(storeLanguage)) {
      nextLanguage = storeLanguage
    }
    updateDocumentDirection(nextLanguage)
    queueMicrotask(() => setLanguage(nextLanguage))
  }, [storeLanguage])

  const changeLanguage = (lang: string) => {
    if (!isSupportedLanguage(lang)) return
    setLanguage(lang)
    localStorage.setItem("pos_lang", lang)
    updateDocumentDirection(lang)
  }

  const t = (key: string): string => {
    const langDict = translations[language] || en
    return langDict[key] || translations.en[key] || key
  }

  const isRtl = isRtlLanguage(language)

  return (
    <TranslationContext.Provider value={{ language, t, changeLanguage, isRtl }}>
      {children}
    </TranslationContext.Provider>
  )
}

export const useTranslation = () => {
  const context = useContext(TranslationContext)
  if (context === undefined) {
    throw new Error("useTranslation must be used within a TranslationProvider")
  }
  return context
}
