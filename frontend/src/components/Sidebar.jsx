import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import 'bootstrap/dist/css/bootstrap.min.css';

const Sidebar = () => {
  const [rol, setRol] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const usuario = JSON.parse(localStorage.getItem("usuario"));
    if (usuario) {
      setRol(usuario.rol);
    }
  }, []);

  const logout = () => {
    // Limpiar localStorage
    localStorage.clear();
    
    // Redirigir a la página de inicio reemplazando el historial
    navigate("/", { replace: true });
    
    // Forzar recarga para limpiar completamente el estado
    window.location.reload();
  };

  const NavLink = ({ to, children }) => (
    <Link
      to={to}
      className="btn btn-outline-light mb-2"
      onClick={() => setIsOpen(false)}
    >
      {children}
    </Link>
  );

  const renderLinks = () => {
    switch (rol) {
      case "administrador":
        return (
          <>
            <NavLink to="/dashboard">Inicio</NavLink>
            <NavLink to="/TablaU">Apartado de Usuarios</NavLink>
            <NavLink to="/registro">Registrar Usuario</NavLink>
            <NavLink to="/TablaC">Tabla de Clientes</NavLink>
            <NavLink to="/registroC">Registro Clientes</NavLink>
            <NavLink to="/TablaV">Tabla de ventas</NavLink>
            <NavLink to="/TablaP">Tabla de Productos</NavLink>
            <NavLink to="/CodeP">Códigos de Barras</NavLink>
            <NavLink to="/HistorialGlobal">Historial de precios</NavLink>
            <NavLink to="/TablaproductosAd">Tabla de Productos</NavLink>
            <NavLink to="/Sobrantes">PNAPC</NavLink>
          </>
        );
      case "registrador":
        return (
          <>
            <NavLink to="/dashboard">Inicio</NavLink>
            <NavLink to="/registroC">Registrar Clientes</NavLink>
            <NavLink to="/TablaCR">Tabla de Clientes</NavLink>
            <NavLink to="/TablaproductosRe">Tabla de Productos</NavLink>
          </>
        );
      case "punto de venta":
        return (
          <>
            <NavLink to="/dashboard">Inicio</NavLink>
            <NavLink to="/registroV">Registro de ventas</NavLink>
            <NavLink to="/TablaV">Tabla de ventas</NavLink>
            <NavLink to="/registroP">Registro Productos</NavLink>
            <NavLink to="/TablaP">Tabla de Productos</NavLink>
          </>
        );
      case "inventario":
        return (
          <>
            <NavLink to="/dashboard">Inicio</NavLink>
            <NavLink to="#">Inventario</NavLink>
          </>
        );
      default:
        return <p>Rol no reconocido</p>;
    }
  };

  return (
    <div className="d-flex">
      {/* Botón toggle */}
      <button
        className="btn btn-dark m-2"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: "fixed",
          top: "10px",
          left: isOpen ? "250px" : "10px",
          zIndex: 999,
        }}
      >
        ☰
      </button>

      {/* Sidebar */}
      <div
        className="bg-dark text-white p-4"
        style={{
          height: "100vh",
          width: isOpen ? "240px" : "0",
          overflow: "hidden",
          transition: "width 0.3s ease",
          boxShadow: isOpen ? "2px 0px 5px rgba(0,0,0,0.1)" : "none",
        }}
      >
        {isOpen && (
          <>
            <div className="text-center mb-4">
              <h4>{rol.toUpperCase()}</h4>
            </div>
            <nav className="d-flex flex-column">
              {renderLinks()}
              <div className="mt-auto">
                <button 
                  className="btn btn-outline-danger w-100 mt-2" 
                  onClick={logout}
                >
                  Cerrar sesión
                </button>
              </div>
            </nav>
          </>
        )}
      </div>
    </div>
  );
};

export default Sidebar;