import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';
import { FiPlus, FiEdit2, FiTrash2, FiExternalLink, FiCopy, FiCheck, FiClock, FiMapPin, FiMoreHorizontal, FiSearch } from 'react-icons/fi';
import { showToast } from '../utils/toast';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function formatAmPm(time) {
    if (!time) return '';
    const [h, m] = time.split(':').map(Number);
    const suffix = h >= 12 ? 'pm' : 'am';
    const h12 = h % 12 || 12;
    return `${h12}${m > 0 ? ':' + String(m).padStart(2, '0') : ''} ${suffix}`;
}

export default function EventTypes() {
    const { user } = useAuth();
    const [eventTypes, setEventTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [openMenuId, setOpenMenuId] = useState(null);
    const [copiedId, setCopiedId] = useState(null);
    const menuRef = useRef(null);

    useEffect(() => { loadEventTypes(); }, []);

    useEffect(() => {
        function handleClick(e) {
            if (menuRef.current && !menuRef.current.contains(e.target)) setOpenMenuId(null);
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const loadEventTypes = async () => {
        try { const res = await API.get('/event-types'); setEventTypes(res.data); }
        catch (e) { showToast('Failed to load', 'error'); }
        finally { setLoading(false); }
    };

    const deleteEventType = async (id) => {
        setOpenMenuId(null);
        if (!window.confirm('Delete this event type? All associated bookings will also be deleted.')) return;
        try { await API.delete(`/event-types/${id}`); showToast('Event type deleted'); loadEventTypes(); }
        catch (e) { showToast(e.response?.data?.message || 'Failed', 'error'); }
    };

    const copyLink = async (et) => {
        const link = `${window.location.origin}/u/${user.username}/${et.slug}`;
        try {
            await navigator.clipboard.writeText(link);
            setCopiedId(et.id);
            showToast('Link copied to clipboard');
            setTimeout(() => setCopiedId(null), 2000);
        } catch (e) { showToast('Failed to copy', 'error'); }
    };

    const filtered = eventTypes.filter(et =>
        et.title.toLowerCase().includes(search.toLowerCase()) ||
        (et.description || '').toLowerCase().includes(search.toLowerCase())
    );

    if (loading) return <div className="page-loading"><div className="spinner"></div></div>;

    return (
        <div className="app-page">
            {/* Page Top — Title + Create button */}
            <div className="page-top">
                <h1>Scheduling</h1>
                <Link to="/event-types/new" className="btn btn-primary">
                    <FiPlus size={16} /> Create
                </Link>
            </div>

            {/* Tabs */}
            <div className="page-tabs">
                <button className="page-tab active">Event types</button>
            </div>

            {/* Toolbar — Search */}
            <div className="page-toolbar">
                <div className="search-box">
                    <FiSearch />
                    <input
                        type="text"
                        placeholder="Search event types..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Body — Event Type Cards */}
            <div className="page-body">
                {filtered.length === 0 ? (
                    search ? (
                        <div className="empty-state">
                            <FiSearch size={40} />
                            <h3>No results found</h3>
                            <p>Try a different search term</p>
                        </div>
                    ) : (
                        <div className="empty-state">
                            <FiClock size={40} />
                            <h3>No meeting types yet</h3>
                            <p>Create your first meeting type to let people book time with you.</p>
                            <Link to="/event-types/new" className="btn btn-primary"><FiPlus /> Create meeting type</Link>
                        </div>
                    )
                ) : (
                    <div className="et-list">
                        {filtered.map(et => (
                            <div key={et.id} className={`et-card-cal ${!et.isActive ? 'et-card-cal-inactive' : ''}`}>
                                <div className="et-card-bar" style={{ background: et.color || '#006BFF' }}></div>

                                <div className="et-card-cal-body">
                                    <div className="et-card-cal-top">
                                        <h3>{et.title}</h3>
                                        <span className="et-tag-pill">
                                            <FiClock size={11} /> {et.duration} min
                                        </span>
                                    </div>

                                    <div className="et-card-cal-tags">
                                        <span className="et-tag">
                                            <FiMapPin size={12} /> {et.location || 'Online Meeting'}
                                        </span>
                                        {et.availableDays && et.availableDays.length > 0 && (
                                            <span className="et-tag">
                                                {et.availableDays.length === 5 && et.availableDays.every(d => d >= 1 && d <= 5)
                                                    ? 'Weekdays'
                                                    : et.availableDays.map(d => DAY_NAMES[d]).join(', ')}
                                                , {formatAmPm(et.startTime)} - {formatAmPm(et.endTime)}
                                            </span>
                                        )}
                                    </div>

                                    <div className="et-card-cal-url">
                                        {window.location.origin}/u/{user.username}/{et.slug}
                                    </div>
                                </div>

                                <div className="et-card-cal-right" ref={openMenuId === et.id ? menuRef : null} style={{ position: 'relative' }}>
                                    <button
                                        className={`btn-copy-text ${copiedId === et.id ? 'copied' : ''}`}
                                        onClick={() => copyLink(et)}
                                    >
                                        {copiedId === et.id ? <FiCheck size={14} /> : <FiCopy size={14} />}
                                        {copiedId === et.id ? 'Copied' : 'Copy link'}
                                    </button>

                                    <div style={{ position: 'relative' }}>
                                        <button
                                            className="btn-icon"
                                            onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === et.id ? null : et.id); }}
                                        >
                                            <FiMoreHorizontal size={16} />
                                        </button>
                                        {openMenuId === et.id && (
                                            <div className="et-dropdown">
                                                <Link to={`/u/${user.username}/${et.slug}`} target="_blank" className="et-dropdown-item">
                                                    <FiExternalLink size={14} /> Preview
                                                </Link>
                                                <Link to={`/event-types/${et.id}/edit`} className="et-dropdown-item">
                                                    <FiEdit2 size={14} /> Edit
                                                </Link>
                                                <div className="et-dropdown-sep"></div>
                                                <button onClick={() => deleteEventType(et.id)} className="et-dropdown-item danger">
                                                    <FiTrash2 size={14} /> Delete
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}