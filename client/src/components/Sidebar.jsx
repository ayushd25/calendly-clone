import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiHome, FiClock, FiCalendar, FiUser, FiPlus, FiMenu } from 'react-icons/fi';
import { useState, useEffect } from 'react';

export default function Sidebar() {
    const { user, logout } = useAuth();
    const location = useLocation();
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => { setMobileOpen(false); }, [location]);

    const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

    if (!user) return null;

    const items = [
        { path: '/dashboard', icon: <FiHome />, label: 'Home' },
        { path: '/event-types', icon: <FiClock />, label: 'Event Types' },
        { path: '/bookings', icon: <FiCalendar />, label: 'Meetings' },
    ];

    return (
        <>
            <div className="mobile-topbar">
                <div className="mobile-topbar-left">
                    <button onClick={() => setMobileOpen(true)}><FiMenu size={22} /></button>
                    <div className="mobile-topbar-logo">C</div>
                </div>
                <div className="sidebar-avatar" style={{ width: 30, height: 30, fontSize: 12 }}>
                    {user.name.charAt(0).toUpperCase()}
                </div>
            </div>

            <div className={`mobile-sidebar-overlay ${mobileOpen ? 'open' : ''}`} onClick={() => setMobileOpen(false)} />

            <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
                <div className="sidebar-logo">C</div>

                <nav className="sidebar-nav">
                    {items.map(item => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`sidebar-item ${isActive(item.path) ? 'active' : ''}`}
                        >
                            {item.icon}
                            <span className="sidebar-tooltip">{item.label}</span>
                        </Link>
                    ))}

                    <div className="sidebar-sep"></div>

                    <Link to="/event-types/new" className="sidebar-item" title="New Event">
                        <FiPlus />
                        <span className="sidebar-tooltip">New Event Type</span>
                    </Link>
                </nav>

                <div className="sidebar-bottom">
                    <Link to="/profile" className="sidebar-item" title="Settings">
                        <FiUser />
                        <span className="sidebar-tooltip">Settings</span>
                    </Link>
                    <div className="sidebar-avatar">{user.name.charAt(0).toUpperCase()}</div>
                </div>
            </aside>
        </>
    );
}