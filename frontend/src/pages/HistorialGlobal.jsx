import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import "bootstrap/dist/css/bootstrap.min.css";
import * as XLSX from 'xlsx'; // Importar librería para Excel

function HistorialGlobal() {
  const navigate = useNavigate();
  const [historial, setHistorial] = useState([]);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtros, setFiltros] = useState({
    producto: "",
    campo: "todos",
    usuario: "todos",
    fechaDesde: "",
    fechaHasta: "",
    busqueda: ""
  });
  const [paginaActual, setPaginaActual] = useState(1);
  const [itemsPorPagina, setItemsPorPagina] = useState(15);
  const [estadisticas, setEstadisticas] = useState({
    totalCambios: 0,
    productosConCambios: 0,
    usuariosActivos: 0,
    cambiosHoy: 0,
    cambiosEsteMes: 0
  });
  const [exportando, setExportando] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Cargar historial global
      const historialRes = await fetch('/api/obtener_historial_global.php');
      
      if (!historialRes.ok) {
        throw new Error(`Error HTTP: ${historialRes.status}`);
      }
      
      const historialData = await historialRes.json();
      
      if (!historialData.success) {
        throw new Error(historialData.error || "Error al cargar historial global");
      }
      
      setHistorial(historialData.data.historial || []);
      setEstadisticas(historialData.data.estadisticas || {});
      
      // Cargar lista de productos
      const productosRes = await fetch('/api/obtener_productos.php');
      
      if (productosRes.ok) {
        const productosData = await productosRes.json();
        if (productosData.success) {
          setProductos(productosData.data || []);
        }
      }
      
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

  // Formatear fecha para Excel (formato más simple)
  const formatFechaExcel = (fecha) => {
    if (!fecha) return "";
    
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
      return "";
    }
  };

  // Obtener nombre del campo
  const getNombreCampo = (campo) => {
    const nombres = {
      'precio_kilos': 'Precio Compra/Kg',
      'precio_venderK': 'Precio Venta/Kg',
      'precio_unidad': 'Precio Compra/Unid',
      'precio_venderD': 'Precio Venta/Unid'
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

  // Obtener usuarios únicos
  const getUsuariosUnicos = () => {
    const usuarios = new Set();
    historial.forEach(item => {
      if (item.usuario) usuarios.add(item.usuario);
    });
    return Array.from(usuarios);
  };

  // Obtener campos únicos
  const getCamposUnicos = () => {
    const campos = new Set();
    historial.forEach(item => {
      if (item.campo_cambiado) campos.add(item.campo_cambiado);
    });
    return Array.from(campos);
  };

  // Filtrar historial
  const getHistorialFiltrado = () => {
    let filtrado = [...historial];
    
    // Filtrar por producto
    if (filtros.producto) {
      filtrado = filtrado.filter(item => 
        item.producto_id == filtros.producto || 
        item.producto_nombre.toLowerCase().includes(filtros.producto.toLowerCase())
      );
    }
    
    // Filtrar por campo
    if (filtros.campo !== "todos") {
      filtrado = filtrado.filter(item => item.campo_cambiado === filtros.campo);
    }
    
    // Filtrar por usuario
    if (filtros.usuario !== "todos") {
      filtrado = filtrado.filter(item => item.usuario === filtros.usuario);
    }
    
    // Filtrar por fecha desde
    if (filtros.fechaDesde) {
      filtrado = filtrado.filter(item => new Date(item.fecha_cambio) >= new Date(filtros.fechaDesde));
    }
    
    // Filtrar por fecha hasta
    if (filtros.fechaHasta) {
      const fechaHasta = new Date(filtros.fechaHasta);
      fechaHasta.setHours(23, 59, 59, 999);
      filtrado = filtrado.filter(item => new Date(item.fecha_cambio) <= fechaHasta);
    }
    
    // Filtrar por búsqueda general
    if (filtros.busqueda.trim() !== "") {
      const busquedaLower = filtros.busqueda.toLowerCase();
      filtrado = filtrado.filter(item => 
        (item.motivo && item.motivo.toLowerCase().includes(busquedaLower)) ||
        (item.producto_nombre && item.producto_nombre.toLowerCase().includes(busquedaLower)) ||
        (item.usuario && item.usuario.toLowerCase().includes(busquedaLower)) ||
        (item.campo_cambiado && getNombreCampo(item.campo_cambiado).toLowerCase().includes(busquedaLower))
      );
    }
    
    return filtrado;
  };

  // Paginación
  const historialFiltrado = getHistorialFiltrado();
  const totalPaginas = Math.ceil(historialFiltrado.length / itemsPorPagina);
  const indiceInicio = (paginaActual - 1) * itemsPorPagina;
  const indiceFin = Math.min(indiceInicio + itemsPorPagina, historialFiltrado.length);
  const historialPagina = historialFiltrado.slice(indiceInicio, indiceFin);

  const cambiarPagina = (pagina) => {
    if (pagina >= 1 && pagina <= totalPaginas) {
      setPaginaActual(pagina);
      window.scrollTo(0, 0);
    }
  };

  // Cambiar items por página
  const cambiarItemsPorPagina = (cantidad) => {
    setItemsPorPagina(cantidad);
    setPaginaActual(1); // Reiniciar a la primera página
  };

  // Generar números de página para mostrar
  const generarNumerosPagina = () => {
    const paginas = [];
    const total = totalPaginas;
    const actual = paginaActual;
    
    // Mostrar máximo 5 páginas
    let inicio = Math.max(1, actual - 2);
    let fin = Math.min(total, inicio + 4);
    
    // Ajustar si estamos cerca del final
    if (fin - inicio < 4) {
      inicio = Math.max(1, fin - 4);
    }
    
    for (let i = inicio; i <= fin; i++) {
      paginas.push(i);
    }
    
    return paginas;
  };

  // Exportar a Excel usando XLSX
  const exportarExcel = () => {
    if (historialFiltrado.length === 0) {
      alert("No hay datos para exportar");
      return;
    }

    setExportando(true);

    try {
      // Preparar los datos para Excel
      const datosExcel = historialFiltrado.map(item => {
        return {
          'ID': item.id,
          'Producto': item.producto_nombre,
          'ID Producto': item.producto_id,
          'Campo Modificado': getNombreCampo(item.campo_cambiado),
          'Precio Anterior': item.precio_anterior,
          'Precio Nuevo': item.precio_nuevo,
          'Diferencia': item.diferencia,
          '% Cambio': item.porcentaje_cambio,
          'Fecha Cambio': formatFechaExcel(item.fecha_cambio),
          'Usuario': item.usuario || 'Sistema',
          'Motivo': item.motivo || ''
        };
      });

      // Calcular estadísticas de exportación
      const totalAumentos = historialFiltrado.filter(item => item.diferencia > 0).length;
      const totalDisminuciones = historialFiltrado.filter(item => item.diferencia < 0).length;
      const totalSinCambio = historialFiltrado.filter(item => item.diferencia === 0).length;
      const diferenciaTotal = historialFiltrado.reduce((sum, item) => sum + item.diferencia, 0);

      // Crear hoja de trabajo principal
      const ws = XLSX.utils.json_to_sheet(datosExcel);
      
      // Aplicar formato de moneda a las columnas numéricas
      const range = XLSX.utils.decode_range(ws['!ref']);
      for (let R = range.s.r; R <= range.e.r; ++R) {
        // Columna E (índice 4): Precio Anterior
        const cellAnterior = { c: 4, r: R };
        const cellRefAnterior = XLSX.utils.encode_cell(cellAnterior);
        
        // Columna F (índice 5): Precio Nuevo
        const cellNuevo = { c: 5, r: R };
        const cellRefNuevo = XLSX.utils.encode_cell(cellNuevo);
        
        // Columna G (índice 6): Diferencia
        const cellDiferencia = { c: 6, r: R };
        const cellRefDiferencia = XLSX.utils.encode_cell(cellDiferencia);

        // Aplicar formato de moneda
        [cellRefAnterior, cellRefNuevo, cellRefDiferencia].forEach(cellRef => {
          if (ws[cellRef] && typeof ws[cellRef].v === 'number') {
            ws[cellRef].z = '"$"#,##0.00';
          }
        });

        // Colocar color según la diferencia
        if (ws[cellRefDiferencia] && typeof ws[cellRefDiferencia].v === 'number') {
          const diferencia = ws[cellRefDiferencia].v;
          ws[cellRefDiferencia].s = {
            font: { 
              color: { 
                rgb: diferencia > 0 ? '27AE60' : (diferencia < 0 ? 'E74C3C' : '7F8C8D') 
              },
              bold: diferencia !== 0
            }
          };
        }
      }

      // Ajustar anchos de columnas
      const wscols = [
        { wch: 8 },   // ID
        { wch: 25 },  // Producto
        { wch: 10 },  // ID Producto
        { wch: 20 },  // Campo Modificado
        { wch: 15 },  // Precio Anterior
        { wch: 15 },  // Precio Nuevo
        { wch: 12 },  // Diferencia
        { wch: 10 },  // % Cambio
        { wch: 20 },  // Fecha Cambio
        { wch: 15 },  // Usuario
        { wch: 30 }   // Motivo
      ];
      ws['!cols'] = wscols;

      // Crear hoja de estadísticas
      const fechaExportacion = new Date().toLocaleString('es-ES');
      const estadisticasData = [
        ['REPORTE DE HISTORIAL GLOBAL - FUNDACIÓN PROSPERIDAD'],
        ['Fecha de exportación:', fechaExportacion],
        [''],
        ['ESTADÍSTICAS DE EXPORTACIÓN'],
        ['Registros exportados:', historialFiltrado.length],
        ['Productos diferentes:', new Set(historialFiltrado.map(item => item.producto_nombre)).size],
        ['Usuarios diferentes:', new Set(historialFiltrado.map(item => item.usuario)).size],
        [''],
        ['ANÁLISIS DE CAMBIOS'],
        ['Aumentos de precio:', totalAumentos],
        ['Disminuciones de precio:', totalDisminuciones],
        ['Sin cambio de precio:', totalSinCambio],
        ['Diferencia total acumulada:', diferenciaTotal],
        [''],
        ['RESUMEN GENERAL'],
        ['Total cambios en sistema:', estadisticas.totalCambios],
        ['Productos con cambios:', estadisticas.productosConCambios],
        ['Usuarios activos:', estadisticas.usuariosActivos],
        ['Cambios hoy:', estadisticas.cambiosHoy],
        ['Cambios este mes:', estadisticas.cambiosEsteMes],
        [''],
        ['FILTROS APLICADOS'],
        ['Producto:', filtros.producto || 'Todos'],
        ['Campo:', filtros.campo !== "todos" ? getNombreCampo(filtros.campo) : 'Todos'],
        ['Usuario:', filtros.usuario !== "todos" ? filtros.usuario : 'Todos'],
        ['Fecha desde:', filtros.fechaDesde || 'No aplicado'],
        ['Fecha hasta:', filtros.fechaHasta || 'No aplicado'],
        ['Búsqueda:', filtros.busqueda || 'No aplicado'],
        [''],
        ['INFORMACIÓN DEL SISTEMA'],
        ['Generado por:', 'Sistema de Seguimiento de Precios'],
        ['Versión:', '1.0'],
        ['Notas:', 'Este reporte incluye todos los cambios de precio según los filtros aplicados']
      ];

      const wsEstadisticas = XLSX.utils.aoa_to_sheet(estadisticasData);

      // Ajustar anchos de columnas para estadísticas
      wsEstadisticas['!cols'] = [
        { wch: 25 },
        { wch: 30 }
      ];

      // Crear libro de trabajo con dos hojas
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Historial de Cambios");
      XLSX.utils.book_append_sheet(wb, wsEstadisticas, "Estadísticas y Filtros");

      // Crear una tercera hoja con distribución por campo
      const distribucionCampo = {};
      historialFiltrado.forEach(item => {
        const campo = getNombreCampo(item.campo_cambiado);
        if (!distribucionCampo[campo]) {
          distribucionCampo[campo] = 0;
        }
        distribucionCampo[campo]++;
      });

      const distribucionData = [
        ['DISTRIBUCIÓN POR TIPO DE CAMBIO'],
        [''],
        ['Campo', 'Cantidad', 'Porcentaje']
      ];

      Object.entries(distribucionCampo).forEach(([campo, cantidad]) => {
        const porcentaje = ((cantidad / historialFiltrado.length) * 100).toFixed(2);
        distribucionData.push([campo, cantidad, `${porcentaje}%`]);
      });

      const wsDistribucion = XLSX.utils.aoa_to_sheet(distribucionData);
      XLSX.utils.book_append_sheet(wb, wsDistribucion, "Distribución");

      // Generar nombre de archivo
      const fechaActual = new Date();
      const fechaStr = fechaActual.toISOString().split('T')[0];
      const nombreArchivo = `Historial_Global_${fechaStr}.xlsx`;

      // Descargar archivo
      XLSX.writeFile(wb, nombreArchivo);
      
      console.log("✅ Historial global exportado:", nombreArchivo);
      
      // Mostrar mensaje de éxito
      setTimeout(() => {
        alert(`✅ Reporte exportado exitosamente!\n\n📊 Registros exportados: ${historialFiltrado.length}\n📁 Archivo: ${nombreArchivo}`);
      }, 100);
      
    } catch (error) {
      console.error("❌ Error al exportar Excel:", error);
      alert("❌ Error al exportar a Excel. Por favor, intente nuevamente.");
    } finally {
      setExportando(false);
    }
  };

  // Exportar reporte completo (todos los registros)
  const exportarReporteCompleto = async () => {
    if (historial.length === 0) {
      alert("No hay datos en el sistema para exportar");
      return;
    }

    if (!confirm(`¿Exportar TODOS los registros del historial?\n\n📊 Total registros: ${historial.length}\n⏱️ Esto puede tardar unos momentos...`)) {
      return;
    }

    setExportando(true);

    try {
      // Preparar los datos para Excel (todos los registros)
      const datosExcel = historial.map(item => {
        return {
          'ID': item.id,
          'Producto': item.producto_nombre,
          'ID Producto': item.producto_id,
          'Campo Modificado': getNombreCampo(item.campo_cambiado),
          'Precio Anterior': item.precio_anterior,
          'Precio Nuevo': item.precio_nuevo,
          'Diferencia': item.diferencia,
          '% Cambio': item.porcentaje_cambio,
          'Fecha Cambio': formatFechaExcel(item.fecha_cambio),
          'Usuario': item.usuario || 'Sistema',
          'Motivo': item.motivo || ''
        };
      });

      // Ordenar por fecha más reciente primero
      datosExcel.sort((a, b) => new Date(b['Fecha Cambio']) - new Date(a['Fecha Cambio']));

      // Crear hoja de trabajo principal
      const ws = XLSX.utils.json_to_sheet(datosExcel);

      // Aplicar formatos
      const range = XLSX.utils.decode_range(ws['!ref']);
      for (let R = range.s.r; R <= range.e.r; ++R) {
        // Aplicar formato de moneda
        for (let C = 4; C <= 6; C++) {
          const cell = { c: C, r: R };
          const cellRef = XLSX.utils.encode_cell(cell);
          if (ws[cellRef] && typeof ws[cellRef].v === 'number') {
            ws[cellRef].z = '"$"#,##0.00';
          }
        }
      }

      // Ajustar anchos de columnas
      ws['!cols'] = [
        { wch: 8 },   // ID
        { wch: 25 },  // Producto
        { wch: 10 },  // ID Producto
        { wch: 20 },  // Campo Modificado
        { wch: 15 },  // Precio Anterior
        { wch: 15 },  // Precio Nuevo
        { wch: 12 },  // Diferencia
        { wch: 10 },  // % Cambio
        { wch: 20 },  // Fecha Cambio
        { wch: 15 },  // Usuario
        { wch: 30 }   // Motivo
      ];

      // Crear libro de trabajo
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Historial Completo");

      // Generar nombre de archivo
      const fechaActual = new Date();
      const fechaStr = fechaActual.toISOString().split('T')[0];
      const nombreArchivo = `Historial_Completo_${fechaStr}.xlsx`;

      // Descargar archivo
      XLSX.writeFile(wb, nombreArchivo);
      
      alert(`✅ Historial completo exportado!\n\n📊 Total registros: ${historial.length}\n📁 Archivo: ${nombreArchivo}`);
      
    } catch (error) {
      console.error("❌ Error al exportar historial completo:", error);
      alert("❌ Error al exportar historial completo.");
    } finally {
      setExportando(false);
    }
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
              <h4 className="mt-3">Cargando historial global...</h4>
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
            <button className="btn btn-primary" onClick={cargarDatos}>
              <i className="bi bi-arrow-clockwise me-2"></i>Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  const usuariosUnicos = getUsuariosUnicos();
  const camposUnicos = getCamposUnicos();
  const numerosPagina = generarNumerosPagina();

  return (
    <div className="d-flex">
      <Sidebar />
      
      <div className="container-fluid p-4">
        {/* Encabezado */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2><i className="bi bi-clock-history text-primary me-2"></i>Historial Global de Precios</h2>
            <p className="text-muted mb-0">Registro completo de todos los cambios de precio en el sistema</p>
          </div>
          <div className="d-flex">
            <button className="btn btn-outline-secondary me-2" onClick={() => navigate(-1)}>
              <i className="bi bi-arrow-left me-1"></i>Volver
            </button>
            
            {/* Botón para exportar */}
            <div className="dropdown">
              <button 
                className="btn btn-success dropdown-toggle" 
                type="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
                disabled={exportando}
              >
                {exportando ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Exportando...
                  </>
                ) : (
                  <>
                    <i className="bi bi-file-excel me-1"></i>
                    Exportar Excel
                  </>
                )}
              </button>
              <ul className="dropdown-menu">
                <li>
                  <button 
                    className="dropdown-item" 
                    onClick={exportarExcel}
                    disabled={exportando || historialFiltrado.length === 0}
                  >
                    <i className="bi bi-file-excel text-success me-2"></i>
                    Exportar filtrados ({historialFiltrado.length})
                  </button>
                </li>
                <li>
                  <button 
                    className="dropdown-item" 
                    onClick={exportarReporteCompleto}
                    disabled={exportando || historial.length === 0}
                  >
                    <i className="bi bi-files text-primary me-2"></i>
                    Exportar completo ({historial.length})
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="row mb-4">
          <div className="col-md-12">
            <div className="card border-primary">
              <div className="card-header bg-primary text-white">
                <i className="bi bi-bar-chart me-2"></i>Resumen General
              </div>
              <div className="card-body">
                <div className="row text-center">
                  <div className="col-md-2">
                    <h5 className="text-muted">Total Cambios</h5>
                    <h3 className="text-primary">{estadisticas.totalCambios}</h3>
                  </div>
                  <div className="col-md-2">
                    <h5 className="text-muted">Productos</h5>
                    <h3 className="text-success">{estadisticas.productosConCambios}</h3>
                  </div>
                  <div className="col-md-2">
                    <h5 className="text-muted">Usuarios</h5>
                    <h3 className="text-info">{estadisticas.usuariosActivos}</h3>
                  </div>
                  <div className="col-md-2">
                    <h5 className="text-muted">Cambios Hoy</h5>
                    <h3 className="text-warning">{estadisticas.cambiosHoy}</h3>
                  </div>
                  <div className="col-md-2">
                    <h5 className="text-muted">Este Mes</h5>
                    <h3 className="text-danger">{estadisticas.cambiosEsteMes}</h3>
                  </div>
                  <div className="col-md-2">
                    <h5 className="text-muted">Filtrados</h5>
                    <h3 className={historialFiltrado.length === historial.length ? 'text-muted' : 'text-success'}>
                      {historialFiltrado.length}
                    </h3>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="card mb-4">
          <div className="card-header bg-light">
            <h5 className="mb-0"><i className="bi bi-funnel me-2"></i>Filtros Avanzados</h5>
          </div>
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-3">
                <label className="form-label">Producto</label>
                <select 
                  className="form-select" 
                  value={filtros.producto} 
                  onChange={(e) => {
                    setFiltros({...filtros, producto: e.target.value});
                    setPaginaActual(1);
                  }}
                >
                  <option value="">Todos los productos</option>
                  {productos.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.producto} (ID: {p.id})
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="col-md-2">
                <label className="form-label">Campo</label>
                <select 
                  className="form-select" 
                  value={filtros.campo} 
                  onChange={(e) => {
                    setFiltros({...filtros, campo: e.target.value});
                    setPaginaActual(1);
                  }}
                >
                  <option value="todos">Todos los campos</option>
                  {camposUnicos.map(campo => (
                    <option key={campo} value={campo}>{getNombreCampo(campo)}</option>
                  ))}
                </select>
              </div>
              
              <div className="col-md-2">
                <label className="form-label">Usuario</label>
                <select 
                  className="form-select" 
                  value={filtros.usuario} 
                  onChange={(e) => {
                    setFiltros({...filtros, usuario: e.target.value});
                    setPaginaActual(1);
                  }}
                >
                  <option value="todos">Todos los usuarios</option>
                  {usuariosUnicos.map(usuario => (
                    <option key={usuario} value={usuario}>{usuario}</option>
                  ))}
                </select>
              </div>
              
              <div className="col-md-2">
                <label className="form-label">Fecha desde</label>
                <input
                  type="date"
                  className="form-control"
                  value={filtros.fechaDesde}
                  onChange={(e) => {
                    setFiltros({...filtros, fechaDesde: e.target.value});
                    setPaginaActual(1);
                  }}
                />
              </div>
              
              <div className="col-md-2">
                <label className="form-label">Fecha hasta</label>
                <input
                  type="date"
                  className="form-control"
                  value={filtros.fechaHasta}
                  onChange={(e) => {
                    setFiltros({...filtros, fechaHasta: e.target.value});
                    setPaginaActual(1);
                  }}
                />
              </div>
              
              <div className="col-md-1">
                <label className="form-label">&nbsp;</label>
                <button 
                  className="btn btn-outline-danger w-100"
                  onClick={() => {
                    setFiltros({
                      producto: "",
                      campo: "todos",
                      usuario: "todos",
                      fechaDesde: "",
                      fechaHasta: "",
                      busqueda: ""
                    });
                    setPaginaActual(1);
                  }}
                >
                  <i className="bi bi-x-circle"></i>
                </button>
              </div>
              
              <div className="col-md-12">
                <div className="input-group">
                  <span className="input-group-text">
                    <i className="bi bi-search"></i>
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Buscar en producto, motivo o usuario..."
                    value={filtros.busqueda}
                    onChange={(e) => {
                      setFiltros({...filtros, busqueda: e.target.value});
                      setPaginaActual(1);
                    }}
                  />
                </div>
              </div>
              
              <div className="col-12">
                <div className="d-flex justify-content-between align-items-center">
                  <small className="text-muted">
                    Mostrando {historialFiltrado.length} de {historial.length} cambios registrados
                  </small>
                  <div className="d-flex align-items-center">
                    <div className="input-group input-group-sm me-2" style={{ width: '150px' }}>
                      <span className="input-group-text">Mostrar:</span>
                      <select 
                        className="form-select" 
                        value={itemsPorPagina}
                        onChange={(e) => cambiarItemsPorPagina(parseInt(e.target.value))}
                      >
                        <option value="10">10</option>
                        <option value="15">15</option>
                        <option value="20">20</option>
                        <option value="30">30</option>
                        <option value="50">50</option>
                      </select>
                    </div>
                    <button className="btn btn-sm btn-primary" onClick={cargarDatos}>
                      <i className="bi bi-arrow-clockwise me-1"></i>Actualizar
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
            <div>
              <h5 className="mb-0"><i className="bi bi-list-check me-2"></i>Historial de Cambios</h5>
              <small className="text-muted">Ordenado por fecha más reciente</small>
            </div>
            <div>
              <span className="badge bg-primary me-2">
                Página {paginaActual} de {totalPaginas}
              </span>
              <span className="badge bg-success">
                {indiceInicio + 1}-{indiceFin} de {historialFiltrado.length}
              </span>
            </div>
          </div>
          
          <div className="card-body p-0">
            {historialPagina.length === 0 ? (
              <div className="text-center py-5">
                <i className="bi bi-inbox fs-1 text-muted mb-3"></i>
                <h4>No hay registros</h4>
                <p className="text-muted">
                  {historial.length > 0 
                    ? "No se encontraron resultados con los filtros aplicados"
                    : "No hay cambios de precio registrados en el sistema"}
                </p>
                {historial.length > 0 && (
                  <button 
                    className="btn btn-outline-primary"
                    onClick={() => {
                      setFiltros({
                        producto: "",
                        campo: "todos",
                        usuario: "todos",
                        fechaDesde: "",
                        fechaHasta: "",
                        busqueda: ""
                      });
                      setPaginaActual(1);
                    }}
                  >
                    <i className="bi bi-eraser me-2"></i>
                    Limpiar filtros
                  </button>
                )}
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: '70px' }}>#</th>
                      <th style={{ width: '150px' }}>Fecha</th>
                      <th style={{ width: '200px' }}>Producto</th>
                      <th style={{ width: '150px' }}>Campo</th>
                      <th style={{ width: '120px' }}>Precio Anterior</th>
                      <th style={{ width: '120px' }}>Precio Nuevo</th>
                      <th style={{ width: '100px' }}>Cambio</th>
                      <th style={{ width: '100px' }}>Usuario</th>
                      <th>Motivo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historialPagina.map((item, index) => {
                      const esAumento = item.diferencia > 0;
                      const esDisminucion = item.diferencia < 0;
                      const numItem = indiceInicio + index + 1;
                      
                      return (
                        <tr key={item.id} className={index % 2 === 0 ? '' : 'table-light'}>
                          <td>
                            <span className="badge bg-secondary">{numItem}</span>
                          </td>
                          <td>
                            <div className="small">{formatFecha(item.fecha_cambio)}</div>
                            <small className="text-muted">
                              {new Date(item.fecha_cambio).toLocaleDateString('es-ES', { weekday: 'short' })}
                            </small>
                          </td>
                          <td>
                            <div className="fw-bold">{item.producto_nombre}</div>
                            <small className="text-muted">ID: {item.producto_id}</small>
                          </td>
                          <td>
                            <span className={`badge bg-${getColorCampo(item.campo_cambiado)}`}>
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
                            <div className="text-truncate" style={{ maxWidth: '250px' }} title={item.motivo || ''}>
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
          
          {/* Paginación */}
          {totalPaginas > 1 && (
            <div className="card-footer">
              <div className="d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center">
                  <small className="text-muted me-3">
                    Mostrando {historialPagina.length} de {historialFiltrado.length} cambios
                  </small>
                  <div className="input-group input-group-sm" style={{ width: '120px' }}>
                    <span className="input-group-text">Ir a:</span>
                    <select 
                      className="form-select" 
                      value={paginaActual}
                      onChange={(e) => cambiarPagina(parseInt(e.target.value))}
                    >
                      {[...Array(totalPaginas)].map((_, i) => (
                        <option key={i + 1} value={i + 1}>
                          Pág. {i + 1}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <nav>
                  <ul className="pagination pagination-sm mb-0">
                    {/* Primera página */}
                    <li className={`page-item ${paginaActual === 1 ? 'disabled' : ''}`}>
                      <button 
                        className="page-link" 
                        onClick={() => cambiarPagina(1)}
                        title="Primera página"
                      >
                        <i className="bi bi-chevron-bar-left"></i>
                      </button>
                    </li>
                    
                    {/* Página anterior */}
                    <li className={`page-item ${paginaActual === 1 ? 'disabled' : ''}`}>
                      <button 
                        className="page-link" 
                        onClick={() => cambiarPagina(paginaActual - 1)}
                        title="Página anterior"
                      >
                        <i className="bi bi-chevron-left"></i>
                      </button>
                    </li>
                    
                    {/* Puntos suspensivos iniciales */}
                    {paginaActual > 3 && (
                      <li className="page-item disabled">
                        <span className="page-link">...</span>
                      </li>
                    )}
                    
                    {/* Números de página */}
                    {numerosPagina.map(paginaNum => (
                      <li key={paginaNum} className={`page-item ${paginaActual === paginaNum ? 'active' : ''}`}>
                        <button 
                          className="page-link" 
                          onClick={() => cambiarPagina(paginaNum)}
                        >
                          {paginaNum}
                        </button>
                      </li>
                    ))}
                    
                    {/* Puntos suspensivos finales */}
                    {paginaActual < totalPaginas - 2 && (
                      <li className="page-item disabled">
                        <span className="page-link">...</span>
                      </li>
                    )}
                    
                    {/* Página siguiente */}
                    <li className={`page-item ${paginaActual === totalPaginas ? 'disabled' : ''}`}>
                      <button 
                        className="page-link" 
                        onClick={() => cambiarPagina(paginaActual + 1)}
                        title="Página siguiente"
                      >
                        <i className="bi bi-chevron-right"></i>
                      </button>
                    </li>
                    
                    {/* Última página */}
                    <li className={`page-item ${paginaActual === totalPaginas ? 'disabled' : ''}`}>
                      <button 
                        className="page-link" 
                        onClick={() => cambiarPagina(totalPaginas)}
                        title="Última página"
                      >
                        <i className="bi bi-chevron-bar-right"></i>
                      </button>
                    </li>
                  </ul>
                </nav>
              </div>
            </div>
          )}
          
          <div className="card-footer bg-light">
            <div className="d-flex justify-content-between align-items-center">
              <small className="text-muted">
                <i className="bi bi-info-circle me-1"></i>
                Historial generado automáticamente | {new Date().toLocaleString()}
              </small>
              <small className="text-muted">
                Sistema de seguimiento de precios v1.0
              </small>
            </div>
          </div>
        </div>

        {/* Análisis */}
        {historialFiltrado.length > 0 && (
          <div className="row mt-4">
            <div className="col-md-6">
              <div className="card">
                <div className="card-header bg-info text-white">
                  <i className="bi bi-pie-chart me-2"></i>Distribución por Campo
                </div>
                <div className="card-body">
                  {camposUnicos.map(campo => {
                    const cantidad = historialFiltrado.filter(item => item.campo_cambiado === campo).length;
                    const porcentaje = (cantidad / historialFiltrado.length * 100).toFixed(1);
                    
                    return (
                      <div key={campo} className="mb-3">
                        <div className="d-flex justify-content-between mb-1">
                          <span>
                            <i className={`bi ${getIconoCampo(campo)} me-2 text-${getColorCampo(campo)}`}></i>
                            {getNombreCampo(campo)}
                          </span>
                          <span className="fw-bold">{cantidad} ({porcentaje}%)</span>
                        </div>
                        <div className="progress" style={{ height: '8px' }}>
                          <div 
                            className={`progress-bar bg-${getColorCampo(campo)}`} 
                            style={{ width: `${porcentaje}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            
            <div className="col-md-6">
              <div className="card">
                <div className="card-header bg-success text-white">
                  <i className="bi bi-calendar3 me-2"></i>Actividad Reciente
                </div>
                <div className="card-body">
                  <div className="alert alert-info">
                    <i className="bi bi-lightbulb me-2"></i>
                    <strong>Últimos 7 días:</strong> {
                      historialFiltrado.filter(item => {
                        const fecha = new Date(item.fecha_cambio);
                        const hoy = new Date();
                        const hace7Dias = new Date(hoy.getTime() - (7 * 24 * 60 * 60 * 1000));
                        return fecha >= hace7Dias;
                      }).length
                    } cambios
                  </div>
                  
                  <div className="alert alert-warning">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    <strong>Productos con más cambios:</strong>
                    <ul className="mb-0 mt-2">
                      {(() => {
                        const productosConteo = {};
                        historialFiltrado.forEach(item => {
                          if (!productosConteo[item.producto_nombre]) {
                            productosConteo[item.producto_nombre] = 0;
                          }
                          productosConteo[item.producto_nombre]++;
                        });
                        
                        const top5 = Object.entries(productosConteo)
                          .sort((a, b) => b[1] - a[1])
                          .slice(0, 5);
                        
                        return top5.map(([nombre, cantidad]) => (
                          <li key={nombre}>
                            {nombre}: <strong>{cantidad}</strong> cambios
                          </li>
                        ));
                      })()}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default HistorialGlobal;