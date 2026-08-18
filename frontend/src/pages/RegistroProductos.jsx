import { useState, useEffect } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import Sidebar from '../components/Sidebar';
import { useNavigate } from 'react-router-dom';

const RegistroProductos = () => {
  const navigate = useNavigate();
  
  // Tipos de productos disponibles
  const PRODUCT_TYPES = {
    VEGETABLES_FRUITS: 'verduras_frutas',
    OTHER: 'otro'
  };

  const [formData, setFormData] = useState({
    producto: "",
    tipo_producto: PRODUCT_TYPES.VEGETABLES_FRUITS,
    kilos: "",
    precio_kilos: "",
    precio_venderK: "",
    unidades: "",
    precio_unidad: "",
    precio_venderD: "",
    fecha_recibimiento: "",
    observaciones: "" // Nuevo campo agregado
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errors, setErrors] = useState({});
  const [calculatedValues, setCalculatedValues] = useState({
    totalCosto: 0,
    totalVenta: 0,
    ganancia: 0
  });

  // Calcular valores totales cuando cambian los campos relevantes
  useEffect(() => {
    let totalCosto = 0;
    let totalVenta = 0;
    
    if (formData.tipo_producto === PRODUCT_TYPES.VEGETABLES_FRUITS) {
      const kilos = parseFloat(formData.kilos) || 0;
      const precioCosto = parseFloat(formData.precio_kilos) || 0;
      const precioVenta = parseFloat(formData.precio_venderK) || 0;
      
      totalCosto = kilos * precioCosto;
      totalVenta = kilos * precioVenta;
    } else {
      const unidades = parseInt(formData.unidades) || 0;
      const precioCosto = parseFloat(formData.precio_unidad) || 0;
      const precioVenta = parseFloat(formData.precio_venderD) || 0;
      
      totalCosto = unidades * precioCosto;
      totalVenta = unidades * precioVenta;
    }
    
    const ganancia = totalVenta - totalCosto;
    
    setCalculatedValues({
      totalCosto: totalCosto.toFixed(2),
      totalVenta: totalVenta.toFixed(2),
      ganancia: ganancia.toFixed(2)
    });
  }, [formData]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.producto.trim()) {
      newErrors.producto = "El nombre del producto es requerido";
    }
    
    // Validación según tipo de producto
    if (formData.tipo_producto === PRODUCT_TYPES.VEGETABLES_FRUITS) {
      if (!formData.kilos || parseFloat(formData.kilos) <= 0) {
        newErrors.kilos = "Los kilos deben ser un número mayor a 0";
      }
      if (!formData.precio_kilos || parseFloat(formData.precio_kilos) <= 0) {
        newErrors.precio_kilos = "El precio por kilo es requerido";
      }
      if (!formData.precio_venderK || parseFloat(formData.precio_venderK) <= 0) {
        newErrors.precio_venderK = "El precio de venta por kilo es requerido";
      }
    } else {
      if (!formData.unidades || parseInt(formData.unidades) <= 0) {
        newErrors.unidades = "Las unidades deben ser un número mayor a 0";
      }
      if (!formData.precio_unidad || parseFloat(formData.precio_unidad) <= 0) {
        newErrors.precio_unidad = "El precio por unidad es requerido";
      }
      if (!formData.precio_venderD || parseFloat(formData.precio_venderD) <= 0) {
        newErrors.precio_venderD = "El precio de venta por unidad es requerido";
      }
    }
    
    if (!formData.fecha_recibimiento) {
      newErrors.fecha_recibimiento = "La fecha es requerida";
    } else if (new Date(formData.fecha_recibimiento) > new Date()) {
      newErrors.fecha_recibimiento = "La fecha no puede ser futura";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Limpiar error cuando el usuario empieza a escribir
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleProductTypeChange = (type) => {
    setFormData(prev => ({
      ...prev,
      tipo_producto: type,
      kilos: type === PRODUCT_TYPES.VEGETABLES_FRUITS ? prev.kilos : "",
      precio_kilos: type === PRODUCT_TYPES.VEGETABLES_FRUITS ? prev.precio_kilos : "",
      precio_venderK: type === PRODUCT_TYPES.VEGETABLES_FRUITS ? prev.precio_venderK : "",
      unidades: type === PRODUCT_TYPES.OTHER ? prev.unidades : "",
      precio_unidad: type === PRODUCT_TYPES.OTHER ? prev.precio_unidad : "",
      precio_venderD: type === PRODUCT_TYPES.OTHER ? prev.precio_venderD : ""
    }));
  };

  const handleNumberInput = (e, type = 'float') => {
    const { name, value } = e.target;
    
    // Permitir solo números y punto decimal para floats
    if (type === 'float') {
      if (value === "" || /^\d*\.?\d*$/.test(value)) {
        handleChange(e);
      }
    } 
    // Solo números enteros para unidades
    else if (type === 'int') {
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
    setSuccessMessage("");

    try {
      const payload = {
        producto: formData.producto,
        tipo_producto: formData.tipo_producto,
        fecha_recibimiento: formData.fecha_recibimiento,
        observaciones: formData.observaciones // Nuevo campo
      };

      // Agregar campos según tipo de producto
      if (formData.tipo_producto === PRODUCT_TYPES.VEGETABLES_FRUITS) {
        payload.kilos = parseFloat(formData.kilos);
        payload.precio_kilos = parseFloat(formData.precio_kilos);
        payload.precio_venderK = parseFloat(formData.precio_venderK);
        payload.unidades = 0;
        payload.precio_unidad = 0;
        payload.precio_venderD = 0;
      } else {
        payload.unidades = parseInt(formData.unidades);
        payload.precio_unidad = parseFloat(formData.precio_unidad);
        payload.precio_venderD = parseFloat(formData.precio_venderD);
        payload.kilos = 0;
        payload.precio_kilos = 0;
        payload.precio_venderK = 0;
      }

      const res = await fetch("/api/guardar_producto.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const result = await res.json();
      
      if (result.success) {
        setSuccessMessage("✅ Producto registrado correctamente");
        
        // Resetear formulario
        setFormData({
          producto: "",
          tipo_producto: PRODUCT_TYPES.VEGETABLES_FRUITS,
          kilos: "",
          precio_kilos: "",
          precio_venderK: "",
          unidades: "",
          precio_unidad: "",
          precio_venderD: "",
          fecha_recibimiento: "",
          observaciones: "" // Resetear observaciones también
        });
        
        // Redirigir después de 2 segundos
        setTimeout(() => {
          setSuccessMessage("");
          navigate('/TablaP');
        }, 2000);
      } else {
        alert(result.error || "Error al registrar el producto");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al conectar con el servidor");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="d-flex">
      <Sidebar />
      <div className="container-fluid d-flex flex-column align-items-center justify-content-center py-4">
        <div className="card shadow" style={{ width: "100%", maxWidth: "900px" }}>
          <div className="card-header bg-primary text-white text-center">
            <h2 className="mb-0">📦 Registro de Productos</h2>
            <small className="opacity-75">Seleccione el tipo de producto y complete los campos</small>
          </div>
          
          <div className="card-body">
            {successMessage && (
              <div className="alert alert-success text-center">
                <i className="bi bi-check-circle me-2"></i>
                {successMessage}
                <div className="mt-2">
                  <div className="spinner-border spinner-border-sm text-success" role="status">
                    <span className="visually-hidden">Redirigiendo...</span>
                  </div>
                  <span className="ms-2">Redirigiendo a la tabla...</span>
                </div>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="mx-auto" style={{ maxWidth: "700px" }}>
              {/* Selección de Tipo de Producto */}
              <div className="mb-4">
                <label className="form-label fw-bold">
                  <i className="bi bi-tags me-2"></i>Tipo de Producto
                </label>
                <div className="row g-3">
                  <div className="col-6">
                    <div 
                      className={`card cursor-pointer text-center p-3 ${formData.tipo_producto === PRODUCT_TYPES.VEGETABLES_FRUITS ? 'border-primary bg-primary-light' : 'border'}`}
                      onClick={() => handleProductTypeChange(PRODUCT_TYPES.VEGETABLES_FRUITS)}
                      style={{ cursor: 'pointer' }}
                    >
                      <i className={`bi bi-apple fs-1 ${formData.tipo_producto === PRODUCT_TYPES.VEGETABLES_FRUITS ? 'text-primary' : 'text-muted'}`}></i>
                      <h6 className="mt-2">Verduras/Frutas</h6>
                      <small className="text-muted">Se mide por peso (kilos)</small>
                    </div>
                  </div>
                  <div className="col-6">
                    <div 
                      className={`card cursor-pointer text-center p-3 ${formData.tipo_producto === PRODUCT_TYPES.OTHER ? 'border-primary bg-primary-light' : 'border'}`}
                      onClick={() => handleProductTypeChange(PRODUCT_TYPES.OTHER)}
                      style={{ cursor: 'pointer' }}
                    >
                      <i className={`bi bi-box fs-1 ${formData.tipo_producto === PRODUCT_TYPES.OTHER ? 'text-primary' : 'text-muted'}`}></i>
                      <h6 className="mt-2">Otros Productos</h6>
                      <small className="text-muted">Se mide por unidades</small>
                    </div>
                  </div>
                </div>
              </div>

              {/* Nombre del Producto */}
              <div className="mb-4">
                <label className="form-label fw-bold">
                  <i className="bi bi-box me-2"></i>Nombre del Producto
                </label>
                <input
                  type="text"
                  name="producto"
                  className={`form-control ${errors.producto ? 'is-invalid' : ''}`}
                  value={formData.producto}
                  onChange={handleChange}
                  placeholder={formData.tipo_producto === PRODUCT_TYPES.VEGETABLES_FRUITS 
                    ? "Ej: Manzanas Fuji, Zanahorias, Lechuga..." 
                    : "Ej: Arroz 1kg, Leche 1L, Galletas..."}
                  disabled={isLoading}
                />
                {errors.producto && <div className="invalid-feedback">{errors.producto}</div>}
              </div>

              {/* Campos Condicionales según Tipo de Producto */}
              {formData.tipo_producto === PRODUCT_TYPES.VEGETABLES_FRUITS ? (
                <div className="border p-3 rounded mb-4 bg-light">
                  <h6 className="fw-bold mb-3">
                    <i className="bi bi-scale me-2"></i>Información de Kilos
                  </h6>
                  
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label fw-bold">Cantidad en Kilos</label>
                      <div className="input-group">
                        <span className="input-group-text">
                          <i className="bi bi-speedometer2"></i>
                        </span>
                        <input
                          type="text"
                          name="kilos"
                          className={`form-control ${errors.kilos ? 'is-invalid' : ''}`}
                          value={formData.kilos}
                          onChange={(e) => handleNumberInput(e, 'float')}
                          placeholder="Ej: 10.5, 25.0, 5.75"
                          disabled={isLoading}
                        />
                        <span className="input-group-text">kg</span>
                      </div>
                      {errors.kilos && <div className="invalid-feedback">{errors.kilos}</div>}
                    </div>
                    
                    <div className="col-md-6">
                      <label className="form-label fw-bold">Precio de Costo por Kilo</label>
                      <div className="input-group">
                        <span className="input-group-text">$</span>
                        <input
                          type="text"
                          name="precio_kilos"
                          className={`form-control ${errors.precio_kilos ? 'is-invalid' : ''}`}
                          value={formData.precio_kilos}
                          onChange={(e) => handleNumberInput(e, 'float')}
                          placeholder="Ej: 15.99, 8.50, 12.75"
                          disabled={isLoading}
                        />
                      </div>
                      {errors.precio_kilos && <div className="invalid-feedback">{errors.precio_kilos}</div>}
                    </div>
                    
                    <div className="col-md-12">
                      <label className="form-label fw-bold">Precio de Venta por Kilo</label>
                      <div className="input-group">
                        <span className="input-group-text">$</span>
                        <input
                          type="text"
                          name="precio_venderK"
                          className={`form-control ${errors.precio_venderK ? 'is-invalid' : ''}`}
                          value={formData.precio_venderK}
                          onChange={(e) => handleNumberInput(e, 'float')}
                          placeholder="Ej: 18.50, 10.00, 15.00"
                          disabled={isLoading}
                        />
                      </div>
                      {errors.precio_venderK && <div className="invalid-feedback">{errors.precio_venderK}</div>}
                      <small className="text-muted">Precio al que se venderá al público</small>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="border p-3 rounded mb-4 bg-light">
                  <h6 className="fw-bold mb-3">
                    <i className="bi bi-box-seam me-2"></i>Información de Unidades
                  </h6>
                  
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label fw-bold">Cantidad en Unidades</label>
                      <div className="input-group">
                        <span className="input-group-text">
                          <i className="bi bi-123"></i>
                        </span>
                        <input
                          type="text"
                          name="unidades"
                          className={`form-control ${errors.unidades ? 'is-invalid' : ''}`}
                          value={formData.unidades}
                          onChange={(e) => handleNumberInput(e, 'int')}
                          placeholder="Ej: 50, 100, 24"
                          disabled={isLoading}
                        />
                        <span className="input-group-text">unid.</span>
                      </div>
                      {errors.unidades && <div className="invalid-feedback">{errors.unidades}</div>}
                    </div>
                    
                    <div className="col-md-6">
                      <label className="form-label fw-bold">Precio de Costo por Unidad</label>
                      <div className="input-group">
                        <span className="input-group-text">$</span>
                        <input
                          type="text"
                          name="precio_unidad"
                          className={`form-control ${errors.precio_unidad ? 'is-invalid' : ''}`}
                          value={formData.precio_unidad}
                          onChange={(e) => handleNumberInput(e, 'float')}
                          placeholder="Ej: 1.20, 2.50, 5.99"
                          disabled={isLoading}
                        />
                      </div>
                      {errors.precio_unidad && <div className="invalid-feedback">{errors.precio_unidad}</div>}
                    </div>
                    
                    <div className="col-md-12">
                      <label className="form-label fw-bold">Precio de Venta por Unidad</label>
                      <div className="input-group">
                        <span className="input-group-text">$</span>
                        <input
                          type="text"
                          name="precio_venderD"
                          className={`form-control ${errors.precio_venderD ? 'is-invalid' : ''}`}
                          value={formData.precio_venderD}
                          onChange={(e) => handleNumberInput(e, 'float')}
                          placeholder="Ej: 1.50, 3.00, 7.50"
                          disabled={isLoading}
                        />
                      </div>
                      {errors.precio_venderD && <div className="invalid-feedback">{errors.precio_venderD}</div>}
                      <small className="text-muted">Precio al que se venderá al público</small>
                    </div>
                  </div>
                </div>
              )}

              {/* Fecha de Recibimiento */}
              <div className="mb-4">
                <label className="form-label fw-bold">
                  <i className="bi bi-calendar-date me-2"></i>Fecha de Recibimiento
                </label>
                <input
                  type="date"
                  name="fecha_recibimiento"
                  className={`form-control ${errors.fecha_recibimiento ? 'is-invalid' : ''}`}
                  value={formData.fecha_recibimiento}
                  onChange={handleChange}
                  max={new Date().toISOString().split('T')[0]}
                  disabled={isLoading}
                />
                {errors.fecha_recibimiento && <div className="invalid-feedback">{errors.fecha_recibimiento}</div>}
              </div>

              {/* Campo de Observaciones */}
              <div className="mb-4">
                <label className="form-label fw-bold">
                  <i className="bi bi-chat-left-text me-2"></i>Observaciones (Opcional)
                </label>
                <textarea
                  name="observaciones"
                  className="form-control"
                  value={formData.observaciones}
                  onChange={handleChange}
                  placeholder="Notas adicionales sobre el producto (ej: procedencia, calidad, características especiales...)"
                  rows="3"
                  disabled={isLoading}
                />
                <small className="text-muted">Información adicional que pueda ser útil para el manejo del producto</small>
              </div>

              {/* Resumen Financiero */}
              <div className="border p-3 rounded mb-4 bg-light">
                <h6 className="fw-bold mb-3">
                  <i className="bi bi-calculator me-2"></i>Resumen Financiero
                </h6>
                <div className="row text-center">
                  <div className="col-md-4">
                    <div className="p-2">
                      <small className="text-muted d-block">Costo Total</small>
                      <h5 className={`fw-bold ${parseFloat(calculatedValues.totalCosto) > 0 ? 'text-danger' : 'text-muted'}`}>
                        ${calculatedValues.totalCosto}
                      </h5>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="p-2">
                      <small className="text-muted d-block">Venta Total</small>
                      <h5 className={`fw-bold ${parseFloat(calculatedValues.totalVenta) > 0 ? 'text-success' : 'text-muted'}`}>
                        ${calculatedValues.totalVenta}
                      </h5>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="p-2">
                      <small className="text-muted d-block">Ganancia Estimada</small>
                      <h5 className={`fw-bold ${parseFloat(calculatedValues.ganancia) > 0 ? 'text-success' : parseFloat(calculatedValues.ganancia) < 0 ? 'text-danger' : 'text-muted'}`}>
                        ${calculatedValues.ganancia}
                      </h5>
                    </div>
                  </div>
                </div>
              </div>

              {/* Botones */}
              <div className="d-grid gap-3">
                <button 
                  type="submit" 
                  className="btn btn-primary btn-lg"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Registrando...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check-circle me-2"></i>
                      Registrar Producto
                    </>
                  )}
                </button>
                
                <button 
                  type="button" 
                  className="btn btn-outline-secondary"
                  onClick={() => navigate('/TablaP')}
                  disabled={isLoading}
                >
                  <i className="bi bi-table me-2"></i>
                  Ver Tabla de Productos
                </button>
              </div>
            </form>
            
            {/* Resumen del producto */}
            {formData.producto && (
              <div className="mt-4 p-3 border rounded bg-light">
                <h6 className="fw-bold">
                  <i className="bi bi-eye me-2"></i>Resumen del Producto
                </h6>
                <div className="row small">
                  <div className="col-md-2">
                    <strong>Tipo:</strong><br/>
                    {formData.tipo_producto === PRODUCT_TYPES.VEGETABLES_FRUITS ? 'Verduras/Frutas' : 'Otros'}
                  </div>
                  <div className="col-md-3">
                    <strong>Producto:</strong><br/>
                    {formData.producto}
                  </div>
                  <div className="col-md-3">
                    <strong>Detalles:</strong><br/>
                    {formData.tipo_producto === PRODUCT_TYPES.VEGETABLES_FRUITS 
                      ? `${formData.kilos || '0'} kg - Costo: $${formData.precio_kilos || '0'}/kg - Venta: $${formData.precio_venderK || '0'}/kg`
                      : `${formData.unidades || '0'} unid. - Costo: $${formData.precio_unidad || '0'}/unid - Venta: $${formData.precio_venderD || '0'}/unid`}
                  </div>
                  <div className="col-md-2">
                    <strong>Fecha:</strong><br/>
                    {formData.fecha_recibimiento || 'No especificada'}
                  </div>
                  <div className="col-md-2">
                    <strong>Ganancia:</strong><br/>
                    <span className={parseFloat(calculatedValues.ganancia) > 0 ? 'text-success fw-bold' : ''}>
                      ${calculatedValues.ganancia}
                    </span>
                  </div>
                  {formData.observaciones && (
                    <div className="col-md-12 mt-2">
                      <strong>Observaciones:</strong><br/>
                      <span className="text-muted">{formData.observaciones}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          <div className="card-footer text-muted text-center">
            <small>
              <i className="bi bi-info-circle me-1"></i>
              Complete todos los campos. Los precios de venta deben ser mayores que los de costo para obtener ganancia.
            </small>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegistroProductos;