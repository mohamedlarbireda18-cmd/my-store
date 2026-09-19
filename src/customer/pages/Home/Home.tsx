import { Link } from 'react-router-dom'
import { ArrowRight, Truck, ShieldCheck, Headphones, Tag } from 'lucide-react'
import { usePublicProducts } from '../../hooks/usePublicProducts'
import { usePublicCategories } from '../../hooks/usePublicCategories'
import { ProductGrid } from '../../components/ProductGrid/ProductGrid'
import './Home.css'

export function Home() {
  const { data: products = [], isLoading } = usePublicProducts()
  const { data: categories = [] } = usePublicCategories()

  const featured = products.slice(0, 8)

  return (
    <div className="c-home">
      <div className="c-container">
        {/* ==============================
            Hero
        ============================== */}
        <section className="c-home__hero">
          <div className="c-home__hero-content">
            <span className="c-home__hero-badge">
              <Tag size={12} />
              Best deals today
            </span>
            <h1 className="c-home__hero-title">
              Everything you need,{' '}
              <span className="c-home__hero-title-accent">in one place</span>
            </h1>
            <p className="c-home__hero-subtitle">
              Discover high-quality products at the best prices. Shop smarter,
              live better.
            </p>
            <Link to="/products" className="c-btn c-btn--primary c-btn--lg">
              Shop now
              <ArrowRight size={18} />
            </Link>

            {/* Trust row */}
            <div className="c-home__hero-trust">
              <div className="c-home__hero-trust-item">
                <Truck size={16} />
                <div>
                  <div className="c-home__hero-trust-title">Fast delivery</div>
                  <div className="c-home__hero-trust-desc">
                    Across Algeria
                  </div>
                </div>
              </div>
              <div className="c-home__hero-trust-item">
                <ShieldCheck size={16} />
                <div>
                  <div className="c-home__hero-trust-title">
                    Secure payment
                  </div>
                  <div className="c-home__hero-trust-desc">100% protected</div>
                </div>
              </div>
              <div className="c-home__hero-trust-item">
                <Headphones size={16} />
                <div>
                  <div className="c-home__hero-trust-title">24/7 support</div>
                  <div className="c-home__hero-trust-desc">
                    We're here to help
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="c-home__hero-visual">
            <div className="c-home__hero-visual-glow" />
            <img
              src="/hero-products.png"
              alt="Featured products"
              className="c-home__hero-visual-img"
            />
          </div>
        </section>

        {/* ==============================
            Featured Products
        ============================== */}
        <section className="c-home__section">
          <div className="c-home__section-header">
            <div>
              <h2 className="c-section-title">Featured Products</h2>
              <p className="c-home__section-sub">
                Check out our most popular products, handpicked for you.
              </p>
            </div>
            <Link to="/products" className="c-home__section-link">
              View all
              <ArrowRight size={14} />
            </Link>
          </div>

          <ProductGrid
            products={featured}
            isLoading={isLoading}
            emptyTitle="No products yet"
            emptyMessage="Check back soon for our first drop."
            skeletonCount={4}
          />
        </section>

        {/* ==============================
            Offer banner + Why shop with us
        ============================== */}
        <section className="c-home__promo">
          {/* Special offer */}
          <div className="c-home__offer">
            <div className="c-home__offer-content">
              <span className="c-home__offer-badge">
                <Tag size={12} />
                Special offer
              </span>
              <h3 className="c-home__offer-title">
                Up to <span>50% off</span>
              </h3>
              <p className="c-home__offer-desc">
                On selected products. Don't miss out!
              </p>
              <Link to="/products" className="c-btn c-btn--primary c-btn--sm">
                Shop now
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>

          {/* Why shop with us */}
          <div className="c-home__why">
            <h3 className="c-home__why-title">Why shop with us?</h3>
            <div className="c-home__why-items">
              <div className="c-home__why-item">
                <div className="c-home__why-icon">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <div className="c-home__why-item-title">
                    Quality products
                  </div>
                  <div className="c-home__why-item-desc">Verified sellers</div>
                </div>
              </div>
              <div className="c-home__why-item">
                <div className="c-home__why-icon">
                  <Truck size={20} />
                </div>
                <div>
                  <div className="c-home__why-item-title">Fast delivery</div>
                  <div className="c-home__why-item-desc">All 58 wilayas</div>
                </div>
              </div>
              <div className="c-home__why-item">
                <div className="c-home__why-icon">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <div className="c-home__why-item-title">
                    Cash on delivery
                  </div>
                  <div className="c-home__why-item-desc">Pay on receipt</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ==============================
            Categories preview
        ============================== */}
        {categories.length > 0 && (
          <section className="c-home__section">
            <div className="c-home__section-header">
              <div>
                <h2 className="c-section-title">Shop by category</h2>
                <p className="c-home__section-sub">
                  Browse our collection by category.
                </p>
              </div>
              <Link to="/categories" className="c-home__section-link">
                View all
                <ArrowRight size={14} />
              </Link>
            </div>

            <div className="c-home__categories">
              {categories.slice(0, 8).map((cat) => (
                <Link
                  key={cat.id}
                  to={`/products?category=${cat.slug}`}
                  className="c-home__category"
                >
                  <div className="c-home__category-name">{cat.name}</div>
                  <div className="c-home__category-count">
                    {cat.product_count} product
                    {cat.product_count !== 1 ? 's' : ''}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}