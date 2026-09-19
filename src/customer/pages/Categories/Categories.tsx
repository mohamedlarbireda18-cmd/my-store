import { Link } from 'react-router-dom'
import { ArrowRight, LayoutGrid } from 'lucide-react'
import { usePublicCategories } from '../../hooks/usePublicCategories'
import './Categories.css'

export function Categories() {
  const { data: categories = [], isLoading } = usePublicCategories()

  return (
    <div className="c-categories">
      <div className="c-container">
        <div className="c-categories__header">
          <h1 className="c-page-title">Categories</h1>
          <p className="c-page-subtitle">Explore products by category.</p>
        </div>

        {isLoading ? (
          <div className="c-categories__grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="c-categories__skeleton c-skeleton" />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <div className="c-categories__empty">
            <div className="c-categories__empty-icon">
              <LayoutGrid size={28} />
            </div>
            <h3 className="c-categories__empty-title">No categories yet</h3>
            <p className="c-categories__empty-desc">
              Check back soon for our first categories.
            </p>
          </div>
        ) : (
          <div className="c-categories__grid">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                to={`/products?category=${cat.slug}`}
                className="c-categories__card"
              >
                <div className="c-categories__card-body">
                  <h3 className="c-categories__card-name">{cat.name}</h3>
                  <p className="c-categories__card-count">
                    {cat.product_count} product
                    {cat.product_count !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="c-categories__card-arrow">
                  <ArrowRight size={16} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}