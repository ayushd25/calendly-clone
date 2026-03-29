import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import API from '../utils/api';
import { FiArrowLeft, FiSave, FiPlus, FiTrash2 } from 'react-icons/fi';
import { showToast } from '../utils/toast';

const COLORS = ['#0D9488', '#0EA5E9', '#8B5CF6', '#EC4899', '#F59E0B', '#EF4444', '#10B981', '#6366F1'];
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const TIMEZONES = [
    'Asia/Kolkata', 'Asia/Tokyo', 'Asia/Shanghai', 'Asia/Singapore', 'Asia/Dubai',
    'Asia/Seoul', 'Asia/Bangkok', 'Asia/Karachi',
    'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Europe/Moscow', 'Europe/Rome',
    'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
    'America/Sao_Paulo', 'America/Toronto',
    'Australia/Sydney', 'Pacific/Auckland', 'UTC'
];
const QUESTION_TYPES = [
    { value: 'text', label: 'Short Text' },
    { value: 'textarea', label: 'Long Text' },
    { value: 'select', label: 'Dropdown' }
];

function generateSlug(title) {
    return title.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/[\s_]+/g, '-').replace(/^-+|-+$/g, '').substring(0, 50);
}

export default function CreateEventType() {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditing = !!id;

    const [form, setForm] = useState({
        title: '', slug: '', description: '', duration: 30,
        location: 'Online Meeting', color: '#0D9488',
        availableDays: [1, 2, 3, 4, 5], startTime: '09:00', endTime: '17:00',
        timezone: 'Asia/Kolkata', bufferBefore: 0, bufferAfter: 0,
        customQuestions: [], dateOverrides: {}, isActive: true
    });
    const [loading, setLoading] = useState(false);
    const [fetchLoading, setFetchLoading] = useState(isEditing);

    useEffect(() => { if (isEditing) loadEventType(); }, [id]);

    const loadEventType = async () => {
        try {
            const res = await API.get(`/event-types/${id}`);
            const et = res.data;
            setForm({
                title: et.title || '', slug: et.slug || '', description: et.description || '',
                duration: et.duration || 30, location: et.location || 'Online Meeting',
                color: et.color || '#0D9488', availableDays: et.availableDays || [1, 2, 3, 4, 5],
                startTime: et.startTime || '09:00', endTime: et.endTime || '17:00',
                timezone: et.timezone || 'Asia/Kolkata',
                bufferBefore: et.bufferBefore || 0, bufferAfter: et.bufferAfter || 0,
                customQuestions: et.customQuestions || [], dateOverrides: et.dateOverrides || {},
                isActive: et.isActive !== false
            });
        } catch (error) {
            showToast('Failed to load event type', 'error');
            navigate('/event-types');
        } finally { setFetchLoading(false); }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
        if (name === 'title' && !isEditing) {
            setForm(prev => ({ ...prev, slug: generateSlug(value) }));
        }
    };

    const toggleDay = (day) => {
        setForm(prev => {
            const days = prev.availableDays.includes(day) ? prev.availableDays.filter(d => d !== day) : [...prev.availableDays, day];
            return { ...prev, availableDays: days.sort() };
        });
    };

    const addQuestion = () => {
        const q = { id: `q${Date.now()}`, label: '', type: 'text', required: false, options: [] };
        setForm(prev => ({ ...prev, customQuestions: [...prev.customQuestions, q] }));
    };

    const updateQuestion = (qId, field, value) => {
        setForm(prev => ({
            ...prev,
            customQuestions: prev.customQuestions.map(q => q.id === qId ? { ...q, [field]: value } : q)
        }));
    };

    const removeQuestion = (qId) => {
        setForm(prev => ({ ...prev, customQuestions: prev.customQuestions.filter(q => q.id !== qId) }));
    };

    const addDateOverride = () => {
        const date = prompt('Enter date (YYYY-MM-DD):');
        if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) { showToast('Invalid date format', 'error'); return; }
        setForm(prev => ({
            ...prev,
            dateOverrides: { ...prev.dateOverrides, [date]: { available: false, startTime: '', endTime: '' } }
        }));
    };

    const updateDateOverride = (date, field, value) => {
        setForm(prev => ({
            ...prev,
            dateOverrides: {
                ...prev.dateOverrides,
                [date]: { ...prev.dateOverrides[date], [field]: value }
            }
        }));
    };

    const removeDateOverride = (date) => {
        setForm(prev => {
            const overrides = { ...prev.dateOverrides };
            delete overrides[date];
            return { ...prev, dateOverrides: overrides };
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.title.trim()) return showToast('Title is required', 'error');
        if (!form.slug.trim()) return showToast('Slug is required', 'error');
        if (form.availableDays.length === 0) return showToast('Select at least one day', 'error');
        if (form.startTime >= form.endTime) return showToast('End time must be after start time', 'error');
        setLoading(true);
        try {
            if (isEditing) {
                await API.put(`/event-types/${id}`, form);
                showToast('Event type updated!');
            } else {
                await API.post('/event-types', form);
                showToast('Event type created!');
            }
            navigate('/event-types');
        } catch (error) { showToast(error.response?.data?.message || 'Failed to save', 'error'); }
        finally { setLoading(false); }
    };

    if (fetchLoading) return <div className="page-loading"><div className="spinner"></div></div>;

    return (
        <div className="et-form-page">
            <button className="back-btn" onClick={() => navigate('/event-types')}><FiArrowLeft /> Back to Event Types</button>
            <div className="et-form-header">
                <h1>{isEditing ? 'Edit Event Type' : 'Create Event Type'}</h1>
                <p>{isEditing ? 'Update your meeting type settings' : 'Set up a new meeting type for booking'}</p>
            </div>

            <form onSubmit={handleSubmit} className="et-form">
                <div className="et-form-grid">
                    <div className="et-form-left">
                        <div className="form-card">
                            <h3>Basic Details</h3>
                            <div className="form-group">
                                <label>Title *</label>
                                <input type="text" name="title" placeholder="e.g. Quick Chat, Strategy Call" value={form.title} onChange={handleChange} />
                            </div>
                            <div className="form-group">
                                <label>URL Slug *</label>
                                <div className="slug-input">
                                    <span className="slug-prefix">{window.location.origin}/u/{JSON.parse(localStorage.getItem('user') || '{}').username || 'username'}/</span>
                                    <input type="text" name="slug" placeholder="quick-chat" value={form.slug} onChange={handleChange} />
                                </div>
                                <p className="form-hint">Unique identifier for your public booking link</p>
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <textarea name="description" placeholder="What is this meeting about?" value={form.description} onChange={handleChange} rows={3} />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Duration (minutes)</label>
                                    <select name="duration" value={form.duration} onChange={handleChange}>
                                        {[15, 20, 30, 45, 60, 90, 120].map(d => <option key={d} value={d}>{d} min</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Location</label>
                                    <input type="text" name="location" placeholder="Online Meeting" value={form.location} onChange={handleChange} />
                                </div>
                            </div>
                        </div>

                        <div className="form-card">
                            <h3>Availability</h3>
                            <div className="form-group">
                                <label>Available Days</label>
                                <div className="day-toggles">
                                    {DAY_LABELS.map((label, idx) => (
                                        <button key={idx} type="button" className={`day-toggle ${form.availableDays.includes(idx) ? 'day-toggle-active' : ''}`} onClick={() => toggleDay(idx)}>{label}</button>
                                    ))}
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group"><label>Start Time</label><input type="time" name="startTime" value={form.startTime} onChange={handleChange} /></div>
                                <div className="form-group"><label>End Time</label><input type="time" name="endTime" value={form.endTime} onChange={handleChange} /></div>
                            </div>
                            <div className="form-group">
                                <label>Timezone</label>
                                <select name="timezone" value={form.timezone} onChange={handleChange}>
                                    {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz.replace('_', ' ')}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="form-card">
                            <h3>Buffer Time</h3>
                            <p className="form-hint" style={{ marginBottom: '14px' }}>Add padding before/after meetings to prevent back-to-back scheduling</p>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Before (minutes)</label>
                                    <select name="bufferBefore" value={form.bufferBefore} onChange={handleChange}>
                                        {[0, 5, 10, 15, 20, 30].map(b => <option key={b} value={b}>{b} min</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>After (minutes)</label>
                                    <select name="bufferAfter" value={form.bufferAfter} onChange={handleChange}>
                                        {[0, 5, 10, 15, 20, 30].map(b => <option key={b} value={b}>{b} min</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="form-card">
                            <h3>Custom Questions</h3>
                            <p className="form-hint" style={{ marginBottom: '14px' }}>Ask invitees additional questions when they book</p>
                            {form.customQuestions.map((q, idx) => (
                                <div key={q.id} className="question-block">
                                    <div className="question-header">
                                        <span>Question {idx + 1}</span>
                                        <button type="button" className="btn-icon-danger" onClick={() => removeQuestion(q.id)}><FiTrash2 size={14} /></button>
                                    </div>
                                    <input type="text" placeholder="Question text" value={q.label} onChange={(e) => updateQuestion(q.id, 'label', e.target.value)} />
                                    <div className="form-row" style={{ marginTop: '8px' }}>
                                        <select value={q.type} onChange={(e) => updateQuestion(q.id, 'type', e.target.value)}>
                                            {QUESTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                        </select>
                                        <label className="checkbox-label" style={{ margin: 0 }}>
                                            <input type="checkbox" checked={q.required} onChange={(e) => updateQuestion(q.id, 'required', e.target.checked)} />
                                            <span>Required</span>
                                        </label>
                                    </div>
                                    {q.type === 'select' && (
                                        <input type="text" placeholder="Options (comma-separated)" value={q.options.join(', ')} onChange={(e) => updateQuestion(q.id, 'options', e.target.value.split(',').map(o => o.trim()).filter(Boolean))} style={{ marginTop: '8px' }} />
                                    )}
                                </div>
                            ))}
                            <button type="button" className="btn btn-outline btn-sm" onClick={addQuestion} style={{ marginTop: '12px' }}><FiPlus /> Add Question</button>
                        </div>

                        <div className="form-card">
                            <h3>Date-Specific Hours</h3>
                            <p className="form-hint" style={{ marginBottom: '14px' }}>Override availability for specific dates (holidays, half-days)</p>
                            {Object.entries(form.dateOverrides).map(([date, override]) => (
                                <div key={date} className="question-block">
                                    <div className="question-header">
                                        <strong>{date}</strong>
                                        <button type="button" className="btn-icon-danger" onClick={() => removeDateOverride(date)}><FiTrash2 size={14} /></button>
                                    </div>
                                    <label className="checkbox-label">
                                        <input type="checkbox" checked={override.available !== false} onChange={(e) => updateDateOverride(date, 'available', e.target.checked)} />
                                        <span>Available</span>
                                    </label>
                                    {override.available !== false && (
                                        <div className="form-row" style={{ marginTop: '8px' }}>
                                            <input type="time" value={override.startTime || ''} onChange={(e) => updateDateOverride(date, 'startTime', e.target.value)} placeholder="Start" />
                                            <input type="time" value={override.endTime || ''} onChange={(e) => updateDateOverride(date, 'endTime', e.target.value)} placeholder="End" />
                                        </div>
                                    )}
                                </div>
                            ))}
                            <button type="button" className="btn btn-outline btn-sm" onClick={addDateOverride} style={{ marginTop: '12px' }}><FiPlus /> Add Date Override</button>
                        </div>
                    </div>

                    <div className="et-form-right">
                        <div className="form-card">
                            <h3>Appearance</h3>
                            <div className="form-group">
                                <label>Color</label>
                                <div className="color-picker">
                                    {COLORS.map(c => (
                                        <button key={c} type="button" className={`color-swatch ${form.color === c ? 'color-swatch-active' : ''}`} style={{ background: c }} onClick={() => setForm(prev => ({ ...prev, color: c }))}>
                                            {form.color === c && <span className="color-check">&#10003;</span>}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            {isEditing && (
                                <div className="form-group">
                                    <label className="checkbox-label"><input type="checkbox" name="isActive" checked={form.isActive} onChange={handleChange} /><span>Active (visible on booking page)</span></label>
                                </div>
                            )}
                        </div>

                        <div className="form-card form-card-preview">
                            <h3>Preview</h3>
                            <div className="et-preview">
                                <div className="et-preview-color" style={{ background: form.color }}></div>
                                <h4>{form.title || 'Untitled Event'}</h4>
                                <p>{form.description || 'No description'}</p>
                                <div className="et-preview-meta">
                                    <span>{form.duration} min</span>
                                    <span>{form.location}</span>
                                    <span>{form.timezone}</span>
                                </div>
                                {(form.bufferBefore > 0 || form.bufferAfter > 0) && (
                                    <p className="et-preview-buffer">{form.bufferBefore}min before / {form.bufferAfter}min after buffer</p>
                                )}
                                <div className="et-preview-days">
                                    {form.availableDays.map(d => <span key={d} className="day-chip">{DAY_LABELS[d]}</span>)}
                                    {form.availableDays.length === 0 && <span className="text-muted">No days selected</span>}
                                </div>
                                <p className="et-preview-time">{form.startTime} – {form.endTime}</p>
                                {form.customQuestions.length > 0 && <p className="et-preview-questions">{form.customQuestions.length} custom question(s)</p>}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="et-form-actions">
                    <button type="button" className="btn btn-ghost" onClick={() => navigate('/event-types')}>Cancel</button>
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? <span className="btn-spinner"></span> : <><FiSave /> {isEditing ? 'Save Changes' : 'Create Event Type'}</>}
                    </button>
                </div>
            </form>
        </div>
    );
}