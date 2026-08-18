import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import "bootstrap/dist/css/bootstrap.min.css";

function EditarEstadoVenta() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [venta, setVenta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  // Estado para el formulario
  const [estadoPago, setEstadoPago] = useState("");
  const [metodoPago, setMetodoPago] = useState("");
  
  // Estado para rastrear cambios
  const [cambios, setCambios] = useState({
    estado: false,
    metodo: false
  });
  
  // Historial de cambios
  const [historial, setHistorial] = useState([]);
  
  // Opciones para el select de estado
  const opcionesEstado = [
    { valor: "pagado", texto: "Pagado", icono: "✓", color: "success" },
    { valor: "pendiente", texto: "Pendiente", icono: "⏱", color: "warning" },
    { valor: "cancelado", texto: "Cancelado", icono: "✗", color: "danger" }
  ];

  // Opciones para el select de método de pago - ACTUALIZADAS
  const opcionesMetodoPago = [
    { valor: "efectivo", texto: "Efectivo", icono: "💵", color: "success" },
    { valor: "tarjeta", texto: "Tarjeta", icono: "💳", color: "info" },
    { valor: "mixto", texto: "Mixto", icono: "🔄", color: "primary" }
  ];

  // Cargar datos de la venta
  useEffect(() => {
    cargarVenta();
  }, [id]);

  // Detectar cambios en los campos
  useEffect(() => {
    if (venta) {
      setCambios({
        estado: estadoPago !== venta.estado_pago,
        metodo: metodoPago !== venta.metodo_pago
      });
    }
  }, [estadoPago, metodoPago, venta]);

  const cargarVenta = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/obtener_venta_por_id.php?id=${id}`);
      
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Datos de la venta:", data);
      
      if (data.success && data.venta) {
        const ventaData = data.venta;
        
        setVenta(ventaData);
        setEstadoPago(ventaData.estado_pago);
        setMetodoPago(ventaData.metodo_pago || "");
        
        setHistorial([
          {
            id: 1,
            fecha: ventaData.fecha_venta_formateada,
            usuario: "Sistema",
            estado_anterior: ventaData.estado_pago,
            estado_nuevo: ventaData.estado_pago,
            metodo_anterior: ventaData.metodo_pago,
            metodo_nuevo: ventaData.metodo_pago,
            comentario: "Venta registrada"
          }
        ]);
      } else {
        alert(`Error: ${data.message || data.error || "No se pudo cargar la venta"}`);
      }
    } catch (error) {
      console.error("Error al cargar venta:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Guardar cambios
  const guardarCambios = async () => {
    if (!venta) return;
    
    // Verificar si hay cambios
    if (!cambios.estado && !cambios.metodo) {
      alert("No hay cambios para guardar");
      return;
    }
    
    setSaving(true);
    setError(null);
    
    try {
      // Construir objeto solo con los campos que cambiaron
      const datosActualizar = {
        id: venta.id
      };
      
      // Solo agregar estado_pago si cambió
      if (cambios.estado) {
        datosActualizar.estado_pago = estadoPago;
      }
      
      // Solo agregar metodo_pago si cambió
      if (cambios.metodo) {
        datosActualizar.metodo_pago = metodoPago;
      }
      
      console.log("Enviando datos:", JSON.stringify(datosActualizar, null, 2));
      
      const response = await fetch('/api/actualizar_estado_venta.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(datosActualizar)
      });
      
      // Verificar si la respuesta es JSON válido
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error("Respuesta no JSON:", text);
        throw new Error("El servidor no devolvió una respuesta JSON válida");
      }
      
      const data = await response.json();
      console.log("Respuesta del servidor:", data);
      
      if (data.success) {
        setSuccess(true);
        
        // Registrar cambios para el historial
        let cambiosTexto = [];
        if (cambios.estado) {
          cambiosTexto.push(`estado: ${venta.estado_pago} → ${estadoPago}`);
        }
        if (cambios.metodo) {
          cambiosTexto.push(`método: ${venta.metodo_pago || 'no especificado'} → ${metodoPago}`);
        }
        
        // Actualizar venta local
        setVenta({
          ...venta,
          estado_pago: cambios.estado ? estadoPago : venta.estado_pago,
          metodo_pago: cambios.metodo ? metodoPago : venta.metodo_pago
        });
        
        // Agregar al historial
        const nuevoHistorial = {
          id: Date.now(),
          fecha: new Date().toLocaleString('es-MX'),
          usuario: "Usuario Actual",
          estado_anterior: venta.estado_pago,
          estado_nuevo: cambios.estado ? estadoPago : venta.estado_pago,
          metodo_anterior: venta.metodo_pago,
          metodo_nuevo: cambios.metodo ? metodoPago : venta.metodo_pago,
          comentario: `Cambios: ${cambiosTexto.join(', ')}`
        };
        
        setHistorial([nuevoHistorial, ...historial]);
        
        // Mostrar mensaje de éxito
        alert(`✅ ${data.message || "Venta actualizada correctamente"}`);
        
        setTimeout(() => setSuccess(false), 3000);
      } else {
        alert(`❌ Error: ${data.message || data.error || "Error desconocido"}`);
        setError(data.message || data.error);
      }
    } catch (error) {
      console.error("Error al guardar:", error);
      setError(error.message);
      alert(`Error de conexión: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Función para restablecer los valores
  const restablecerValores = () => {
    if (venta) {
      setEstadoPago(venta.estado_pago);
      setMetodoPago(venta.metodo_pago || "");
    }
  };

  // Formatear moneda
  const formatoMoneda = (valor) => {
    if (valor === null || valor === undefined) return '$0.00';
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2
    }).format(valor);
  };

  // Renderizar badge de estado
  const renderEstadoBadge = (estado, size = "normal") => {
    const opcion = opcionesEstado.find(op => op.valor === estado) || opcionesEstado[1];
    const fontSize = size === "small" ? "0.8rem" : "1rem";
    
    return (
      <span className={`badge bg-${opcion.color} d-inline-flex align-items-center`} style={{ fontSize }}>
        <span className="me-1">{opcion.icono}</span>
        <span>{opcion.texto}</span>
      </span>
    );
  };

  // Renderizar badge de método de pago - ACTUALIZADO
  const renderMetodoBadge = (metodo, size = "normal") => {
    const metodoInfo = opcionesMetodoPago.find(op => op.valor === metodo) || 
      { bg: 'secondary', icono: '💰', texto: metodo || 'No especificado', color: 'secondary' };
    const fontSize = size === "small" ? "0.8rem" : "1rem";
    
    return (
      <span className={`badge bg-${metodoInfo.bg} d-inline-flex align-items-center`} style={{ fontSize }}>
        <span className="me-1">{metodoInfo.icono}</span>
        <span>{metodoInfo.texto}</span>
      </span>
    );
  };

  if (loading) {
    return (
      <div className="d-flex">
        <Sidebar />
        <div className="container-fluid p-4">
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Cargando...</span>
            </div>
            <p className="mt-3">Cargando información de la venta...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!venta) {
    return (
      <div className="d-flex">
        <Sidebar />
        <div className="container-fluid p-4">
          <div className="alert alert-danger">
            <h4>Error</h4>
            <p>No se pudo cargar la información de la venta</p>
            <button 
              className="btn btn-primary mt-2"
              onClick={() => navigate('/TablaV')}
            >
              Volver a Ventas
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex">
      <Sidebar />
      <div className="container-fluid p-4">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2>
              <i className="bi bi-pencil-square me-2 text-warning"></i>
              Editar Venta
            </h2>
            <p className="text-muted mb-0">
              Folio: <strong>{venta.folio}</strong> | 
              Fecha: <strong>{venta.fecha_venta_formateada}</strong>
            </p>
          </div>
          <div>
            <button 
              className="btn btn-outline-primary"
              onClick={() => navigate('/TablaV')}
            >
              <i className="bi bi-arrow-left me-2"></i>
              Volver a Ventas
            </button>
          </div>
        </div>

        {/* Mensajes de éxito/error */}
        {success && (
          <div className="alert alert-success alert-dismissible fade show" role="alert">
            <i className="bi bi-check-circle me-2"></i>
            <strong>¡Éxito!</strong> La venta se actualizó correctamente
            <button 
              type="button" 
              className="btn-close" 
              onClick={() => setSuccess(false)}
            ></button>
          </div>
        )}

        {error && (
          <div className="alert alert-danger alert-dismissible fade show" role="alert">
            <i className="bi bi-exclamation-triangle me-2"></i>
            <strong>Error:</strong> {error}
            <button 
              type="button" 
              className="btn-close" 
              onClick={() => setError(null)}
            ></button>
          </div>
        )}

        <div className="row">
          {/* Columna izquierda - Formulario */}
          <div className="col-md-8">
            {/* Tarjeta de información del cliente */}
            <div className="card mb-4">
              <div className="card-header bg-light">
                <h5 className="mb-0">
                  <i className="bi bi-person me-2"></i>
                  Información del Cliente
                </h5>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-6">
                    <p className="mb-1"><strong>Nombre:</strong> {venta.cliente?.nombre || venta.cliente}</p>
                    <p className="mb-1"><strong>Teléfono:</strong> {venta.cliente?.telefono || venta.cliente_telefono || 'No registrado'}</p>
                  </div>
                  <div className="col-md-6">
                    <p className="mb-1"><strong>Email:</strong> {venta.cliente?.email || 'No registrado'}</p>
                    <p className="mb-1"><strong>Dirección:</strong> {venta.cliente?.direccion || 'No registrada'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tarjeta de edición */}
            <div className="card mb-4">
              <div className="card-header bg-warning text-white">
                <h5 className="mb-0">
                  <i className="bi bi-pencil-square me-2"></i>
                  Editar Información de Pago
                </h5>
              </div>
              <div className="card-body">
                <div className="row">
                  {/* Estado actual */}
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-bold">Estado Actual:</label>
                    <div className="p-2 border rounded">
                      {renderEstadoBadge(venta.estado_pago, "large")}
                    </div>
                  </div>
                  
                  {/* Método actual */}
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-bold">Método de Pago Actual:</label>
                    <div className="p-2 border rounded">
                      {renderMetodoBadge(venta.metodo_pago, "large")}
                    </div>
                  </div>
                </div>

                <hr className="my-3" />

                <div className="row">
                  {/* Nuevo estado */}
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-bold">
                      <i className="bi bi-arrow-right me-1"></i>
                      Nuevo Estado:
                    </label>
                    <select 
                      className="form-select"
                      value={estadoPago}
                      onChange={(e) => setEstadoPago(e.target.value)}
                    >
                      <option value="">Seleccionar estado</option>
                      {opcionesEstado.map(op => (
                        <option key={op.valor} value={op.valor}>
                          {op.icono} {op.texto}
                        </option>
                      ))}
                    </select>
                    {cambios.estado && (
                      <div className="mt-2">
                        <span className="badge bg-warning text-dark">
                          Cambio pendiente: {renderEstadoBadge(estadoPago, "small")}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Nuevo método de pago - ACTUALIZADO */}
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-bold">
                      <i className="bi bi-arrow-right me-1"></i>
                      Nuevo Método de Pago:
                    </label>
                    <select 
                      className="form-select"
                      value={metodoPago}
                      onChange={(e) => setMetodoPago(e.target.value)}
                    >
                      <option value="">Seleccionar método</option>
                      {opcionesMetodoPago.map(op => (
                        <option key={op.valor} value={op.valor}>
                          {op.icono} {op.texto}
                        </option>
                      ))}
                    </select>
                    {cambios.metodo && (
                      <div className="mt-2">
                        <span className="badge bg-warning text-dark">
                          Cambio pendiente: {renderMetodoBadge(metodoPago, "small")}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Botones de acción */}
                <div className="mt-4">
                  <button 
                    className="btn btn-warning me-2"
                    onClick={guardarCambios}
                    disabled={saving || (!cambios.estado && !cambios.metodo)}
                  >
                    {saving ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Guardando...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-save me-2"></i>
                        Actualizar Venta
                        {(cambios.estado || cambios.metodo) && (
                          <span className="badge bg-light text-dark ms-2">
                            {cambios.estado && cambios.metodo ? '2 cambios' : '1 cambio'}
                          </span>
                        )}
                      </>
                    )}
                  </button>
                  <button 
                    className="btn btn-outline-secondary"
                    onClick={restablecerValores}
                    disabled={saving || (!cambios.estado && !cambios.metodo)}
                  >
                    <i className="bi bi-arrow-counterclockwise me-2"></i>
                    Restablecer
                  </button>
                </div>
              </div>
            </div>

            {/* Detalle de productos */}
            <div className="card mb-4">
              <div className="card-header bg-light">
                <h5 className="mb-0">
                  <i className="bi bi-box me-2"></i>
                  Productos de la Venta
                </h5>
              </div>
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table table-sm">
                    <thead className="table-light">
                      <tr>
                        <th>Producto</th>
                        <th className="text-center">Cantidad</th>
                        <th className="text-end">P/U</th>
                        <th className="text-end">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {venta.detalles && venta.detalles.length > 0 ? (
                        venta.detalles.map((detalle, index) => (
                          <tr key={index}>
                            <td>{detalle.nombre_producto}</td>
                            <td className="text-center">
                              {detalle.cantidad} {detalle.unidad_medida}
                            </td>
                            <td className="text-end">{formatoMoneda(detalle.precio_unitario)}</td>
                            <td className="text-end">{formatoMoneda(detalle.precio_total)}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="4" className="text-center text-muted">
                            No hay productos en esta venta
                          </td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot className="table-secondary">
                      <tr>
                        <td colSpan="3" className="text-end fw-bold">TOTAL:</td>
                        <td className="text-end fw-bold text-success">
                          {formatoMoneda(venta.total_venta)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Columna derecha - Historial y resumen */}
          <div className="col-md-4">
            {/* Tarjeta de resumen */}
            <div className="card mb-4">
              <div className="card-header bg-info text-white">
                <h5 className="mb-0">
                  <i className="bi bi-info-circle me-2"></i>
                  Resumen de Venta
                </h5>
              </div>
              <div className="card-body">
                <ul className="list-group list-group-flush">
                  <li className="list-group-item d-flex justify-content-between align-items-center">
                    <span>Folio:</span>
                    <strong>{venta.folio}</strong>
                  </li>
                  <li className="list-group-item d-flex justify-content-between align-items-center">
                    <span>Fecha:</span>
                    <strong>{venta.fecha_venta_formateada}</strong>
                  </li>
                  <li className="list-group-item d-flex justify-content-between align-items-center">
                    <span>Estado actual:</span>
                    {renderEstadoBadge(venta.estado_pago)}
                  </li>
                  <li className="list-group-item d-flex justify-content-between align-items-center">
                    <span>Método de pago:</span>
                    {renderMetodoBadge(venta.metodo_pago)}
                  </li>
                  <li className="list-group-item d-flex justify-content-between align-items-center">
                    <span>Total productos:</span>
                    <strong>{venta.total_productos || 0} items</strong>
                  </li>
                  <li className="list-group-item d-flex justify-content-between align-items-center">
                    <span>Total venta:</span>
                    <strong className="text-success h5 mb-0">
                      {formatoMoneda(venta.total_venta)}
                    </strong>
                  </li>
                </ul>
              </div>
            </div>

            {/* Historial de cambios */}
            <div className="card">
              <div className="card-header bg-secondary text-white">
                <h5 className="mb-0">
                  <i className="bi bi-clock-history me-2"></i>
                  Historial de Cambios
                </h5>
              </div>
              <div className="card-body" style={{ maxHeight: "400px", overflowY: "auto" }}>
                {historial.length === 0 ? (
                  <p className="text-muted text-center">No hay historial disponible</p>
                ) : (
                  <div className="timeline">
                    {historial.map((item, index) => (
                      <div key={item.id || index} className="mb-3 pb-2 border-bottom">
                        <div className="d-flex justify-content-between">
                          <small className="text-muted">
                            <i className="bi bi-clock me-1"></i>
                            {item.fecha}
                          </small>
                          <small className="text-primary">
                            <i className="bi bi-person me-1"></i>
                            {item.usuario}
                          </small>
                        </div>
                        
                        <div className="mt-2">
                          {item.estado_anterior !== item.estado_nuevo && (
                            <div className="mb-1">
                              <span className="badge bg-light text-dark me-2">Estado:</span>
                              {renderEstadoBadge(item.estado_anterior, "small")}
                              <i className="bi bi-arrow-right mx-2"></i>
                              {renderEstadoBadge(item.estado_nuevo, "small")}
                            </div>
                          )}
                          
                          {item.metodo_anterior !== item.metodo_nuevo && (
                            <div className="mb-1">
                              <span className="badge bg-light text-dark me-2">Método:</span>
                              {renderMetodoBadge(item.metodo_anterior, "small")}
                              <i className="bi bi-arrow-right mx-2"></i>
                              {renderMetodoBadge(item.metodo_nuevo, "small")}
                            </div>
                          )}
                          
                          {item.comentario && (
                            <div className="mt-2 p-2 bg-light rounded">
                              <small>
                                <i className="bi bi-chat-quote me-1"></i>
                                {item.comentario}
                              </small>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EditarEstadoVenta;