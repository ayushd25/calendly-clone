import { Link } from 'react-router-dom';
import { FiCalendar } from 'react-icons/fi';

export default function Topbar() {
    return (
        <div className="topbar">
            <Link to="/" className="topbar-brand">
                <FiCalendar />
                Calendly
            </Link>
            <div className="topbar-right">
                <Link to="/login" className="btn btn-ghost btn-sm">Log in</Link>
                <Link to="/register" className="btn btn-primary btn-sm">Sign up free</Link>
            </div>
        </div>
    );
}