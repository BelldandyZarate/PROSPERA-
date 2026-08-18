import { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import Sidebar from "../components/Sidebar";

function CodigoBarras() {
  const [archivo, setArchivo] = useState(null);
  const [mensaje, setMensaje] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!archivo) {
      setMensaje("Por favor selecciona un archivo CSV");
      return;
    }

    setIsLoading(true);
    setMensaje("");

    try {
      const formData = new FormData();
      formData.append("archivo", archivo);

      // Cambia esta ruta según tu estructura de proyecto
      const res = await fetch("api/importar_csv.php", {
        method: "POST",
        body: formData
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const result = await res.json();
      setMensaje(result.message || result.error);
    } catch (error) {
      setMensaje(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-md-2 p-0">
          <Sidebar />
        </div>
        <div className="col-md-10 p-4">
          <div className="card shadow">
            <div className="card-header bg-primary text-white">
              <h3 className="mb-0">Importar Códigos Postales desde CSV</h3>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit} encType="multipart/form-data">
                <div className="mb-3">
                  <label htmlFor="csvFile" className="form-label">
                    Selecciona archivo CSV
                  </label>
                  <input
                    id="csvFile"
                    type="file"
                    accept=".csv"
                    onChange={e => setArchivo(e.target.files[0])}
                    className="form-control"
                    required
                    name="archivo"
                  />
                  <div className="form-text">
                    El archivo debe estar en formato CSV con los códigos postales.
                  </div>
                </div>
                
                <button 
                  className="btn btn-primary" 
                  type="submit"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Procesando...
                    </>
                  ) : 'Importar'}
                </button>
              </form>
              
              {mensaje && (
                <div className={`alert mt-4 ${mensaje.toLowerCase().includes('error') ? 'alert-danger' : 'alert-success'}`}>
                  {mensaje}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CodigoBarras;