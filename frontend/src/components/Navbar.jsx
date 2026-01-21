import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Menu, 
  X, 
  ChevronDown, 
  Home, 
  Users,
  ShoppingCart,
  FileText,
  ClipboardCheck,
  Heart,
  MessageSquare,
  BarChart,
  Settings,
  User,
  LogOut,
  Shield,
  Package,
  CreditCard,
  Calendar,
  FileSpreadsheet,
  DollarSign,
  Bell,
  HelpCircle,
  Search,
  Info,
  Briefcase,
  Globe,
  Phone,
  Mail
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const menuRef = useRef(null);
  const userMenuRef = useRef(null);

  const { user, logout } = useAuth();

  // Definir permisos por rol
  const getRolePermissions = () => {
    if (!user) return { navItems: [], quickActions: [] };
    
    const commonUserItems = [
      
    ];

    const roleBasedItems = {
      superadministrador: [
        { 
          label: 'Administración',
          icon: <Shield size={20} />,
          mobileIcon: true,
          dropdown: [
            { path: '/admin/users', label: 'Gestión de Usuarios', icon: <Users size={16} /> },
            { path: '/admin/roles', label: 'Roles y Permisos', icon: <Shield size={16} /> },
            { path: '/admin/system', label: 'Configuración del Sistema', icon: <Settings size={16} /> },
            { path: '/admin/logs', label: 'Registros del Sistema', icon: <FileText size={16} /> },
          ]
        },
        { 
          label: 'Reportes',
          icon: <BarChart size={20} />,
          mobileIcon: true,
          dropdown: [
            { path: '/reports/financial', label: 'Financieros', icon: <DollarSign size={16} /> },
            { path: '/reports/activities', label: 'Actividades', icon: <FileSpreadsheet size={16} /> },
            { path: '/reports/users', label: 'Usuarios', icon: <Users size={16} /> },
          ]
        },
        { 
          path: '/beneficiarios', 
          label: 'Beneficiarios', 
          icon: <Heart size={20} />,
          mobileIcon: true
        },
        { 
          path: '/punto-venta', 
          label: 'PuntodeVenta', 
          icon: <ShoppingCart size={20} />,
          mobileIcon: true
        },
        { 
          path: '/consultoria', 
          label: 'Consultoría', 
          icon: <MessageSquare size={20} />,
          mobileIcon: true
        },
      ],
      administrador: [
        { 
          label: 'Gestión',
          icon: <Users size={20} />,
          mobileIcon: true,
          dropdown: [
            { path: '/admin/beneficiarios', label: 'Beneficiarios', icon: <Heart size={16} /> },
            { path: '/admin/pagos', label: 'Pagos', icon: <CreditCard size={16} /> },
            { path: '/admin/registros', label: 'Registros', icon: <ClipboardCheck size={16} /> },
          ]
        },
        { 
          path: '/beneficiarios', 
          label: 'Beneficiarios', 
          icon: <Heart size={20} />,
          mobileIcon: true
        },
        { 
          path: '/punto-venta', 
          label: 'PuntodeVenta', 
          icon: <ShoppingCart size={20} />,
          mobileIcon: true
        },
        { 
          path: '/reportes', 
          label: 'Reportes', 
          icon: <BarChart size={20} />,
          mobileIcon: true
        },
        ...commonUserItems,
      ],
      beneficiario: [
        { 
          path: '/mis-beneficios', 
          label: 'Mis Beneficios', 
          icon: <Heart size={20} />,
          mobileIcon: true
        },
        { 
          path: '/mis-pagos', 
          label: 'Mis Pagos', 
          icon: <CreditCard size={20} />,
          mobileIcon: true
        },
        { 
          path: '/calendario', 
          label: 'Calendario', 
          icon: <Calendar size={20} />,
          mobileIcon: true
        },
        ...commonUserItems,
      ],
      PuntodeVenta: [
        { 
          path: '/ventas', 
          label: 'Ventas', 
          icon: <ShoppingCart size={20} />,
          mobileIcon: true
        },
        { 
          path: '/transacciones', 
          label: 'Transacciones', 
          icon: <CreditCard size={20} />,
          mobileIcon: true
        },
        { 
          path: '/inventario', 
          label: 'Inventario', 
          icon: <Package size={20} />,
          mobileIcon: true
        },
        { 
          path: '/corte-caja', 
          label: 'Corte de Caja', 
          icon: <DollarSign size={20} />,
          mobileIcon: true
        },
        ...commonUserItems,
      ],
      registrador: [
        { 
          path: '/registro-beneficiarios', 
          label: 'Registro', 
          icon: <User size={20} />,
          mobileIcon: true
        },
        { 
          path: '/validacion', 
          label: 'Validación', 
          icon: <ClipboardCheck size={20} />,
          mobileIcon: true
        },
        { 
          path: '/documentos', 
          label: 'Documentos', 
          icon: <FileText size={20} />,
          mobileIcon: true
        },
        ...commonUserItems,
      ],
      contenido: [
        { 
          label: 'Contenido',
          icon: <FileText size={20} />,
          mobileIcon: true,
          dropdown: [
            { path: '/contenido/blog', label: 'Blog', icon: <FileText size={16} /> },
            { path: '/contenido/noticias', label: 'Noticias', icon: <Bell size={16} /> },
            { path: '/contenido/recursos', label: 'Recursos', icon: <Package size={16} /> },
          ]
        },
        { 
          path: '/media', 
          label: 'Multimedia', 
          icon: <Package size={20} />,
          mobileIcon: true
        },
        { 
          path: '/analytics', 
          label: 'Analíticas', 
          icon: <BarChart size={20} />,
          mobileIcon: true
        },
        ...commonUserItems,
      ],
      consultoria: [
        { 
          path: '/consultas', 
          label: 'Consultas', 
          icon: <MessageSquare size={20} />,
          mobileIcon: true
        },
        { 
          path: '/asesorias', 
          label: 'Asesorías', 
          icon: <Users size={20} />,
          mobileIcon: true
        },
        { 
          path: '/reportes-consultoria', 
          label: 'Reportes', 
          icon: <FileText size={20} />,
          mobileIcon: true
        },
        ...commonUserItems,
      ],
    };

    const quickActions = {
      superadministrador: [
        { icon: <Search size={20} />, label: 'Buscar Usuario', action: () => navigate('/admin/users') },
        { icon: <BarChart size={20} />, label: 'Reportes', action: () => navigate('/reports') },
        { icon: <Bell size={20} />, label: 'Alertas', action: () => navigate('/admin/alerts') },
      ],
      administrador: [
        { icon: <Search size={20} />, label: 'Buscar Beneficiario', action: () => navigate('/beneficiarios') },
        { icon: <CreditCard size={20} />, label: 'Registrar Pago', action: () => navigate('/pagos/nuevo') },
        { icon: <FileText size={20} />, label: 'Generar Reporte', action: () => navigate('/reportes') },
      ],
      beneficiario: [
        { icon: <Heart size={20} />, label: 'Mis Beneficios', action: () => navigate('/mis-beneficios') },
        { icon: <Calendar size={20} />, label: 'Próximas Citas', action: () => navigate('/calendario') },
        { icon: <Bell size={20} />, label: 'Notificaciones', action: () => navigate('/notifications') },
      ],
      PuntodeVenta: [
        { icon: <ShoppingCart size={20} />, label: 'Nueva Venta', action: () => navigate('/ventas/nueva') },
        { icon: <CreditCard size={20} />, label: 'Corte de Caja', action: () => navigate('/corte-caja') },
        { icon: <Package size={20} />, label: 'Ver Inventario', action: () => navigate('/inventario') },
      ],
      registrador: [
        { icon: <User size={20} />, label: 'Nuevo Registro', action: () => navigate('/registro-beneficiarios/nuevo') },
        { icon: <ClipboardCheck size={20} />, label: 'Validar Documentos', action: () => navigate('/validacion') },
        { icon: <FileText size={20} />, label: 'Subir Documentos', action: () => navigate('/documentos/subir') },
      ],
      contenido: [
        { icon: <FileText size={20} />, label: 'Nuevo Artículo', action: () => navigate('/contenido/blog/nuevo') },
        { icon: <Bell size={20} />, label: 'Crear Noticia', action: () => navigate('/contenido/noticias/nueva') },
        { icon: <BarChart size={20} />, label: 'Ver Analíticas', action: () => navigate('/analytics') },
      ],
      consultoria: [
        { icon: <MessageSquare size={20} />, label: 'Nueva Consulta', action: () => navigate('/consultas/nueva') },
        { icon: <Users size={20} />, label: 'Agendar Asesoría', action: () => navigate('/asesorias/nueva') },
        { icon: <FileText size={20} />, label: 'Generar Reporte', action: () => navigate('/reportes-consultoria') },
      ],
    };

    return {
      navItems: roleBasedItems[user.rol] || [],
      quickActions: quickActions[user.rol] || [],
    };
  };

  // Menú público para usuarios no autenticados
  const publicNavItems = [
    { 
      path: '/', 
      label: 'Inicio', 
      icon: <Home size={20} />,
      mobileIcon: true
    },
    { 
      path: '/about', 
      label: 'Acerca', 
      icon: <Info size={20} />,
      mobileIcon: true
    },
    {
      label: 'Servicios',
      icon: <Briefcase size={20} />,
      mobileIcon: true,
      dropdown: [
        { path: '/services/web', label: 'Desarrollo Web', icon: <Globe size={16} /> },
        { path: '/services/mobile', label: 'Apps Móviles', icon: <Phone size={16} /> },
        { path: '/services/design', label: 'Diseño UI/UX', icon: <Settings size={16} /> },
      ]
    },
    { 
      path: '/portfolio', 
      label: 'Portafolio', 
      icon: <Briefcase size={20} />,
      mobileIcon: true
    },
    {
      label: 'Más',
      icon: <Settings size={20} />,
      mobileIcon: true,
      dropdown: [
        { path: '/blog', label: 'Blog', icon: <HelpCircle size={16} /> },
        { path: '/contact', label: 'Contacto', icon: <Mail size={16} /> },
        { path: '/faq', label: 'FAQ', icon: <HelpCircle size={16} /> },
      ]
    },
  ];

  // Acciones rápidas públicas
  const publicQuickActions = [
    { icon: <Search size={20} />, label: 'Buscar', action: () => console.log('Buscar') },
    { icon: <Phone size={20} />, label: 'Llamar', action: () => window.open('tel:+1234567890') },
    { icon: <Mail size={20} />, label: 'Email', action: () => window.open('mailto:info@misitio.com') },
  ];

  const permissions = getRolePermissions();
  const navItems = user ? permissions.navItems : publicNavItems;
  const quickActions = user ? permissions.quickActions : publicQuickActions;

  // Detectar scroll
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Cerrar menú al cambiar de ruta
  useEffect(() => {
    setIsMenuOpen(false);
    setActiveDropdown(null);
    setUserDropdownOpen(false);
  }, [location]);

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
        setActiveDropdown(null);
      }
      
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
    if (!isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  };

  const toggleDropdown = (dropdownName) => {
    setActiveDropdown(activeDropdown === dropdownName ? null : dropdownName);
  };

  const toggleUserDropdown = () => {
    setUserDropdownOpen(!userDropdownOpen);
  };

  const handleLogout = () => {
    logout();
    setUserDropdownOpen(false);
    setIsMenuOpen(false);
  };

  // Función para obtener el color según el rol
  const getRoleColor = (role) => {
    const colors = {
      superadministrador: '#dc2626', // Rojo
      administrador: '#2563eb', // Azul
      beneficiario: '#16a34a', // Verde
      PuntodeVenta: '#9333ea', // Púrpura
      registrador: '#ea580c', // Naranja
      contenido: '#0891b2', // Cian
      consultoria: '#ca8a04', // Amarillo
    };
    return colors[role] || '#6b7280';
  };

  // Función para obtener el nombre completo del rol
  const getFullRoleName = (role) => {
    const roleNames = {
      superadministrador: 'Super Administrador',
      administrador: 'Administrador',
      beneficiario: 'Beneficiario',
      PuntodeVenta: 'PuntodeVenta',
      registrador: 'Registrador',
      contenido: 'Contenido',
      consultoria: 'Consultoría',
    };
    return roleNames[role] || role;
  };

  return (
    <>
      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`} ref={menuRef}>
        <div className="navbar-container">
          {/* Logo a la izquierda */}
          <Link to="/" className="navbar-logo">
            <div className="logo-icon">
              <div className="logo-dot"></div>
              <div className="logo-dot"></div>
              <div className="logo-dot"></div>
            </div>
            <span className="logo-text">
              {user ? 'Sistema Integral' : 'Mi Sitio Web'}
            </span>
          </Link>

          {/* Menú Desktop - centrado */}
          <div className="navbar-desktop-menu">
            <ul className="navbar-menu">
              {navItems.map((item, index) => (
                <li key={index} className="navbar-item">
                  {item.path ? (
                    <Link 
                      to={item.path} 
                      className={`navbar-link ${location.pathname === item.path ? 'active' : ''}`}
                    >
                      <span className="nav-icon">{item.icon}</span>
                      {item.label}
                    </Link>
                  ) : item.dropdown ? (
                    <div className="dropdown-container">
                      <button 
                        className={`navbar-link dropdown-toggle ${activeDropdown === item.label ? 'active' : ''}`}
                        onClick={() => toggleDropdown(item.label)}
                      >
                        <span className="nav-icon">{item.icon}</span>
                        {item.label}
                        <ChevronDown className="dropdown-icon" size={16} />
                      </button>
                      <div className={`dropdown-menu ${activeDropdown === item.label ? 'open' : ''}`}>
                        {item.dropdown.map((subItem, subIndex) => (
                          <Link
                            key={subIndex}
                            to={subItem.path}
                            className="dropdown-item"
                            onClick={() => setActiveDropdown(null)}
                          >
                            {subItem.icon}
                            {subItem.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>

          {/* Acciones Desktop - derecha */}
          <div className="navbar-actions-desktop" ref={userMenuRef}>
            {user ? (
              <div className="user-menu">
                <button 
                  className="user-btn"
                  onClick={toggleUserDropdown}
                  style={{ borderColor: getRoleColor(user.rol) }}
                >
                  <div 
                    className="user-avatar"
                    style={{ backgroundColor: getRoleColor(user.rol) }}
                  >
                    {user.nombre_completo.charAt(0)}
                  </div>
                  <div className="user-info-mini">
                    <span className="user-name">{user.nombre_completo.split(' ')[0]}</span>
                    <span className="user-role-mini">{user.rol}</span>
                  </div>
                  <ChevronDown className={`dropdown-icon ${userDropdownOpen ? 'rotated' : ''}`} size={16} />
                </button>
                <div className={`user-dropdown ${userDropdownOpen ? 'open' : ''}`}>
                  <div className="user-info">
                    <div 
                      className="user-info-avatar"
                      style={{ backgroundColor: getRoleColor(user.rol) }}
                    >
                      {user.nombre_completo.charAt(0)}
                    </div>
                    <div className="user-info-details">
                      <strong>{user.nombre_completo}</strong>
                      <span 
                        className="user-role"
                        style={{ color: getRoleColor(user.rol) }}
                      >
                        {getFullRoleName(user.rol)}
                      </span>
                    </div>
                  </div>
                  <div className="dropdown-divider"></div>
                  {navItems.map((item, index) => (
                    item.path && !item.dropdown && (
                      <Link 
                        key={index}
                        to={item.path} 
                        className="user-dropdown-item"
                        onClick={() => setUserDropdownOpen(false)}
                      >
                        {item.icon}
                        <span>{item.label}</span>
                      </Link>
                    )
                  ))}
                  <div className="dropdown-divider"></div>
                  <Link 
                    to="/profile" 
                    className="user-dropdown-item"
                    onClick={() => setUserDropdownOpen(false)}
                  >
                    <User size={16} />
                    <span>Mi Perfil</span>
                  </Link>
                  <Link 
                    to="/settings" 
                    className="user-dropdown-item"
                    onClick={() => setUserDropdownOpen(false)}
                  >
                    <Settings size={16} />
                    <span>Configuración</span>
                  </Link>
                  <Link 
                    to="/help" 
                    className="user-dropdown-item"
                    onClick={() => setUserDropdownOpen(false)}
                  >
                    <HelpCircle size={16} />
                    <span>Ayuda</span>
                  </Link>
                  <div className="dropdown-divider"></div>
                  <button 
                    onClick={handleLogout} 
                    className="user-dropdown-item logout"
                  >
                    <LogOut size={16} />
                    <span>Cerrar Sesión</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="auth-buttons">
                <Link to="/login" className="btn btn-outline btn-sm">
                  <User size={16} />
                  <span>Iniciar Sesión</span>
                </Link>
                <Link to="/register" className="btn btn-primary btn-sm">
                  <User size={16} />
                  <span>Registrarse</span>
                </Link>
              </div>
            )}
          </div>

          {/* Botón Hamburguesa para móvil - derecha */}
          <button 
            className={`navbar-toggle ${isMenuOpen ? 'open' : ''}`}
            onClick={toggleMenu}
            aria-label={isMenuOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={isMenuOpen}
          >
            <div className="hamburger-icon">
              <span className="hamburger-line"></span>
              <span className="hamburger-line"></span>
              <span className="hamburger-line"></span>
            </div>
            <span className="toggle-text">Menú</span>
          </button>
        </div>

        {/* Menú Móvil - Se despliega desde arriba/centro */}
        <div className={`mobile-menu-container ${isMenuOpen ? 'open' : ''}`}>
          <div className="mobile-menu-header">
            {user ? (
              <div className="mobile-user-info">
                <div 
                  className="mobile-user-avatar"
                  style={{ backgroundColor: getRoleColor(user.rol) }}
                >
                  {user.nombre_completo.charAt(0)}
                </div>
                <div className="mobile-user-details">
                  <strong>{user.nombre_completo}</strong>
                  <span 
                    className="mobile-user-role"
                    style={{ color: getRoleColor(user.rol) }}
                  >
                    {getFullRoleName(user.rol)}
                  </span>
                </div>
              </div>
            ) : (
              <div className="mobile-search">
                <Search size={20} />
                <input 
                  type="text" 
                  placeholder="Buscar en el sitio..."
                  className="search-input"
                />
              </div>
            )}
          </div>

          <div className="mobile-menu-content">
            {/* Navegación principal */}
            <ul className="mobile-nav-list">
              {navItems.map((item, index) => (
                <li key={index} className="mobile-nav-item">
                  {item.path ? (
                    <Link 
                      to={item.path} 
                      className={`mobile-nav-link ${location.pathname === item.path ? 'active' : ''}`}
                      onClick={toggleMenu}
                    >
                      <span className="mobile-nav-icon">{item.icon}</span>
                      <span className="mobile-nav-label">{item.label}</span>
                    </Link>
                  ) : item.dropdown ? (
                    <div className="mobile-dropdown">
                      <button 
                        className={`mobile-dropdown-toggle ${activeDropdown === item.label ? 'open' : ''}`}
                        onClick={() => toggleDropdown(item.label)}
                      >
                        <span className="mobile-nav-icon">{item.icon}</span>
                        <span className="mobile-nav-label">{item.label}</span>
                        <ChevronDown className={`dropdown-arrow ${activeDropdown === item.label ? 'rotated' : ''}`} size={18} />
                      </button>
                      <div className={`mobile-dropdown-content ${activeDropdown === item.label ? 'open' : ''}`}>
                        {item.dropdown.map((subItem, subIndex) => (
                          <Link
                            key={subIndex}
                            to={subItem.path}
                            className="mobile-dropdown-item"
                            onClick={toggleMenu}
                          >
                            {subItem.icon}
                            <span>{subItem.label}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>

            {/* Acciones rápidas */}
            {quickActions.length > 0 && (
              <div className="mobile-quick-actions">
                <h3 className="quick-actions-title">
                  {user ? 'Acciones Rápidas' : 'Acceso Rápido'}
                </h3>
                <div className="quick-actions-grid">
                  {quickActions.map((action, index) => (
                    <button
                      key={index}
                      className="quick-action-btn"
                      onClick={() => {
                        action.action();
                        toggleMenu();
                      }}
                    >
                      <span className="action-icon">{action.icon}</span>
                      <span className="action-label">{action.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Enlaces de usuario en móvil */}
            {user ? (
              <div className="mobile-user-menu">
                <div className="mobile-user-section">
                  <h3 className="mobile-user-section-title">Mi Cuenta</h3>
                  <Link 
                    to="/profile" 
                    className="mobile-user-link"
                    onClick={toggleMenu}
                  >
                    <User size={18} />
                    <span>Mi Perfil</span>
                  </Link>
                  <Link 
                    to="/settings" 
                    className="mobile-user-link"
                    onClick={toggleMenu}
                  >
                    <Settings size={18} />
                    <span>Configuración</span>
                  </Link>
                  <Link 
                    to="/notifications" 
                    className="mobile-user-link"
                    onClick={toggleMenu}
                  >
                    <Bell size={18} />
                    <span>Notificaciones</span>
                  </Link>
                  <Link 
                    to="/help" 
                    className="mobile-user-link"
                    onClick={toggleMenu}
                  >
                    <HelpCircle size={18} />
                    <span>Ayuda y Soporte</span>
                  </Link>
                  <button 
                    onClick={handleLogout} 
                    className="mobile-user-link logout"
                  >
                    <LogOut size={18} />
                    <span>Cerrar Sesión</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="mobile-auth-buttons">
                <Link 
                  to="/login" 
                  className="btn btn-outline btn-block"
                  onClick={toggleMenu}
                >
                  <User size={18} />
                  <span>Iniciar Sesión</span>
                </Link>
                <Link 
                  to="/register" 
                  className="btn btn-primary btn-block"
                  onClick={toggleMenu}
                >
                  <User size={18} />
                  <span>Registrarse</span>
                </Link>
              </div>
            )}

            {/* Información de contacto (solo para público) */}
            {!user && (
              <div className="mobile-contact-info">
                <h3 className="contact-info-title">Contacto</h3>
                <div className="contact-info-content">
                  <a href="tel:+1234567890" className="contact-item" onClick={toggleMenu}>
                    <Phone size={18} />
                    <span>+1 234 567 890</span>
                  </a>
                  <a href="mailto:info@misitio.com" className="contact-item" onClick={toggleMenu}>
                    <Mail size={18} />
                    <span>info@misitio.com</span>
                  </a>
                </div>
              </div>
            )}

            {/* Botón de cierre */}
            <div className="mobile-menu-footer">
              <button className="btn btn-close-menu" onClick={toggleMenu}>
                <X size={20} />
                <span>Cerrar Menú</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Overlay para móvil */}
      {isMenuOpen && (
        <div 
          className="mobile-menu-overlay" 
          onClick={toggleMenu}
          role="button"
          tabIndex={0}
          aria-label="Cerrar menú"
        />
      )}
    </>
  );
};

export default Navbar;