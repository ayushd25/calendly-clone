import { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import API from '../utils/api';
import { FiCalendar, FiClock, FiMapPin, FiArrowLeft, FiArrowRight, FiCheck, FiChevronLeft, FiChevronRight, FiShield } from 'react-icons/fi';
import { showToast } from '../utils/toast';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_LABELS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function BookingPage() {
    const { id } = useParams();
    const { username, slug } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const rescheduleId = searchParams.get('reschedule');

    const isSlugRoute = !!username && !!slug;
    const isReschedule = !!rescheduleId;

    const [eventType, setEventType] = useState(null);
    const [bookedSlots, setBookedSlots] = useState([]);
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedTime, setSelectedTime] = useState('');
    const [availableSlots, setAvailableSlots] = useState([]);
    const [step, setStep] = useState(1);
    const [form, setForm] = useState({ guestName: '', guestEmail: '', notes: '', customAnswers: {} });
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [done, setDone] = useState(false);
    const [viewYear, setViewYear] = useState(new Date().getFullYear());
    const [viewMonth, setViewMonth] = useState(new Date().getMonth());

    useEffect(() => {
        if (isSlugRoute) {
            API.get(`/event-types/by-slug/${username}/${slug}`).then(res => setEventType(res.data)).catch(() => setEventType(null)).finally(() => setLoading(false));
        } else {
            API.get(`/event-types/${id}`).then(res => setEventType(res.data)).catch(() => setEventType(null)).finally(() => setLoading(false));
        }
        if (isReschedule) {
            API.get(`/bookings/${rescheduleId}`).then(res => {
                setForm(prev => ({ ...prev, guestName: res.data.guestName, guestEmail: res.data.guestEmail, notes: res.data.notes || '', customAnswers: res.data.customAnswers || {} }));
            }).catch(() => {});
        }
    }, [id, username, slug, rescheduleId]);

    useEffect(() => {
        if (!selectedDate || !eventType) return;
        const endpoint = isSlugRoute
            ? `/bookings/slots/slug/${username}/${slug}?date=${selectedDate}`
            : `/bookings/slots/${eventType.id}?date=${selectedDate}`;
        API.get(endpoint).then(res => setBookedSlots(res.data)).catch(() => setBookedSlots([]));
    }, [selectedDate, eventType]);

    useEffect(() => { if (!selectedDate || !eventType) return; generateSlots(); }, [bookedSlots, selectedDate, eventType]);

    const generateSlots = () => {
        if (!eventType) return;
        let startTime = eventType.startTime;
        let endTime = eventType.endTime;
        const override = eventType.dateOverrides?.[selectedDate];
        if (override) {
            if (override.available === false) { setAvailableSlots([]); return; }
            if (override.startTime) startTime = override.startTime;
            if (override.endTime) endTime = override.endTime;
        }
        const [startH, startM] = startTime.split(':').map(Number);
        const [endH, endM] = endTime.split(':').map(Number);
        const duration = eventType.duration;
        const bufBefore = eventType.bufferBefore || 0;
        const bufAfter = eventType.bufferAfter || 0;
        let startMin = startH * 60 + startM;
        const endMin = endH * 60 + endM;
        const slots = [];
        while (startMin + duration <= endMin) {
            const h = Math.floor(startMin / 60);
            const m = startMin % 60;
            const ts = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
            const slotEnd = startMin + duration;
            const effStart = startMin - bufBefore;
            const effEnd = slotEnd + bufAfter;
            const blocked = bookedSlots.some(b => {
                const [bH, bM] = b.time.split(':').map(Number);
                const bS = bH * 60 + bM;
                return effStart < bS + b.duration && effEnd > bS;
            });
            const slotDate = new Date(selectedDate + 'T' + ts);
            const isPast = slotDate < new Date();
            if (!blocked && !isPast) slots.push(ts);
            startMin += 30;
        }
        setAvailableSlots(slots);
    };

    const getMonthGrid = () => {
        if (!eventType) return [];
        const firstDay = new Date(viewYear, viewMonth, 1);
        const lastDay = new Date(viewYear, viewMonth + 1, 0);
        const startDow = firstDay.getDay();
        const daysInMonth = lastDay.getDate();
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const grid = [];
        for (let i = 0; i < startDow; i++) grid.push(null);
        for (let d = 1; d <= daysInMonth; d++) {
            const date = new Date(viewYear, viewMonth, d);
            const dow = date.getDay();
            const ds = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const isPast = date < today;
            const override = eventType.dateOverrides?.[ds];
            let isAvail = eventType.availableDays?.includes(dow) && !isPast;
            if (override) isAvail = override.available === false ? false : !isPast;
            grid.push({ day: d, date: ds, isAvailable: isAvail, isPast, isSelected: ds === selectedDate });
        }
        return grid;
    };

    const goToPrev = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); } else setViewMonth(viewMonth - 1); };
    const goToNext = () => { if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); } else setViewMonth(viewMonth + 1); };

    const formatDate = (ds) => { const d = new Date(ds + 'T00:00:00'); return `${DAY_LABELS[d.getDay()]}, ${MONTH_LABELS[d.getMonth()]} ${d.getDate()}`; };
    const formatTime12 = (ts) => { const [h, m] = ts.split(':').map(Number); return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`; };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.guestName.trim() || !form.guestEmail.trim()) return showToast('Please fill in name and email', 'error');
        // Validate required custom questions
        if (eventType.customQuestions) {
            for (const q of eventType.customQuestions) {
                if (q.required && !form.customAnswers[q.id]?.trim()) return showToast(`"${q.label}" is required`, 'error');
            }
        }
        setSubmitting(true);
        try {
            if (isReschedule) {
                await API.put(`/bookings/${rescheduleId}/reschedule`, { date: selectedDate, time: selectedTime, guestName: form.guestName, guestEmail: form.guestEmail });
            } else {
                await API.post('/bookings', { eventTypeId: eventType.id, guestName: form.guestName, guestEmail: form.guestEmail, date: selectedDate, time: selectedTime, notes: form.notes, customAnswers: form.customAnswers });
            }
            setDone(true);
            showToast(isReschedule ? 'Meeting rescheduled!' : 'Booking confirmed!');
        } catch (error) { showToast(error.response?.data?.message || 'Failed', 'error'); }
        finally { setSubmitting(false); }
    };

    if (loading) return <div className="page-loading"><div className="spinner"></div></div>;
    if (!eventType) return <div className="page-loading"><p>Event type not found</p><Link to="/" className="btn btn-primary" style={{ marginTop: '16px' }}>Go Home</Link></div>;

    if (done) {
        return (
            <div className="booking-page">
                <div className="booking-confirmed">
                    <div className="confirmed-icon"><FiCheck /></div>
                    <h1>{isReschedule ? 'Meeting Rescheduled' : 'Booking Confirmed'}</h1>
                    <div className="confirmed-details">
                        <p><strong>{eventType.title}</strong></p>
                        <p>{formatDate(selectedDate)} at {formatTime12(selectedTime)}</p>
                        <p>{eventType.duration} min &middot; {eventType.location}</p>
                        {eventType.timezone && <p className="confirmed-tz">Timezone: {eventType.timezone.replace('_', ' ')}</p>}
                    </div>
                    <div className="confirmed-guest"><p><strong>Guest:</strong> {form.guestName} ({form.guestEmail})</p></div>
                    <button className="btn btn-primary" style={{ marginTop: '24px' }} onClick={() => navigate('/')}>Done</button>
                </div>
            </div>
        );
    }

    const grid = getMonthGrid();

    return (
        <div className="booking-page">
            <div className="booking-layout">
                <div className="booking-left">
                    <div className="booking-event-info">
                        <div className="booking-event-color" style={{ background: eventType.color }}></div>
                        <h1>{eventType.title}</h1>
                        {eventType.description && <p className="booking-event-desc">{eventType.description}</p>}
                        <div className="booking-event-meta">
                            <span><FiClock /> {eventType.duration} min</span>
                            <span><FiMapPin /> {eventType.location}</span>
                        </div>
                        {(eventType.bufferBefore > 0 || eventType.bufferAfter > 0) && (
                            <div className="booking-buffer-info"><FiShield /> {eventType.bufferBefore}min before / {eventType.bufferAfter}min after buffer</div>
                        )}
                        {eventType.timezone && <p className="booking-tz-label"><FiClock /> Times shown in {eventType.timezone.replace('_', ' ')}</p>}
                        <div className="booking-event-host">
                            <div className="host-avatar">{(eventType.userId?.name || 'U').charAt(0).toUpperCase()}</div>
                            <div><p className="host-name">{eventType.userId?.name || 'Host'}</p><p className="host-label">Host</p></div>
                        </div>
                        <div className="booking-event-days">
                            <p className="days-label">Available on:</p>
                            <div className="day-chips-wrap">{eventType.availableDays.map(d => <span key={d} className="day-chip">{DAY_LABELS[d]}</span>)}</div>
                            <p className="time-range">{eventType.startTime} – {eventType.endTime}</p>
                        </div>
                    </div>
                </div>

                <div className="booking-right">
                    {step === 1 && (
                        <div className="booking-step">
                            <div className="step-indicator"><span className="step-dot step-dot-active"></span><span className="step-dot"></span></div>
                            <h2>{isReschedule ? 'Reschedule — Select new date & time' : 'Select a date & time'}</h2>

                            {/* Month Calendar */}
                            <div className="month-calendar">
                                <div className="cal-header">
                                    <button type="button" className="cal-nav" onClick={goToPrev}><FiChevronLeft /></button>
                                    <span className="cal-title">{MONTH_LABELS[viewMonth]} {viewYear}</span>
                                    <button type="button" className="cal-nav" onClick={goToNext}><FiChevronRight /></button>
                                </div>
                                <div className="cal-weekdays">{DAY_LABELS.map(d => <span key={d} className="cal-wd">{d}</span>)}</div>
                                <div className="cal-grid">
                                    {grid.map((cell, i) => (
                                        cell === null
                                            ? <div key={`e${i}`} className="cal-cell cal-empty"></div>
                                            : <button key={cell.date} type="button" className={`cal-cell ${cell.isPast ? 'cal-past' : ''} ${cell.isAvailable ? 'cal-available' : 'cal-unavailable'} ${cell.isSelected ? 'cal-selected' : ''}`} onClick={() => cell.isAvailable && setSelectedDate(cell.date)} disabled={!cell.isAvailable}>{cell.day}</button>
                                    ))}
                                </div>
                            </div>

                            {selectedDate && (
                                <div className="time-picker">
                                    <h3>{formatDate(selectedDate)}</h3>
                                    {availableSlots.length === 0 ? <p className="no-slots">No available time slots for this date</p> : (
                                        <div className="time-grid">{availableSlots.map(time => <button key={time} className={`time-cell ${selectedTime === time ? 'time-selected' : ''}`} onClick={() => setSelectedTime(time)}>{formatTime12(time)}</button>)}</div>
                                    )}
                                </div>
                            )}

                            {selectedTime && <button className="btn btn-primary btn-full" onClick={() => setStep(2)} style={{ marginTop: '20px' }}>Next <FiArrowRight /></button>}
                        </div>
                    )}

                    {step === 2 && (
                        <div className="booking-step">
                            <div className="step-indicator"><span className="step-dot step-dot-done"></span><span className="step-dot step-dot-active"></span></div>
                            <h2>Enter your details</h2>
                            <div className="selected-summary">
                                <p><strong>{eventType.title}</strong></p>
                                <p>{formatDate(selectedDate)} at {formatTime12(selectedTime)}</p>
                                <p>{eventType.duration} min &middot; {eventType.location}</p>
                            </div>
                            <form onSubmit={handleSubmit} className="booking-form">
                                <div className="form-group"><label>Name *</label><input type="text" placeholder="Your full name" value={form.guestName} onChange={e => setForm(p => ({ ...p, guestName: e.target.value }))} required /></div>
                                <div className="form-group"><label>Email *</label><input type="email" placeholder="you@example.com" value={form.guestEmail} onChange={e => setForm(p => ({ ...p, guestEmail: e.target.value }))} required /></div>
                                <div className="form-group"><label>Notes (optional)</label><textarea placeholder="Anything the host should know?" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={3} /></div>
                                {eventType.customQuestions?.map(q => (
                                    <div key={q.id} className="form-group">
                                        <label>{q.label} {q.required && <span style={{ color: 'var(--danger)' }}>*</span>}</label>
                                        {q.type === 'textarea' ? (
                                            <textarea placeholder={q.label} value={form.customAnswers[q.id] || ''} onChange={e => setForm(p => ({ ...p, customAnswers: { ...p.customAnswers, [q.id]: e.target.value } }))} rows={2} required={q.required} />
                                        ) : q.type === 'select' ? (
                                            <select value={form.customAnswers[q.id] || ''} onChange={e => setForm(p => ({ ...p, customAnswers: { ...p.customAnswers, [q.id]: e.target.value } }))} required={q.required}>
                                                <option value="">Select...</option>
                                                {q.options?.map((o, i) => <option key={i} value={o}>{o}</option>)}
                                            </select>
                                        ) : (
                                            <input type="text" placeholder={q.label} value={form.customAnswers[q.id] || ''} onChange={e => setForm(p => ({ ...p, customAnswers: { ...p.customAnswers, [q.id]: e.target.value } }))} required={q.required} />
                                        )}
                                    </div>
                                ))}
                                <div className="booking-form-actions">
                                    <button type="button" className="btn btn-ghost" onClick={() => setStep(1)}><FiArrowLeft /> Back</button>
                                    <button type="submit" className="btn btn-primary" disabled={submitting}>
                                        {submitting ? <span className="btn-spinner"></span> : isReschedule ? 'Confirm Reschedule' : 'Confirm Booking'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}