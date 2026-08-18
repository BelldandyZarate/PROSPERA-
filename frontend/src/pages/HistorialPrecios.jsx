import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import "bootstrap/dist/css/bootstrap.min.css";

function HistorialPrecios() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [producto, setProducto] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtroCampo, setFiltroCampo] = useState("todos");
  const [filtroUsuario, setFiltroUsuario] = useState("todos");
  const [orden, setOrden] = useState("desc");
  const [busqueda, setBusqueda] = useState("");
  
  // Estadísticas
  const [estadisticas, setEstadisticas] = useState({
    totalCambios: 0,
    primerCambio: null,
    ultimoCambio: null,
    precioActual: 0,
    precioInicial: 0,
    cambiosPorCampo: {},
    cambiosPorMes: {},
    usuarios: [],
    campos: []
  });

  useEffect(() => {
    cargarDatos();
  }, [id]);

  const cargarDatos = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // 1. Cargar datos del producto
      const productoRes = await fetch(`/api/obtener_producto.php?id=${id}`);
      
      if (!productoRes.ok) {
        throw new Error(`Error HTTP: ${productoRes.status}`);
      }
      
      const productoData = await productoRes.json();
      
      if (!productoData.success) {
        throw new Error(productoData.error || "Error al cargar producto");
      }
      
      setProducto(productoData.data);
      
      // 2. Cargar historial de precios
      const historialRes = await fetch(`/api/obtener_historial_precios.php?id=${id}`);
      
      if (!historialRes.ok) {
        throw new Error(`Error HTTP: ${historialRes.status}`);
      }
      
      const historialData = await historialRes.json();
      
      if (!historialData.success) {
        throw new Error(historialData.error || "Error al cargar historial");
      }
      
      // Ordenar historial por fecha
      const historialOrdenado = [...(historialData.data.historial || [])];
      historialOrdenado.sort((a, b) => {
        return new Date(b.fecha_cambio) - new Date(a.fecha_cambio);
      });
      
      setHistorial(historialOrdenado);
      setEstadisticas(historialData.data.estadisticas || {});
      
    } catch (error) {
      console.error("Error cargando datos:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Formatear fecha
  const formatFecha = (fecha) => {
    if (!fecha) return "N/A";
    
    try {
      const date = new Date(fecha);
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return "Fecha inválida";
    }
  };

  // Obtener tiempo transcurrido
  const getTiempoTranscurrido = (fecha) => {
    if (!fecha) return "";
    
    try {
      const ahora = new Date();
      const fechaCambio = new Date(fecha);
      const diferencia = ahora - fechaCambio;
      
      const segundos = Math.floor(diferencia / 1000);
      const minutos = Math.floor(segundos / 60);
      const horas = Math.floor(minutos / 60);
      const dias = Math.floor(horas / 24);
      
      if (dias > 0) {
        return `Hace ${dias} día${dias > 1 ? 's' : ''}`;
      } else if (horas > 0) {
        return `Hace ${horas} hora${horas > 1 ? 's' : ''}`;
      } else if (minutos > 0) {
        return `Hace ${minutos} minuto${minutos > 1 ? 's' : ''}`;
      } else {
        return "Hace unos momentos";
      }
    } catch (e) {
      return "";
    }
  };

  // Obtener nombre del campo
  const getNombreCampo = (campo) => {
    const nombres = {
      'precio_kilos': 'Precio Compra por Kilo',
      'precio_venderK': 'Precio Venta por Kilo',
      'precio_unidad': 'Precio Compra por Unidad',
      'precio_venderD': 'Precio Venta por Unidad'
    };
    return nombres[campo] || campo;
  };

  // Obtener color según el campo
  const getColorCampo = (campo) => {
    const colores = {
      'precio_kilos': 'primary',
      'precio_venderK': 'success',
      'precio_unidad': 'warning',
      'precio_venderD': 'info'
    };
    return colores[campo] || 'secondary';
  };

  // Obtener icono según el campo
  const getIconoCampo = (campo) => {
    const iconos = {
      'precio_kilos': 'bi-cart',
      'precio_venderK': 'bi-cash-stack',
      'precio_unidad': 'bi-box',
      'precio_venderD': 'bi-currency-dollar'
    };
    return iconos[campo] || 'bi-pencil';
  };

  // Filtrar historial
  const getHistorialFiltrado = () => {
    let filtrado = [...historial];
    
    // Filtrar por campo
    if (filtroCampo !== "todos") {
      filtrado = filtrado.filter(item => item.campo_cambiado === filtroCampo);
    }
    
    // Filtrar por usuario
    if (filtroUsuario !== "todos") {
      filtrado = filtrado.filter(item => item.usuario === filtroUsuario);
    }
    
    // Filtrar por búsqueda (motivo o campo)
    if (busqueda.trim() !== "") {
      const busquedaLower = busqueda.toLowerCase();
      filtrado = filtrado.filter(item => 
        (item.motivo && item.motivo.toLowerCase().includes(busquedaLower)) ||
        (item.campo_nombre && item.campo_nombre.toLowerCase().includes(busquedaLower)) ||
        (item.usuario && item.usuario.toLowerCase().includes(busquedaLower))
      );
    }
    
    // Ordenar
    filtrado.sort((a, b) => {
      const fechaA = new Date(a.fecha_cambio);
      const fechaB = new Date(b.fecha_cambio);
      return orden === "desc" ? fechaB - fechaA : fechaA - fechaB;
    });
    
    return filtrado;
  };

  // Exportar a CSV
  const exportarCSV = () => {
    if (historial.length === 0) return;
    
    const headers = [
      'ID',
      'Fecha Cambio',
      'Campo Modificado',
      'Precio Anterior',
      'Precio Nuevo',
      'Diferencia',
      '% Cambio',
      'Usuario',
      'Motivo'
    ];
    
    const rows = getHistorialFiltrado().map(item => [
      item.id,
      formatFecha(item.fecha_cambio),
      getNombreCampo(item.campo_cambiado),
      `$${item.precio_anterior.toFixed(2)}`,
      `$${item.precio_nuevo.toFixed(2)}`,
      `$${item.diferencia.toFixed(2)}`,
      `${item.porcentaje_cambio.toFixed(2)}%`,
      item.usuario || 'Sistema',
      item.motivo || ''
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `historial_precios_${producto?.producto || id}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Renderizar estado de carga
  if (loading) {
    return (
      <div className="d-flex">
        <Sidebar />
        <div className="container-fluid p-4">
          <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
            <div className="text-center">
              <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }} role="status">
                <span className="visually-hidden">Cargando...</span>
              </div>
              <h4 className="mt-3">Cargando historial...</h4>
              <p className="text-muted">Por favor espere</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Renderizar error
  if (error) {
    return (
      <div className="d-flex">
        <Sidebar />
        <div className="container-fluid p-4">
          <div className="alert alert-danger">
            <h5><i className="bi bi-exclamation-triangle me-2"></i>Error</h5>
            <p>{error}</p>
            <button className="btn btn-primary" onClick={() => navigate(-1)}>
              <i className="bi bi-arrow-left me-2"></i>Volver
            </button>
          </div>
        </div>
      </div>
    );
  }

  const historialFiltrado = getHistorialFiltrado();
  const camposDisponibles = estadisticas.campos || [];
  const usuariosDisponibles = estadisticas.usuarios || [];

  return (
    <div className="d-flex">
      <Sidebar />
      
      <div className="container-fluid p-4">
        {/* Encabezado */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2><i className="bi bi-clock-history text-primary me-2"></i>Historial de Precios</h2>
            <p className="text-muted mb-0">
              Producto: <strong>{producto?.producto}</strong> | ID: {id}
            </p>
          </div>
          <div>
            <button className="btn btn-outline-secondary me-2" onClick={() => navigate(-1)}>
              <i className="bi bi-arrow-left me-1"></i>Volver
            </button>
            <Link to={`/editarP/${id}`} className="btn btn-warning">
              <i className="bi bi-pencil me-1"></i>Editar Producto
            </Link>
          </div>
        </div>

        {/* Resumen del producto */}
        <div className="row mb-4">
          <div className="col-md-4">
            <div className="card h-100">
              <div className="card-header bg-primary text-white">
                <i className="bi bi-info-circle me-2"></i>Información del Producto
              </div>
              <div className="card-body">
                <p><strong>Nombre:</strong> {producto?.producto}</p>
                <p>
                  <strong>Tipo:</strong>{' '}
                  <span className={`badge ${producto?.tipo_producto === 'verduras_frutas' ? 'bg-success' : 'bg-info'}`}>
                    {producto?.tipo_producto === 'verduras_frutas' ? 'Verduras/Frutas' : 'Otros'}
                  </span>
                </p>
                <p><strong>Precio actual:</strong> ${estadisticas.precioActual.toFixed(2)}</p>
                <p><strong>Fecha creación:</strong> {formatFecha(producto?.fecha_creacion)}</p>
              </div>
            </div>
          </div>
          
          <div className="col-md-4">
            <div className="card h-100">
              <div className="card-header bg-success text-white">
                <i className="bi bi-bar-chart me-2"></i>Estadísticas
              </div>
              <div className="card-body">
                <div className="row text-center">
                  <div className="col-6 mb-3">
                    <div className="p-2 border rounded">
                      <small className="text-muted">Total cambios</small>
                      <h3 className="mb-0">{estadisticas.totalCambios}</h3>
                    </div>
                  </div>
                  <div className="col-6 mb-3">
                    <div className="p-2 border rounded">
                      <small className="text-muted">Precio inicial</small>
                      <h4 className="mb-0">${estadisticas.precioInicial.toFixed(2)}</h4>
                    </div>
                  </div>
                  <div className="col-12">
                    <div className="p-2 border rounded">
                      <small className="text-muted">Variación total</small>
                      <h4 className={`mb-0 ${estadisticas.precioActual > estadisticas.precioInicial ? 'text-success' : 'text-danger'}`}>
                        ${(estadisticas.precioActual - estadisticas.precioInicial).toFixed(2)} 
                        ({estadisticas.precioInicial > 0 ? ((estadisticas.precioActual - estadisticas.precioInicial) / estadisticas.precioInicial * 100).toFixed(1) : 0}%)
                      </h4>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="col-md-4">
            <div className="card h-100">
              <div className="card-header bg-info text-white">
                <i className="bi bi-calendar3 me-2"></i>Fechas
              </div>
              <div className="card-body">
                <p><strong>Primer cambio:</strong> {formatFecha(estadisticas.primerCambio) || 'Sin cambios'}</p>
                <p><strong>Último cambio:</strong> {formatFecha(estadisticas.ultimoCambio) || 'Sin cambios'}</p>
                <p><strong>Última actualización:</strong> {formatFecha(producto?.fecha_actualizacion)}</p>
                <div className="mt-3">
                  <button className="btn btn-sm btn-outline-primary w-100" onClick={cargarDatos}>
                    <i className="bi bi-arrow-clockwise me-1"></i>Actualizar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="card mb-4">
          <div className="card-header bg-light">
            <h5 className="mb-0"><i className="bi bi-funnel me-2"></i>Filtros</h5>
          </div>
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-3">
                <label className="form-label">Campo modificado</label>
                <select className="form-select" value={filtroCampo} onChange={(e) => setFiltroCampo(e.target.value)}>
                  <option value="todos">Todos los campos</option>
                  {camposDisponibles.map(campo => (
                    <option key={campo} value={campo}>{getNombreCampo(campo)}</option>
                  ))}
                </select>
              </div>
              
              <div className="col-md-3">
                <label className="form-label">Usuario</label>
                <select className="form-select" value={filtroUsuario} onChange={(e) => setFiltroUsuario(e.target.value)}>
                  <option value="todos">Todos los usuarios</option>
                  {usuariosDisponibles.map(usuario => (
                    <option key={usuario} value={usuario}>{usuario}</option>
                  ))}
                </select>
              </div>
              
              <div className="col-md-3">
                <label className="form-label">Ordenar por fecha</label>
                <select className="form-select" value={orden} onChange={(e) => setOrden(e.target.value)}>
                  <option value="desc">Más reciente primero</option>
                  <option value="asc">Más antiguo primero</option>
                </select>
              </div>
              
              <div className="col-md-3">
                <label className="form-label">Buscar</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Buscar en motivo, campo o usuario..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                />
              </div>
              
              <div className="col-12">
                <div className="d-flex justify-content-between align-items-center">
                  <small className="text-muted">
                    Mostrando {historialFiltrado.length} de {historial.length} cambios
                  </small>
                  <div>
                    <button className="btn btn-sm btn-outline-secondary me-2" onClick={exportarCSV}>
                      <i className="bi bi-download me-1"></i>Exportar CSV
                    </button>
                    <button 
                      className="btn btn-sm btn-outline-danger" 
                      onClick={() => {
                        setFiltroCampo("todos");
                        setFiltroUsuario("todos");
                        setBusqueda("");
                        setOrden("desc");
                      }}
                    >
                      <i className="bi bi-x-circle me-1"></i>Limpiar filtros
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabla de historial */}
        <div className="card">
          <div className="card-header bg-light d-flex justify-content-between align-items-center">
            <h5 className="mb-0"><i className="bi bi-list-check me-2"></i>Registro de Cambios</h5>
            <span className="badge bg-primary">{historialFiltrado.length} registros</span>
          </div>
          
          <div className="card-body p-0">
            {historialFiltrado.length === 0 ? (
              <div className="text-center py-5">
                <i className="bi bi-inbox fs-1 text-muted mb-3"></i>
                <h4>No hay registros</h4>
                <p className="text-muted">
                  {historial.length > 0 
                    ? "No se encontraron resultados con los filtros aplicados"
                    : "No hay cambios de precio registrados para este producto"}
                </p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>#</th>
                      <th>Fecha</th>
                      <th>Campo</th>
                      <th>Precio Anterior</th>
                      <th>Precio Nuevo</th>
                      <th>Cambio</th>
                      <th>Usuario</th>
                      <th>Motivo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historialFiltrado.map((item, index) => {
                      const colorCampo = getColorCampo(item.campo_cambiado);
                      const esAumento = item.diferencia > 0;
                      const esDisminucion = item.diferencia < 0;
                      
                      return (
                        <tr key={item.id}>
                          <td>{index + 1}</td>
                          <td>
                            <div>{formatFecha(item.fecha_cambio)}</div>
                            <small className="text-muted">{getTiempoTranscurrido(item.fecha_cambio)}</small>
                          </td>
                          <td>
                            <span className={`badge bg-${colorCampo}`}>
                              <i className={`bi ${getIconoCampo(item.campo_cambiado)} me-1`}></i>
                              {getNombreCampo(item.campo_cambiado)}
                            </span>
                          </td>
                          <td>
                            <span className="text-muted">${item.precio_anterior.toFixed(2)}</span>
                          </td>
                          <td>
                            <strong className={esAumento ? 'text-success' : esDisminucion ? 'text-danger' : ''}>
                              ${item.precio_nuevo.toFixed(2)}
                            </strong>
                          </td>
                          <td>
                            <div>
                              <span className={`badge ${esAumento ? 'bg-success' : esDisminucion ? 'bg-danger' : 'bg-secondary'}`}>
                                {esAumento ? '+' : ''}${Math.abs(item.diferencia).toFixed(2)}
                              </span>
                              <br />
                              <small className="text-muted">
                                {item.porcentaje_cambio.toFixed(2)}%
                              </small>
                            </div>
                          </td>
                          <td>
                            <span className="badge bg-dark">
                              <i className="bi bi-person me-1"></i>
                              {item.usuario || 'Sistema'}
                            </span>
                          </td>
                          <td>
                            <div className="text-truncate" style={{ maxWidth: '200px' }} title={item.motivo || ''}>
                              {item.motivo || <span className="text-muted fst-italic">Sin motivo</span>}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          
          <div className="card-footer bg-light">
            <div className="d-flex justify-content-between align-items-center">
              <small className="text-muted">
                Historial generado automáticamente | {new Date().toLocaleString()}
              </small>
              <div className="text-end">
                <small className="text-muted">
                  Producto: {producto?.producto} | ID: {id}
                </small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HistorialPrecios;