import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {toast} from 'react-hot-toast';
export default function Signup() {
    const [newAdmin, setNewAdmin] = useState({
        username: '',
        password: ''
    });
    const [superadminPassword, setSuperadminPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    
    // Get superadmin username from localStorage
    const superadminUsername = localStorage.getItem('username');
    const userRole = localStorage.getItem('userRole');

    useEffect(() => {
        // Redirect if not superadmin
        if (userRole !== 'superadmin') {
            navigate('/dashboard');
        }
    }, [userRole, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
    
    // Basic validation
    if (superadminPassword.trim() === '' || newAdmin.username.trim() === '' || newAdmin.password.trim() === '') {
        setError('All fields are required');
        return;
    }
        try {
            const response = await fetch('http://localhost:8000/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: newAdmin.username,
                    password: newAdmin.password
                }),
            });
    
            // Handle non-JSON responses
            const text = await response.text();
            const data = text ? JSON.parse(text) : {};
    
            if (!response.ok) {
                throw new Error(data.detail || 'Failed to create account');
            }
    
            toast.success('Admin account created successfully!');
            navigate('/manage-admins');
    
        } catch (error) {
            console.error('Signup error:', error);
            setError('Failed to connect to server');
        }
    };

    if (userRole !== 'superadmin') {
        return null; // Or loading spinner while redirect happens
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
                <h2 className="text-2xl font-bold text-center mb-6">Create New Admin Account</h2>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <input
                            type="text"
                            placeholder="New Admin Username"
                            value={newAdmin.username}
                            onChange={(e) => setNewAdmin({...newAdmin, username: e.target.value})}
                            required
                            className="w-full p-3 border rounded-lg border-gray-300 focus:outline-none focus:border-blue-500"
                        />
                    </div>
                    <div className="mb-4">
                        <input
                            type="password"
                            placeholder="New Admin Password"
                            value={newAdmin.password}
                            onChange={(e) => setNewAdmin({...newAdmin, password: e.target.value})}
                            required
                            className="w-full p-3 border rounded-lg border-gray-300 focus:outline-none focus:border-blue-500"
                        />
                    </div>
                    <div className="mb-4">
                        <input
                            type="password"
                            placeholder="Your Superadmin Password"
                            value={superadminPassword}
                            onChange={(e) => setSuperadminPassword(e.target.value)}
                            required
                            className="w-full p-3 border rounded-lg border-gray-300 focus:outline-none focus:border-blue-500"
                        />
                    </div>
                    {error && <p className="text-red-500 mb-4">{error}</p>}
                    <div className="mb-6">
                        <button
                            type="submit"
                            className="w-full bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600 transition duration-300"
                        >
                            Create Admin Account
                        </button>
                    </div>
                </form>
                <div className="text-center">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="text-blue-500 hover:underline"
                    >
                        Back to Dashboard
                    </button>
                </div>
                <div className="text-center mt-8">
                    <p className="text-gray-600">
                       Login Added Admin?{' '}
                        <a href="/login" className="text-blue-500 hover:underline">
                            Log In
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}