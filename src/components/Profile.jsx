import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
    const { user } = useAuth();
    const [passwords, setPasswords] = useState({
        current: '',
        new: '',
        confirm: ''
    });
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (passwords.new !== passwords.confirm) {
            setMessage("New passwords don't match");
            return;
        }

        try {
            const response = await fetch('http://localhost:8000/api/change-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${btoa(`${user.username}:${passwords.current}`)}`
                },
                body: JSON.stringify({
                    current_password: passwords.current,
                    new_password: passwords.new
                })
            });

            if (response.ok) {
                setMessage('Password changed successfully!');
                setPasswords({ current: '', new: '', confirm: '' });
            } else {
                const error = await response.json();
                setMessage(error.detail || 'Password change failed');
            }
        } catch (err) {
            setMessage('Failed to connect to server');
        }
    };

    return (
        <div className="profile-page">
            <h2>Profile Management</h2>
            <div className="profile-section">
                <div className="user-info">
                    <h3>Account Details</h3>
                    <p>Username: {user?.username}</p>
                    <p>Role: <span className="role-tag">{user?.role}</span></p>
                </div>

                <div className="password-change">
                    <h3>Change Password</h3>
                    <form onSubmit={handleSubmit}>
                        <input
                            type="password"
                            placeholder="Current Password"
                            value={passwords.current}
                            onChange={(e) => setPasswords({...passwords, current: e.target.value})}
                        />
                        <input
                            type="password"
                            placeholder="New Password"
                            value={passwords.new}
                            onChange={(e) => setPasswords({...passwords, new: e.target.value})}
                        />
                        <input
                            type="password"
                            placeholder="Confirm New Password"
                            value={passwords.confirm}
                            onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
                        />
                        <button type="submit">Update Password</button>
                    </form>
                    {message && <div className="message">{message}</div>}
                </div>
            </div>
        </div>
    );
}