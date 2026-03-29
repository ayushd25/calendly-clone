import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';
import { FiPlus, FiClock, FiCalendar, FiX, FiExternalLink, FiCopy, FiArrowUpRight, FiTrendingUp } from 'react-icons/fi';
import { showToast } from '../utils/toast';

export default function Dashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState({ total: 0, upcoming: 0, past: 0, cancelled: 0 });
    const [eventTypes, setEventTypes] = useState([]);
    const [upcomingBookings, setUpcomingBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try {
            const [s, e, b] = await Promise.all([API.get('/bookings/stats'), API.get('/event-types'), API.get('/bookings?type=upcoming')]);
            setStats(s.data); setEventTypes(e.data); setUpcomingBookings(b.data.slice(0, 5));
        } catch (err) { console.error(err); } finally { setLoading(false); }
    };

    const copyLink = (et) => {
        navigator.clipboard.writeText(`${window.location.origin}/u/${user.username}/${et.slug}`).then(() => showToast('Link copied!'));
    };

    const cancelBooking = async (id) => {
        if (!window.confirm('Cancel this booking?')) return;
        try { await API.put(`/bookings/${id}/status`, { status: 'cancelled' }); showToast('Cancelled'); loadData(); }
        catch (e) { showToast(e.response?.data?.message || 'Failed', 'error'); }
    };

    const formatTime12 = (ts) => { const [h, m] = ts.split(':').map(Number); return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`; };

    if (loading) return <div className="page-loading"><div className="spinner"></div></div>;

    return (
        <div className="app-page">
            <div className="page-top">
                <div>
                    <h1>Welcome, {user?.name?.split(' ')[0]}</h1>
                </div>
                <Link to="/event-types/new" className="btn btn-primary">
                    <FiPlus size={16} /> New meeting type
                </Link>
            </div>

            <div className="page-tabs">
                <button className="page-tab active">Overview</button>
            </div>

            <div className="page-body" style={{ paddingTop: 24 }}>
                <div className="stats-row">
                    <div className="stat-box">
                        <p className="stat-box-label">Total Bookings</p>
                        <p className="stat-box-value">{stats.total}</p>
                    </div>
                    <div className="stat-box">
                        <p className="stat-box-label">Upcoming</p>
                        <p className="stat-box-value">{stats.upcoming}</p>
                    </div>
                    <div className="stat-box">
                        <p className="stat-box-label">Past</p>
                        <p className="stat-box-value">{stats.past}</p>
                    </div>
                    <div className="stat-box">
                        <p className="stat-box-label">Cancelled</p>
                        <p className="stat-box-value">{stats.cancelled}</p>
                    </div>
                </div>

                <div className="dash-two-col">
                    <div className="dash-panel">
                        <div className="dash-panel-header">
                            <h2>Upcoming Meetings</h2>
                            <Link to="/bookings" className="dash-panel-link">View all <FiArrowUpRight size={12} /></Link>
                        </div>
                        {upcomingBookings.length === 0 ? (
                            <div className="empty-state-sm"><FiCalendar size={28} /><p>No upcoming meetings</p></div>
                        ) : (
                            upcomingBookings.map(b => (
                                <div key={b.id} className="booking-item">
                                    <div className="booking-item-bar" style={{ background: b.eventTypeId?.color || '#006BFF' }}></div>
                                    <div className="booking-item-info">
                                        <p className="booking-item-title">{b.eventTypeId?.title || 'Meeting'}</p>
                                        <p className="booking-item-meta">{b.date} at {formatTime12(b.time)} &middot; {b.guestName}</p>
                                    </div>
                                    {b.status !== 'cancelled' && <button className="btn-icon-danger" onClick={() => cancelBooking(b.id)}><FiX size={15} /></button>}
                                </div>
                            ))
                        )}
                    </div>

                    <div className="dash-panel">
                        <div className="dash-panel-header">
                            <h2>Your Meeting Types</h2>
                            <Link to="/event-types" className="dash-panel-link">Manage <FiArrowUpRight size={12} /></Link>
                        </div>
                        {eventTypes.length === 0 ? (
                            <div className="empty-state-sm"><FiClock size={28} /><p>No meeting types yet</p></div>
                        ) : (
                            eventTypes.map(et => (
                                <div key={et.id} className="et-item-dash">
                                    <div className="et-dot" style={{ background: et.color }}></div>
                                    <div className="et-item-dash-info">
                                        <p className="et-item-dash-title">{et.title}</p>
                                        <p className="et-item-dash-meta">{et.duration} min &middot; {et.bookingCount} bookings</p>
                                    </div>
                                    <div className="et-item-dash-actions">
                                        <button className="btn-icon" onClick={() => copyLink(et)}><FiCopy size={14} /></button>
                                        <button className="btn-icon" onClick={() => navigate(`/u/${user.username}/${et.slug}`)}><FiExternalLink size={14} /></button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="link-banner">
                    <div className="link-banner-info">
                        <h3>Your Booking Page</h3>
                        <p>Share this link to let people book time with you</p>
                    </div>
                    <div className="link-box">
                        <span className="link-url">{window.location.origin}/u/{user?.username}</span>
                        <button className="btn btn-primary btn-sm" onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/u/${user.username}`); showToast('Copied!'); }}>
                            <FiCopy size={14} /> Copy link
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}