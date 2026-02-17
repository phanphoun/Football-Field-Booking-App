import { Link } from 'react-router-dom';
import { Trophy, Facebook, Twitter, Instagram, Mail, Phone, MapPin } from 'lucide-react';
import './Footer.css';

const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="footer">
            <div className="footer-content container">
                <div className="footer-grid">
                    {/* Brand Section */}
                    <div className="footer-section">
                        <div className="footer-logo">
                            <div className="logo-icon">
                                <Trophy size={28} />
                            </div>
                            <div className="logo-text">
                                <span className="logo-title">FieldBook</span>
                                <span className="logo-subtitle">Cambodia</span>
                            </div>
                        </div>
                        <p className="footer-description">
                            The premier platform for booking football fields and organizing matches in Cambodia.
                            Connect with teams, find opponents, and enjoy the beautiful game.
                        </p>
                        <div className="footer-social">
                            <a href="#" className="social-link" aria-label="Facebook">
                                <Facebook size={20} />
                            </a>
                            <a href="#" className="social-link" aria-label="Twitter">
                                <Twitter size={20} />
                            </a>
                            <a href="#" className="social-link" aria-label="Instagram">
                                <Instagram size={20} />
                            </a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className="footer-section">
                        <h3 className="footer-title">Quick Links</h3>
                        <ul className="footer-links">
                            <li><Link to="/fields">Browse Fields</Link></li>
                            <li><Link to="/teams">Find Teams</Link></li>
                            <li><Link to="/matchmaking">Matchmaking</Link></li>
                            <li><Link to="/leagues">League Matches</Link></li>
                            <li><Link to="/bookings">My Bookings</Link></li>
                        </ul>
                    </div>

                    {/* For Field Owners */}
                    <div className="footer-section">
                        <h3 className="footer-title">For Field Owners</h3>
                        <ul className="footer-links">
                            <li><Link to="/dashboard">Dashboard</Link></li>
                            <li><Link to="/dashboard/fields">Manage Fields</Link></li>
                            <li><Link to="/dashboard/bookings">Bookings</Link></li>
                            <li><Link to="/dashboard/revenue">Revenue</Link></li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div className="footer-section">
                        <h3 className="footer-title">Contact Us</h3>
                        <ul className="footer-contact">
                            <li>
                                <Mail size={18} />
                                <span>support@fieldbook.com</span>
                            </li>
                            <li>
                                <Phone size={18} />
                                <span>+855 12 345 678</span>
                            </li>
                            <li>
                                <MapPin size={18} />
                                <span>Phnom Penh, Cambodia</span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="footer-bottom">
                    <p className="footer-copyright">
                        © {currentYear} FieldBook Cambodia. All rights reserved.
                    </p>
                    <div className="footer-legal">
                        <Link to="/privacy">Privacy Policy</Link>
                        <Link to="/terms">Terms of Service</Link>
                        <Link to="/cookies">Cookie Policy</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
