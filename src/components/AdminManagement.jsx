import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function AdminManagement() {
    const { user } = useAuth();
    const [admins, setAdmins] = useState([]);
    const [newAdmin, setNewAdmin] = useState({ username: '', password: '' });
    const [error, setError] = useState('');

    useEffect(() => {
        if (user?.role === 'superadmin') {
            fetchAdmins();
        }
    }, [user]);

    const fetchAdmins = async () => {
        try {
            const response = await fetch('http://localhost:8000/api/admins', {
                headers: {
                    'Authorization': `Basic ${btoa(`${user.username}:${localStorage.getItem('password')}`)}`
                }
            });
            const data = await response.json();
            setAdmins(data.filter(a => a.role === 'admin'));
        } catch (err) {
            setError('Failed to fetch admins');
        }
    };

    const createAdmin = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('http://localhost:8000/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${btoa(`${user.username}:${localStorage.getItem('password')}`)}`
                },
                body: JSON.stringify(newAdmin)
            });

            if (response.ok) {
                setNewAdmin({ username: '', password: '' });
                fetchAdmins();
                setError('');
            } else {
                const errorData = await response.json();
                setError(errorData.detail || 'Failed to create admin');
            }
        } catch (err) {
            setError('Failed to connect to server');
        }
    };

    const deleteAdmin = async (username) => {
        try {
            await fetch(`http://localhost:8000/api/admins/${username}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Basic ${btoa(`${user.username}:${localStorage.getItem('password')}`)}`
                }
            });
            fetchAdmins();
        } catch (err) {
            setError('Failed to delete admin');
        }
    };

    if (user?.role !== 'superadmin') return null;

    return (
        <div className="admin-management">
            <h2>Admin Management</h2>
            {error && <div className="error-message">{error}</div>}

            <form onSubmit={createAdmin} className="admin-form">
                <input
                    type="text"
                    placeholder="Username"
                    value={newAdmin.username}
                    onChange={(e) => setNewAdmin({...newAdmin, username: e.target.value})}
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={newAdmin.password}
                    onChange={(e) => setNewAdmin({...newAdmin, password: e.target.value})}
                />
                <button type="submit">Create Admin</button>
            </form>

            <div className="admin-list">
                <h3>Existing Admins</h3>
                {admins.map(admin => (
                    <div key={admin.username} className="admin-item">
                        <span>{admin.username}</span>
                        <button 
                            onClick={() => deleteAdmin(admin.username)}
                            className="delete-btn"
                        >
                            Delete
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}