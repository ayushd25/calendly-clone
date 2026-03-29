import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { FiCalendar, FiFilter, FiX, FiRefreshCw } from 'react-icons/fi';
import { showToast } from '../utils/toast';

export default function MyBookings() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => { loadBookings(); }, [filter]);

    const loadBookings = async () => {
        setLoading(true);
        try {
            const params = filter !== 'all' ? { type: filter } : {};
            const res = await API.get('/bookings', { params });
            setBookings(res.data);
        } catch (error) { showToast('Failed to load bookings', 'error'); }
        finally { setLoading(false); }
    };

    const cancelBooking = async (id) => {
        if (!window.confirm('Cancel this booking?')) return;
        try { await API.put(`/bookings/${id}/status`, { status: 'cancelled' }); showToast('Booking cancelled'); loadBookings(); }
        catch (error) { showToast(error.response?.data?.message || 'Failed', 'error'); }
    };

    const rescheduleBooking = (booking) => {
        const slug = booking.eventTypeId?.slug;
        if (slug) {
            navigate(`/u/${user.username}/${slug}?reschedule=${booking.id}`);
        } else {
            navigate(`/book/${booking.eventTypeId}?reschedule=${booking.id}`);
        }
    };

    const formatDate = (ds) => new Date(ds + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    const formatTime12 = (ts) => { const [h, m] = ts.split(':').map(Number); return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`; };

    if (loading) return <div className="page-loading"><div className="spinner"></div></div>;

    return (
        <div className="bookings-page">
            <div className="bookings-header"><div><h1>My Bookings</h1><p>Manage all your scheduled meetings</p></div></div>
            <div className="bookings-filters">
                <FiFilter />
                {['all', 'upcoming', 'past'].map(f => (
                    <button key={f} className={`filter-btn ${filter === f ? 'filter-btn-active' : ''}`} onClick={() => setFilter(f)}>{f.charAt(0).toUpperCase() + f.slice(1)}</button>
                ))}
            </div>
            {bookings.length === 0 ? (
                <div className="empty-state"><FiCalendar size={48} /><h3>No bookings found</h3><p>{filter === 'all' ? 'You have no bookings yet' : `No ${filter} bookings`}</p></div>
            ) : (
                <div className="bookings-list">
                    {bookings.map(booking => (
                        <div key={booking._id || booking.id} className={`booking-card ${booking.status === 'cancelled' ? 'booking-card-cancelled' : ''}`}>
                            <div className="booking-card-color" style={{ background: booking.eventTypeId?.color || '#0D9488' }}></div>
                            <div className="booking-card-body">
                                <div className="booking-card-top">
                                    <h3>{booking.eventTypeId?.title || 'Meeting'}</h3>
                                    <span className={`status-badge status-${booking.status}`}>{booking.status}</span>
                                </div>
                                <div className="booking-card-info">
                                    <div className="booking-info-row"><span className="info-label">Date & Time</span><span className="info-value">{formatDate(booking.date)} at {formatTime12(booking.time)}</span></div>
                                    <div className="booking-info-row"><span className="info-label">Duration</span><span className="info-value">{booking.duration} minutes</span></div>
                                    <div className="booking-info-row"><span className="info-label">Location</span><span className="info-value">{booking.eventTypeId?.location || 'Online'}</span></div>
                                    <div className="booking-info-row"><span className="info-label">Guest</span><span className="info-value">{booking.guestName} ({booking.guestEmail})</span></div>
                                    {booking.notes && <div className="booking-info-row"><span className="info-label">Notes</span><span className="info-value">{booking.notes}</span></div>}
                                    {booking.customAnswers && Object.keys(booking.customAnswers).length > 0 && (
                                        <div className="booking-info-row"><span className="info-label">Custom Answers</span>
                                            <span className="info-value">{Object.entries(booking.customAnswers).map(([k, v]) => v).join(', ')}</span>
                                        </div>
                                    )}
                                </div>
                                {booking.status !== 'cancelled' && (
                                    <div className="booking-card-actions">
                                        <button className="btn btn-ghost btn-sm" onClick={() => rescheduleBooking(booking)}><FiRefreshCw /> Reschedule</button>
                                        <button className="btn btn-ghost btn-sm btn-danger-text" onClick={() => cancelBooking(booking.id)}><FiX /> Cancel</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}