import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import API from '../utils/api';
import { FiCalendar, FiClock, FiUser, FiMapPin, FiArrowRight, FiGlobe } from 'react-icons/fi';

export default function UserProfile() {
    const { username } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => { loadProfile(); }, [username]);

    const loadProfile = async () => {
        try { const res = await API.get(`/event-types/user/${username}`); setData(res.data); }
        catch (e) { setData(null); } finally { setLoading(false); }
    };

    if (loading) return <div className="page-loading"><div className="spinner"></div></div>;
    if (!data) return <div className="page-loading"><FiUser size={48} /><h2 style={{ marginTop: '16px' }}>User not found</h2><p>The user "{username}" doesn't exist</p><Link to="/" className="btn btn-primary" style={{ marginTop: '16px' }}>Go Home</Link></div>;

    return (
        <div className="user-profile-page">
            <div className="up-header">
                <div className="up-avatar">{data.user.name.charAt(0).toUpperCase()}</div>
                <h1>{data.user.name}</h1>
                <p className="up-username">@{data.user.username}</p>
            </div>
            {data.eventTypes.length === 0 ? (
                <div className="empty-state"><FiCalendar size={48} /><h3>No available events</h3><p>This user hasn't set up any bookable events yet</p></div>
            ) : (
                <div className="up-events">
                    <h2>Available Events</h2>
                    <div className="up-events-grid">
                        {data.eventTypes.map(et => (
                            <Link to={`/u/${data.user.username}/${et.slug}`} key={et.id} className="up-event-card">
                                <div className="up-event-color" style={{ background: et.color }}></div>
                                <div className="up-event-body">
                                    <h3>{et.title}</h3>
                                    {et.description && <p>{et.description}</p>}
                                    <div className="up-event-meta">
                                        <span><FiClock /> {et.duration} min</span>
                                        <span><FiMapPin /> {et.location}</span>
                                    </div>
                                    <div className="up-event-slug"><FiGlobe size={12} /> {et.slug}</div>
                                </div>
                                <div className="up-event-arrow"><FiArrowRight /></div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}