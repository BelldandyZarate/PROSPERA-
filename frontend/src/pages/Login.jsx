import { useState } from "react";
import { useNavigate } from "react-router-dom";
import 'bootstrap/dist/css/bootstrap.min.css';
import '../../styles/Login.css'

const Login = () => {
  const [login, setLogin] = useState({ usuario: "", contrasena: "" });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const iniciarSesion = async () => {
    const res = await fetch("/api/login.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(login),
    });
    const result = await res.json();

    if (result.success) {
      // Guardar usuario en localStorage
      localStorage.setItem("usuario", JSON.stringify(result.usuario));
      // Redirigir a dashboard global
      navigate("/dashboard");
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="container d-flex justify-content-center align-items-center" style={{
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '100%',
  maxWidth: '400px',
  padding: '0 15px'
}}>
      <div className="card shadow-lg rounded p-4" style={{ width: "100%", maxWidth: "400px" }}>
        <h2 className="text-center mb-4">Iniciar Sesión</h2>
        <div className="mb-3">
          <input
            type="text"
            className="form-control form-control-lg"
            placeholder="Usuario"
            onChange={e => setLogin({ ...login, usuario: e.target.value })}
          />
        </div>
        <div className="mb-3">
          <input
            type="password"
            className="form-control form-control-lg"
            placeholder="Contraseña"
            onChange={e => setLogin({ ...login, contrasena: e.target.value })}
          />
        </div>
        <button
          onClick={iniciarSesion}
          className="btn btn-primary w-100 py-2"
        >
          Entrar
        </button>
        {error && <p className="text-danger text-center mt-3">{error}</p>}
      </div>
    </div>
  );
};

export default Login;
