import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserPlus, User, Mail, Lock, Phone, MapPin, AlertCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import './Auth.css';

const Register = () => {
    const [formData, setFormData] = useState({
        nombre_completo: '',
        email: '',
        password: '',
        confirmPassword: '',
        rol: 'beneficiario',
        telefono: '',
        direccion: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const roles = [
        { value: 'beneficiario', label: 'Beneficiario' },
        { value: 'punto_venta', label: 'Punto de Venta' },
        { value: 'registrador', label: 'Registrador' },
        { value: 'consultoria', label: 'Consultoría' },
        { value: 'contenido', label: 'Contenido' },
        { value: 'administrador', label: 'Administrador (Requiere aprobación)' }
    ];

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // Validar contraseñas
        if (formData.password !== formData.confirmPassword) {
            setError('Las contraseñas no coinciden');
            return;
        }

        if (formData.password.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres');
            return;
        }

        setLoading(true);

        const userData = {
            nombre_completo: formData.nombre_completo,
            email: formData.email,
            password: formData.password,
            rol: formData.rol,
            telefono: formData.telefono,
            direccion: formData.direccion
        };

        const result = await register(userData);
        
        if (result.success) {
            setSuccess('¡Registro exitoso! Redirigiendo...');
            setTimeout(() => {
                navigate('/dashboard');
            }, 2000);
        } else {
            setError(result.error || 'Error al registrar usuario');
        }
        
        setLoading(false);
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <div className="auth-icon">
                        <UserPlus size={32} />
                    </div>
                    <h2>Crear Cuenta</h2>
                    <p className="auth-subtitle">
                        Regístrate para acceder al sistema
                    </p>
                </div>

                {error && (
                    <div className="auth-error">
                        <AlertCircle size={20} />
                        <span>{error}</span>
                    </div>
                )}

                {success && (
                    <div className="auth-success">
                        <AlertCircle size={20} />
                        <span>{success}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label htmlFor="nombre_completo">
                            <User size={18} />
                            <span>Nombre Completo</span>
                        </label>
                        <input
                            type="text"
                            id="nombre_completo"
                            name="nombre_completo"
                            value={formData.nombre_completo}
                            onChange={handleChange}
                            placeholder="Juan Pérez"
                            required
                        />
                    </div>

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

                    <div className="form-row">
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

                        <div className="form-group">
                            <label htmlFor="confirmPassword">
                                <Lock size={18} />
                                <span>Confirmar Contraseña</span>
                            </label>
                            <input
                                type="password"
                                id="confirmPassword"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="rol">
                            <User size={18} />
                            <span>Tipo de Usuario</span>
                        </label>
                        <select
                            id="rol"
                            name="rol"
                            value={formData.rol}
                            onChange={handleChange}
                            required
                        >
                            {roles.map((role) => (
                                <option key={role.value} value={role.value}>
                                    {role.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="telefono">
                            <Phone size={18} />
                            <span>Teléfono (Opcional)</span>
                        </label>
                        <input
                            type="tel"
                            id="telefono"
                            name="telefono"
                            value={formData.telefono}
                            onChange={handleChange}
                            placeholder="+1234567890"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="direccion">
                            <MapPin size={18} />
                            <span>Dirección (Opcional)</span>
                        </label>
                        <textarea
                            id="direccion"
                            name="direccion"
                            value={formData.direccion}
                            onChange={handleChange}
                            placeholder="Tu dirección completa"
                            rows="3"
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary auth-btn"
                        disabled={loading}
                    >
                        {loading ? 'Registrando...' : 'Registrarse'}
                    </button>
                </form>

                <div className="auth-footer">
                    <p>
                        ¿Ya tienes una cuenta?{' '}
                        <Link to="/login" className="auth-link">
                            Inicia sesión aquí
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;