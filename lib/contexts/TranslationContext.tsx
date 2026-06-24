"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { useAppSelector } from "@/lib/redux/hooks"
import en from "../locales/en.json"
import es from "../locales/es.json"
import fr from "../locales/fr.json"
import ar from "../locales/ar.json"

const translations: Record<string, Record<string, string>> = {
  en,
  es,
  fr,
  ar,
}

type TranslationContextType = {
  language: string
  t: (key: string) => string
  changeLanguage: (lang: string) => void
  isRtl: boolean
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined)

export const TranslationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<string>("en")
  const storeLanguage = useAppSelector(
    (state) => state.session.businessSettings?.settings?.store_language
  )

  useEffect(() => {
    const savedLanguage = localStorage.getItem("pos_lang")
    if (savedLanguage) {
      setLanguage(savedLanguage)
      updateDocumentDirection(savedLanguage)
    } else if (storeLanguage) {
      setLanguage(storeLanguage)
      updateDocumentDirection(storeLanguage)
    } else {
      setLanguage("en")
      updateDocumentDirection("en")
    }
  }, [storeLanguage])

  const updateDocumentDirection = (lang: string) => {
    const isRtl = lang === "ar"
    document.documentElement.dir = isRtl ? "rtl" : "ltr"
    document.documentElement.lang = lang
  }

  const changeLanguage = (lang: string) => {
    if (!translations[lang]) return
    setLanguage(lang)
    localStorage.setItem("pos_lang", lang)
    updateDocumentDirection(lang)
  }

  const t = (key: string): string => {
    const langDict = translations[language] || en
    return langDict[key] || key
  }

  const isRtl = language === "ar"

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
