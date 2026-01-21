import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Shield, 
  Edit, 
  Save, 
  X,
  Key,
  CheckCircle,
  Clock,
  UserCheck,
  AlertCircle,
  Camera,
  Trash2,
  Lock
} from 'lucide-react';
import './Profile.css';

const Profile = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [profileData, setProfileData] = useState(null);
  
  // Estados para cambio de contraseña
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
  });

  // Cargar datos del perfil
  useEffect(() => {
    if (user) {
      setProfileData({
        ...user,
        avatar_url: user.avatar && user.avatar !== 'default.png' 
          ? `http://localhost:5000/uploads/avatars/${user.avatar}`
          : null
      });
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setUpdating(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          nombre_completo: profileData.nombre_completo,
          telefono: profileData.telefono,
          direccion: profileData.direccion
        })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: data.message });
        setIsEditing(false);
        setProfileData(data.user);
      } else {
        setMessage({ type: 'error', text: data.error });
      }
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      setMessage({ type: 'error', text: 'Error al conectar con el servidor' });
    } finally {
      setUpdating(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'Las contraseñas no coinciden' });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'La nueva contraseña debe tener al menos 6 caracteres' });
      return;
    }

    try {
      setUpdating(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/user/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: data.message });
        setShowChangePassword(false);
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        setMessage({ type: 'error', text: data.error });
      }
    } catch (error) {
      console.error('Error al cambiar contraseña:', error);
      setMessage({ type: 'error', text: 'Error al conectar con el servidor' });
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Nunca';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const getRoleColor = (role) => {
    const colors = {
      superadministrador: '#dc3545',
      administrador: '#007bff',
      punto_venta: '#28a745',
      registrador: '#17a2b8',
      consultoria: '#6f42c1',
      beneficiario: '#fd7e14',
      contenido: '#20c997'
    };
    return colors[role] || '#6c757d';
  };

  if (!profileData) {
    return (
      <div className="profile-error">
        <AlertCircle size={48} />
        <h3>No se pudo cargar el perfil</h3>
        <p>Por favor, inicia sesión para ver tu perfil</p>
      </div>
    );
  }

  return (
    <div className="profile-container">
      {/* Header del perfil */}
      <div className="profile-header">
        <h1 className="profile-title">Mi Perfil</h1>
        <p className="profile-subtitle">Administra tu información personal</p>
      </div>

      {message.text && (
        <div className={`profile-message ${message.type}`}>
          {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span>{message.text}</span>
          <button 
            className="message-close" 
            onClick={() => setMessage({ type: '', text: '' })}
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div className="profile-content">
        {/* Sección de foto de perfil */}
        <div className="profile-avatar-section">
          <div className="avatar-container">
            <div className="avatar-wrapper">
              {profileData.avatar_url ? (
                <img 
                  src={profileData.avatar_url} 
                  alt="Foto de perfil" 
                  className="profile-avatar"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = `https://ui-avatars.com/api/?name=${profileData.nombre_completo}&background=667eea&color=fff&size=200`;
                  }}
                />
              ) : (
                <div className="avatar-placeholder">
                  {profileData.nombre_completo.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          </div>

          <div className="avatar-info">
            <h3>{profileData.nombre_completo}</h3>
            <div 
              className="role-badge"
              style={{ backgroundColor: getRoleColor(profileData.rol) }}
            >
              <Shield size={14} />
              <span>{profileData.rol.replace('_', ' ')}</span>
            </div>
            <p className="email">{profileData.email}</p>
            <p className="member-since">
              <Calendar size={14} />
              <span>Miembro desde: {formatDate(profileData.fecha_registro)}</span>
            </p>
          </div>
        </div>

        {/* Sección de información personal */}
        <div className="profile-card">
          <div className="card-header">
            <h3>
              <User size={20} />
              Información Personal
            </h3>
            <button 
              className="btn btn-outline btn-sm"
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? (
                <>
                  <X size={16} />
                  <span>Cancelar</span>
                </>
              ) : (
                <>
                  <Edit size={16} />
                  <span>Editar</span>
                </>
              )}
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label>
                  <User size={16} />
                  Nombre Completo
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profileData.nombre_completo || ''}
                    onChange={(e) => setProfileData({
                      ...profileData,
                      nombre_completo: e.target.value
                    })}
                    required
                  />
                ) : (
                  <div className="field-value">{profileData.nombre_completo || 'No especificado'}</div>
                )}
              </div>

              <div className="form-group">
                <label>
                  <Mail size={16} />
                  Correo Electrónico
                </label>
                <div className="field-value">
                  {profileData.email}
                </div>
              </div>

              <div className="form-group">
                <label>
                  <Phone size={16} />
                  Teléfono
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={profileData.telefono || ''}
                    onChange={(e) => setProfileData({
                      ...profileData,
                      telefono: e.target.value
                    })}
                  />
                ) : (
                  <div className="field-value">{profileData.telefono || 'No especificado'}</div>
                )}
              </div>

              <div className="form-group">
                <label>
                  <Shield size={16} />
                  Tipo de Usuario
                </label>
                <div className="field-value">
                  <span 
                    className="role-display"
                    style={{ color: getRoleColor(profileData.rol) }}
                  >
                    {profileData.rol.replace('_', ' ')}
                  </span>
                </div>
              </div>

              <div className="form-group full-width">
                <label>
                  <MapPin size={16} />
                  Dirección
                </label>
                {isEditing ? (
                  <textarea
                    value={profileData.direccion || ''}
                    onChange={(e) => setProfileData({
                      ...profileData,
                      direccion: e.target.value
                    })}
                    rows="3"
                  />
                ) : (
                  <div className="field-value">{profileData.direccion || 'No especificada'}</div>
                )}
              </div>

              <div className="form-group">
                <label>
                  <Calendar size={16} />
                  Fecha de Registro
                </label>
                <div className="field-value">{formatDate(profileData.fecha_registro)}</div>
              </div>

              <div className="form-group">
                <label>
                  <Clock size={16} />
                  Último Acceso
                </label>
                <div className="field-value">{formatDate(profileData.ultimo_login)}</div>
              </div>
            </div>

            {isEditing && (
              <div className="form-actions">
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={updating}
                >
                  {updating ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Sección de seguridad */}
        <div className="profile-card">
          <div className="card-header">
            <h3>
              <Lock size={20} />
              Seguridad
            </h3>
          </div>

          {!showChangePassword ? (
            <div className="security-info">
              <div className="security-item">
                <Key size={20} />
                <div className="security-details">
                  <h4>Contraseña</h4>
                  <p>Cambia tu contraseña regularmente</p>
                </div>
                <button 
                  className="btn btn-outline btn-sm"
                  onClick={() => setShowChangePassword(true)}
                >
                  Cambiar Contraseña
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handlePasswordChange} className="change-password-form">
              <div className="form-group">
                <label>Contraseña Actual</label>
                <div className="password-input">
                  <input
                    type={showPassword.current ? "text" : "password"}
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({
                      ...passwordData,
                      currentPassword: e.target.value
                    })}
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword({
                      ...showPassword,
                      current: !showPassword.current
                    })}
                  >
                    {showPassword.current ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label>Nueva Contraseña</label>
                <div className="password-input">
                  <input
                    type={showPassword.new ? "text" : "password"}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({
                      ...passwordData,
                      newPassword: e.target.value
                    })}
                    required
                    minLength="6"
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword({
                      ...showPassword,
                      new: !showPassword.new
                    })}
                  >
                    {showPassword.new ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
                <small className="password-hint">Mínimo 6 caracteres</small>
              </div>

              <div className="form-group">
                <label>Confirmar Nueva Contraseña</label>
                <div className="password-input">
                  <input
                    type={showPassword.confirm ? "text" : "password"}
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({
                      ...passwordData,
                      confirmPassword: e.target.value
                    })}
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword({
                      ...showPassword,
                      confirm: !showPassword.confirm
                    })}
                  >
                    {showPassword.confirm ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>

              <div className="form-actions">
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={updating}
                >
                  {updating ? 'Actualizando...' : 'Cambiar Contraseña'}
                </button>
                <button 
                  type="button"
                  className="btn btn-outline"
                  onClick={() => {
                    setShowChangePassword(false);
                    setPasswordData({
                      currentPassword: '',
                      newPassword: '',
                      confirmPassword: ''
                    });
                  }}
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;