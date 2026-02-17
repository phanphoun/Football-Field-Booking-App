import { Link } from 'react-router-dom';
import { MapPin, Users, Trophy, Zap, Star, TrendingUp, Shield, Clock } from 'lucide-react';
import './Home.css';

const Home = () => {
    const features = [
        {
            icon: MapPin,
            title: 'Find Fields',
            description: 'Browse and book premium football fields across Cambodia with real-time availability.',
            color: 'var(--primary-green)',
        },
        {
            icon: Users,
            title: 'Build Teams',
            description: 'Create and manage your team, customize jerseys, and track your performance.',
            color: 'var(--accent-blue)',
        },
        {
            icon: Zap,
            title: 'Auto Matchmaking',
            description: 'Find opponents automatically and schedule matches with teams at your skill level.',
            color: 'var(--accent-orange)',
        },
        {
            icon: Trophy,
            title: 'Track Stats',
            description: 'Monitor match results, MVP awards, and climb the leaderboards.',
            color: 'var(--accent-purple)',
        },
    ];

    const stats = [
        { value: '1,000+', label: 'Active Users', icon: Users },
        { value: '50+', label: 'Football Fields', icon: MapPin },
        { value: '200+', label: 'Daily Matches', icon: Trophy },
        { value: '4.8', label: 'User Rating', icon: Star },
    ];

    const benefits = [
        {
            icon: TrendingUp,
            title: 'Grow Your Network',
            description: 'Connect with football enthusiasts and expand your team network.',
        },
        {
            icon: Shield,
            title: 'Secure Bookings',
            description: 'Safe and reliable booking system with instant confirmation.',
        },
        {
            icon: Clock,
            title: '24/7 Support',
            description: 'Round-the-clock customer support for all your needs.',
        },
    ];

    return (
        <div className="home">
            {/* Hero Section */}
            <section className="hero">
                <div className="hero-background"></div>
                <div className="hero-content container">
                    <div className="hero-text animate-fadeIn">
                        <h1 className="hero-title">
                            Book Your Perfect
                            <span className="gradient-text"> Football Field</span>
                        </h1>
                        <p className="hero-subtitle">
                            The premier platform for booking football fields and organizing matches in Cambodia.
                            Find fields, build teams, and compete with the best.
                        </p>
                        <div className="hero-actions">
                            <Link to="/fields" className="btn btn-primary btn-lg">
                                <MapPin size={20} />
                                Browse Fields
                            </Link>
                            <Link to="/matchmaking" className="btn btn-outline btn-lg">
                                <Zap size={20} />
                                Find Opponents
                            </Link>
                        </div>
                    </div>
                    <div className="hero-image animate-slideInRight">
                        <div className="hero-card">
                            <div className="hero-card-glow"></div>
                            <div className="hero-card-content">
                                <Trophy size={80} className="hero-icon" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="stats-section">
                <div className="container">
                    <div className="stats-grid">
                        {stats.map((stat, index) => {
                            const Icon = stat.icon;
                            return (
                                <div key={index} className="stat-card animate-fadeIn" style={{ animationDelay: `${index * 0.1}s` }}>
                                    <Icon size={32} className="stat-icon" />
                                    <div className="stat-value">{stat.value}</div>
                                    <div className="stat-label">{stat.label}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="section features-section">
                <div className="container">
                    <div className="section-header">
                        <h2 className="section-title">Everything You Need</h2>
                        <p className="section-subtitle">
                            Powerful features to help you book fields, organize matches, and grow your football community.
                        </p>
                    </div>
                    <div className="grid grid-cols-4">
                        {features.map((feature, index) => {
                            const Icon = feature.icon;
                            return (
                                <div key={index} className="feature-card card animate-fadeIn" style={{ animationDelay: `${index * 0.1}s` }}>
                                    <div className="feature-icon" style={{ background: `linear-gradient(135deg, ${feature.color}, ${feature.color}dd)` }}>
                                        <Icon size={28} />
                                    </div>
                                    <h3 className="feature-title">{feature.title}</h3>
                                    <p className="feature-description">{feature.description}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Benefits Section */}
            <section className="section benefits-section">
                <div className="container">
                    <div className="benefits-content">
                        <div className="benefits-text">
                            <h2 className="section-title">Why Choose FieldBook?</h2>
                            <p className="section-subtitle">
                                Join Cambodia's fastest-growing football community and experience the future of field booking.
                            </p>
                            <div className="benefits-list">
                                {benefits.map((benefit, index) => {
                                    const Icon = benefit.icon;
                                    return (
                                        <div key={index} className="benefit-item">
                                            <div className="benefit-icon">
                                                <Icon size={24} />
                                            </div>
                                            <div className="benefit-content">
                                                <h4 className="benefit-title">{benefit.title}</h4>
                                                <p className="benefit-description">{benefit.description}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            <Link to="/register" className="btn btn-primary btn-lg">
                                Get Started Now
                            </Link>
                        </div>
                        <div className="benefits-visual">
                            <div className="visual-card card-glass">
                                <div className="visual-glow"></div>
                                <Users size={120} className="visual-icon" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="cta-section">
                <div className="container">
                    <div className="cta-content">
                        <h2 className="cta-title">Ready to Play?</h2>
                        <p className="cta-subtitle">
                            Join thousands of players and teams already using FieldBook to organize their matches.
                        </p>
                        <div className="cta-actions">
                            <Link to="/register" className="btn btn-accent btn-lg">
                                Create Account
                            </Link>
                            <Link to="/fields" className="btn btn-outline btn-lg">
                                Explore Fields
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Home;
