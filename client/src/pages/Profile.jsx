import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';
import { FiUser, FiMail, FiAtSign, FiSave } from 'react-icons/fi';
import { showToast } from '../utils/toast';

export default function Profile() {
    const { user, updateUser } = useAuth();
    const [form, setForm] = useState({
        name: user?.name || '',
        email: user?.email || '',
        username: user?.username || ''
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name.trim() || !form.email.trim() || !form.username.trim()) {
            showToast('All fields are required', 'error');
            return;
        }
        if (!/^[a-zA-Z0-9_]+$/.test(form.username)) {
            showToast('Username can only contain letters, numbers, and underscores', 'error');
            return;
        }
        setLoading(true);
        try {
            const res = await API.put('/auth/profile', {
                name: form.name.trim(),
                email: form.email.trim(),
                username: form.username.toLowerCase().trim()
            });
            updateUser(res.data.user);
            showToast('Profile updated!');
        } catch (error) {
            showToast(error.response?.data?.message || 'Failed to update', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="profile-page">
            <div className="profile-header">
                <h1>Profile Settings</h1>
                <p>Manage your account information</p>
            </div>

            <div className="profile-avatar-section">
                <div className="profile-avatar-large">
                    {user?.name?.charAt(0).toUpperCase()}
                </div>
                <h2>{user?.name}</h2>
                <p className="profile-username">@{user?.username}</p>
            </div>

            <form onSubmit={handleSubmit} className="profile-form">
                <div className="form-card">
                    <h3>Account Information</h3>
                    <div className="form-group">
                        <label>Full Name</label>
                        <div className="input-wrapper">
                            <FiUser className="input-icon" />
                            <input
                                type="text"
                                name="name"
                                value={form.name}
                                onChange={handleChange}
                            />
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Email</label>
                        <div className="input-wrapper">
                            <FiMail className="input-icon" />
                            <input
                                type="email"
                                name="email"
                                value={form.email}
                                onChange={handleChange}
                            />
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Username</label>
                        <div className="input-wrapper">
                            <FiAtSign className="input-icon" />
                            <input
                                type="text"
                                name="username"
                                value={form.username}
                                onChange={handleChange}
                            />
                        </div>
                        <p className="form-hint">Your booking page: {window.location.origin}/u/{form.username}</p>
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? <span className="btn-spinner"></span> : <><FiSave /> Save Changes</>}
                    </button>
                </div>
            </form>
        </div>
    );
}