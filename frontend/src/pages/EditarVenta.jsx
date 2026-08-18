import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import "bootstrap/dist/css/bootstrap.min.css";

const EditarVenta = () => {
  const { id } = useParams(); // id corresponde a venta_id
  const navigate = useNavigate();

  const [venta, setVenta] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) {
      setError("ID no proporcionado");
      return;
    }

    fetch(`/api/obtener_venta_por_id.php?id=${id}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (data.success && data.data) {
          const ventaData = {
            ...data.data,
            id: data.data.venta_id,
            numero_tarjeta: data.data.numero_tarjeta || "", // si lo tienes en la base de datos
          };
          setVenta(ventaData);
        } else {
          setError(data.error || "Venta no encontrada");
        }
      })
      .catch((err) => {
        console.error("Fetch error:", err);
        setError("Error de conexión al servidor");
      });
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setVenta((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!venta) return;

    try {
      const bodyToSend = {
        ...venta,
        venta_id: venta.id,
      };
      delete bodyToSend.id;

      const res = await fetch("/api/actualizar_venta.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyToSend),
      });
      const data = await res.json();
      if (data.success) {
        alert("Venta actualizada correctamente");
        navigate("/TablaV");
      } else {
        alert("Error al actualizar: " + (data.error || ""));
      }
    } catch (err) {
      console.error(err);
      alert("Error de conexión al actualizar");
    }
  };

  if (error) {
    return (
      <div className="p-4">
        <Sidebar />
        <div className="alert alert-danger">
          {error}{" "}
          <button className="btn btn-link" onClick={() => navigate("/ventas")}>
            Volver
          </button>
        </div>
      </div>
    );
  }

  if (!venta) {
    return (
      <div className="d-flex">
        <Sidebar />
        <div className="p-4">Cargando...</div>
      </div>
    );
  }

  let fechaLocal = venta.fecha_venta;
  if (fechaLocal && !fechaLocal.includes("T")) {
    fechaLocal = new Date(fechaLocal).toISOString().slice(0, 16);
  }

  return (
    <div className="d-flex">
      <Sidebar />
      <div className="container p-4">
        <h3>Editar Venta #{venta.id}</h3>
        <form onSubmit={handleSubmit}>
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label">Cliente</label>
              <input
                type="text"
                name="cliente"
                className="form-control"
                value={venta.cliente || ""}
                onChange={handleChange}
                required
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Producto</label>
              <input
                type="text"
                name="producto"
                className="form-control"
                value={venta.producto || ""}
                onChange={handleChange}
                required
              />
            </div>
            <div className="col-md-2">
              <label className="form-label">Unidades</label>
              <input
                type="number"
                name="unidades"
                className="form-control"
                value={venta.unidades || ""}
                onChange={handleChange}
                min="1"
                required
              />
            </div>
            <div className="col-md-2">
              <label className="form-label">Total</label>
              <input
                type="number"
                step="0.01"
                name="precio_total"
                className="form-control"
                value={venta.precio_total || ""}
                onChange={handleChange}
                min="0"
                required
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Método de Pago</label>
              <select
                name="metodo_pago"
                className="form-select"
                value={venta.metodo_pago || ""}
                onChange={handleChange}
                required
              >
                <option value="">Selecciona método</option>
                <option value="efectivo">Efectivo</option>
                <option value="tarjeta">Tarjeta</option>
                {/* <option value="transferencia">Transferencia</option> Eliminado */}
              </select>
            </div>

            {/* Mostrar campo número de tarjeta solo si método_pago es tarjeta */}
            {venta.metodo_pago === "tarjeta" && (
              <div className="col-md-4">
                <label className="form-label">Número de tarjeta</label>
                <input
                  type="text"
                  name="numero_tarjeta"
                  className="form-control"
                  value={venta.numero_tarjeta || ""}
                  onChange={handleChange}
                  required
                />
              </div>
            )}

            <div className="col-md-4">
              <label className="form-label">Fecha</label>
              <input
                type="datetime-local"
                name="fecha_venta"
                className="form-control"
                value={fechaLocal}
                onChange={handleChange}
                required
              />
            </div>
          </div>
          <div className="mt-3">
            <button type="submit" className="btn btn-success me-2">
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditarVenta;
