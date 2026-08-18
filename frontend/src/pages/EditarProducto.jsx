import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import "bootstrap/dist/css/bootstrap.min.css";

const EditarProducto = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Tipos de productos disponibles
  const PRODUCT_TYPES = {
    VEGETABLES_FRUITS: 'verduras_frutas',
    OTHER: 'otro'
  };
  
  const [producto, setProducto] = useState({
    id: id,
    producto: "",
    tipo_producto: PRODUCT_TYPES.VEGETABLES_FRUITS,
    kilos: "",
    precio_kilos: "",
    precio_venderK: "",
    unidades: "",
    precio_unidad: "",
    precio_venderD: "",
    fecha_recibimiento: "",
    observaciones: ""
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [cargandoDatos, setCargandoDatos] = useState(true);
  const [errors, setErrors] = useState({});
  const [calculatedValues, setCalculatedValues] = useState({
    costoTotal: 0,
    ventaTotal: 0,
    ganancia: 0
  });

  useEffect(() => {
    cargarProducto();
  }, [id]);

  const cargarProducto = () => {
    setCargandoDatos(true);
    fetch(`/api/obtener_producto.php?id=${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          const productoData = data.data;
          
          // Determinar tipo de producto
          let tipoProducto = PRODUCT_TYPES.VEGETABLES_FRUITS;
          if (productoData.tipo_producto) {
            tipoProducto = productoData.tipo_producto;
          } else if (productoData.unidades > 0) {
            tipoProducto = PRODUCT_TYPES.OTHER;
          }
          
          const formattedData = {
            id: productoData.id || id,
            producto: productoData.producto || "",
            tipo_producto: tipoProducto,
            kilos: productoData.kilos !== null && productoData.kilos !== undefined ? productoData.kilos : "",
            precio_kilos: productoData.precio_kilos !== null && productoData.precio_kilos !== undefined ? productoData.precio_kilos : "",
            precio_venderK: productoData.precio_venderK !== null && productoData.precio_venderK !== undefined ? productoData.precio_venderK : "",
            unidades: productoData.unidades !== null && productoData.unidades !== undefined ? productoData.unidades : "",
            precio_unidad: productoData.precio_unidad !== null && productoData.precio_unidad !== undefined ? productoData.precio_unidad : "",
            precio_venderD: productoData.precio_venderD !== null && productoData.precio_venderD !== undefined ? productoData.precio_venderD : "",
            fecha_recibimiento: productoData.fecha_recibimiento || "",
            observaciones: productoData.observaciones || ""
          };
          
          setProducto(formattedData);
        } else {
          alert("Producto no encontrado");
          navigate("/TablaP");
        }
      })
      .catch((error) => {
        console.error("Error al cargar producto:", error);
        alert("Error de conexión al cargar los datos del producto");
        navigate("/TablaP");
      })
      .finally(() => {
        setCargandoDatos(false);
      });
  };

  // Calcular valores totales
  useEffect(() => {
    let costoTotal = 0;
    let ventaTotal = 0;
    
    if (producto.tipo_producto === PRODUCT_TYPES.VEGETABLES_FRUITS) {
      const kilos = parseFloat(producto.kilos) || 0;
      const precioCosto = parseFloat(producto.precio_kilos) || 0;
      const precioVenta = parseFloat(producto.precio_venderK) || 0;
      
      costoTotal = kilos * precioCosto;
      ventaTotal = kilos * precioVenta;
    } else {
      const unidades = parseInt(producto.unidades) || 0;
      const precioCosto = parseFloat(producto.precio_unidad) || 0;
      const precioVenta = parseFloat(producto.precio_venderD) || 0;
      
      costoTotal = unidades * precioCosto;
      ventaTotal = unidades * precioVenta;
    }
    
    const ganancia = ventaTotal - costoTotal;
    
    setCalculatedValues({
      costoTotal: costoTotal.toFixed(2),
      ventaTotal: ventaTotal.toFixed(2),
      ganancia: ganancia.toFixed(2)
    });
  }, [producto]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!producto.producto.trim()) {
      newErrors.producto = "El nombre del producto es requerido";
    }
    
    if (producto.tipo_producto === PRODUCT_TYPES.VEGETABLES_FRUITS) {
      if (!producto.kilos || parseFloat(producto.kilos) <= 0) {
        newErrors.kilos = "Los kilos deben ser un número mayor a 0";
      }
      if (!producto.precio_kilos || parseFloat(producto.precio_kilos) <= 0) {
        newErrors.precio_kilos = "El precio por kilo es requerido";
      }
      if (!producto.precio_venderK || parseFloat(producto.precio_venderK) <= 0) {
        newErrors.precio_venderK = "El precio de venta por kilo es requerido";
      }
    } else {
      if (!producto.unidades || parseInt(producto.unidades) <= 0) {
        newErrors.unidades = "Las unidades deben ser un número mayor a 0";
      }
      if (!producto.precio_unidad || parseFloat(producto.precio_unidad) <= 0) {
        newErrors.precio_unidad = "El precio por unidad es requerido";
      }
      if (!producto.precio_venderD || parseFloat(producto.precio_venderD) <= 0) {
        newErrors.precio_venderD = "El precio de venta por unidad es requerido";
      }
    }
    
    if (!producto.fecha_recibimiento) {
      newErrors.fecha_recibimiento = "La fecha es requerida";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProducto(prev => ({ ...prev, [name]: value }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleProductTypeChange = (type) => {
    setProducto(prev => ({
      ...prev,
      tipo_producto: type,
      kilos: type === PRODUCT_TYPES.VEGETABLES_FRUITS ? (prev.kilos || "") : "",
      precio_kilos: type === PRODUCT_TYPES.VEGETABLES_FRUITS ? (prev.precio_kilos || "") : "",
      precio_venderK: type === PRODUCT_TYPES.VEGETABLES_FRUITS ? (prev.precio_venderK || "") : "",
      unidades: type === PRODUCT_TYPES.OTHER ? (prev.unidades || "") : "",
      precio_unidad: type === PRODUCT_TYPES.OTHER ? (prev.precio_unidad || "") : "",
      precio_venderD: type === PRODUCT_TYPES.OTHER ? (prev.precio_venderD || "") : ""
    }));
  };

  const handleNumberInput = (e, type = 'float') => {
    const { name, value } = e.target;
    
    if (type === 'float') {
      if (value === "" || /^\d*\.?\d{0,2}$/.test(value)) {
        handleChange(e);
      }
    } else if (type === 'int') {
      if (value === "" || /^\d*$/.test(value)) {
        handleChange(e);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      const datosEnviar = {
        id: parseInt(producto.id),
        producto: producto.producto.trim(),
        tipo_producto: producto.tipo_producto,
        fecha_recibimiento: producto.fecha_recibimiento,
        observaciones: producto.observaciones.trim()
      };
      
      if (producto.tipo_producto === PRODUCT_TYPES.VEGETABLES_FRUITS) {
        datosEnviar.kilos = parseFloat(producto.kilos);
        datosEnviar.precio_kilos = parseFloat(producto.precio_kilos);
        datosEnviar.precio_venderK = parseFloat(producto.precio_venderK);
        datosEnviar.unidades = 0;
        datosEnviar.precio_unidad = 0;
        datosEnviar.precio_venderD = 0;
      } else {
        datosEnviar.unidades = parseInt(producto.unidades);
        datosEnviar.precio_unidad = parseFloat(producto.precio_unidad);
        datosEnviar.precio_venderD = parseFloat(producto.precio_venderD);
        datosEnviar.kilos = 0;
        datosEnviar.precio_kilos = 0;
        datosEnviar.precio_venderK = 0;
      }
      
      const res = await fetch("/api/actualizar_producto.php", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(datosEnviar)
      });
      
      const result = await res.json();
      
      if (result.success) {
        alert("✅ Producto actualizado correctamente");
        navigate("/TablaP");
      } else {
        alert(`❌ Error al actualizar producto: ${result.error || result.message || "Error desconocido"}`);
      }
    } catch (error) {
      console.error("Error en la solicitud:", error);
      alert("Error de conexión al actualizar el producto");
    } finally {
      setIsLoading(false);
    }
  };

  if (cargandoDatos) {
    return (
      <div className="d-flex">
        <Sidebar />
        <div className="container-fluid d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
          <div className="text-center">
            <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }} role="status">
              <span className="visually-hidden">Cargando...</span>
            </div>
            <p className="mt-3 fs-5">Cargando datos del producto #{id}...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex">
      <Sidebar />
      <div className="container-fluid p-4">
        <div className="card shadow" style={{ maxWidth: "1000px", margin: "0 auto" }}>
          <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
            <div>
              <h2 className="mb-0">
                <i className="bi bi-pencil-square me-2"></i>
                Editar Producto #{id}
              </h2>
              <small className="opacity-75">Modifique los campos necesarios</small>
            </div>
            <button 
              type="button" 
              className="btn btn-light btn-sm"
              onClick={() => navigate('/TablaP')}
            >
              <i className="bi bi-arrow-left me-1"></i>
              Volver
            </button>
          </div>
          
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              
              {/* 1. Tipo de Producto */}
              <div className="mb-4">
                <label className="form-label fw-bold">
                  <i className="bi bi-tags me-2"></i>Tipo de Producto
                </label>
                <div className="row g-3">
                  <div className="col-6">
                    <div 
                      className={`card text-center p-3 ${producto.tipo_producto === PRODUCT_TYPES.VEGETABLES_FRUITS ? 'border-primary bg-primary text-white' : 'border'}`}
                      onClick={() => handleProductTypeChange(PRODUCT_TYPES.VEGETABLES_FRUITS)}
                      style={{ cursor: 'pointer', transition: 'all 0.3s' }}
                    >
                      <i className={`bi bi-apple fs-1 ${producto.tipo_producto === PRODUCT_TYPES.VEGETABLES_FRUITS ? 'text-white' : 'text-muted'}`}></i>
                      <h6 className="mt-2">Verduras/Frutas</h6>
                      <small className={producto.tipo_producto === PRODUCT_TYPES.VEGETABLES_FRUITS ? 'text-white-50' : 'text-muted'}>Se mide por peso (kilos)</small>
                    </div>
                  </div>
                  <div className="col-6">
                    <div 
                      className={`card text-center p-3 ${producto.tipo_producto === PRODUCT_TYPES.OTHER ? 'border-primary bg-primary text-white' : 'border'}`}
                      onClick={() => handleProductTypeChange(PRODUCT_TYPES.OTHER)}
                      style={{ cursor: 'pointer', transition: 'all 0.3s' }}
                    >
                      <i className={`bi bi-box fs-1 ${producto.tipo_producto === PRODUCT_TYPES.OTHER ? 'text-white' : 'text-muted'}`}></i>
                      <h6 className="mt-2">Otros Productos</h6>
                      <small className={producto.tipo_producto === PRODUCT_TYPES.OTHER ? 'text-white-50' : 'text-muted'}>Se mide por unidades</small>
                    </div>
                  </div>
                </div>
              </div>

              {/* Campos del formulario */}
              <div className="mb-4">
                <label className="form-label fw-bold">
                  <i className="bi bi-box-seam me-2"></i>Nombre del Producto *
                </label>
                <div className="input-group">
                  <span className="input-group-text bg-white">
                    <i className="bi bi-card-text"></i>
                  </span>
                  <input
                    type="text"
                    className={`form-control ${errors.producto ? 'is-invalid' : ''}`}
                    name="producto"
                    value={producto.producto}
                    onChange={handleChange}
                    placeholder="Ej: Manzanas, Leche, Pan"
                    required
                    disabled={isLoading}
                  />
                </div>
                {errors.producto && <div className="invalid-feedback d-block">{errors.producto}</div>}
              </div>

              {/* 2. Campos Condicionales según Tipo de Producto */}
              {producto.tipo_producto === PRODUCT_TYPES.VEGETABLES_FRUITS ? (
                <div className="border p-4 rounded mb-4 bg-light">
                  <h6 className="fw-bold mb-3 border-bottom pb-2">
                    <i className="bi bi-scale me-2"></i>Información de Kilos
                  </h6>
                  
                  <div className="row g-3">
                    <div className="col-md-4">
                      <label className="form-label fw-bold">Cantidad en Kilos *</label>
                      <div className="input-group">
                        <span className="input-group-text bg-white">
                          <i className="bi bi-speedometer2"></i>
                        </span>
                        <input
                          type="text"
                          className={`form-control ${errors.kilos ? 'is-invalid' : ''}`}
                          name="kilos"
                          value={producto.kilos}
                          onChange={(e) => handleNumberInput(e, 'float')}
                          placeholder="Ej: 10.5"
                          required
                          disabled={isLoading}
                        />
                        <span className="input-group-text bg-white">kg</span>
                      </div>
                      {errors.kilos && <div className="invalid-feedback d-block">{errors.kilos}</div>}
                    </div>
                    
                    <div className="col-md-4">
                      <label className="form-label fw-bold">Precio Costo por Kilo *</label>
                      <div className="input-group">
                        <span className="input-group-text bg-white">$</span>
                        <input
                          type="text"
                          className={`form-control ${errors.precio_kilos ? 'is-invalid' : ''}`}
                          name="precio_kilos"
                          value={producto.precio_kilos}
                          onChange={(e) => handleNumberInput(e, 'float')}
                          placeholder="Ej: 15.99"
                          required
                          disabled={isLoading}
                        />
                      </div>
                      {errors.precio_kilos && <div className="invalid-feedback d-block">{errors.precio_kilos}</div>}
                    </div>
                    
                    <div className="col-md-4">
                      <label className="form-label fw-bold">Precio Venta por Kilo *</label>
                      <div className="input-group">
                        <span className="input-group-text bg-white">$</span>
                        <input
                          type="text"
                          className={`form-control ${errors.precio_venderK ? 'is-invalid' : ''}`}
                          name="precio_venderK"
                          value={producto.precio_venderK}
                          onChange={(e) => handleNumberInput(e, 'float')}
                          placeholder="Ej: 18.50"
                          required
                          disabled={isLoading}
                        />
                      </div>
                      {errors.precio_venderK && <div className="invalid-feedback d-block">{errors.precio_venderK}</div>}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="border p-4 rounded mb-4 bg-light">
                  <h6 className="fw-bold mb-3 border-bottom pb-2">
                    <i className="bi bi-box-seam me-2"></i>Información de Unidades
                  </h6>
                  
                  <div className="row g-3">
                    <div className="col-md-4">
                      <label className="form-label fw-bold">Cantidad en Unidades *</label>
                      <div className="input-group">
                        <span className="input-group-text bg-white">
                          <i className="bi bi-123"></i>
                        </span>
                        <input
                          type="text"
                          className={`form-control ${errors.unidades ? 'is-invalid' : ''}`}
                          name="unidades"
                          value={producto.unidades}
                          onChange={(e) => handleNumberInput(e, 'int')}
                          placeholder="Ej: 50"
                          required
                          disabled={isLoading}
                        />
                        <span className="input-group-text bg-white">unid.</span>
                      </div>
                      {errors.unidades && <div className="invalid-feedback d-block">{errors.unidades}</div>}
                    </div>
                    
                    <div className="col-md-4">
                      <label className="form-label fw-bold">Precio Costo por Unidad *</label>
                      <div className="input-group">
                        <span className="input-group-text bg-white">$</span>
                        <input
                          type="text"
                          className={`form-control ${errors.precio_unidad ? 'is-invalid' : ''}`}
                          name="precio_unidad"
                          value={producto.precio_unidad}
                          onChange={(e) => handleNumberInput(e, 'float')}
                          placeholder="Ej: 1.20"
                          required
                          disabled={isLoading}
                        />
                      </div>
                      {errors.precio_unidad && <div className="invalid-feedback d-block">{errors.precio_unidad}</div>}
                    </div>
                    
                    <div className="col-md-4">
                      <label className="form-label fw-bold">Precio Venta por Unidad *</label>
                      <div className="input-group">
                        <span className="input-group-text bg-white">$</span>
                        <input
                          type="text"
                          className={`form-control ${errors.precio_venderD ? 'is-invalid' : ''}`}
                          name="precio_venderD"
                          value={producto.precio_venderD}
                          onChange={(e) => handleNumberInput(e, 'float')}
                          placeholder="Ej: 1.50"
                          required
                          disabled={isLoading}
                        />
                      </div>
                      {errors.precio_venderD && <div className="invalid-feedback d-block">{errors.precio_venderD}</div>}
                    </div>
                  </div>
                </div>
              )}

              {/* Fecha */}
              <div className="mb-4">
                <label className="form-label fw-bold">
                  <i className="bi bi-calendar-date me-2"></i>Fecha de Recibimiento *
                </label>
                <div className="input-group">
                  <span className="input-group-text bg-white">
                    <i className="bi bi-calendar"></i>
                  </span>
                  <input
                    type="date"
                    className={`form-control ${errors.fecha_recibimiento ? 'is-invalid' : ''}`}
                    name="fecha_recibimiento"
                    value={producto.fecha_recibimiento}
                    onChange={handleChange}
                    required
                    disabled={isLoading}
                  />
                </div>
                {errors.fecha_recibimiento && <div className="invalid-feedback d-block">{errors.fecha_recibimiento}</div>}
              </div>

              {/* Campo de Observaciones */}
              <div className="mb-4">
                <label className="form-label fw-bold">
                  <i className="bi bi-chat-left-text me-2"></i>Observaciones (Opcional)
                </label>
                <div className="input-group">
                  <span className="input-group-text bg-white">
                    <i className="bi bi-chat-text"></i>
                  </span>
                  <textarea
                    className="form-control"
                    name="observaciones"
                    value={producto.observaciones}
                    onChange={handleChange}
                    placeholder="Notas adicionales sobre el producto (ej: procedencia, calidad, características especiales, estado actual...)"
                    rows="3"
                    disabled={isLoading}
                    style={{ resize: 'vertical' }}
                  />
                </div>
                <small className="text-muted">Información adicional que pueda ser útil para el manejo del producto</small>
              </div>

              {/* 3. Resumen Financiero */}
              <div className="border p-4 rounded mb-4" style={{ backgroundColor: '#f8f9fa' }}>
                <h6 className="fw-bold mb-3 border-bottom pb-2">
                  <i className="bi bi-calculator me-2"></i>Resumen Financiero
                </h6>
                <div className="row text-center">
                  <div className="col-md-4">
                    <div className="p-3">
                      <small className="text-muted d-block mb-1">Costo Total</small>
                      <h4 className={`fw-bold ${parseFloat(calculatedValues.costoTotal) > 0 ? 'text-danger' : 'text-muted'}`}>
                        ${calculatedValues.costoTotal}
                      </h4>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="p-3">
                      <small className="text-muted d-block mb-1">Venta Total</small>
                      <h4 className={`fw-bold ${parseFloat(calculatedValues.ventaTotal) > 0 ? 'text-success' : 'text-muted'}`}>
                        ${calculatedValues.ventaTotal}
                      </h4>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="p-3">
                      <small className="text-muted d-block mb-1">Ganancia Estimada</small>
                      <h4 className={`fw-bold ${parseFloat(calculatedValues.ganancia) > 0 ? 'text-success' : parseFloat(calculatedValues.ganancia) < 0 ? 'text-danger' : 'text-muted'}`}>
                        ${calculatedValues.ganancia}
                      </h4>
                    </div>
                  </div>
                </div>
              </div>

              {/* Botones */}
              <div className="d-flex gap-2 mt-4">
                <button 
                  className="btn btn-primary px-4 py-2"
                  type="submit"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Guardando Cambios...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check-circle me-2"></i>
                      Guardar Cambios
                    </>
                  )}
                </button>
                
                <button 
                  type="button" 
                  className="btn btn-outline-secondary px-4 py-2"
                  onClick={() => navigate('/TablaP')}
                  disabled={isLoading}
                >
                  <i className="bi bi-x-circle me-2"></i>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
          
          <div className="card-footer text-muted bg-light">
            <small>
              <i className="bi bi-info-circle me-1"></i>
              Campos marcados con * son obligatorios. ID del producto: {id}
            </small>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditarProducto;