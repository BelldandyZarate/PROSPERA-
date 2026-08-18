import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import "bootstrap/dist/css/bootstrap.min.css";
import { useNavigate } from "react-router-dom";

function Sobrantes() {
  const [sobrantes, setSobrantes] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [busquedaNombre, setBusquedaNombre] = useState("");
  const [busquedaTipo, setBusquedaTipo] = useState("");
  const [busquedaEstado, setBusquedaEstado] = useState("pendiente");
  const [paginaActual, setPaginaActual] = useState(1);
  const [estadisticas, setEstadisticas] = useState(null);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [totalFilas, setTotalFilas] = useState(0);
  const [mostrarTodos, setMostrarTodos] = useState(false);
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  
  const productosPorPagina = 20;
  const navigate = useNavigate();

  const tiposProducto = [
    { value: "", label: "Todos los tipos" },
    { value: "verduras_frutas", label: "Verduras/Frutas" },
    { value: "otro", label: "Otros Productos" }
  ];

  const estadosSobrante = [
    { value: "pendiente", label: "Pendientes" },
    { value: "procesado", label: "Procesados" },
    { value: "descartado", label: "Descartados" }
  ];

  useEffect(() => {
    cargarSobrantes();
  }, [paginaActual, busquedaEstado, mostrarTodos]);

  const cargarSobrantes = async () => {
    setCargando(true);
    try {
      let url = `/api/obtener_sobrantes.php?pagina=${paginaActual}&por_pagina=${productosPorPagina}`;
      
      if (mostrarTodos) {
        url += `&mostrar_todos=true`;
      } else {
        url += `&estado=${busquedaEstado}`;
      }
      
      if (busquedaTipo) {
        url += `&tipo_producto=${busquedaTipo}`;
      }
      
      if (fechaDesde) {
        url += `&fecha_desde=${fechaDesde}`;
      }
      
      if (fechaHasta) {
        url += `&fecha_hasta=${fechaHasta}`;
      }
      
      url += `&t=${Date.now()}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setSobrantes(data.data || []);
        setEstadisticas(data.estadisticas || null);
        setTotalPaginas(data.paginacion?.total_paginas || 1);
        setTotalFilas(data.paginacion?.total_filas || 0);
      } else {
        console.error("Error al cargar sobrantes:", data.message);
        setSobrantes([]);
      }
    } catch (error) {
      console.error("Error en la solicitud:", error);
      setSobrantes([]);
    } finally {
      setCargando(false);
    }
  };

  const productosFiltrados = sobrantes.filter((producto) => {
    const nombreCoincide = busquedaNombre 
      ? producto.producto.toLowerCase().includes(busquedaNombre.toLowerCase()) ||
        (producto.producto_original_nombre && 
         producto.producto_original_nombre.toLowerCase().includes(busquedaNombre.toLowerCase()))
      : true;

    const tipoCoincide = busquedaTipo 
      ? producto.tipo_producto === busquedaTipo 
      : true;

    return nombreCoincide && tipoCoincide;
  });

  const cambiarPagina = (nuevaPagina) => {
    if (nuevaPagina >= 1 && nuevaPagina <= totalPaginas) {
      setPaginaActual(nuevaPagina);
    }
  };

  const handleExportar = () => {
    if (sobrantes.length === 0) {
      alert("⚠️ No hay productos para exportar");
      return;
    }

    try {
      const headers = [
        "ID", "ID Producto", "Producto", "Producto Original", "Tipo", 
        "Kilos", "Unidades", "Precio por Kilo", "Precio por Unidad",
        "Valor Total", "Fecha Recibimiento", "Días en Inventario",
        "Estado", "Motivo", "Observaciones", "Usuario", "Fecha Sobrante", "Fecha Procesado"
      ];

      const csvData = sobrantes.map(producto => [
        producto.id,
        producto.producto_id,
        `"${producto.producto}"`,
        `"${producto.producto_original || ''}"`,
        producto.tipo_producto === 'verduras_frutas' ? 'Verduras/Frutas' : 'Otros',
        producto.kilos || '0.00',
        producto.unidades || '0',
        producto.precio_kilos || '0.00',
        producto.precio_unidad || '0.00',
        producto.valor_total || '0.00',
        producto.fecha_recibimiento || '',
        producto.dias_en_inventario || '0',
        producto.estado || 'pendiente',
        `"${producto.motivo || ''}"`,
        `"${producto.observaciones || ''}"`,
        `"${producto.usuario_nombre || ''}"`,
        producto.fecha_sobrante || '',
        producto.fecha_procesado || ''
      ]);

      const csvContent = [
        headers.join(','),
        ...csvData.map(row => row.join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `sobrantes_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      alert("✅ Archivo CSV exportado correctamente");
    } catch (error) {
      console.error("Error exportando CSV:", error);
      alert("❌ Error al exportar el archivo");
    }
  };

  const obtenerEtiquetaEstado = (estado) => {
    const estados = {
      'pendiente': { label: 'Pendiente', clase: 'warning' },
      'procesado': { label: 'Procesado', clase: 'success' },
      'descartado': { label: 'Descartado', clase: 'danger' }
    };
    return estados[estado] || { label: estado, clase: 'secondary' };
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return '-';
    try {
      const date = new Date(fecha);
      if (isNaN(date.getTime())) return fecha;
      return date.toLocaleDateString('es-ES');
    } catch (e) {
      return fecha;
    }
  };

  const obtenerCantidadYUnidad = (producto) => {
    if (producto.tipo_producto === 'verduras_frutas' && parseFloat(producto.kilos) > 0) {
      return `${parseFloat(producto.kilos).toFixed(2)} kg`;
    } else if (parseInt(producto.unidades) > 0) {
      return `${parseInt(producto.unidades)} unid.`;
    } else {
      return "0.00";
    }
  };

  const formatearMoneda = (valor) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(valor || 0);
  };

  const limpiarFiltros = () => {
    setBusquedaNombre("");
    setBusquedaTipo("");
    setFechaDesde("");
    setFechaHasta("");
    if (mostrarTodos) {
      setMostrarTodos(false);
      setBusquedaEstado("pendiente");
    }
    setPaginaActual(1);
  };

  const aplicarFiltros = () => {
    setPaginaActual(1);
    cargarSobrantes();
  };

  return (
    <div className="d-flex">
      <Sidebar />
      <div className="container-fluid p-4">
        {/* Título y botones */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="mb-0">
            <span className="me-2">📦</span>
            Producto no apto para consumo
          </h2>
          <div>
            <button 
              className="btn btn-outline-secondary me-2"
              onClick={cargarSobrantes}
              disabled={cargando}
            >
              {cargando ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Cargando...
                </>
              ) : (
                <>
                  <span className="me-2">🔄</span>
                  Actualizar
                </>
              )}
            </button>
            <button 
              className="btn btn-success me-2"
              onClick={handleExportar}
              disabled={sobrantes.length === 0 || cargando}
            >
              <span className="me-2">📥</span>
              Exportar CSV
            </button>
            <button 
              className="btn btn-outline-primary"
              onClick={() => navigate('/tabla-productos')}
            >
              <span className="me-2">⬅️</span>
              Volver a Productos
            </button>
          </div>
        </div>

        {/* Filtros - Diseño similar a la imagen */}
        <div className="card mb-4 border-light shadow-sm">
          <div className="card-body">
            <h5 className="card-title mb-3 text-muted">Filtros de Búsqueda</h5>
            
            <div className="row g-3">
              {/* Nombre del Producto */}
              <div className="col-md-3">
                <label className="form-label fw-bold">Nombre del Producto</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Buscar por nombre..."
                  value={busquedaNombre}
                  onChange={(e) => setBusquedaNombre(e.target.value)}
                  disabled={cargando}
                />
              </div>
              
              {/* Tipo */}
              <div className="col-md-2">
                <label className="form-label fw-bold">Tipo</label>
                <select
                  className="form-select"
                  value={busquedaTipo}
                  onChange={(e) => setBusquedaTipo(e.target.value)}
                  disabled={cargando}
                >
                  {tiposProducto.map((tipo) => (
                    <option key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Estado - Solo si no está mostrando todos */}
              {!mostrarTodos && (
                <div className="col-md-2">
                  <label className="form-label fw-bold">Estado</label>
                  <select
                    className="form-select"
                    value={busquedaEstado}
                    onChange={(e) => {
                      setBusquedaEstado(e.target.value);
                      setPaginaActual(1);
                    }}
                    disabled={cargando}
                  >
                    {estadosSobrante.map((estado) => (
                      <option key={estado.value} value={estado.value}>
                        {estado.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              {/* Fecha Desde */}
              <div className="col-md-2">
                <label className="form-label fw-bold">Fecha Desde</label>
                <input
                  type="date"
                  className="form-control"
                  value={fechaDesde}
                  onChange={(e) => setFechaDesde(e.target.value)}
                  disabled={cargando}
                  placeholder="dd/mm/aaaa"
                />
              </div>
              
              {/* Fecha Hasta */}
              <div className="col-md-2">
                <label className="form-label fw-bold">Fecha Hasta</label>
                <input
                  type="date"
                  className="form-control"
                  value={fechaHasta}
                  onChange={(e) => setFechaHasta(e.target.value)}
                  disabled={cargando}
                  placeholder="dd/mm/aaaa"
                />
              </div>
              
              {/* Mostrar Todos Checkbox */}
              <div className="col-md-1 d-flex align-items-end">
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="mostrarTodos"
                    checked={mostrarTodos}
                    onChange={(e) => {
                      setMostrarTodos(e.target.checked);
                      setPaginaActual(1);
                    }}
                  />
                  <label className="form-check-label" htmlFor="mostrarTodos">
                    Mostrar Todos
                  </label>
                </div>
              </div>
            </div>
            
            {/* Botones de acción */}
            <div className="row mt-4">
              <div className="col-md-9">
                <button
                  className="btn btn-primary w-100"
                  onClick={aplicarFiltros}
                  disabled={cargando}
                >
                  {cargando ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Aplicando Filtros...
                    </>
                  ) : (
                    <>
                      <span className="me-2">🔍</span>
                      Aplicar Filtros
                    </>
                  )}
                </button>
              </div>
              <div className="col-md-3">
                <button
                  className="btn btn-outline-secondary w-100"
                  onClick={limpiarFiltros}
                  disabled={cargando}
                >
                  <span className="me-2">❌</span>
                  Limpiar Filtros
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Indicador de carga */}
        {cargando && (
          <div className="alert alert-info text-center mb-4">
            <div className="spinner-border spinner-border-sm me-2" role="status"></div>
            Cargando sobrantes...
          </div>
        )}

        {/* Tabla de Productos */}
        <div className="card border-light shadow-sm mb-4">
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th width="60" className="border-bottom">ID</th>
                    <th className="border-bottom">Producto</th>
                    <th width="120" className="border-bottom">Tipo</th>
                    <th width="100" className="border-bottom">Cantidad</th>
                    <th width="120" className="border-bottom">Valor Total</th>
                    <th width="100" className="border-bottom">Días Inv.</th>
                    <th width="120" className="border-bottom">Estado</th>
                    <th width="150" className="border-bottom">Fecha Sobrante</th>
                    <th width="150" className="border-bottom">Usuario</th>
                  </tr>
                </thead>
                <tbody>
                  {!cargando && productosFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="text-center py-5">
                        <div className="mb-3">📭</div>
                        <h5 className="text-muted">No hay productos en sobrantes</h5>
                        <p className="text-muted mb-0">
                          {busquedaNombre || busquedaTipo || fechaDesde || fechaHasta
                            ? "No hay resultados para los filtros aplicados"
                            : "Agrega productos desde la tabla principal usando el botón 'Sobrante'"}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    productosFiltrados.map((producto) => {
                      const estadoInfo = obtenerEtiquetaEstado(producto.estado);
                      
                      return (
                        <tr key={`sobrante-${producto.id}`} className="align-middle">
                          <td>
                            <small className="text-muted">#{producto.id}</small>
                          </td>
                          <td>
                            <div>
                              <strong className="d-block">{producto.producto}</strong>
                              {producto.producto_original_nombre && producto.producto_original_nombre !== producto.producto && (
                                <small className="text-muted d-block">
                                  Original: {producto.producto_original_nombre}
                                </small>
                              )}
                              {producto.motivo && (
                                <small className="text-muted d-block">
                                  <em>Motivo: {producto.motivo}</em>
                                </small>
                              )}
                            </div>
                          </td>
                          <td>
                            <span className={`badge ${producto.tipo_producto === 'verduras_frutas' ? 'bg-success' : 'bg-info'}`}>
                              {producto.tipo_producto === 'verduras_frutas' ? 'V/F' : 'Otros'}
                            </span>
                          </td>
                          <td>
                            <span className="fw-semibold">
                              {obtenerCantidadYUnidad(producto)}
                            </span>
                          </td>
                          <td>
                            <span className="text-danger fw-bold">
                              {formatearMoneda(producto.valor_total)}
                            </span>
                          </td>
                          <td>
                            <span className={`badge ${producto.dias_en_inventario > 30 ? 'bg-danger' : producto.dias_en_inventario > 15 ? 'bg-warning' : 'bg-success'}`}>
                              {producto.dias_en_inventario || 0} días
                            </span>
                          </td>
                          <td>
                            <span className={`badge bg-${estadoInfo.clase}`}>
                              {estadoInfo.label}
                            </span>
                          </td>
                          <td>
                            <small className="text-muted">
                              {producto.fecha_sobrante_formateada || formatearFecha(producto.fecha_sobrante)}
                            </small>
                          </td>
                          <td>
                            <small className="text-muted">
                              {producto.usuario_nombre || '-'}
                            </small>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Información de paginación */}
        {sobrantes.length > 0 && (
          <div className="alert alert-light border shadow-sm mb-4">
            <div className="row align-items-center">
              <div className="col-md-6">
                <strong>
                  <span className="me-2">ℹ️</span>
                  Mostrando:
                </strong> {productosFiltrados.length} productos filtrados
                <br/>
                <strong>Total en BD:</strong> {totalFilas} productos
                {mostrarTodos && <span className="ms-2 text-muted">(mostrando todos los estados)</span>}
              </div>
              <div className="col-md-6 text-end">
                <strong>
                  <span className="me-2">📄</span>
                  Página:
                </strong> {paginaActual} de {totalPaginas}
              </div>
            </div>
          </div>
        )}

        {/* Información adicional - Dos columnas */}
        <div className="row mt-4">
          <div className="col-md-6">
            <div className="card border-light shadow-sm">
              <div className="card-header bg-info text-white">
                <span className="me-2">ℹ️</span>
                <strong>Información sobre Estados</strong>
              </div>
              <div className="card-body">
                <ul className="list-unstyled mb-0">
                  <li className="mb-3">
                    <span className="badge bg-warning me-2">Pendiente</span>
                    <span className="text-muted">Producto que requiere atención</span>
                  </li>
                  <li className="mb-3">
                    <span className="badge bg-success me-2">Procesado</span>
                    <span className="text-muted">Ya fue atendido/revisado</span>
                  </li>
                  <li>
                    <span className="badge bg-danger me-2">Descartado</span>
                    <span className="text-muted">Fue eliminado/desechado</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="col-md-6">
            <div className="card border-light shadow-sm">
              <div className="card-header bg-success text-white">
                <span className="me-2">💡</span>
                <strong>Consejos</strong>
              </div>
              <div className="card-body">
                <ul className="list-unstyled mb-0">
                  <li className="mb-2">
                    <span className="me-2">✅</span>
                    Revise regularmente los productos pendientes
                  </li>
                  <li className="mb-2">
                    <span className="me-2">📊</span>
                    Exporte reportes para análisis de inventario
                  </li>
                  <li>
                    <span className="me-2">🔄</span>
                    Use "Mostrar Todos" para ver el historial completo
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Paginación - Centrada */}
        {totalPaginas > 1 && (
          <div className="d-flex justify-content-center align-items-center mt-4 mb-4">
            <button
              className="btn btn-outline-primary me-2"
              onClick={() => cambiarPagina(paginaActual - 1)}
              disabled={paginaActual === 1 || cargando}
            >
              <span className="me-1">⬅️</span> Anterior
            </button>
            
            <div className="mx-3">
              {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
                let paginaNum;
                if (totalPaginas <= 5) {
                  paginaNum = i + 1;
                } else if (paginaActual <= 3) {
                  paginaNum = i + 1;
                } else if (paginaActual >= totalPaginas - 2) {
                  paginaNum = totalPaginas - 4 + i;
                } else {
                  paginaNum = paginaActual - 2 + i;
                }
                
                return (
                  <button
                    key={paginaNum}
                    className={`btn ${paginaActual === paginaNum ? 'btn-primary' : 'btn-outline-primary'} mx-1`}
                    onClick={() => cambiarPagina(paginaNum)}
                    disabled={cargando}
                  >
                    {paginaNum}
                  </button>
                );
              })}
            </div>
            
            <button
              className="btn btn-outline-primary ms-2"
              onClick={() => cambiarPagina(paginaActual + 1)}
              disabled={paginaActual === totalPaginas || cargando}
            >
              Siguiente <span className="ms-1">➡️</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Sobrantes;