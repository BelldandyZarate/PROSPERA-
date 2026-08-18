import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from '../components/Sidebar';

const Registro = () => {
  const [form, setForm] = useState({
    nombre: "",
    usuario: "",
    contrasena: "",
    rol: "administrador",
    activo: false,
    foto: null,
  });
  const navigate = useNavigate();

  const registrar = async () => {
    const data = new FormData();
    for (const key in form) data.append(key, form[key]);

    const res = await fetch("/api/registrar_usuario.php", {
      method: "POST",
      body: data,
    });
    const result = await res.json();
    if (result.success) {
      alert("Registrado correctamente");
      navigate("/");
    } else {
      alert("Error: " + result.error);
    }
  };

  return (
    <div className="d-flex">
      <Sidebar />
      
      {/* Contenido principal - diseño amplio */}
      <div className="flex-grow-1 p-4" style={{ marginLeft: '250px' }}>
        <div className="bg-white rounded-3 shadow-sm p-4">
          <h2 className="mb-4 text-primary border-bottom pb-3">Registro de Usuario</h2>
          
          <div className="row g-3">
            {/* Columna izquierda */}
            <div className="col-md-6">
              <div className="mb-3">
                <label className="form-label fw-semibold">Nombre completo</label>
                <input
                  className="form-control"
                  placeholder="Ej: Juan Pérez"
                  onChange={e => setForm({ ...form, nombre: e.target.value })}
                />
              </div>
              
              <div className="mb-3">
                <label className="form-label fw-semibold">Usuario</label>
                <input
                  className="form-control"
                  placeholder="Ej: juan.perez"
                  onChange={e => setForm({ ...form, usuario: e.target.value })}
                />
              </div>
              
              <div className="mb-3">
                <label className="form-label fw-semibold">Contraseña</label>
                <input
                  className="form-control"
                  type="password"
                  placeholder="Mínimo 8 caracteres"
                  onChange={e => setForm({ ...form, contrasena: e.target.value })}
                />
              </div>
            </div>
            
            {/* Columna derecha */}
            <div className="col-md-6">
              <div className="mb-3">
                <label className="form-label fw-semibold">Rol</label>
                <select
                  className="form-select"
                  onChange={e => setForm({ ...form, rol: e.target.value })}
                >
                  <option value="administrador">Administrador</option>
                  <option value="registrador">Registrador</option>
                  <option value="punto de venta">Punto de Venta</option>
                  <option value="inventario">Inventario</option>
                </select>
              </div>
              
              <div className="mb-3">
                <label className="form-label fw-semibold">Foto de perfil</label>
                <input
                  className="form-control"
                  type="file"
                  accept="image/*"
                  onChange={e => setForm({ ...form, foto: e.target.files[0] })}
                />
              </div>
              
              <div className="mb-4 form-check form-switch">
                <input
                  type="checkbox"
                  className="form-check-input"
                  id="activoCheck"
                  onChange={e => setForm({ ...form, activo: e.target.checked })}
                />
                <label className="form-check-label fw-semibold" htmlFor="activoCheck">
                  Usuario activo
                </label>
              </div>
            </div>
          </div>
          
          <div className="d-flex justify-content-between align-items-center mt-4 border-top pt-3">
            <button 
              onClick={registrar} 
              className="btn btn-primary px-4 py-2 fw-bold"
            >
              <i className="bi bi-person-plus me-2"></i>
              Registrar Usuario
            </button>
            
            <div className="text-end">
              <span className="text-muted me-2">¿Ya tienes cuenta?</span>
              <a 
                href="#login" 
                className="text-decoration-none fw-semibold"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/");
                }}
              >
                Inicia sesión
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Registro;