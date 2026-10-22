import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../../../i18n/LanguageContext'
import './Breadcrumbs.css'

interface BreadcrumbItem {
  label: string
  to?: string
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[]
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  const { t } = useLanguage()

  return (
    <nav className="c-breadcrumbs" aria-label={t('a11y.breadcrumb')}>
      <ol>
        {items.map((item, index) => {
          const isLast = index === items.length - 1

          return (
            <li key={`${item.label}-${index}`}>
              {index > 0 && (
                <ChevronRight
                  size={13}
                  className="c-breadcrumbs__separator"
                  aria-hidden="true"
                />
              )}
              {item.to && !isLast ? (
                <Link to={item.to}>{item.label}</Link>
              ) : (
                <span aria-current={isLast ? 'page' : undefined}>
                  {item.label}
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
