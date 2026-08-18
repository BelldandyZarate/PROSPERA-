import React, { useState, useEffect, useRef } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import JsBarcode from "jsbarcode";
import Sidebar from '../components/Sidebar';
import { useNavigate } from 'react-router-dom';

const RegistroCliente = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    curp: "",
    id_votante: "",
    nombre_completo: "",
    direccion: "",
    codigo_postal: "",
    colonia: "",
    estado: "",
    ciudad: "",
    correo: "",
    telefono: "",
    notas: "",
    tipo_pago: "",
    medio: "",
    adultos: "",
    menores: "",
    sugerencias: "",
    padecimientos: "",
    quien_padece: ""
  });

  const [fotoCliente, setFotoCliente] = useState(null);
  const [fotoIne, setFotoIne] = useState(null);
  const [coloniasDisponibles, setColoniasDisponibles] = useState([]);
  const [currentSection, setCurrentSection] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagenesSubidas, setImagenesSubidas] = useState(false);
  const barcodeCanvasRef = useRef(null);

  useEffect(() => {
    if (formData.curp.length >= 10 && barcodeCanvasRef.current) {
      JsBarcode(barcodeCanvasRef.current, formData.curp, {
        format: "CODE128",
        lineColor: "#000",
        width: 2,
        height: 40,
        displayValue: true,
      });
    }
  }, [formData.curp]);

  useEffect(() => {
    setImagenesSubidas(fotoCliente !== null && fotoIne !== null);
  }, [fotoCliente, fotoIne]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCodigoPostalChange = async (e) => {
    const codigoPostal = e.target.value.replace(/\D/, "");
    setFormData(prev => ({ ...prev, codigo_postal: codigoPostal }));

    if (codigoPostal.length === 5) {
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
            estado: resultado.estado,
            ciudad: resultado.ciudad,
            colonia: resultado.colonias[0]
          }));
        } else {
          setColoniasDisponibles([]);
        }
      } catch (error) {
        console.error("Error cargando datos de CP:", error);
      }
    } else {
      setColoniasDisponibles([]);
    }
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
      if (!canvas) {
        alert("Error: código de barras no generado");
        setIsSubmitting(false);
        return;
      }

      const barcodeBlob = await new Promise(resolve => {
        canvas.toBlob(resolve, "image/png");
      });

      const data = new FormData();
      for (const key in formData) {
        data.append(key, formData[key]);
      }

      if (fotoCliente) data.append("foto_cliente", fotoCliente);
      if (fotoIne) data.append("foto_ine", fotoIne);
      data.append("barcode_img", barcodeBlob, "barcode.png");

      const res = await fetch("/api/guardar_cliente.php", {
        method: "POST",
        body: data,
      });

      const text = await res.text();
      try {
        const result = JSON.parse(text);
        alert(result.message || result.error);

        if (formData.telefono.length >= 10) {
          const telefonoSinEspacios = formData.telefono.replace(/\D/g, "");
          const mensaje = encodeURIComponent(`¡Bienvenid@ ${formData.nombre_completo}! a FUNDACIÓN PROPERIDAD.
             Por favor tomate el tiempo para contestar nuestra encuesta psicomatrica: https://docs.google.com/forms/d/1QMG9jsnW_Q3TOj-Q9m-tdkY2yvmTatN4A8waZJeqsWI/edit`);
          const urlWhatsapp = `https://wa.me/52${telefonoSinEspacios}?text=${mensaje}`;
          window.open(urlWhatsapp, "_blank");
        }

        setFormData({
          curp: "",
          id_votante: "",
          nombre_completo: "",
          direccion: "",
          codigo_postal: "",
          colonia: "",
          estado: "",
          ciudad: "",
          correo: "",
          telefono: "",
          notas: "",
          tipo_pago: "",
          medio: "",
          adultos: "",
          menores: "",
          sugerencias: "",
          padecimientos: "",
          quien_padece: ""
        });
        setFotoCliente(null);
        setFotoIne(null);
        navigate('/TablaCR');
      } catch (error) {
        console.error("Respuesta no válida JSON:", text);
        alert("Error del servidor. Revisa la consola.");
      }
    } catch (error) {
      alert("Error al registrar cliente. Revisa la consola.");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextSection = () => {
    setCurrentSection(prev => Math.min(prev + 1, 7));
  };

  const prevSection = () => {
    setCurrentSection(prev => Math.max(prev - 1, 1));
  };

  const renderSection = () => {
    switch(currentSection) {
      case 1:
        return (
          <div className="row mb-4">
            <h4 className="mb-4 text-primary">Información Básica</h4>
            <div className="col-md-4 mb-3">
              <label className="form-label fw-semibold">CURP</label>
              <input
                type="text"
                name="curp"
                className="form-control"
                value={formData.curp}
                onChange={handleChange}
              />
            </div>
            
            <div className="col-md-4 mb-3">
              <label className="form-label fw-semibold">ID Votante</label>
              <input
                type="text"
                name="id_votante"
                className="form-control"
                value={formData.id_votante}
                onChange={handleChange}
              />
            </div>
            
            <div className="col-md-4 mb-3">
              <label className="form-label fw-semibold">Nombre completo</label>
              <input
                type="text"
                name="nombre_completo"
                className="form-control"
                value={formData.nombre_completo}
                onChange={handleChange}
              />
            </div>
          </div>
        );
      case 2:
        return (
          <div className="row mb-4">
            <h4 className="mb-4 text-primary">Dirección</h4>
            <div className="col-md-6 mb-3">
              <label className="form-label fw-semibold">Dirección</label>
              <input
                type="text"
                name="direccion"
                className="form-control"
                value={formData.direccion}
                onChange={handleChange}
              />
            </div>
            
            <div className="col-md-2 mb-3">
              <label className="form-label fw-semibold">Código Postal</label>
              <input
                type="text"
                name="codigo_postal"
                className="form-control"
                value={formData.codigo_postal}
                onChange={handleCodigoPostalChange}
                maxLength={5}
              />
            </div>
            
            <div className="col-md-2 mb-3">
              <label className="form-label fw-semibold">Colonia</label>
              {coloniasDisponibles.length > 0 ? (
                <select
                  name="colonia"
                  className="form-select"
                  value={formData.colonia}
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
                  value={formData.colonia}
                  onChange={handleChange}
                />
              )}
            </div>
            
            <div className="col-md-2 mb-3">
              <label className="form-label fw-semibold">Municipio</label>
              <input
                type="text"
                name="ciudad"
                className="form-control"
                value={formData.ciudad}
                onChange={handleChange}
              />
            </div>
          </div>
        );
      case 3:
        return (
          <div className="row mb-4">
            <h4 className="mb-4 text-primary">Contacto</h4>
            <div className="col-md-4 mb-3">
              <label className="form-label fw-semibold">Correo electrónico</label>
              <input
                type="email"
                name="correo"
                className="form-control"
                value={formData.correo}
                onChange={handleChange}
              />
            </div>
            
            <div className="col-md-4 mb-3">
              <label className="form-label fw-semibold">Teléfono</label>
              <input
                type="text"
                name="telefono"
                className="form-control"
                value={formData.telefono}
                onChange={handleChange}
              />
            </div>
            
            <div className="col-md-4 mb-3">
              <label className="form-label fw-semibold">Estado</label>
              <input
                type="text"
                name="estado"
                className="form-control"
                value={formData.estado}
                onChange={handleChange}
              />
            </div>
          </div>
        );
      case 4:
        return (
          <div className="row mb-4">
            <h4 className="mb-4 text-primary">Información Adicional</h4>
            <div className="col-md-6 mb-3">
              <label className="form-label fw-semibold">Notas</label>
              <textarea
                name="notas"
                className="form-control"
                rows="2"
                value={formData.notas}
                onChange={handleChange}
              ></textarea>
            </div>
            
            <div className="col-md-3 mb-3">
              <label className="form-label fw-semibold">Tipo de pago</label>
              <select
                name="tipo_pago"
                className="form-select"
                value={formData.tipo_pago}
                onChange={handleChange}
              >
                <option value="">Seleccione</option>
                <option value="efectivo">Efectivo</option>
                <option value="banco">Banco</option>
              </select>
            </div>
            
            <div className="col-md-3 mb-3">
              <label className="form-label fw-semibold">Medio de contacto</label>
              <select
                name="medio"
                className="form-select"
                value={formData.medio}
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
        );
      case 5:
        return (
          <div className="row mb-4">
            <h4 className="mb-4 text-primary">Familia</h4>
            <div className="col-md-3 mb-3">
              <label className="form-label fw-semibold">Adultos (18+ años)</label>
              <input
                type="number"
                name="adultos"
                className="form-control"
                value={formData.adultos}
                onChange={handleChange}
              />
            </div>
            
            <div className="col-md-3 mb-3">
              <label className="form-label fw-semibold">Menores de edad</label>
              <input
                type="number"
                name="menores"
                className="form-control"
                value={formData.menores}
                onChange={handleChange}
              />
            </div>
            
            <div className="col-md-6 mb-3">
              <label className="form-label fw-semibold">Sugerencias</label>
              <textarea
                name="sugerencias"
                className="form-control"
                rows="2"
                value={formData.sugerencias}
                onChange={handleChange}
              ></textarea>
            </div>
          </div>
        );
      case 6:
        return (
          <div className="row mb-4">
            <h4 className="mb-4 text-primary">Salud</h4>
            <div className="col-md-6 mb-3">
              <label className="form-label fw-semibold">Padecimientos crónicos</label>
              <input
                type="text"
                name="padecimientos"
                className="form-control"
                value={formData.padecimientos}
                onChange={handleChange}
              />
            </div>
            
            <div className="col-md-6 mb-3">
              <label className="form-label fw-semibold">¿Quién los padece?</label>
              <input
                type="text"
                name="quien_padece"
                className="form-control"
                value={formData.quien_padece}
                onChange={handleChange}
              />
            </div>
          </div>
        );
      case 7:
        return (
          <div className="row mb-4">
            <h4 className="mb-4 text-primary">Documentos</h4>
            <div className="col-md-6 mb-3">
              <label className="form-label fw-semibold">Foto del cliente</label>
              <input
                type="file"
                name="foto_cliente"
                accept="image/*"
                className="form-control"
                onChange={e => setFotoCliente(e.target.files[0])}
              />
              {fotoCliente && (
                <div className="mt-2">
                  <span className="badge bg-success">Foto lista para subir</span>
                </div>
              )}
            </div>
            
            <div className="col-md-6 mb-3">
              <label className="form-label fw-semibold">Foto INE/IFE</label>
              <input
                type="file"
                name="foto_ine"
                accept="image/*"
                className="form-control"
                onChange={e => setFotoIne(e.target.files[0])}
              />
              {fotoIne && (
                <div className="mt-2">
                  <span className="badge bg-success">Foto lista para subir</span>
                </div>
              )}
            </div>
            
            {!imagenesSubidas && (
              <div className="alert alert-warning mt-3">
                Por favor, sube tanto la foto del cliente como la foto del INE para poder guardar el registro.
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="d-flex" style={{ minHeight: '100vh' }}>
      <Sidebar />
      
      <div className="flex-grow-1 p-4" style={{ 
        marginLeft: '250px',
        backgroundColor: '#f8f9fa'
      }}>
        <div className="bg-white rounded-3 shadow-sm p-4">
          <h2 className="mb-4 text-primary border-bottom pb-3">Registro de Cliente</h2>
          
          <div className="progress mb-4" style={{ height: '10px' }}>
            <div 
              className="progress-bar bg-primary" 
              role="progressbar" 
              style={{ width: `${(currentSection / 7) * 100}%` }}
              aria-valuenow={currentSection}
              aria-valuemin="1"
              aria-valuemax="7"
            ></div>
          </div>
          
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
            {renderSection()}
            
            <div className="d-flex justify-content-between mt-4">
              {currentSection > 1 && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={prevSection}
                  disabled={isSubmitting}
                >
                  Anterior
                </button>
              )}
              
              {currentSection < 7 ? (
                <button
                  type="button"
                  className="btn btn-primary ms-auto"
                  onClick={nextSection}
                  disabled={isSubmitting}
                >
                  Siguiente
                </button>
              ) : (
                <button
                  type="submit"
                  className="btn btn-success ms-auto"
                  disabled={isSubmitting || !imagenesSubidas}
                >
                  {isSubmitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Guardando...
                    </>
                  ) : (
                    "Guardar Cliente"
                  )}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegistroCliente;