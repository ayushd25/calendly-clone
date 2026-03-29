import { Link } from 'react-router-dom';
import { FiCalendar, FiClock, FiUsers, FiArrowRight, FiCheck } from 'react-icons/fi';

export default function Home() {
    return (
        <div className="home-page">
            {/* Hero Section */}
            <section className="hero">
                <div className="hero-glow"></div>
                <div className="hero-glow hero-glow-2"></div>
                <div className="hero-content">
                    <div className="hero-badge">Scheduling Made Simple</div>
                    <h1>Say goodbye to<br />back-and-forth emails</h1>
                    <p className="hero-sub">
                        Share your availability and let others book time with you instantly.
                        No more email ping-pong, no more timezone confusion.
                    </p>
                    <div className="hero-actions">
                        <Link to="/register" className="btn btn-primary btn-lg">
                            Get Started Free <FiArrowRight />
                        </Link>
                        <Link to="/login" className="btn btn-outline btn-lg">
                            Log In
                        </Link>
                    </div>
                    <div className="hero-stats">
                        <div className="hero-stat">
                            <strong>10K+</strong>
                            <span>Meetings booked</span>
                        </div>
                        <div className="stat-divider"></div>
                        <div className="hero-stat">
                            <strong>98%</strong>
                            <span>Satisfaction rate</span>
                        </div>
                        <div className="stat-divider"></div>
                        <div className="hero-stat">
                            <strong>5 min</strong>
                            <span>Setup time</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="features-section">
                <div className="section-label">Features</div>
                <h2>Everything you need to schedule smarter</h2>
                <div className="features-grid">
                    <div className="feature-card">
                        <div className="feature-icon">
                        <FiCalendar />
                        </div>
                        <h3>Custom Event Types</h3>
                        <p>Create different meeting types with custom durations, descriptions, and availability settings for every scenario.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">
                            <FiClock />
                        </div>
                        <h3>Smart Availability</h3>
                        <p>Set your available days and hours. The system automatically shows only open slots to your guests — no double bookings.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">
                            <FiUsers />
                        </div>
                        <h3>Shareable Booking Page</h3>
                        <p>Get a personal booking link. Share it anywhere — email, social media, website — and let people book instantly.</p>
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section className="how-section">
                <div className="section-label">How It Works</div>
                <h2>Three simple steps</h2>
                <div className="steps-grid">
                    <div className="step-card">
                        <div className="step-number">1</div>
                        <h3>Create an Event Type</h3>
                        <p>Set your meeting title, duration, and availability window. Customize it however you like.</p>
                    </div>
                    <div className="step-card">
                        <div className="step-number">2</div>
                        <h3>Share Your Link</h3>
                        <p>Copy your personal booking page URL and send it to clients, colleagues, or friends.</p>
                    </div>
                    <div className="step-card">
                        <div className="step-number">3</div>
                        <h3>Get Booked</h3>
                        <p>Guests pick a time that works for them. You get a confirmed booking — no emails needed.</p>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="cta-section">
                <div className="cta-glow"></div>
                <div className="cta-content">
                    <h2>Ready to simplify your scheduling?</h2>
                    <p>Join thousands who've already ditched the email back-and-forth.</p>
                    <div className="cta-checklist">
                        <span><FiCheck /> Free to get started</span>
                        <span><FiCheck /> No credit card required</span>
                        <span><FiCheck /> Set up in under 5 minutes</span>
                    </div>
                    <Link to="/register" className="btn btn-primary btn-lg">
                        Create Your Free Account <FiArrowRight />
                    </Link>
                </div>
            </section>
        </div>
    );
}
                        