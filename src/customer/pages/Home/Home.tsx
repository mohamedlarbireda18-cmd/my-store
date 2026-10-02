import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Truck,
  ShieldCheck,
  Headphones,
  Tag,
} from 'lucide-react'
import {
  InstagramIcon,
  FacebookIcon,
  WhatsAppIcon,
} from '../../components/SocialIcons/SocialIcons'
import './Home.css'

export function Home() {
  return (
    <div className="c-home">
      <div className="c-container">
        {/* Hero */}
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

        {/* Promo row */}
        <section className="c-home__promo">
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

        {/* Social links */}
        <section className="c-home__social">
          <h3 className="c-home__social-title">Follow us</h3>
          <p className="c-home__social-sub">
            Stay updated with our latest products and offers.
          </p>

          <div className="c-home__social-links">
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="c-home__social-link c-home__social-link--instagram"
              aria-label="Instagram"
            >
              <InstagramIcon size={22} />
            </a>

            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="c-home__social-link c-home__social-link--facebook"
              aria-label="Facebook"
            >
              <FacebookIcon size={22} />
            </a>

            <a
              href="https://wa.me/213000000000"
              target="_blank"
              rel="noopener noreferrer"
              className="c-home__social-link c-home__social-link--whatsapp"
              aria-label="WhatsApp"
            >
              <WhatsAppIcon size={22} />
            </a>
          </div>
        </section>
      </div>
    </div>
  )
}