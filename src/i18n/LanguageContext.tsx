import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  translations,
  type Language,
  type TranslationKey,
} from './translations'

const STORAGE_KEY = 'dzairtech_language'

type TranslationParams = Record<string, string | number>

interface LanguageContextValue {
  language: Language
  setLanguage: (language: Language) => void
  toggleLanguage: () => void
  t: (key: TranslationKey, params?: TranslationParams) => string
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

function detectLanguage(): Language {
  if (typeof window === 'undefined') return 'fr'

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored === 'en' || stored === 'fr') return stored
  } catch {
    // localStorage can be unavailable in private browsing.
  }

  return window.navigator.language.toLowerCase().startsWith('fr') ? 'fr' : 'en'
}

function interpolate(value: string, params?: TranslationParams): string {
  if (!params) return value

  return value.replace(/\{(\w+)\}/g, (match, name: string) => {
    const param = params[name]
    return param === undefined ? match : String(param)
  })
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(detectLanguage)

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, language)
    } catch {
      // Ignore storage failures; the in-memory language still works.
    }
  }, [language])

  const setLanguage = useCallback((next: Language) => {
    setLanguageState(next)
  }, [])

  const toggleLanguage = useCallback(() => {
    setLanguageState((current) => (current === 'en' ? 'fr' : 'en'))
  }, [])

  const t = useCallback(
    (key: TranslationKey, params?: TranslationParams) => {
      let value: string = translations[language][key]

      if (params && 'count' in params) {
        const count = Number(params.count)
        const suffix =
          language === 'fr'
            ? count <= 1
              ? '_one'
              : '_other'
            : count === 1
              ? '_one'
              : '_other'
        const pluralKey = `${key}${suffix}` as TranslationKey

        if (pluralKey in translations[language]) {
          value = translations[language][pluralKey]
        }
      }

      return interpolate(value, params)
    },
    [language]
  )

  const contextValue = useMemo(
    () => ({ language, setLanguage, toggleLanguage, t }),
    [language, setLanguage, toggleLanguage, t]
  )

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext)

  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }

  return context
}
