import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogIn, Mail, Lock, AlertCircle } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './Auth.css';

const Login = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const result = await login(formData.email, formData.password);

        if (result.success) {
            let redirectPath = '/dashboard';

            // 1. Ruta guardada por ProtectedRoute
            const savedRedirect = sessionStorage.getItem('redirectAfterLogin');
            if (savedRedirect) {
                redirectPath = savedRedirect;
                sessionStorage.removeItem('redirectAfterLogin');
            }

            // 2. Ruta enviada por Navigate state
            const from = location.state?.from?.pathname;
            if (from && from !== '/login') {
                redirectPath = from;
            }

            // 3. Última ruta visitada
            const lastPath = sessionStorage.getItem('lastPath');
            if (
                lastPath &&
                lastPath !== '/login' &&
                lastPath !== '/register'
            ) {
                redirectPath = lastPath;
            }

            navigate(redirectPath, { replace: true });
        } else {
            setError(result.error || 'Error al iniciar sesión');
        }

        setLoading(false);
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <div className="auth-icon">
                        <LogIn size={32} />
                    </div>
                    <h2>Iniciar Sesión</h2>
                    <p className="auth-subtitle">
                        Accede a tu cuenta para continuar
                    </p>
                </div>

                {error && (
                    <div className="auth-error">
                        <AlertCircle size={20} />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label htmlFor="email">
                            <Mail size={18} />
                            <span>Email</span>
                        </label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="tu@email.com"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">
                            <Lock size={18} />
                            <span>Contraseña</span>
                        </label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary auth-btn"
                        disabled={loading}
                    >
                        {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                    </button>
                </form>

                <div className="auth-footer">
                    <p>
                        ¿No tienes una cuenta?{' '}
                        <Link to="/register" className="auth-link">
                            Regístrate aquí
                        </Link>
                    </p>
                    <p>
                        <Link to="/forgot-password" className="auth-link">
                            ¿Olvidaste tu contraseña?
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
