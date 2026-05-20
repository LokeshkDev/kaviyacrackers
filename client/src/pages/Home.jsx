import React, { useEffect, useState } from 'react';
import { useApi } from '../hooks/useApi';
import { Link } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import AOS from 'aos';
import 'aos/dist/aos.css';

// Assets
import heroImg from '../assets/img/hero.png';
import logo from '../assets/img/kaviya_crackers_logo.jpeg';
import offersBg from '../assets/img/offers-bg.png';

const Home = () => {
  const { fetchData } = useApi();
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    AOS.init({ duration: 800, once: true });

    const loadData = async () => {
      const data = await fetchData();
      if (data && data.categories) {
        setCategories(data.categories);
      }
    };
    loadData();

    // Scroll to Top functionality
    const scrollBtn = document.getElementById('scrollToTop');
    if (scrollBtn) {
      window.onscroll = () => {
        if (document.body.scrollTop > 100 || document.documentElement.scrollTop > 100) {
          scrollBtn.style.display = "flex";
        } else {
          scrollBtn.style.display = "none";
        }
      };
      scrollBtn.onclick = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      };
    }
  }, []);

  return (
    <main>
      {/* Hero Section */}
      <section id="home" className="hero-section py-5 d-flex align-items-center">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-6 mb-5 mb-lg-0" data-aos="fade-up">
              <span className="badge rounded-pill bg-soft-orange text-orange mb-3 px-3 py-2 fw-semibold">
                Premium Festive Collection 2026
              </span>
              <h1 className="display-3 fw-bold mb-4">
                Celebrate Every Moment with <span className="text-gradient">Kaviya Crackers</span>
              </h1>
              <p className="lead text-muted mb-5">
                Premium quality crackers, fireworks, festive combo packs, and wholesale supplies for every celebration. Safe, trusted, and delivered with care.
              </p>
              <div className="d-flex flex-wrap gap-3">
                <Link to="/shop" className="btn btn-primary btn-lg rounded-pill px-5 shadow-lg">Shop Now</Link>
                <a href="https://wa.me/919342758753" target="_blank" rel="noreferrer"
                  className="btn btn-outline-dark btn-lg rounded-pill px-5 shadow-sm">WhatsApp Order</a>
              </div>
              <div className="mt-5 d-flex gap-4 align-items-center">
                <div className="d-flex align-items-center">
                  <i className="bi bi-patch-check-fill text-success fs-3 me-2"></i>
                  <span className="fw-semibold text-dark">ISO Certified</span>
                </div>
                <div className="d-flex align-items-center">
                  <i className="bi bi-truck text-primary fs-3 me-2"></i>
                  <span className="fw-semibold text-dark">Fast Delivery</span>
                </div>
              </div>
            </div>
            <div className="col-lg-6 position-relative" data-aos="zoom-in">
              <div className="hero-image-wrapper">
                <img src={heroImg} alt="Festival Crackers Showcase" className="img-fluid rounded-custom shadow-lg" />
                <div className="floating-badge top-0 end-0 m-4 bg-white p-3 shadow-lg d-none d-md-block">
                  <div className="text-center">
                    <span className="d-block fw-bold fs-4 text-primary">20+</span>
                    <span className="text-muted small">Years of Trust</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-5 bg-white-tertiary-cream">
        <div className="container py-5">
          <div className="row align-items-center g-5">
            <div className="col-lg-5 order-2 order-lg-1" data-aos="fade-right">
              <h2 className="display-5 fw-bold mb-4">Our Legacy of <span className="text-primary">Brightness</span></h2>
              <p className="text-muted mb-4">Kaviya Crackers offers premium quality fireworks for festivals and celebrations. We provide trusted, affordable, and safe products for both retail and wholesale customers. Our mission is to light up your celebrations with the safest and most vibrant crackers in the market.</p>
              <div className="row g-4">
                {[
                  { title: 'Premium', desc: 'Quality Products', color: 'primary' },
                  { title: 'Wholesale', desc: 'Bulk Supplies', color: 'warning' },
                  { title: 'Safe', desc: 'Eco-Friendly', color: 'info' },
                  { title: 'Trusted', desc: 'Service Excellence', color: 'success' }
                ].map((item, idx) => (
                  <div className="col-6" key={idx}>
                    <div className={`p-3 bg-white rounded-4 shadow-sm h-100 border-start border-4 border-${item.color}`}>
                      <h4 className="fw-bold mb-1">{item.title}</h4>
                      <p className="small text-muted mb-0">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="col-lg-7 order-1 order-lg-2" data-aos="fade-left">
              <div className="about-grid d-grid gap-4">
                <div className="bg-packaging rounded-4 h-250 overflow-hidden shadow-lg border-0 position-relative">
                  <div className="p-5 text-white h-100 d-flex flex-column justify-content-end z-1 position-relative">
                    <h3 className="fw-bold display-6">Safe Packaging</h3>
                    <p className="mb-0 fs-5 opacity-75">Ensuring every delivery arrives in perfect condition with multi-layer protection.</p>
                  </div>
                </div>
                <div className="bg-support rounded-4 h-250 overflow-hidden shadow-lg border-0 position-relative">
                  <div className="p-5 text-white h-100 d-flex flex-column justify-content-end z-1 position-relative">
                    <h3 className="fw-bold display-6">Fast Support</h3>
                    <p className="mb-0 fs-5 opacity-75">Dedicated team for all your enquiries, bulk orders, and festival assistance.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Product Categories */}
      <section id="products" className="py-5">
        <div className="container py-5">
          <div className="text-center mb-5" data-aos="fade-up">
            <span className="text-primary fw-bold text-uppercase tracking-widest small">Our Collection</span>
            <h2 className="display-5 fw-bold mt-2">Explore Our <span className="text-gradient">Categories</span></h2>
            <p className="text-muted mx-auto" style={{ maxWidth: '600px' }}>Discover a wide range of crackers and fireworks designed to make your celebrations unforgettable.</p>
          </div>

          <div className="position-relative" data-aos="fade-up">
            <Swiper
              modules={[Navigation, Pagination, Autoplay]}
              spaceBetween={20}
              slidesPerView={1.3}
              autoplay={{ delay: 3000 }}
              navigation={{ nextEl: '.cat-next', prevEl: '.cat-prev' }}
              pagination={{ clickable: true }}
              className="categorySwiper py-4"
              breakpoints={{
                480: { slidesPerView: 2.2 },
                768: { slidesPerView: 3.2 },
                1024: { slidesPerView: 4.2 }
              }}
            >
              {categories.map((cat, i) => (
                <SwiperSlide key={i}>
                  <Link to="/shop" className="text-decoration-none text-dark h-100">
                    <div className="category-card category-card-fill rounded-5 shadow-sm h-100 border-0 bg-white hover-scale">
                      <div className="category-card-fill__media">
                        <img
                          src={cat.image ? (cat.image.startsWith('http') ? cat.image : `/${cat.image}`) : logo}
                          alt={cat.name}
                          onError={(e) => { e.target.src = logo; }}
                        />
                      </div>
                      <div className="category-card-fill__body bg-white border-top border-light">
                        <h5 className="fw-bold mb-0 text-dark">{cat.name}</h5>
                        <span className="small fw-bold text-primary">View Collection →</span>
                      </div>
                    </div>
                  </Link>
                </SwiperSlide>
              ))}
            </Swiper>
            <div className="swiper-button-prev cat-prev"></div>
            <div className="swiper-button-next cat-next"></div>
          </div>
        </div>
      </section>

      {/* Festival Offers */}
      <section id="offers" className="py-5 parallax-offers text-white overflow-hidden position-relative">
        <div className="parallax-bg" style={{ backgroundImage: `url(${offersBg})` }}></div>
        <div className="container py-5 position-relative z-1">
          <div className="row align-items-center">
            <div className="col-lg-5 mb-5 mb-lg-0" data-aos="fade-right">
              <h2 className="display-4 fw-bold mb-4">Exclusive <br />Festival Offers</h2>
              <p className="lead mb-5 opacity-75">Don't miss out on our specially curated combo packs and wholesale discounts. Limited time only!</p>
              <a href="https://wa.me/919342758753" className="btn btn-light btn-lg rounded-pill px-5 fw-bold text-primary shadow-lg">Grab Offers Now</a>
            </div>
            <div className="col-lg-7" data-aos="fade-left">
              <div className="row g-4 scroll-reveal">
                <div className="col-md-6">
                  <div className="offer-card p-4 rounded-5 bg-white text-dark shadow-lg">
                    <span className="badge bg-danger mb-3">Hot Deal</span>
                    <h4 className="fw-bold">Family Combo Pack</h4>
                    <p className="text-muted small">Everything you need for a grand family celebration.</p>
                    <div className="d-flex justify-content-between align-items-center mt-4">
                      <span className="fs-3 fw-bold">₹4,999</span>
                      <span className="text-muted text-decoration-line-through">₹7,500</span>
                    </div>
                  </div>
                </div>
                <div className="col-md-6 mt-md-5">
                  <div className="offer-card p-4 rounded-5 bg-white text-dark shadow-lg">
                    <span className="badge bg-warning mb-3">Best for Kids</span>
                    <h4 className="fw-bold">Safe Kids Box</h4>
                    <p className="text-muted small">Premium sound-free and safe crackers for kids.</p>
                    <div className="d-flex justify-content-between align-items-center mt-4">
                      <span className="fs-3 fw-bold">₹1,499</span>
                      <span className="text-muted text-decoration-line-through">₹2,200</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-5">
        <div className="container py-5">
          <div className="text-center mb-5" data-aos="fade-up">
            <h2 className="display-5 fw-bold">Why <span className="text-primary">Kaviya Crackers?</span></h2>
            <p className="text-muted">Commitment to quality and safety since our inception.</p>
          </div>
          <div className="row g-4">
            {[
              { icon: 'shield-check', title: 'Premium Quality', text: 'Only the highest grade raw materials used.', color: 'primary' },
              { icon: 'tag', title: 'Affordable Pricing', text: 'Best prices in the market for retail and wholesale.', color: 'warning' },
              { icon: 'box', title: 'Safe Packaging', text: 'Multi-layer safe packaging for damage-free transit.', color: 'info' },
              { icon: 'headset', title: 'Fast Support', text: 'Quick response team for all your queries.', color: 'success' }
            ].map((item, idx) => (
              <div className="col-lg-3 col-md-6" key={idx} data-aos="fade-up" data-aos-delay={idx * 100}>
                <div className="p-4 rounded-4 bg-white-tertiary text-center h-100 transition-up shadow-sm">
                  <i className={`bi bi-${item.icon} fs-1 text-${item.color} mb-3 d-block`}></i>
                  <h5 className="fw-bold">{item.title}</h5>
                  <p className="small text-muted mb-0">{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Safety Tips */}
      <section id="safety" className="py-5 bg-soft-yellow">
        <div className="container py-5">
          <div className="row align-items-center g-5">
            <div className="col-lg-6" data-aos="fade-right">
              <h2 className="display-5 fw-bold mb-4">Celebrations are <br /><span className="text-danger">Safety First</span></h2>
              <p className="text-muted mb-5">At Kaviya Crackers, your safety is our top priority. Please follow these essential tips for a happy and safe festival.</p>
              <ul className="list-unstyled">
                {[
                  'Always supervise children during celebrations.',
                  'Light crackers in open spaces only.',
                  'Keep a bucket of water or sand nearby.',
                  'Store crackers in a cool, dry place away from heat.'
                ].map((tip, idx) => (
                  <li className="d-flex align-items-center mb-3" key={idx}>
                    <div className="bg-white p-2 rounded-circle shadow-sm me-3">
                      <i className="bi bi-check2 text-danger"></i>
                    </div>
                    <span className="fw-medium">{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="col-lg-6" data-aos="fade-left">
              <div className="p-5 bg-white rounded-5 shadow-lg border-bottom border-5 border-danger">
                <h3 className="fw-bold mb-4">Important Guidelines</h3>
                <div className="alert alert-warning border-0 rounded-4 mb-4">
                  <i className="bi bi-exclamation-triangle-fill me-2"></i> Never try to re-ignite a dud cracker.
                </div>
                <div className="alert alert-info border-0 rounded-4 mb-0">
                  <i className="bi bi-info-circle-fill me-2"></i> Dispose of used crackers safely in water.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Customer Reviews */}
      <section className="py-5 overflow-hidden">
        <div className="container py-5">
          <div className="text-center mb-5" data-aos="fade-up">
            <h2 className="display-5 fw-bold">Customer <span className="text-primary">Reviews</span></h2>
          </div>
          <Swiper
            modules={[Pagination, Autoplay]}
            spaceBetween={30}
            slidesPerView={1}
            autoplay={{ delay: 4000 }}
            pagination={{ clickable: true }}
            breakpoints={{
              768: { slidesPerView: 2 },
              1024: { slidesPerView: 3 }
            }}
            className="reviewSwiper py-4"
            data-aos="fade-up"
          >
            {[
              { name: 'Rajesh Kumar', role: 'Family Customer', color: 'blue', text: 'Amazing quality and very safe packaging. My family loved the flower pots and sparklers from Kaviya Crackers.' },
              { name: 'Suresh Raina', role: 'Wholesale Dealer', color: 'orange', text: "Best prices for wholesale orders. I've been buying from them for 3 years now. Highly recommended!" },
              { name: 'Anitha Devi', role: 'Retail Customer', color: 'pink', text: 'The combo packs are so convenient and kids loved the soundless crackers. Very prompt delivery too.' }
            ].map((rev, idx) => (
              <SwiperSlide key={idx}>
                <div className="p-4 rounded-4 bg-white shadow-sm border h-100">
                  <div className="d-flex mb-3 gap-1">
                    {[1, 2, 3, 4, 5].map(s => <i key={s} className="bi bi-star-fill text-warning"></i>)}
                  </div>
                  <p className="text-muted italic">"{rev.text}"</p>
                  <div className="d-flex align-items-center mt-4">
                    <div className={`bg-soft-${rev.color} p-3 rounded-circle me-3`}>
                      <i className={`bi bi-${rev.role === 'Wholesale Dealer' ? 'shop' : 'person'}`}></i>
                    </div>
                    <div>
                      <h6 className="fw-bold mb-0">{rev.name}</h6>
                      <span className="small text-muted">{rev.role}</span>
                    </div>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-5 bg-white-tertiary-cream">
        <div className="container py-5">
          <div className="row g-5">
            <div className="col-lg-5" data-aos="fade-right">
              <h2 className="display-5 fw-bold mb-4">Get in <span className="text-primary">Touch</span></h2>
              <p className="text-muted mb-5">Have questions or want to place a bulk order? Our team is here to help you.</p>
              <div className="contact-info">
                {[
                  { icon: 'geo-alt', label: 'Address', text: '123, Festival Plaza, Main Road, Sivakasi, Tamil Nadu', color: 'primary' },
                  { icon: 'telephone', label: 'Phone', text: '+91 93427 58753', color: 'warning' },
                  { icon: 'envelope', label: 'Email', text: 'info@Kaviyacrackers.com', color: 'info' }
                ].map((item, idx) => (
                  <div className="d-flex mb-4" key={idx}>
                    <div className="icon-box bg-white shadow-sm rounded-4 me-3 p-3 d-flex align-items-center justify-content-center" style={{ width: '50px', height: '50px' }}>
                      <i className={`bi bi-${item.icon} text-${item.color}`}></i>
                    </div>
                    <div>
                      <h6 className="fw-bold mb-1">{item.label}</h6>
                      <p className="text-muted small mb-0">{item.text}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-5 p-4 bg-white rounded-5 shadow-sm">
                <h5 className="fw-bold mb-3">Store Location</h5>
                <div className="map-placeholder bg-white-tertiary rounded-4 d-flex align-items-center justify-content-center border" style={{ height: '200px' }}>
                  <div className="text-center opacity-50">
                    <i className="bi bi-map fs-1 text-muted"></i>
                    <p className="small text-muted mt-2">Interactive Map Loading...</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-lg-7" data-aos="fade-left">
              <div className="p-5 bg-white rounded-5 shadow-lg border-top border-5 border-primary">
                <h3 className="fw-bold mb-4">Send an Enquiry</h3>
                <form id="contactForm">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <div className="form-floating mb-3">
                        <input type="text" className="form-control rounded-4 border-light bg-white-tertiary" id="name" placeholder="Name" required />
                        <label htmlFor="name">Your Name</label>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-floating mb-3">
                        <input type="tel" className="form-control rounded-4 border-light bg-white-tertiary" id="phone" placeholder="Phone" required />
                        <label htmlFor="phone">Phone Number</label>
                      </div>
                    </div>
                    <div className="col-12">
                      <div className="form-floating mb-3">
                        <select className="form-select rounded-4 border-light bg-white-tertiary" id="interest">
                          <option value="Retail">Retail Purchase</option>
                          <option value="Wholesale">Wholesale Enquiry</option>
                          <option value="Combo">Festival Combo Packs</option>
                          <option value="Bulk">Bulk Events</option>
                        </select>
                        <label htmlFor="interest">Interested In</label>
                      </div>
                    </div>
                    <div className="col-12">
                      <div className="form-floating mb-3">
                        <textarea className="form-control rounded-4 border-light bg-white-tertiary" style={{ height: '150px' }} placeholder="Message" id="message"></textarea>
                        <label htmlFor="message">Message (Optional)</label>
                      </div>
                    </div>
                    <div className="col-12 mt-4">
                      <button className="btn btn-primary btn-lg rounded-pill px-5 w-100 py-3 fw-bold shadow-lg" type="submit">Submit Enquiry</button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Floating Action Elements */}
      <div className="floating-actions d-flex flex-column gap-3 position-fixed bottom-0 end-0 m-4" style={{ zIndex: 1050 }}>
        <a href="https://wa.me/919342758753" className="btn-float whatsapp shadow-lg d-flex align-items-center justify-content-center" title="WhatsApp Order">
          <i className="bi bi-whatsapp"></i>
        </a>
        <a href="tel:+919342758753" className="btn-float call shadow-lg d-flex align-items-center justify-content-center" title="Call Us">
          <i className="bi bi-telephone"></i>
        </a>
        <button id="scrollToTop" className="btn-float top shadow-lg d-flex align-items-center justify-content-center" title="Scroll to Top" style={{ display: 'none' }}>
          <i className="bi bi-arrow-up"></i>
        </button>
      </div>

      {/* Social Sidebar (Desktop) */}
      <div className="social-sidebar d-none d-lg-flex flex-column position-fixed start-0 top-50 translate-middle-y shadow-lg rounded-end overflow-hidden" style={{ zIndex: 1040 }}>
        <a href="#" className="social-bar-item facebook d-flex align-items-center text-decoration-none text-white p-3 gap-3">
          <i className="bi bi-facebook fs-4"></i><span>Facebook</span>
        </a>
        <a href="#" className="social-bar-item instagram d-flex align-items-center text-decoration-none text-white p-3 gap-3">
          <i className="bi bi-instagram fs-4"></i><span>Instagram</span>
        </a>
        <a href="https://wa.me/919342758753" className="social-bar-item whatsapp d-flex align-items-center text-decoration-none text-white p-3 gap-3">
          <i className="bi bi-whatsapp fs-4"></i><span>WhatsApp</span>
        </a>
        <a href="#" className="social-bar-item youtube d-flex align-items-center text-decoration-none text-white p-3 gap-3">
          <i className="bi bi-youtube fs-4"></i><span>YouTube</span>
        </a>
      </div>
    </main>
  );
};

export default Home;
