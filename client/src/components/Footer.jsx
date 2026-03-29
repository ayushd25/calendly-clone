import { FiCalendar } from 'react-icons/fi';
import { Link } from 'react-router-dom';

export default function Footer() {
    return (
        <footer className="footer">
            <div className="footer-inner">
                <div className="footer-top">
                    <div className="footer-brand"><FiCalendar /> Calendly Clone</div>
                    <p className="footer-tagline">Scheduling automation for everyone</p>
                </div>
                <div className="footer-columns">
                    <div className="footer-col"><h4>Product</h4><Link to="/">Home</Link><Link to="/login">Log In</Link><Link to="/register">Sign Up</Link></div>
                    <div className="footer-col"><h4>Solutions</h4><span>Sales</span><span>Recruiting</span><span>Education</span></div>
                    <div className="footer-col"><h4>Resources</h4><span>Help Center</span><span>API Docs</span><span>Blog</span></div>
                </div>
                <div className="footer-bottom">&copy; {new Date().getFullYear()} Calendly Clone. All rights reserved.</div>
            </div>
        </footer>
    );
}