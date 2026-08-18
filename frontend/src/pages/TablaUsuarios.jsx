import { useEffect, useState } from "react";
import Sidebar from '../components/Sidebar';

const TablaUsuarios = () => {
  const [usuarios, setUsuarios] = useState([]);

  useEffect(() => {
    fetch("/api/obtener_usuarios.php")
      .then(res => res.json())
      .then(data => setUsuarios(data))
      .catch(err => console.error("Error al cargar usuarios:", err));
  }, []);

  const toggleActivo = async (id, nuevoEstado) => {
    const res = await fetch("/api/actualizar_estado_usuario.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, activo: nuevoEstado }),
    });
    const result = await res.json();
    if (result.success) {
      setUsuarios(usuarios.map(u => u.id === id ? { ...u, activo: nuevoEstado } : u));
    } else {
      alert("Error al actualizar estado");
    }
  };

  const getRolBadge = (rol) => {
    switch (rol) {
      case 'administrador':
        return <span className="badge bg-primary">Administrador</span>;
      case 'registrador':
        return <span className="badge bg-success">Registrador</span>;
      case 'punto de venta':
        return <span className="badge bg-warning text-dark">Punto de Venta</span>;
      case 'inventario':
        return <span className="badge bg-info text-dark">Inventario</span>;
      default:
        return <span className="badge bg-secondary">{rol}</span>;
    }
  };

  return (
    <div className="d-flex">
      <Sidebar />
      <div className="container" style={{ padding: '30px', marginLeft: '250px', width: 'calc(100% - 250px)' }}>
        <h2 className="mb-4">Lista de Usuarios</h2>

        <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
          {usuarios.map(usuario => (
            <div className="col" key={usuario.id}>
              <div className="card shadow-sm border-0 h-100">
                <div className="card-body text-center">
                  {/* Asumiendo que las fotos se guardan con una ruta completa desde el servidor */}
                  <img
                    src={usuario.foto}  // Usará la URL completa que se envió desde el backend
                    alt="foto"
                    className="rounded-circle border border-2 border-primary mb-3"
                    width="120"
                    height="120"
/>
                  <h5 className="card-title">{usuario.nombre}</h5>
                  <p className="card-subtitle text-muted mb-2">@{usuario.usuario}</p>
                  {getRolBadge(usuario.rol)}
                  <div className="mt-3">
                    <div className="form-check form-switch d-flex justify-content-center align-items-center gap-2">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        role="switch"
                        checked={usuario.activo === 1}
                        onChange={() => toggleActivo(usuario.id, usuario.activo === 1 ? 0 : 1)}
                      />
                      <span>{usuario.activo === 1 ? "Activo" : "Inactivo"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {usuarios.length === 0 && (
            <div className="col">
              <div className="alert alert-info text-center">No hay usuarios registrados.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TablaUsuarios;
