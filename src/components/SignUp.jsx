import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Signup() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('http://localhost:8000/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            if (response.ok) {
                alert('Signup successful! Please login.');
                navigate('/login');
            } else {
                const error = await response.json();
                alert(error.detail);
            }
        } catch (error) {
            console.error('Signup error:', error);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
                <h2 className="text-2xl font-bold text-center mb-6">Sign Up</h2>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <input
                            type="text"
                            placeholder="Username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            className="w-full p-3 border rounded-lg border-gray-300 focus:outline-none focus:border-blue-500"
                        />
                    </div>
                    <div className="mb-4">
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full p-3 border rounded-lg border-gray-300 focus:outline-none focus:border-blue-500"
                        />
                    </div>
                    <div className="mb-6">
                        <button
                            type="submit"
                            className="w-full bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600 transition duration-300"
                        >
                            Sign Up
                        </button>
                    </div>
                </form>
                <div className="text-center">
                    <p className="text-gray-600">
                        Already have an account?{' '}
                        <a href="/login" className="text-blue-500 hover:underline">
                            Go to Login
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}