import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import JsBarcode from "jsbarcode";

const EditarClienteR = () => {
  const { curp } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState(null);
  const [mensaje, setMensaje] = useState("");
  const [coloniasDisponibles, setColoniasDisponibles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const barcodeCanvasRef = useRef(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentSection, setCurrentSection] = useState(0);
  const formRef = useRef(null);

  const sections = [
    "Información Básica",
    "Dirección",
    "Contacto",
    "Información Adicional",
    "Familia",
    "Salud"
  ];

  useEffect(() => {
    fetch(`/api/editar_cliente.php?curp=${curp}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setFormData(data.data);
          if (data.data.codigo_postal) {
            cargarColonias(data.data.codigo_postal);
          }
        } else {
          setMensaje("Cliente no encontrado.");
        }
      })
      .catch(() => setMensaje("Error al cargar cliente."));
  }, [curp]);

  useEffect(() => {
    if (formData?.curp && barcodeCanvasRef.current) {
      JsBarcode(barcodeCanvasRef.current, formData.curp, {
        format: "CODE128",
        lineColor: "#000",
        width: 2,
        height: 40,
        displayValue: true,
      });
    }
  }, [formData?.curp]);

  const cargarColonias = async (codigoPostal) => {
    try {
      const [cdmxRes, edoRes] = await Promise.all([
        fetch("/data/cdmx.json"),
        fetch("/data/edomex.json")
      ]);
      const [cdmxData, edoData] = await Promise.all([
        cdmxRes.json(),
        edoRes.json()
      ]);
      const todos = [...cdmxData, ...edoData];
      const resultado = todos.find(cp => cp.cp === codigoPostal);

      if (resultado) {
        setColoniasDisponibles(resultado.colonias);
        setFormData(prev => ({
          ...prev,
          estado: prev.estado || resultado.estado,
          ciudad: prev.ciudad || resultado.ciudad,
          colonia: prev.colonia || resultado.colonias[0]
        }));
      } else {
        setColoniasDisponibles([]);
      }
    } catch (error) {
      console.error("Error cargando datos de CP:", error);
    }
  };

  const handleCodigoPostalChange = async (e) => {
    const codigoPostal = e.target.value.replace(/\D/g, "");
    setFormData(prev => ({ ...prev, codigo_postal: codigoPostal }));

    if (codigoPostal.length === 5) {
      await cargarColonias(codigoPostal);
    } else {
      setColoniasDisponibles([]);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      JsBarcode(barcodeCanvasRef.current, formData.curp, {
        format: "CODE128",
        lineColor: "#000",
        width: 2,
        height: 40,
        displayValue: true,
      });

      const canvas = barcodeCanvasRef.current;
      const barcodeBlob = await new Promise(resolve => {
        canvas.toBlob(resolve, "image/png");
      });

      const form = new FormData();
      for (const key in formData) {
        form.append(key, formData[key]);
      }
      form.append("barcode_img", barcodeBlob, "barcode.png");

      const res = await fetch("/api/editar_cliente.php", {
        method: "POST",
        body: form,
      });

      const data = await res.json();
      if (data.success) {
        alert("Cliente actualizado correctamente.");
        navigate("/TablaC");
      } else {
        setMensaje(data.message || "Error al actualizar.");
      }
    } catch (error) {
      setMensaje("Error en la conexión al actualizar.");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const nextSection = () => {
    if (currentSection < sections.length - 1) {
      setCurrentSection(currentSection + 1);
      scrollToTop();
    }
  };

  const prevSection = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
      scrollToTop();
    }
  };

  const scrollToTop = () => {
    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (!formData) return (
    <div className="d-flex" style={{ minHeight: '100vh' }}>
      <Sidebar collapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />
      <div className={`flex-grow-1 p-3 ${sidebarCollapsed ? 'content-collapsed' : 'content-expanded'}`}>
        <p className="m-4">Cargando...</p>
      </div>
    </div>
  );

  return (
    <div className="d-flex" style={{ minHeight: '100vh' }}>
      <Sidebar collapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />
      
      <div className={`flex-grow-1 p-3 ${sidebarCollapsed ? 'content-collapsed' : 'content-expanded'}`}>
        <div className="bg-white rounded-3 shadow-sm p-3 p-md-4" ref={formRef}>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="text-primary border-bottom pb-2">Editar Cliente</h2>
            <button 
              className="btn btn-outline-secondary d-md-none"
              onClick={toggleSidebar}
            >
              <i className={`bi bi-arrow-${sidebarCollapsed ? 'right' : 'left'}`}></i>
            </button>
          </div>
          
          {mensaje && <div className="alert alert-danger">{mensaje}</div>}

          {formData.curp && (
            <div className="text-center mb-4 p-3 bg-light rounded">
              <canvas ref={barcodeCanvasRef} style={{ display: "none" }} />
              <img
                src={barcodeCanvasRef.current?.toDataURL("image/png")}
                alt="Código de Barras"
                className="img-fluid"
                style={{ maxHeight: '80px' }}
              />
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Sección de navegación */}
            <div className="d-flex justify-content-between align-items-center mb-4">
              <button 
                type="button" 
                className="btn btn-outline-primary"
                onClick={prevSection}
                disabled={currentSection === 0}
              >
                <i className="bi bi-arrow-left"></i> Anterior
              </button>
              
              <h4 className="mb-0 text-primary text-center">
                {sections[currentSection]}
              </h4>
              
              <button 
                type="button" 
                className="btn btn-outline-primary"
                onClick={nextSection}
                disabled={currentSection === sections.length - 1}
              >
                Siguiente <i className="bi bi-arrow-right"></i>
              </button>
            </div>

            {/* Información Básica - visible solo cuando currentSection es 0 */}
            <div className={`row mb-4 ${currentSection === 0 ? '' : 'd-none'}`}>
              <div className="col-12 col-md-4 mb-3">
                <label className="form-label fw-semibold">CURP</label>
                <input
                  type="text"
                  name="curp"
                  className="form-control"
                  value={formData.curp}
                  readOnly
                />
              </div>
              
              <div className="col-12 col-md-4 mb-3">
                <label className="form-label fw-semibold">ID Votante</label>
                <input
                  type="text"
                  name="id_votante"
                  className="form-control"
                  value={formData.id_votante || ""}
                  readOnly
                />
              </div>
              
              <div className="col-12 col-md-4 mb-3">
                <label className="form-label fw-semibold">Nombre completo</label>
                <input
                  type="text"
                  name="nombre_completo"
                  className="form-control"
                  value={formData.nombre_completo || ""}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Dirección - visible solo cuando currentSection es 1 */}
            <div className={`row mb-4 ${currentSection === 1 ? '' : 'd-none'}`}>
              <div className="col-12 col-md-6 mb-3">
                <label className="form-label fw-semibold">Dirección</label>
                <input
                  type="text"
                  name="direccion"
                  className="form-control"
                  value={formData.direccion || ""}
                  onChange={handleChange}
                />
              </div>
              
              <div className="col-12 col-md-2 mb-3">
                <label className="form-label fw-semibold">Código Postal</label>
                <input
                  type="text"
                  name="codigo_postal"
                  className="form-control"
                  value={formData.codigo_postal || ""}
                  onChange={handleCodigoPostalChange}
                  maxLength={5}
                />
              </div>
              
              <div className="col-12 col-md-2 mb-3">
                <label className="form-label fw-semibold">Colonia</label>
                {coloniasDisponibles.length > 0 ? (
                  <select
                    name="colonia"
                    className="form-select"
                    value={formData.colonia || ""}
                    onChange={handleChange}
                  >
                    {coloniasDisponibles.map((colonia, index) => (
                      <option key={index} value={colonia}>{colonia}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    name="colonia"
                    className="form-control"
                    value={formData.colonia || ""}
                    onChange={handleChange}
                  />
                )}
              </div>
              
              <div className="col-12 col-md-2 mb-3">
                <label className="form-label fw-semibold">Municipio</label>
                <input
                  type="text"
                  name="ciudad"
                  className="form-control"
                  value={formData.ciudad || ""}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Contacto - visible solo cuando currentSection es 2 */}
            <div className={`row mb-4 ${currentSection === 2 ? '' : 'd-none'}`}>
              <div className="col-12 col-md-4 mb-3">
                <label className="form-label fw-semibold">Correo electrónico</label>
                <input
                  type="email"
                  name="correo"
                  className="form-control"
                  value={formData.correo || ""}
                  onChange={handleChange}
                />
              </div>
              
              <div className="col-12 col-md-4 mb-3">
                <label className="form-label fw-semibold">Teléfono</label>
                <input
                  type="text"
                  name="telefono"
                  className="form-control"
                  value={formData.telefono || ""}
                  onChange={handleChange}
                />
              </div>
              
              <div className="col-12 col-md-4 mb-3">
                <label className="form-label fw-semibold">Estado</label>
                <input
                  type="text"
                  name="estado"
                  className="form-control"
                  value={formData.estado || ""}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Información Adicional - visible solo cuando currentSection es 3 */}
            <div className={`row mb-4 ${currentSection === 3 ? '' : 'd-none'}`}>
              <div className="col-12 col-md-6 mb-3">
                <label className="form-label fw-semibold">Notas</label>
                <textarea
                  name="notas"
                  className="form-control"
                  rows="2"
                  value={formData.notas || ""}
                  onChange={handleChange}
                ></textarea>
              </div>
              
              <div className="col-12 col-md-3 mb-3">
                <label className="form-label fw-semibold">Tipo de pago</label>
                <select
                  name="tipo_pago"
                  className="form-select"
                  value={formData.tipo_pago || ""}
                  onChange={handleChange}
                >
                  <option value="">Seleccione</option>
                  <option value="efectivo">Efectivo</option>
                  <option value="banco">Banco</option>
                </select>
              </div>
              
              <div className="col-12 col-md-3 mb-3">
                <label className="form-label fw-semibold">Medio de contacto</label>
                <select
                  name="medio"
                  className="form-select"
                  value={formData.medio || ""}
                  onChange={handleChange}
                >
                  <option value="">Seleccione</option>
                  <option value="volantes">Volantes</option>
                  <option value="cartulina">Cartulina</option>
                  <option value="en casa">En casa</option>
                  <option value="recomendacion">Recomendación</option>
                </select>
              </div>
            </div>

            {/* Familia - visible solo cuando currentSection es 4 */}
            <div className={`row mb-4 ${currentSection === 4 ? '' : 'd-none'}`}>
              <div className="col-12 col-md-3 mb-3">
                <label className="form-label fw-semibold">Adultos (18+ años)</label>
                <input
                  type="number"
                  name="adultos"
                  className="form-control"
                  value={formData.adultos || ""}
                  onChange={handleChange}
                />
              </div>
              
              <div className="col-12 col-md-3 mb-3">
                <label className="form-label fw-semibold">Menores de edad</label>
                <input
                  type="number"
                  name="menores"
                  className="form-control"
                  value={formData.menores || ""}
                  onChange={handleChange}
                />
              </div>
              
              <div className="col-12 col-md-6 mb-3">
                <label className="form-label fw-semibold">Sugerencias</label>
                <textarea
                  name="sugerencias"
                  className="form-control"
                  rows="2"
                  value={formData.sugerencias || ""}
                  onChange={handleChange}
                ></textarea>
              </div>
            </div>

            {/* Salud - visible solo cuando currentSection es 5 */}
            <div className={`row mb-4 ${currentSection === 5 ? '' : 'd-none'}`}>
              <div className="col-12 col-md-6 mb-3">
                <label className="form-label fw-semibold">Padecimientos crónicos</label>
                <input
                  type="text"
                  name="padecimientos"
                  className="form-control"
                  value={formData.padecimientos || ""}
                  onChange={handleChange}
                />
              </div>
              
              <div className="col-12 col-md-6 mb-3">
                <label className="form-label fw-semibold">¿Quién los padece?</label>
                <input
                  type="text"
                  name="quien_padece"
                  className="form-control"
                  value={formData.quien_padece || ""}
                  onChange={handleChange}
                />
              </div>
            </div>

           

            <div className="d-flex flex-column flex-md-row justify-content-md-end mt-4 gap-2">
              <button
                type="button"
                className="btn btn-secondary order-2 order-md-1"
                onClick={() => navigate('/TablaCR')}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn btn-primary order-1 order-md-2"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Guardando...
                  </>
                ) : (
                  "Guardar Cambios"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      <style jsx>{`
        .content-expanded {
          margin-left: 250px;
          transition: margin-left 0.3s ease;
        }
        .content-collapsed {
          margin-left: 60px;
          transition: margin-left 0.3s ease;
        }
        @media (max-width: 768px) {
          .content-expanded, .content-collapsed {
            margin-left: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default EditarClienteR;