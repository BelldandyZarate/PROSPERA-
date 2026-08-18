import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import "bootstrap/dist/css/bootstrap.min.css";
import { useNavigate } from "react-router-dom";

function TablaproductosRe() {
  const [productos, setProductos] = useState([]);
  const [paginaActual, setPaginaActual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [busquedaNombre, setBusquedaNombre] = useState("");
  const [busquedaFecha, setBusquedaFecha] = useState("");
  const [busquedaTipo, setBusquedaTipo] = useState("");
  const [filtroActivo, setFiltroActivo] = useState("activos");
  const [cargando, setCargando] = useState(false);
  const [enviandoSobrante, setEnviandoSobrante] = useState(false);
  const [estadisticas, setEstadisticas] = useState(null);
  const [usuarioPuedeEditar, setUsuarioPuedeEditar] = useState(false);
  const [errorMensaje, setErrorMensaje] = useState("");
  const [mostrarObservaciones, setMostrarObservaciones] = useState({});
  const [modalSobrante, setModalSobrante] = useState({
    abierto: false,
    producto: null,
    cantidad: "",
    motivo: "",
  });
  
  const navigate = useNavigate();

  const tiposProducto = [
    { value: "", label: "Todos los tipos" },
    { value: "verduras_frutas", label: "Verduras/Frutas" },
    { value: "otro", label: "Otros Productos" }
  ];

  useEffect(() => {
    verificarPermisosUsuario();
    cargarProductos();
  }, [paginaActual, filtroActivo]);

  const verificarPermisosUsuario = () => {
    try {
      const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");
      const rol = usuario.rol || "";
      const rolesConPermisos = ["registrador"];
      setUsuarioPuedeEditar(rolesConPermisos.includes(rol));
    } catch (error) {
      console.error("Error verificando permisos:", error);
      setUsuarioPuedeEditar(false);
    }
  };

  const cargarProductos = async () => {
    setCargando(true);
    setErrorMensaje("");
    setMostrarObservaciones({});
    
    try {
      let url = `/api/obtener_productos.php?pagina=${paginaActual}`;
      
      if (filtroActivo === "inactivos") {
        url += "&solo_inactivos=true";
      } else if (filtroActivo === "todos") {
        url += "&mostrar_todos=true";
      } else {
        url += "&solo_activos=true";
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setProductos(data.data || []);
        setEstadisticas(data.estadisticas || null);
        setTotalPaginas(data.paginacion?.total_paginas || 1);
      } else {
        setErrorMensaje(data.message || "Error al cargar productos");
      }
    } catch (error) {
      console.error("Error en la solicitud:", error);
      setErrorMensaje("Error de conexión con el servidor");
    } finally {
      setCargando(false);
    }
  };

  const toggleObservaciones = (productoId) => {
    setMostrarObservaciones(prev => ({
      ...prev,
      [productoId]: !prev[productoId]
    }));
  };

  const abrirModalSobrante = (producto) => {
    const esVerdurasFrutas = producto.kilos > 0;
    setModalSobrante({
      abierto: true,
      producto: producto,
      cantidad: esVerdurasFrutas ? 
        (producto.kilos?.toString() || "0") : 
        (producto.unidades?.toString() || "0"),
      motivo: "",
    });
  };

  const confirmarEnvioSobrante = async () => {
    if (!modalSobrante.producto) return;
    
    const producto = modalSobrante.producto;
    const esVerdurasFrutas = producto.kilos > 0;
    
    // Validar cantidad
    if (!modalSobrante.cantidad.trim()) {
      alert("Debes ingresar una cantidad válida");
      return;
    }
    
    const cantidadNum = esVerdurasFrutas ? 
      parseFloat(modalSobrante.cantidad) : 
      parseInt(modalSobrante.cantidad);
    
    if (isNaN(cantidadNum) || cantidadNum <= 0) {
      alert("La cantidad debe ser un número mayor que 0");
      return;
    }
    
    // Validar que no exceda la cantidad disponible
    const cantidadDisponible = esVerdurasFrutas ? producto.kilos : producto.unidades;
    if (cantidadNum > cantidadDisponible) {
      if (!confirm(`⚠️ Advertencia: La cantidad ingresada (${cantidadNum}) es mayor que la disponible (${cantidadDisponible}).\n¿Deseas continuar de todas formas?`)) {
        return;
      }
    }
    
    // Validar motivo
    if (!modalSobrante.motivo.trim()) {
      alert("Debes ingresar un motivo para marcar como sobrante");
      return;
    }
    
    // Opcional: Validar longitud mínima
    if (modalSobrante.motivo.trim().length < 10) {
      if (!confirm(`El motivo parece muy corto (${modalSobrante.motivo.trim().length} caracteres). ¿Estás seguro de continuar?`)) {
        return;
      }
    }
    
    // Obtener usuario actual
    const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");
    const usuarioId = usuario.id || 1;
    
    // Calcular días en inventario
    const fechaRecibimiento = producto.fecha_recibimiento ? 
      new Date(producto.fecha_recibimiento) : new Date();
    const hoy = new Date();
    const diferenciaTiempo = hoy.getTime() - fechaRecibimiento.getTime();
    const diasEnInventario = Math.floor(diferenciaTiempo / (1000 * 3600 * 24));
    
    // Calcular valores proporcionales
    const costoUnitario = esVerdurasFrutas ? 
      (producto.precio_kilos || 0) : 
      (producto.precio_unidad || 0);
    
    const valorTotal = esVerdurasFrutas ? 
      cantidadNum * costoUnitario : 
      cantidadNum * costoUnitario;
    
    const costoOriginalTotal = producto.costo_total || 0;
    
    // Preparar datos para enviar
    const datosSobrante = {
      producto_id: producto.id,
      producto: producto.producto,
      producto_original: producto.producto,
      tipo_producto: esVerdurasFrutas ? "verduras_frutas" : "otro",
      kilos: esVerdurasFrutas ? cantidadNum : 0.00,
      unidades: esVerdurasFrutas ? 0 : cantidadNum,
      precio_kilos: esVerdurasFrutas ? costoUnitario : 0.00,
      precio_unidad: esVerdurasFrutas ? 0.00 : costoUnitario,
      valor_total: valorTotal,
      costo_original_total: costoOriginalTotal,
      porcentaje_original: cantidadDisponible > 0 ? 
        ((cantidadNum / cantidadDisponible) * 100).toFixed(2) : "100.00",
      fecha_recibimiento: producto.fecha_recibimiento || hoy.toISOString().split('T')[0],
      dias_en_inventario: diasEnInventario > 0 ? diasEnInventario : 0,
      estado: "pendiente",
      motivo: modalSobrante.motivo.trim(),
      observaciones: `Cantidad enviada a PNAPC: ${cantidadNum}${esVerdurasFrutas ? ' kg' : ' unidades'} (de ${cantidadDisponible}${esVerdurasFrutas ? ' kg' : ' unidades'} disponibles). ` +
                     `Estado original: ${producto.activo === 1 ? 'Activo' : 'Suspendido'}. ` +
                     `${producto.observaciones ? 'Observaciones originales: ' + producto.observaciones : ''}`,
      usuario_id: usuarioId
    };
    
    setEnviandoSobrante(true);
    
    try {
      console.log("Enviando datos a PNAPC:", datosSobrante);
      
      // Enviar a la API
      const response = await fetch("/api/agregar_sobrante.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(datosSobrante),
      });
      
      const responseText = await response.text();
      console.log("Respuesta del servidor:", responseText);
      
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (jsonError) {
        console.error("Error parseando JSON:", jsonError);
        throw new Error("El servidor devolvió una respuesta no válida.");
      }
      
      if (result.success) {
        alert(`✅ Producto "${producto.producto}" agregado a PNAPC correctamente\n` +
              `Cantidad: ${cantidadNum}${esVerdurasFrutas ? ' kg' : ' unidades'}`);
        
        // Guardar en localStorage
        const productosSobrantes = JSON.parse(localStorage.getItem('productosSobrantes') || '[]');
        productosSobrantes.push({
          id: result.sobrante_id || Date.now(),
          ...datosSobrante,
          fechaSeleccion: new Date().toISOString(),
          cantidad_original: cantidadDisponible,
          porcentaje_utilizado: cantidadDisponible > 0 ? 
            ((cantidadNum / cantidadDisponible) * 100).toFixed(2) : "100.00"
        });
        localStorage.setItem('productosSobrantes', JSON.stringify(productosSobrantes));
        
        // Cerrar modal
        setModalSobrante({ abierto: false, producto: null, cantidad: "", motivo: "" });
        
        // Recargar productos
        cargarProductos();
        
      } else {
        alert(`❌ Error: ${result.message || "No se pudo agregar a PNAPC"}`);
      }
    } catch (error) {
      console.error("Error completo al enviar a PNAPC:", error);
      alert(`❌ Error: ${error.message}`);
    } finally {
      setEnviandoSobrante(false);
    }
  };

  const handleCambiarEstado = async (id, productoNombre, activoActual) => {
    const confirmMessage = activoActual 
      ? `¿Estás seguro de SUSPENDER el producto "${productoNombre}"?\n\n✅ El producto se mantendrá en la base de datos\n❌ NO se podrá vender ni editar\n❌ NO aparecerá en listas de ventas\n🔄 Podrás reactivarlo cuando lo necesites`
      : `¿Estás seguro de REACTIVAR el producto "${productoNombre}"?\n\n✅ Volverá a estar disponible para ventas\n✅ Podrás editarlo nuevamente\n✅ Aparecerá en todas las listas`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      setCargando(true);
      const res = await fetch(`/api/suspender_producto.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: id }),
      });
      
      const result = await res.json();
      
      if (result.success) {
        alert(result.message);
        cargarProductos();
      } else {
        alert(result.message || "Error al cambiar el estado");
      }
    } catch (error) {
      console.error("Error en la solicitud:", error);
      alert("Error de conexión");
    } finally {
      setCargando(false);
    }
  };

  const determinarTipoProducto = (producto) => {
    if (producto.kilos > 0 && producto.precio_kilos > 0) {
      return "verduras_frutas";
    } else if (producto.unidades > 0 && producto.precio_unidad > 0) {
      return "otro";
    }
    return "indefinido";
  };

  const productosFiltrados = productos.filter((producto) => {
    const nombreCoincide = producto.producto
      .toLowerCase()
      .includes(busquedaNombre.toLowerCase());

    const fechaCoincide = busquedaFecha
      ? new Date(producto.fecha_recibimiento).toISOString().slice(0, 10) === busquedaFecha
      : true;

    const tipoProducto = determinarTipoProducto(producto);
    const tipoCoincide = busquedaTipo 
      ? tipoProducto === busquedaTipo 
      : true;

    return nombreCoincide && fechaCoincide && tipoCoincide;
  });

  const cambiarPagina = (nuevaPagina) => {
    if (nuevaPagina >= 1 && nuevaPagina <= totalPaginas) {
      setPaginaActual(nuevaPagina);
    }
  };

  return (
    <div className="d-flex">
      <Sidebar />
      <div className="container-fluid p-4">
        {/* Modal para PNAPC - ACTUALIZADO */}
        {modalSobrante.abierto && (
          <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header bg-info text-white">
                  <h5 className="modal-title">
                    <span className="me-2">📦</span>
                    Agregar a PNAPC
                  </h5>
                  <button 
                    type="button" 
                    className="btn-close btn-close-white"
                    onClick={() => setModalSobrante({ abierto: false, producto: null, cantidad: "", motivo: "" })}
                    disabled={enviandoSobrante}
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">
                      <strong>Producto:</strong> {modalSobrante.producto?.producto}
                    </label>
                    <div className="text-muted small">
                      ID: {modalSobrante.producto?.id} | 
                      Tipo: {modalSobrante.producto?.kilos > 0 ? 'Verduras/Frutas' : 'Otros productos'}
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">
                      Cantidad a enviar a PNAPC:
                    </label>
                    <div className="input-group">
                      <input
                        type="number"
                        className="form-control"
                        step={modalSobrante.producto?.kilos > 0 ? "0.01" : "1"}
                        min="0"
                        value={modalSobrante.cantidad}
                        onChange={(e) => setModalSobrante({...modalSobrante, cantidad: e.target.value})}
                        placeholder={modalSobrante.producto?.kilos > 0 ? "Ej: 2.5 kg" : "Ej: 10 unidades"}
                        disabled={enviandoSobrante}
                      />
                      <span className="input-group-text">
                        {modalSobrante.producto?.kilos > 0 ? "kg" : "unidades"}
                      </span>
                    </div>
                    <div className="form-text">
                      Disponible: {modalSobrante.producto?.kilos > 0 ? 
                        `${modalSobrante.producto.kilos} kg` : 
                        `${modalSobrante.producto?.unidades} unidades`}
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">Motivo:</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      placeholder="Describe el motivo por el cual este producto debe ir a PNAPC..."
                      value={modalSobrante.motivo}
                      onChange={(e) => setModalSobrante({...modalSobrante, motivo: e.target.value})}
                      disabled={enviandoSobrante}
                      maxLength="500"
                    />
                    <div className="form-text text-end">
                      {modalSobrante.motivo.length}/500 caracteres
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label small text-muted">
                      <span className="me-1">💡</span>
                      Sugerencias de motivos comunes:
                    </label>
                    <div className="d-flex flex-wrap gap-2">
                      {["Exceso de inventario", "Producto próximo a vencer", "Dañado/Defectuoso", 
                        "Cambio de temporada", "Baja rotación", "Error en pedido"].map((sugerencia) => (
                        <button
                          key={sugerencia}
                          type="button"
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => setModalSobrante(prev => ({
                            ...prev,
                            motivo: prev.motivo ? `${prev.motivo}, ${sugerencia}` : sugerencia
                          }))}
                          disabled={enviandoSobrante}
                        >
                          {sugerencia}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => setModalSobrante({ abierto: false, producto: null, cantidad: "", motivo: "" })}
                    disabled={enviandoSobrante}
                  >
                    Cancelar
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-info"
                    onClick={confirmarEnvioSobrante}
                    disabled={enviandoSobrante || !modalSobrante.motivo.trim()}
                  >
                    {enviandoSobrante ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Enviando...
                      </>
                    ) : (
                      <>
                        <span className="me-2">📦</span>
                        Agregar a PNAPC
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="d-flex justify-content-between align-items-center mb-3">
          <h2>
            <span className="me-2">📦</span>
            Gestión de Productos
          </h2>
          <div>
            <button 
              className="btn btn-outline-secondary"
              onClick={cargarProductos}
              disabled={cargando}
            >
              {cargando ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                  Cargando...
                </>
              ) : (
                <>
                  <span className="me-2">🔄</span>
                  Actualizar
                </>
              )}
            </button>
          </div>
        </div>

        {/* Mensaje informativo actualizado */}
        <div className="alert alert-info mb-3">
          <span className="me-2">ℹ️</span>
          <strong>Productos suspendidos:</strong> No están disponibles para ventas ni pueden ser editados. Solo pueden ser reactivados.
          <br/>
          <span className="me-2">📝</span>
          <strong>Observaciones:</strong> Haz clic en el ícono 📝 junto al nombre para ver las observaciones del producto.
          <br/>
          <span className="me-2">📦</span>
          <strong>PNAPC (Sobrantes):</strong> Use el botón "PNAPC" para marcar productos que requieren atención especial. Podrá especificar la cantidad y escribir el motivo libremente.
        </div>

        {errorMensaje && (
          <div className="alert alert-danger alert-dismissible fade show" role="alert">
            <span className="me-2">⚠️</span>
            <strong>Error:</strong> {errorMensaje}
            <button 
              type="button" 
              className="btn-close" 
              onClick={() => setErrorMensaje("")}
              aria-label="Close"
            ></button>
          </div>
        )}

        {estadisticas && !errorMensaje && (
          <div className="row mb-4">
            <div className="col-md-12">
              <div className="card border-primary">
                <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                  <div>
                    <span className="me-2">📈</span>
                    <strong>Estado de Productos</strong>
                  </div>
                  <div className="btn-group btn-group-sm">
                    <button
                      className={`btn ${filtroActivo === "activos" ? 'btn-light' : 'btn-outline-light'}`}
                      onClick={() => setFiltroActivo("activos")}
                      disabled={cargando}
                    >
                      <span className="me-1">✅</span>
                      Activos ({estadisticas.activos || 0})
                    </button>
                    <button
                      className={`btn ${filtroActivo === "inactivos" ? 'btn-light' : 'btn-outline-light'}`}
                      onClick={() => setFiltroActivo("inactivos")}
                      disabled={cargando}
                    >
                      <span className="me-1">⏸️</span>
                      Suspendidos ({estadisticas.inactivos || 0})
                    </button>
                    <button
                      className={`btn ${filtroActivo === "todos" ? 'btn-light' : 'btn-outline-light'}`}
                      onClick={() => setFiltroActivo("todos")}
                      disabled={cargando}
                    >
                      <span className="me-1">📋</span>
                      Todos ({estadisticas.total_productos || 0})
                    </button>
                  </div>
                </div>
                <div className="card-body">
                  <div className="row text-center">
                    <div className="col-md-3">
                      <div className="card border-success">
                        <div className="card-body">
                          <h5 className="text-muted small">Productos Activos</h5>
                          <h2 className="text-success">{estadisticas.activos || 0}</h2>
                          <small>Disponibles para venta</small>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="card border-warning">
                        <div className="card-body">
                          <h5 className="text-muted small">Productos Suspendidos</h5>
                          <h2 className="text-warning">{estadisticas.inactivos || 0}</h2>
                          <small>No disponibles</small>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="card border-info">
                        <div className="card-body">
                          <h5 className="text-muted small">PNAPC Pendientes</h5>
                          <h2 className="text-info">
                            {(() => {
                              try {
                                const sobrantes = JSON.parse(localStorage.getItem('productosSobrantes') || '[]');
                                return sobrantes.length;
                              } catch {
                                return 0;
                              }
                            })()}
                          </h2>
                          <small>Requieren atención</small>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="card border-primary">
                        <div className="card-body">
                          <h5 className="text-muted small">Ganancia Estimada</h5>
                          <h2 className={`${(estadisticas.ganancia_total_estimada || 0) > 0 ? 'text-success' : 'text-danger'}`}>
                            ${(estadisticas.ganancia_total_estimada || 0).toFixed(2)}
                          </h2>
                          <small>Solo productos activos</small>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="row mb-3">
          <div className="col-md-3">
            <label className="form-label">Nombre del Producto</label>
            <input
              type="text"
              className="form-control"
              placeholder="Buscar producto..."
              value={busquedaNombre}
              onChange={(e) => setBusquedaNombre(e.target.value)}
              disabled={cargando}
            />
          </div>
          <div className="col-md-2">
            <label className="form-label">Fecha Recibimiento</label>
            <input
              type="date"
              className="form-control"
              value={busquedaFecha}
              onChange={(e) => setBusquedaFecha(e.target.value)}
              disabled={cargando}
            />
          </div>
          <div className="col-md-2">
            <label className="form-label">Tipo de Producto</label>
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
          <div className="col-md-5 d-flex align-items-end">
            <div className="w-100 d-flex gap-2">
              <button
                className="btn btn-outline-secondary w-50"
                onClick={() => {
                  setBusquedaNombre("");
                  setBusquedaFecha("");
                  setBusquedaTipo("");
                }}
                disabled={cargando}
              >
                <span className="me-2">❌</span>
                Limpiar Filtros
              </button>
              <button
                className="btn btn-info w-50"
                onClick={cargarProductos}
                disabled={cargando}
              >
                {cargando ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Filtrando...
                  </>
                ) : (
                  <>
                    <span className="me-2">🔍</span>
                    Aplicar Filtros
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {cargando && (
          <div className="alert alert-info text-center">
            <div className="spinner-border spinner-border-sm me-2" role="status"></div>
            Cargando productos...
          </div>
        )}

        <div className="table-responsive">
          <table className="table table-striped table-hover">
            <thead className="table-dark">
              <tr>
                <th width="50">ID</th>
                <th width="100">Estado</th>
                <th>Producto</th>
                <th width="100">Tipo</th>
                <th width="100">Cantidad</th>
                <th width="120">Precio Costo</th>
                <th width="120">Precio Venta</th>
                <th width="120">Costo Total</th>
                <th width="120">Venta Total</th>
                <th width="120">Ganancia</th>
                <th width="120">Fecha Recib.</th>
                <th width="180">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {!cargando && productosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="12" className="text-center py-5">
                    <div className="mb-3">📭</div>
                    <h5>No hay productos disponibles</h5>
                    {filtroActivo === "activos" && <p className="text-muted">No hay productos activos registrados</p>}
                    {filtroActivo === "inactivos" && <p className="text-muted">No hay productos suspendidos</p>}
                    {filtroActivo === "todos" && <p className="text-muted">No hay productos registrados</p>}
                  </td>
                </tr>
              ) : (
                productosFiltrados.map((producto) => {
                  const esInactivo = producto.activo === 0;
                  const esVerdurasFrutas = producto.kilos > 0;
                  const tipoProducto = esVerdurasFrutas ? "Verduras/Frutas" : "Otros";
                  const tieneObservaciones = producto.observaciones && producto.observaciones.trim().length > 0;
                  const mostrarObs = mostrarObservaciones[producto.id] || false;
                  
                  return (
                    <React.Fragment key={producto.id}>
                      <tr className={esInactivo ? "table-secondary" : ""}>
                        <td>
                          <span className={esInactivo ? "text-muted" : "fw-bold"}>
                            {producto.id}
                          </span>
                        </td>
                        <td>
                          {esInactivo ? (
                            <span className="badge bg-warning text-dark">
                              <span className="me-1">⏸️</span>
                              SUSPENDIDO
                            </span>
                          ) : (
                            <span className="badge bg-success">
                              <span className="me-1">✅</span>
                              ACTIVO
                            </span>
                          )}
                        </td>
                        <td>
                          <div className="d-flex align-items-center">
                            <div>
                              <strong className={esInactivo ? "text-muted" : ""}>
                                {producto.producto}
                              </strong>
                              {esInactivo && (
                                <div className="text-warning small">
                                  <span className="me-1">⚠️</span>
                                  Producto no disponible
                                </div>
                              )}
                            </div>
                            {tieneObservaciones && (
                              <button
                                className="btn btn-sm btn-outline-info ms-2"
                                onClick={() => toggleObservaciones(producto.id)}
                                title={mostrarObs ? "Ocultar observaciones" : "Mostrar observaciones"}
                                style={{ padding: '0.15rem 0.35rem', fontSize: '0.75rem' }}
                              >
                                {mostrarObs ? '📝' : '📝'}
                                <span className="ms-1">{mostrarObs ? '▲' : '▼'}</span>
                              </button>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${tipoProducto === 'Verduras/Frutas' ? 'bg-success' : 'bg-info'}`}>
                            {tipoProducto}
                          </span>
                        </td>
                        <td>
                          {esVerdurasFrutas ? (
                            <>
                              {producto.kilos?.toFixed(2)} <small className="text-muted">kg</small>
                            </>
                          ) : (
                            <>
                              {producto.unidades} <small className="text-muted">unid.</small>
                            </>
                          )}
                        </td>
                        <td className={esInactivo ? "text-muted" : "text-danger"}>
                          ${esVerdurasFrutas ? 
                            (producto.precio_kilos?.toFixed(2) || "0.00") : 
                            (producto.precio_unidad?.toFixed(2) || "0.00")}
                        </td>
                        <td className={esInactivo ? "text-muted" : "text-success"}>
                          ${esVerdurasFrutas ? 
                            (producto.precio_venderK?.toFixed(2) || "0.00") : 
                            (producto.precio_venderD?.toFixed(2) || "0.00")}
                        </td>
                        <td>
                          <span className={esInactivo ? "text-muted fw-normal" : "text-danger fw-bold"}>
                            ${producto.costo_total?.toFixed(2) || "0.00"}
                          </span>
                        </td>
                        <td>
                          <span className={esInactivo ? "text-muted fw-normal" : "text-success fw-bold"}>
                            ${producto.venta_total?.toFixed(2) || "0.00"}
                          </span>
                        </td>
                        <td>
                          <span className={`
                            ${esInactivo ? 'text-muted fw-normal' : 'fw-bold'}
                            ${producto.ganancia > 0 ? 'text-success' : 'text-danger'}
                          `}>
                            ${producto.ganancia?.toFixed(2) || "0.00"}
                          </span>
                        </td>
                        <td>
                          {producto.fecha_recibimiento ? (
                            <span className={esInactivo ? "text-muted" : ""}>
                              {new Date(producto.fecha_recibimiento).toLocaleDateString()}
                            </span>
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </td>
                        <td>
                          <div className="btn-group-vertical w-100">
                            {/* Botón PNAPC actualizado */}
                            <button
                              className="btn btn-info btn-sm mb-1"
                              onClick={() => abrirModalSobrante(producto)}
                              title="Agregar a PNAPC (Sobrantes)"
                              disabled={cargando || enviandoSobrante}
                            >
                              {enviandoSobrante ? (
                                <>
                                  <span className="spinner-border spinner-border-sm me-1"></span>
                                  Enviando...
                                </>
                              ) : (
                                <>
                                  <span className="me-1">📋</span>
                                  PNAPC
                                </>
                              )}
                            </button>
                            
                            <button
                              className={`btn ${esInactivo ? 'btn-outline-secondary' : 'btn-warning'} btn-sm mb-1`}
                              onClick={() => !esInactivo && navigate(`/editarPRE/${producto.id}`)}
                              disabled={cargando || !usuarioPuedeEditar || esInactivo}
                              title={esInactivo ? "Producto suspendido - No editable" : "Editar producto"}
                            >
                              <span className="me-1">✏️</span>
                              {esInactivo ? 'No editable' : 'Editar'}
                            </button>
                            
                            <button
                              className={`btn ${esInactivo ? 'btn-success' : 'btn-danger'} btn-sm`}
                              onClick={() => handleCambiarEstado(producto.id, producto.producto, producto.activo)}
                              disabled={cargando || !usuarioPuedeEditar}
                              title={esInactivo ? "Reactivar producto" : "Suspender producto"}
                            >
                              <span className="me-1">{esInactivo ? '▶️' : '⏸️'}</span>
                              {esInactivo ? 'Reactivar' : 'Suspender'}
                            </button>
                          </div>
                        </td>
                      </tr>
                      {/* Fila expandida para observaciones */}
                      {mostrarObs && tieneObservaciones && (
                        <tr key={`${producto.id}-observaciones`} className="bg-light">
                          <td colSpan="12" className="p-3">
                            <div className="alert alert-info mb-0">
                              <div className="d-flex align-items-center">
                                <strong className="me-3">
                                  <span className="me-2">📝</span>
                                  Observaciones:
                                </strong>
                                <div className="flex-grow-1">{producto.observaciones}</div>
                                <button
                                  className="btn btn-sm btn-outline-secondary"
                                  onClick={() => toggleObservaciones(producto.id)}
                                  title="Ocultar observaciones"
                                >
                                  <span className="me-1">▲</span>
                                  Cerrar
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="alert alert-light border mt-3">
          <div className="row align-items-center">
            <div className="col-md-4">
              <strong>
                <span className="me-2">ℹ️</span>
                Productos mostrados:
              </strong> {productosFiltrados.length} de {productos.length}
              {productos.some(p => p.observaciones && p.observaciones.trim().length > 0) && (
                <div className="small text-muted mt-1">
                  <span className="me-1">📝</span>
                  {productos.filter(p => p.observaciones && p.observaciones.trim().length > 0).length} productos tienen observaciones
                </div>
              )}
            </div>
            <div className="col-md-4 text-center">
              <strong>
                <span className="me-2">👁️</span>
                Vista actual:
              </strong> {
                filtroActivo === "activos" ? "Solo productos ACTIVOS" :
                filtroActivo === "inactivos" ? "Solo productos SUSPENDIDOS" :
                "TODOS los productos"
              }
            </div>
            <div className="col-md-4 text-end">
              <span className="text-muted small">
                <span className="me-1">💡</span>
                {filtroActivo === "activos" && "Los productos activos pueden venderse y editarse"}
                {filtroActivo === "inactivos" && "Los productos suspendidos no están disponibles"}
                {filtroActivo === "todos" && "Mostrando todos los productos"}
              </span>
            </div>
          </div>
        </div>

        {totalPaginas > 1 && (
          <div className="d-flex justify-content-center align-items-center mt-3 mb-4">
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

export default TablaproductosRe;