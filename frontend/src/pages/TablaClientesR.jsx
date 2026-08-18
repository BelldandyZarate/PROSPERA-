import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import "bootstrap/dist/css/bootstrap.min.css";
import { useNavigate } from "react-router-dom";
import { FaPrint, FaEdit, FaTrash } from "react-icons/fa";

const TablaClientesR = () => {
  const [clientes, setClientes] = useState([]);
  const [paginaActual, setPaginaActual] = useState(1);
  const [filtro, setFiltro] = useState("");
  const clientesPorPagina = 7;
  const navigate = useNavigate();

  useEffect(() => {
    obtenerClientes();
  }, []);

  const obtenerClientes = () => {
    fetch("/api/obtener_clientes.php")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setClientes(data.data);
        } else {
          console.error("Error al obtener clientes");
        }
      });
  };

  const imprimirCodigo = (src) => {
    const ventana = window.open("", "_blank");
    ventana.document.write(`
      <html>
      <head><title>Imprimir Código</title></head>
      <body onload="window.print(); window.close();">
        <img src="${src}" style="width:300px;" />
      </body>
      </html>
    `);
    ventana.document.close();
  };

  const handleEditar = (curp) => {
    navigate(`/editar-cliente-r/${curp}`);
  };

  const eliminarCliente = (nombre_completo) => {
    if (window.confirm("¿Estás seguro de eliminar este cliente?")) {
      fetch("/api/eliminar_cliente.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ nombre_completo }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            alert("Cliente eliminado correctamente");
            obtenerClientes();
          } else {
            alert("Error al eliminar cliente");
          }
        });
    }
  };

  const clientesFiltrados = clientes.filter((cliente) =>
    cliente.nombre_completo.toLowerCase().includes(filtro.toLowerCase()) ||
    (cliente.telefono && cliente.telefono.includes(filtro))
  );

  const totalPaginas = Math.ceil(clientesFiltrados.length / clientesPorPagina);
  const indiceInicio = (paginaActual - 1) * clientesPorPagina;
  const clientesPagina = clientesFiltrados.slice(
    indiceInicio,
    indiceInicio + clientesPorPagina
  );

  const cambiarPagina = (nuevaPagina) => {
    if (nuevaPagina >= 1 && nuevaPagina <= totalPaginas) {
      setPaginaActual(nuevaPagina);
    }
  };

  return (
    <div className="d-flex">
      <Sidebar />

      <div className="container-fluid p-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h2>Lista de Clientes</h2>
          <button
            className="btn btn-success"
            onClick={() => navigate("/registroCR")}
          >
            Registrar Cliente
          </button>
        </div>

        <div className="mb-3">
          <input
            type="text"
            className="form-control"
            placeholder="Buscar por nombre o teléfono..."
            value={filtro}
            onChange={(e) => {
              setFiltro(e.target.value);
              setPaginaActual(1);
            }}
          />
        </div>

        <div className="d-flex justify-content-between align-items-center mb-2">
          <small className="text-muted">
            Total registros: {clientesFiltrados.length}
          </small>
        </div>

        <div className="table-responsive">
          <table className="table table-striped table-bordered">
            <thead className="table-dark">
              <tr>
                <th>Nombre Completo</th>
                <th>Teléfono</th>
                <th>Código de Barras</th>
                <th>Tipo de Pago</th>
                <th>Notas</th>
                <th>Fecha de Registro</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
            {clientesPagina.map((cliente, index) => (
                <tr key={index}>
                <td>{cliente.nombre_completo}</td>
                <td>{cliente.telefono || '-'}</td>
                <td>
                    <img
                    src={`/api/${cliente.barcode_img}`}
                    alt="Código de barras"
                    style={{ width: "150px" }}
                    />
                </td>
                <td>{cliente.tipo_pago}</td>
                <td>{cliente.notas}</td>
                <td>{new Date(cliente.fecha_registro).toLocaleString()}</td>
                <td className="d-flex gap-1">
                    <button
                    className="btn btn-outline-primary btn-sm"
                    title="Imprimir"
                    onClick={() =>
                        imprimirCodigo(`/api/${cliente.barcode_img}`)
                    }
                    >
                    <FaPrint />
                    </button>
                    <button
                    className="btn btn-outline-warning btn-sm"
                    title="Editar"
                    onClick={() => handleEditar(cliente.curp)}
                    >
                    <FaEdit />
                    </button>
                </td>
                </tr>
            ))}
            {clientesPagina.length === 0 && (
                <tr>
                <td colSpan="7" className="text-center">
                    No hay clientes registrados.
                </td>
                </tr>
            )}
            </tbody>
          </table>
        </div>

        <div className="d-flex justify-content-between align-items-center mt-3">
          <button
            className="btn btn-outline-secondary"
            disabled={paginaActual === 1}
            onClick={() => cambiarPagina(paginaActual - 1)}
          >
            Anterior
          </button>
          <span>
            Página {paginaActual} de {totalPaginas}
          </span>
          <button
            className="btn btn-outline-secondary"
            disabled={paginaActual === totalPaginas}
            onClick={() => cambiarPagina(paginaActual + 1)}
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
};

export default TablaClientesR;
