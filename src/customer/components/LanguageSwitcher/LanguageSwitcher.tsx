import { Globe } from 'lucide-react'
import { useLanguage } from '../../../i18n/LanguageContext'
import './LanguageSwitcher.css'

interface LanguageSwitcherProps {
  variant?: 'compact' | 'menu'
}

export function LanguageSwitcher({
  variant = 'compact',
}: LanguageSwitcherProps) {
  const { language, setLanguage, t } = useLanguage()
  const isMenu = variant === 'menu'

  return (
    <div
      className={`c-lang-switcher c-lang-switcher--${variant}`}
      role="group"
      aria-label={t('language.label')}
    >
      <Globe
        size={isMenu ? 17 : 15}
        className="c-lang-switcher__icon"
        aria-hidden="true"
      />
      <button
        type="button"
        aria-pressed={language === 'en'}
        title={t('language.switchToEnglish')}
        onClick={() => setLanguage('en')}
      >
        {isMenu ? t('language.english') : 'EN'}
      </button>
      <span className="c-lang-switcher__divider" aria-hidden="true" />
      <button
        type="button"
        aria-pressed={language === 'fr'}
        title={t('language.switchToFrench')}
        onClick={() => setLanguage('fr')}
      >
        {isMenu ? t('language.french') : 'FR'}
      </button>
    </div>
  )
}
