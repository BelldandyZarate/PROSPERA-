import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import "bootstrap/dist/css/bootstrap.min.css";
import { useNavigate } from "react-router-dom";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

function TablaVentas() {
  const [ventasAgrupadas, setVentasAgrupadas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [productos, setProductos] = useState([]);
  const [filtros, setFiltros] = useState({
    folio: "",
    cliente_id: "",
    producto_id: "",
    fecha_inicio: "",
    fecha_fin: "",
    estado_pago: "",
    metodo_pago: "",
    tipo_venta: ""
  });
  const [paginacion, setPaginacion] = useState({
    pagina_actual: 1,
    por_pagina: 10,
    total_filas: 0,
    total_paginas: 0
  });
  const [estadisticas, setEstadisticas] = useState({
    total_ventas: 0,
    total_items: 0,
    importe_total: 0,
    importe_pagado: 0,
    importe_pendiente: 0,
    importe_cancelado: 0,
    total_clientes: 0,
    total_productos: 0,
    total_kilos: 0,
    total_unidades: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exportando, setExportando] = useState(false);
  const navigate = useNavigate();

  // Cargar datos iniciales
  useEffect(() => {
    cargarClientes();
    cargarProductos();
    cargarVentas();
  }, []);

  // Cargar clientes
  const cargarClientes = async () => {
    try {
      const response = await fetch('http://localhost/api/obtener_clientes.php');
      const data = await response.json();
      if (data.success) {
        setClientes(data.data || []);
      }
    } catch (error) {
      console.error("Error al cargar clientes:", error);
    }
  };

  // Cargar productos
  const cargarProductos = async () => {
    try {
      const response = await fetch('http://localhost/api/obtener_productos.php');
      const data = await response.json();
      if (data.success) {
        setProductos(data.data || []);
      }
    } catch (error) {
      console.error("Error al cargar productos:", error);
    }
  };

  // Cargar ventas
  const cargarVentas = async (pagina = 1) => {
    setLoading(true);
    setError(null);
    
    try {
      // Construir URL con filtros
      const params = new URLSearchParams();
      
      // Agregar filtros
      Object.keys(filtros).forEach(key => {
        if (filtros[key]) {
          params.append(key, filtros[key]);
        }
      });
      
      // Agregar paginación
      params.append('pagina', pagina);
      params.append('por_pagina', paginacion.por_pagina);

      const url = `/api/obtener_ventas.php?${params.toString()}`;
      console.log("📡 Consultando:", url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Error HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log("📦 Respuesta recibida:", data);
      
      if (data.success) {
        setVentasAgrupadas(data.ventas_agrupadas || []);
        setEstadisticas(data.estadisticas || {});
        
        // Actualizar paginación con los datos del servidor
        if (data.paginacion) {
          setPaginacion({
            ...paginacion,
            pagina_actual: pagina,
            total_filas: data.paginacion.total_filas,
            total_paginas: data.paginacion.total_paginas
          });
        } else {
          // Datos de respaldo
          setPaginacion({
            ...paginacion,
            pagina_actual: pagina,
            total_filas: ventasAgrupadas.length,
            total_paginas: Math.ceil(ventasAgrupadas.length / paginacion.por_pagina)
          });
        }
      } else {
        throw new Error(data.message || "Error al cargar ventas");
      }
    } catch (error) {
      console.error("💥 Error al cargar ventas:", error);
      setError(error.message);
      
      // Datos de prueba para desarrollo
      const ventasPrueba = [
        {
          id: 1,
          folio: "VEN-2024-001",
          cliente: "Juan Pérez García",
          cliente_telefono: "5551234567",
          fecha_venta: "2024-01-15 10:30:00",
          fecha_venta_formateada: "15/01/2024 10:30",
          estado_pago: "pagado",
          metodo_pago: "efectivo",
          total_venta: 246.69,
          total_productos: 2,
          detalles: [
            {
              nombre_producto: "Arroz",
              tipo_venta: "kilos",
              cantidad: 5.5,
              precio_unitario: 25.50,
              precio_total: 140.25,
              unidad_medida: "kg"
            },
            {
              nombre_producto: "Frijol",
              tipo_venta: "kilos",
              cantidad: 3.25,
              precio_unitario: 32.75,
              precio_total: 106.44,
              unidad_medida: "kg"
            }
          ]
        },
        // Agregar más ventas de prueba para demostrar paginación
        ...Array.from({length: 25}, (_, i) => ({
          id: i + 2,
          folio: `VEN-2024-${(i + 2).toString().padStart(3, '0')}`,
          cliente: `Cliente ${i + 1}`,
          cliente_telefono: "5551234567",
          fecha_venta: `2024-01-${15 + i} 10:30:00`,
          fecha_venta_formateada: `${15 + i}/01/2024 10:30`,
          estado_pago: i % 3 === 0 ? "pagado" : i % 3 === 1 ? "pendiente" : "cancelado",
          metodo_pago: i % 3 === 0 ? "efectivo" : i % 3 === 1 ? "tarjeta" : "transferencia",
          total_venta: 100 + (i * 50),
          total_productos: 1 + (i % 3),
          detalles: [
            {
              nombre_producto: "Producto " + (i + 1),
              tipo_venta: "kilos",
              cantidad: 1 + (i % 5),
              precio_unitario: 25.50,
              precio_total: 140.25,
              unidad_medida: "kg"
            }
          ]
        }))
      ];
      
      // Paginar manualmente los datos de prueba
      const inicio = (pagina - 1) * paginacion.por_pagina;
      const fin = inicio + paginacion.por_pagina;
      const ventasPagina = ventasPrueba.slice(inicio, fin);
      
      setVentasAgrupadas(ventasPagina);
      setEstadisticas({
        total_ventas: ventasPrueba.length,
        total_items: ventasPrueba.reduce((sum, v) => sum + v.total_productos, 0),
        importe_total: ventasPrueba.reduce((sum, v) => sum + v.total_venta, 0),
        importe_pagado: ventasPrueba.filter(v => v.estado_pago === 'pagado').reduce((sum, v) => sum + v.total_venta, 0),
        importe_pendiente: ventasPrueba.filter(v => v.estado_pago === 'pendiente').reduce((sum, v) => sum + v.total_venta, 0),
        importe_cancelado: ventasPrueba.filter(v => v.estado_pago === 'cancelado').reduce((sum, v) => sum + v.total_venta, 0),
        total_clientes: new Set(ventasPrueba.map(v => v.cliente)).size,
        total_productos: new Set(ventasPrueba.flatMap(v => v.detalles.map(d => d.nombre_producto))).size,
        total_kilos: ventasPrueba.flatMap(v => v.detalles).filter(d => d.tipo_venta === 'kilos').reduce((sum, d) => sum + d.cantidad, 0),
        total_unidades: ventasPrueba.flatMap(v => v.detalles).filter(d => d.tipo_venta === 'unidades').reduce((sum, d) => sum + d.cantidad, 0)
      });
      
      setPaginacion({
        ...paginacion,
        pagina_actual: pagina,
        total_filas: ventasPrueba.length,
        total_paginas: Math.ceil(ventasPrueba.length / paginacion.por_pagina)
      });
    } finally {
      setLoading(false);
    }
  };

  // Función para exportar a Excel con suma total
  const exportarExcel = () => {
    setExportando(true);
    
    try {
      // Calcular suma total de las ventas en la página actual
      const sumaTotalVentas = ventasAgrupadas.reduce((total, venta) => total + venta.total_venta, 0);
      
      // Preparar los datos para Excel
      const datosExcel = ventasAgrupadas.map(venta => {
        const productosDetalle = venta.detalles.map(detalle => 
          `${detalle.nombre_producto}: ${detalle.cantidad} ${detalle.unidad_medida} × $${detalle.precio_unitario} = $${detalle.precio_total}`
        ).join('; ');
        
        return {
          'Folio': venta.folio,
          'Cliente': venta.cliente,
          'Teléfono Cliente': venta.cliente_telefono || '',
          'Fecha Venta': venta.fecha_venta_formateada || formatoFecha(venta.fecha_venta),
          'Estado Pago': venta.estado_pago,
          'Método Pago': venta.metodo_pago,
          'Total Venta': venta.total_venta,
          'Cantidad Productos': venta.total_productos,
          'Detalles Productos': productosDetalle
        };
      });

      // Agregar fila de TOTAL al final
      datosExcel.push({
        'Folio': 'TOTAL',
        'Cliente': '',
        'Teléfono Cliente': '',
        'Fecha Venta': '',
        'Estado Pago': '',
        'Método Pago': '',
        'Total Venta': sumaTotalVentas,
        'Cantidad Productos': ventasAgrupadas.reduce((sum, v) => sum + v.total_productos, 0),
        'Detalles Productos': `Total de ${ventasAgrupadas.length} ventas exportadas`
      });

      // Crear hoja de trabajo
      const ws = XLSX.utils.json_to_sheet(datosExcel);
      
      // Aplicar formato de moneda a la columna de Total Venta
      const range = XLSX.utils.decode_range(ws['!ref']);
      for (let R = range.s.r; R <= range.e.r; ++R) {
        const cell_address = { c: 6, r: R }; // Columna G (índice 6) es Total Venta
        const cell_ref = XLSX.utils.encode_cell(cell_address);
        
        if (ws[cell_ref]) {
          // Formato para números (con separador de miles y 2 decimales)
          if (typeof ws[cell_ref].v === 'number') {
            ws[cell_ref].z = '"$"#,##0.00';
          }
          
          // Si es la fila del TOTAL, hacerla más destacada
          if (R === range.e.r) {
            ws[cell_ref].s = {
              font: { bold: true, color: { rgb: "FF0000" } },
              fill: { fgColor: { rgb: "FFFF00" } }
            };
          }
        }
      }

      // Ajustar anchos de columnas
      const wscols = [
        { wch: 15 }, // Folio
        { wch: 30 }, // Cliente
        { wch: 15 }, // Teléfono
        { wch: 20 }, // Fecha
        { wch: 12 }, // Estado
        { wch: 12 }, // Método
        { wch: 15 }, // Total
        { wch: 10 }, // Cantidad
        { wch: 50 }  // Detalles
      ];
      ws['!cols'] = wscols;

      // Crear libro de trabajo
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Ventas");

      // Generar nombre de archivo con fecha
      const fechaActual = new Date();
      const fechaStr = fechaActual.toISOString().split('T')[0];
      const nombreArchivo = `Ventas_Pagina_${paginacion.pagina_actual}_${fechaStr}.xlsx`;

      // Descargar archivo
      XLSX.writeFile(wb, nombreArchivo);
      
      console.log("✅ Archivo Excel generado:", nombreArchivo);
      console.log("💰 Suma total exportada:", formatoMoneda(sumaTotalVentas));
    } catch (error) {
      console.error("❌ Error al exportar Excel:", error);
      alert("Error al exportar a Excel. Por favor, intente nuevamente.");
    } finally {
      setExportando(false);
    }
  };

  // Función para exportar TODAS las ventas (sin paginación) con estadísticas completas
  const exportarTodasVentas = async () => {
    if (!confirm(`¿Exportar TODAS las ventas (sin filtros de paginación)?\n\nTotal de ventas: ${paginacion.total_filas}\nImporte total: ${formatoMoneda(estadisticas.importe_total)}\n\nEsto puede tardar unos momentos.`)) {
      return;
    }

    setExportando(true);
    
    try {
      // Construir URL con filtros pero sin paginación
      const params = new URLSearchParams();
      
      // Agregar filtros (sin paginación)
      Object.keys(filtros).forEach(key => {
        if (filtros[key]) {
          params.append(key, filtros[key]);
        }
      });
      
      // NO agregamos paginación para obtener todas las ventas
      const url = `/api/obtener_ventas.php?${params.toString()}&todos=1`;
      console.log("📡 Consultando TODAS las ventas:", url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Error HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        const todasVentas = data.ventas_agrupadas || [];
        
        if (todasVentas.length === 0) {
          alert("No hay ventas para exportar.");
          return;
        }

        // Calcular suma total de todas las ventas
        const sumaTotalVentas = todasVentas.reduce((total, venta) => total + venta.total_venta, 0);
        
        // Preparar los datos para Excel
        const datosExcel = todasVentas.map(venta => {
          const productosDetalle = venta.detalles.map(detalle => 
            `${detalle.nombre_producto}: ${detalle.cantidad} ${detalle.unidad_medida} × $${detalle.precio_unitario} = $${detalle.precio_total}`
          ).join('; ');
          
          return {
            'Folio': venta.folio,
            'Cliente': venta.cliente,
            'Teléfono Cliente': venta.cliente_telefono || '',
            'Fecha Venta': venta.fecha_venta_formateada || formatoFecha(venta.fecha_venta),
            'Estado Pago': venta.estado_pago,
            'Método Pago': venta.metodo_pago,
            'Total Venta': venta.total_venta,
            'Cantidad Productos': venta.total_productos,
            'Detalles Productos': productosDetalle
          };
        });

        // Agregar fila de TOTAL al final
        datosExcel.push({
          'Folio': 'TOTAL GENERAL',
          'Cliente': '',
          'Teléfono Cliente': '',
          'Fecha Venta': '',
          'Estado Pago': '',
          'Método Pago': '',
          'Total Venta': sumaTotalVentas,
          'Cantidad Productos': todasVentas.reduce((sum, v) => sum + v.total_productos, 0),
          'Detalles Productos': `Total de ${todasVentas.length} ventas exportadas`
        });

        // Crear hoja de trabajo principal
        const ws = XLSX.utils.json_to_sheet(datosExcel);
        
        // Aplicar formato de moneda a la columna de Total Venta
        const range = XLSX.utils.decode_range(ws['!ref']);
        for (let R = range.s.r; R <= range.e.r; ++R) {
          const cell_address = { c: 6, r: R }; // Columna G (índice 6) es Total Venta
          const cell_ref = XLSX.utils.encode_cell(cell_address);
          
          if (ws[cell_ref]) {
            // Formato para números (con separador de miles y 2 decimales)
            if (typeof ws[cell_ref].v === 'number') {
              ws[cell_ref].z = '"$"#,##0.00';
            }
            
            // Si es la fila del TOTAL GENERAL, hacerla más destacada
            if (R === range.e.r) {
              ws[cell_ref].s = {
                font: { bold: true, color: { rgb: "FFFFFF" } },
                fill: { fgColor: { rgb: "0070C0" } }
              };
            }
          }
        }

        // Ajustar anchos de columnas
        const wscols = [
          { wch: 15 }, // Folio
          { wch: 30 }, // Cliente
          { wch: 15 }, // Teléfono
          { wch: 20 }, // Fecha
          { wch: 12 }, // Estado
          { wch: 12 }, // Método
          { wch: 15 }, // Total
          { wch: 10 }, // Cantidad
          { wch: 50 }  // Detalles
        ];
        ws['!cols'] = wscols;

        // Crear hoja adicional con estadísticas detalladas
        const fechaExportacion = new Date().toLocaleString('es-MX');
        
        const estadisticasData = [
          ['REPORTE DE VENTAS - FUNDACIÓN PROSPERIDAD'],
          [''],
          ['RESUMEN GENERAL'],
          ['Fecha Exportación:', fechaExportacion],
          ['Ventas Exportadas:', todasVentas.length],
          ['Periodo Filtrado:', filtros.fecha_inicio ? `Del ${filtros.fecha_inicio} al ${filtros.fecha_fin || 'actual'}` : 'Todo el periodo'],
          [''],
          ['ESTADÍSTICAS FINANCIERAS'],
          ['Importe Total de Ventas:', sumaTotalVentas],
          ['Importe Promedio por Venta:', sumaTotalVentas / todasVentas.length],
          ['Venta Más Alta:', Math.max(...todasVentas.map(v => v.total_venta))],
          ['Venta Más Baja:', Math.min(...todasVentas.map(v => v.total_venta))],
          [''],
          ['ESTADO DE PAGOS'],
          ['Ventas Pagadas:', todasVentas.filter(v => v.estado_pago === 'pagado').length],
          ['Importe Pagado:', todasVentas.filter(v => v.estado_pago === 'pagado').reduce((sum, v) => sum + v.total_venta, 0)],
          ['Ventas Pendientes:', todasVentas.filter(v => v.estado_pago === 'pendiente').length],
          ['Importe Pendiente:', todasVentas.filter(v => v.estado_pago === 'pendiente').reduce((sum, v) => sum + v.total_venta, 0)],
          ['Ventas Canceladas:', todasVentas.filter(v => v.estado_pago === 'cancelado').length],
          ['Importe Cancelado:', todasVentas.filter(v => v.estado_pago === 'cancelado').reduce((sum, v) => sum + v.total_venta, 0)],
          [''],
          ['MÉTODOS DE PAGO'],
          ['Efectivo:', todasVentas.filter(v => v.metodo_pago === 'efectivo').length],
          ['Tarjeta:', todasVentas.filter(v => v.metodo_pago === 'tarjeta').length],
          ['Transferencia:', todasVentas.filter(v => v.metodo_pago === 'transferencia').length],
          [''],
          ['RESUMEN DE PRODUCTOS'],
          ['Total Items Vendidos:', todasVentas.reduce((sum, v) => sum + v.total_productos, 0)],
          ['Clientes Diferentes:', new Set(todasVentas.map(v => v.cliente)).size],
          ['Productos Diferentes:', new Set(todasVentas.flatMap(v => v.detalles.map(d => d.nombre_producto))).size],
          ['Total Kilos Vendidos:', todasVentas.flatMap(v => v.detalles).filter(d => d.tipo_venta === 'kilos').reduce((sum, d) => sum + d.cantidad, 0)],
          ['Total Unidades Vendidas:', todasVentas.flatMap(v => v.detalles).filter(d => d.tipo_venta === 'unidades').reduce((sum, d) => sum + d.cantidad, 0)],
          [''],
          ['INFORMACIÓN ADICIONAL'],
          ['Generado por:', 'Sistema de Ventas Fundación Prosperidad'],
          ['Nota:', 'Este reporte incluye todas las ventas según los filtros aplicados']
        ];
        
        const wsEstadisticas = XLSX.utils.aoa_to_sheet(estadisticasData);

        // Ajustar anchos de columnas para estadísticas
        const wscolsEst = [
          { wch: 25 }, // Descripción
          { wch: 25 }  // Valor
        ];
        wsEstadisticas['!cols'] = wscolsEst;

        // Crear libro de trabajo con dos hojas
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Ventas Detalladas");
        XLSX.utils.book_append_sheet(wb, wsEstadisticas, "Estadísticas");

        // Generar nombre de archivo
        const fechaActual = new Date();
        const fechaStr = fechaActual.toISOString().split('T')[0];
        const nombreArchivo = `Reporte_Ventas_Completo_${fechaStr}.xlsx`;

        // Descargar archivo
        XLSX.writeFile(wb, nombreArchivo);
        
        console.log("✅ Archivo Excel completo generado:", nombreArchivo);
        console.log("💰 Suma total exportada:", formatoMoneda(sumaTotalVentas));
        
        alert(`✅ Exportación completada exitosamente!\n\n📊 Ventas exportadas: ${todasVentas.length}\n💰 Importe total: ${formatoMoneda(sumaTotalVentas)}\n📁 Archivo: ${nombreArchivo}`);
      } else {
        throw new Error(data.message || "Error al cargar todas las ventas");
      }
    } catch (error) {
      console.error("❌ Error al exportar todas las ventas:", error);
      alert("❌ Error al exportar todas las ventas. Por favor, intente nuevamente.\n\nError: " + error.message);
    } finally {
      setExportando(false);
    }
  };

  // Función para exportar un resumen ejecutivo
  const exportarResumenEjecutivo = () => {
    setExportando(true);
    
    try {
      // Crear datos para el resumen ejecutivo
      const resumenData = [
        ['REPORTE EJECUTIVO DE VENTAS - FUNDACIÓN PROSPERIDAD'],
        ['Fecha:', new Date().toLocaleDateString('es-MX')],
        ['Hora:', new Date().toLocaleTimeString('es-MX')],
        [''],
        ['RESUMEN FINANCIERO'],
        ['Total Ventas Registradas:', estadisticas.total_ventas],
        ['Importe Total:', formatoMoneda(estadisticas.importe_total)],
        ['Importe Pagado:', formatoMoneda(estadisticas.importe_pagado)],
        ['Importe Pendiente:', formatoMoneda(estadisticas.importe_pendiente)],
        ['Importe Cancelado:', formatoMoneda(estadisticas.importe_cancelado)],
        [''],
        ['DISTRIBUCIÓN POR ESTADO'],
        ['Pagado:', estadisticas.total_ventas > 0 ? `${Math.round((estadisticas.importe_pagado / estadisticas.importe_total) * 100)}%` : '0%'],
        ['Pendiente:', estadisticas.total_ventas > 0 ? `${Math.round((estadisticas.importe_pendiente / estadisticas.importe_total) * 100)}%` : '0%'],
        ['Cancelado:', estadisticas.total_ventas > 0 ? `${Math.round((estadisticas.importe_cancelado / estadisticas.importe_total) * 100)}%` : '0%'],
        [''],
        ['MÉTRICAS DE VENTAS'],
        ['Promedio por Venta:', estadisticas.total_ventas > 0 ? formatoMoneda(estadisticas.importe_total / estadisticas.total_ventas) : '$0.00'],
        ['Items por Venta:', estadisticas.total_ventas > 0 ? (estadisticas.total_items / estadisticas.total_ventas).toFixed(2) : '0'],
        ['Clientes Únicos:', estadisticas.total_clientes],
        ['Productos Vendidos:', estadisticas.total_productos],
        [''],
        ['DETALLE POR MÉTODO DE PAGO'],
        ['Efectivo:', ventasAgrupadas.filter(v => v.metodo_pago === 'efectivo').length],
        ['Tarjeta:', ventasAgrupadas.filter(v => v.metodo_pago === 'tarjeta').length],
        ['Transferencia:', ventasAgrupadas.filter(v => v.metodo_pago === 'transferencia').length],
        [''],
        ['INFORMACIÓN DE FILTROS APLICADOS'],
        ['Fecha Inicio:', filtros.fecha_inicio || 'No aplicado'],
        ['Fecha Fin:', filtros.fecha_fin || 'No aplicado'],
        ['Cliente:', filtros.cliente_id ? clientes.find(c => c.id == filtros.cliente_id)?.nombre_completo || 'Seleccionado' : 'Todos'],
        ['Producto:', filtros.producto_id ? productos.find(p => p.id == filtros.producto_id)?.producto || 'Seleccionado' : 'Todos'],
        ['Estado Pago:', filtros.estado_pago || 'Todos'],
        [''],
        ['VENTAS EN PÁGINA ACTUAL'],
        ['Mostrando:', `${inicio} - ${fin} de ${paginacion.total_filas}`],
        ['Total en Página:', ventasAgrupadas.length],
        ['Suma en Página:', formatoMoneda(ventasAgrupadas.reduce((sum, v) => sum + v.total_venta, 0))],
        [''],
        ['FIRMAS'],
        ['__________________________'],
        ['Responsable de Ventas'],
        [''],
        ['__________________________'],
        ['Revisado por Administración']
      ];

      // Crear hoja de trabajo
      const ws = XLSX.utils.aoa_to_sheet(resumenData);
      
      // Ajustar anchos de columnas
      const wscols = [
        { wch: 35 }, // Descripción
        { wch: 25 }  // Valor
      ];
      ws['!cols'] = wscols;

      // Crear libro de trabajo
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Resumen Ejecutivo");

      // Generar nombre de archivo
      const fechaActual = new Date();
      const fechaStr = fechaActual.toISOString().split('T')[0];
      const nombreArchivo = `Resumen_Ventas_${fechaStr}.xlsx`;

      // Descargar archivo
      XLSX.writeFile(wb, nombreArchivo);
      
      console.log("✅ Resumen ejecutivo generado:", nombreArchivo);
    } catch (error) {
      console.error("❌ Error al exportar resumen:", error);
      alert("Error al exportar resumen ejecutivo.");
    } finally {
      setExportando(false);
    }
  };

  // Función para exportar a PDF la página actual
  const exportarPDF = async () => {
    setExportando(true);
    
    try {
      const pdf = new jsPDF('landscape', 'pt', 'a4');
      const data = document.getElementById('tabla-ventas');
      
      // Obtener la fecha actual para el nombre del archivo
      const fechaActual = new Date();
      const fechaStr = fechaActual.toISOString().split('T')[0];
      
      // Capturar la tabla con html2canvas
      const canvas = await html2canvas(data, {
        scale: 2, // Mejor calidad
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = pdf.internal.pageSize.getWidth() - 40;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Título del PDF
      pdf.setFontSize(20);
      pdf.text('REPORTE DE VENTAS - FUNDACIÓN PROSPERIDAD', 20, 30);
      
      // Subtítulo
      pdf.setFontSize(12);
      pdf.text(`Fecha: ${fechaActual.toLocaleDateString('es-MX')}`, 20, 50);
      pdf.text(`Página: ${paginacion.pagina_actual} de ${paginacion.total_paginas}`, 20, 65);
      pdf.text(`Mostrando: ${inicio} - ${fin} de ${paginacion.total_filas} ventas`, 20, 80);
      
      // Información de suma
      pdf.setFontSize(14);
      pdf.text(`SUMA TOTAL EN PÁGINA: ${formatoMoneda(sumaPaginaActual)}`, 20, 100);
      
      // Agregar la imagen de la tabla
      pdf.addImage(imgData, 'PNG', 20, 120, imgWidth, imgHeight);
      
      // Pie de página
      const pageCount = pdf.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(10);
        pdf.text(
          `Página ${i} de ${pageCount} • Generado el ${fechaActual.toLocaleString('es-MX')} • Fundación Prosperidad`,
          pdf.internal.pageSize.getWidth() / 2,
          pdf.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
      }
      
      // Guardar el PDF
      const nombreArchivo = `Ventas_Pagina_${paginacion.pagina_actual}_${fechaStr}.pdf`;
      pdf.save(nombreArchivo);
      
      console.log("✅ Archivo PDF generado:", nombreArchivo);
    } catch (error) {
      console.error("❌ Error al exportar PDF:", error);
      alert("Error al exportar a PDF. Por favor, intente nuevamente.");
    } finally {
      setExportando(false);
    }
  };

  // Función para exportar un PDF con diseño personalizado
  const exportarPDFPersonalizado = async () => {
    setExportando(true);
    
    try {
      const pdf = new jsPDF('portrait', 'pt', 'a4');
      
      // Obtener la fecha actual
      const fechaActual = new Date();
      const fechaStr = fechaActual.toISOString().split('T')[0];
      const fechaHora = fechaActual.toLocaleString('es-MX');
      
      // Título
      pdf.setFontSize(24);
      pdf.setTextColor(0, 0, 139); // Azul oscuro
      pdf.text('REPORTE DE VENTAS', 40, 60);
      pdf.setFontSize(18);
      pdf.setTextColor(100, 100, 100);
      pdf.text('Fundación Prosperidad', 40, 85);
      
      // Línea divisoria
      pdf.setDrawColor(0, 0, 139);
      pdf.setLineWidth(2);
      pdf.line(40, 100, 550, 100);
      
      // Información del reporte
      pdf.setFontSize(11);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`Fecha de generación: ${fechaHora}`, 40, 120);
      pdf.text(`Página actual: ${paginacion.pagina_actual}`, 40, 135);
      pdf.text(`Ventas en página: ${ventasAgrupadas.length} de ${paginacion.total_filas}`, 40, 150);
      pdf.text(`Mostrando del ${inicio} al ${fin}`, 40, 165);
      
      // Resumen financiero
      pdf.setFontSize(14);
      pdf.setTextColor(0, 100, 0); // Verde
      pdf.text('RESUMEN FINANCIERO', 40, 195);
      
      pdf.setFontSize(11);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`Suma total en página: ${formatoMoneda(sumaPaginaActual)}`, 40, 215);
      pdf.text(`Promedio por venta: ${formatoMoneda(sumaPaginaActual / ventasAgrupadas.length)}`, 40, 230);
      
      // Tabla de ventas
      let yPos = 260;
      
      // Encabezado de la tabla
      pdf.setFillColor(220, 220, 220);
      pdf.rect(40, yPos - 20, 515, 20, 'F');
      
      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
      pdf.text('Folio', 45, yPos - 5);
      pdf.text('Cliente', 120, yPos - 5);
      pdf.text('Productos', 270, yPos - 5);
      pdf.text('Total', 400, yPos - 5);
      pdf.text('Estado', 470, yPos - 5);
      pdf.text('Fecha', 520, yPos - 5);
      
      // Datos de las ventas
      pdf.setFontSize(9);
      ventasAgrupadas.forEach((venta, index) => {
        if (yPos > 700) {
          pdf.addPage();
          yPos = 60;
        }
        
        // Fondo alternado para filas
        if (index % 2 === 0) {
          pdf.setFillColor(245, 245, 245);
          pdf.rect(40, yPos, 515, 30, 'F');
        }
        
        // Datos
        pdf.text(venta.folio, 45, yPos + 10);
        pdf.text(venta.cliente.substring(0, 30), 120, yPos + 10);
        
        // Productos (resumido)
        const productosStr = venta.detalles.map(p => 
          `${p.nombre_producto.substring(0, 15)} (${p.cantidad} ${p.unidad_medida})`
        ).join(', ');
        pdf.text(productosStr.substring(0, 50), 270, yPos + 10);
        
        pdf.text(formatoMoneda(venta.total_venta), 400, yPos + 10);
        pdf.text(venta.estado_pago, 470, yPos + 10);
        
        const fecha = venta.fecha_venta_formateada || formatoFecha(venta.fecha_venta);
        pdf.text(fecha.substring(0, 15), 520, yPos + 10);
        
        yPos += 35;
      });
      
      // Total al final
      yPos += 10;
      pdf.setFillColor(240, 240, 150);
      pdf.rect(40, yPos, 515, 30, 'F');
      
      pdf.setFontSize(12);
      pdf.setFont(undefined, 'bold');
      pdf.text('TOTAL DE LA PÁGINA:', 45, yPos + 20);
      pdf.text(formatoMoneda(sumaPaginaActual), 400, yPos + 20);
      
      // Pie de página
      const pageCount = pdf.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(100, 100, 100);
        pdf.text(
          `Página ${i} de ${pageCount} • Sistema de Ventas Fundación Prosperidad • ${fechaHora}`,
          pdf.internal.pageSize.getWidth() / 2,
          pdf.internal.pageSize.getHeight() - 20,
          { align: 'center' }
        );
      }
      
      // Guardar el PDF
      const nombreArchivo = `Reporte_Ventas_${fechaStr}.pdf`;
      pdf.save(nombreArchivo);
      
      console.log("✅ Archivo PDF personalizado generado:", nombreArchivo);
    } catch (error) {
      console.error("❌ Error al exportar PDF personalizado:", error);
      alert("Error al exportar PDF personalizado. Por favor, intente nuevamente.");
    } finally {
      setExportando(false);
    }
  };

  // Función para exportar PDF con todas las ventas (sin paginación)
const exportarTodasVentasPDF = async () => {
  if (!confirm(`¿Exportar TODAS las ventas a PDF (sin filtros de paginación)?\n\nTotal de ventas: ${paginacion.total_filas}\nImporte total: ${formatoMoneda(estadisticas.importe_total)}\n\nEsto puede tardar unos momentos.`)) {
    return;
  }

  setExportando(true);
  
  try {
    console.log("🔍 Iniciando exportación de todas las ventas a PDF...");
    
    // Primero obtenemos todas las ventas
    const params = new URLSearchParams();
    
    // Agregar filtros si existen
    Object.keys(filtros).forEach(key => {
      if (filtros[key]) {
        params.append(key, filtros[key]);
      }
    });
    
    // Agregar parámetro para obtener todas
    params.append('todos', '1');
    
    // Construir URL completa
    let url = `/api/obtener_ventas.php`;
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    console.log("📡 Consultando API:", url);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Error HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log("📦 Respuesta recibida:", data);
    
    if (data.success) {
      const todasVentas = data.ventas_agrupadas || [];
      console.log(`📊 Ventas obtenidas: ${todasVentas.length}`);
      
      if (todasVentas.length === 0) {
        alert("No hay ventas para exportar.");
        setExportando(false);
        return;
      }

      // FUNCIÓN DE SEGURIDAD: Convertir todos los valores a string
      const safeString = (valor) => {
        if (valor === null || valor === undefined) return '';
        if (typeof valor === 'number') return valor.toString();
        if (typeof valor === 'boolean') return valor ? 'Sí' : 'No';
        return String(valor);
      };

      const sumaTotal = todasVentas.reduce((total, venta) => {
        const totalVenta = venta.total_venta || 0;
        return total + (typeof totalVenta === 'number' ? totalVenta : parseFloat(totalVenta) || 0);
      }, 0);
      
      console.log(`💰 Suma total: ${sumaTotal}`);
      
      // Crear PDF
      const pdf = new jsPDF('portrait', 'pt', 'a4');
      const fechaActual = new Date();
      const fechaHora = fechaActual.toLocaleString('es-MX');
      
      // PORTADA (usando safeString para todos los valores)
      pdf.setFontSize(28);
      pdf.setTextColor(0, 0, 139);
      pdf.text('REPORTE COMPLETO', 40, 100);
      pdf.setFontSize(22);
      pdf.text('DE VENTAS', 40, 130);
      pdf.setFontSize(18);
      pdf.setTextColor(100, 100, 100);
      pdf.text('Fundación Prosperidad', 40, 160);
      
      // Información del reporte - TODOS LOS VALORES CONVERTIDOS A STRING
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`Fecha: ${safeString(fechaHora)}`, 40, 200);
      pdf.text(`Total de ventas: ${safeString(todasVentas.length)}`, 40, 220);
      pdf.text(`Importe total: ${safeString(formatoMoneda(sumaTotal))}`, 40, 240);
      
      const periodoTexto = filtros.fecha_inicio 
        ? `Del ${safeString(filtros.fecha_inicio)} al ${safeString(filtros.fecha_fin || 'actual')}` 
        : 'Todo el periodo';
      pdf.text(`Periodo: ${periodoTexto}`, 40, 260);
      
      pdf.addPage();
      
      // Resumen ejecutivo
      let yPos = 60;
      
      pdf.setFontSize(16);
      pdf.setTextColor(0, 100, 0);
      pdf.text('RESUMEN EJECUTIVO', 40, yPos);
      yPos += 30;
      
      pdf.setFontSize(11);
      pdf.setTextColor(0, 0, 0);
      
      const ventasPagadas = todasVentas.filter(v => v.estado_pago === 'pagado');
      const ventasPendientes = todasVentas.filter(v => v.estado_pago === 'pendiente');
      const ventasCanceladas = todasVentas.filter(v => v.estado_pago === 'cancelado');
      
      const importePagado = ventasPagadas.reduce((sum, v) => sum + (v.total_venta || 0), 0);
      const importePendiente = ventasPendientes.reduce((sum, v) => sum + (v.total_venta || 0), 0);
      const importeCancelado = ventasCanceladas.reduce((sum, v) => sum + (v.total_venta || 0), 0);
      
      const promedioVenta = todasVentas.length > 0 ? sumaTotal / todasVentas.length : 0;
      
      const resumenData = [
        ['Total Ventas:', safeString(todasVentas.length)],
        ['Importe Total:', safeString(formatoMoneda(sumaTotal))],
        ['Promedio por Venta:', safeString(formatoMoneda(promedioVenta))],
        ['Ventas Pagadas:', `${safeString(ventasPagadas.length)} (${safeString(formatoMoneda(importePagado))})`],
        ['Ventas Pendientes:', `${safeString(ventasPendientes.length)} (${safeString(formatoMoneda(importePendiente))})`],
        ['Ventas Canceladas:', `${safeString(ventasCanceladas.length)} (${safeString(formatoMoneda(importeCancelado))})`],
      ];
      
      resumenData.forEach(([label, value]) => {
        pdf.text(safeString(label), 40, yPos);
        pdf.text(safeString(value), 200, yPos);
        yPos += 20;
      });
      
      // Detalle de ventas (agrupado por páginas) - SOLO PRIMERAS 50 PARA PRUEBA
      const ventasPorPagina = 15;
      const ventasLimitadas = todasVentas.slice(0, 50); // Limitar para prueba
      const totalPaginasVentas = Math.ceil(ventasLimitadas.length / ventasPorPagina);
      
      console.log(`📄 Total páginas de detalle: ${totalPaginasVentas} (limitado a 50 ventas)`);
      
      for (let pagina = 0; pagina < totalPaginasVentas; pagina++) {
        if (pagina > 0) {
          pdf.addPage();
          yPos = 60;
        }
        
        pdf.setFontSize(16);
        pdf.setTextColor(0, 0, 139);
        pdf.text(`DETALLE DE VENTAS (${pagina + 1}/${totalPaginasVentas})`, 40, yPos);
        yPos += 40;
        
        const inicioVentas = pagina * ventasPorPagina;
        const finVentas = inicioVentas + ventasPorPagina;
        const ventasPagina = ventasLimitadas.slice(inicioVentas, finVentas);
        
        // Encabezado de tabla
        pdf.setFillColor(220, 220, 220);
        pdf.rect(40, yPos - 20, 515, 20, 'F');
        
        pdf.setFontSize(10);
        pdf.setTextColor(0, 0, 0);
        pdf.text('Folio', 45, yPos - 5);
        pdf.text('Cliente', 100, yPos - 5);
        pdf.text('Total', 350, yPos - 5);
        pdf.text('Estado', 420, yPos - 5);
        pdf.text('Fecha', 480, yPos - 5);
        
        yPos += 10;
        
        // Datos - USANDO safeString PARA TODO
        pdf.setFontSize(9);
        ventasPagina.forEach((venta, index) => {
          if (yPos > 700) {
            pdf.addPage();
            yPos = 60;
            // Redibujar encabezado
            pdf.setFillColor(220, 220, 220);
            pdf.rect(40, yPos - 20, 515, 20, 'F');
            pdf.setFontSize(10);
            pdf.text('Folio', 45, yPos - 5);
            pdf.text('Cliente', 100, yPos - 5);
            pdf.text('Total', 350, yPos - 5);
            pdf.text('Estado', 420, yPos - 5);
            pdf.text('Fecha', 480, yPos - 5);
            yPos += 10;
          }
          
          // Fondo alternado
          if (index % 2 === 0) {
            pdf.setFillColor(245, 245, 245);
            pdf.rect(40, yPos, 515, 20, 'F');
          }
          
          // Datos de la venta - CON SEGURIDAD
          const folio = safeString(venta.folio || `VEN-${venta.id || 'N/A'}`);
          const cliente = safeString(venta.cliente || 'Sin cliente');
          const total = venta.total_venta || 0;
          const estado = safeString(venta.estado_pago || 'Desconocido');
          const fecha = safeString(venta.fecha_venta_formateada || formatoFecha(venta.fecha_venta) || 'Sin fecha');
          
          pdf.text(folio.substring(0, 15), 45, yPos + 10);
          pdf.text(cliente.substring(0, 30), 100, yPos + 10);
          pdf.text(safeString(formatoMoneda(total)), 350, yPos + 10);
          pdf.text(estado, 420, yPos + 10);
          pdf.text(fecha.substring(0, 12), 480, yPos + 10);
          
          yPos += 25;
        });
        
        // Total parcial de la página
        const sumaPagina = ventasPagina.reduce((sum, v) => sum + (v.total_venta || 0), 0);
        yPos += 10;
        pdf.setFontSize(10);
        pdf.setFont(undefined, 'bold');
        pdf.text(`Subtotal página ${pagina + 1}: ${safeString(formatoMoneda(sumaPagina))}`, 40, yPos);
      }
      
      // Última página con total general
      pdf.addPage();
      yPos = 100;
      
      pdf.setFontSize(20);
      pdf.setTextColor(0, 100, 0);
      pdf.text('TOTAL GENERAL', 40, yPos);
      yPos += 40;
      
      pdf.setFontSize(16);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`Total de ventas: ${safeString(todasVentas.length)}`, 40, yPos);
      yPos += 30;
      pdf.text(`Importe total: ${safeString(formatoMoneda(sumaTotal))}`, 40, yPos);
      yPos += 30;
      pdf.text(`Promedio por venta: ${safeString(formatoMoneda(promedioVenta))}`, 40, yPos);
      yPos += 30;
      pdf.text(`Periodo del reporte: ${safeString(periodoTexto)}`, 40, yPos);
      
      yPos += 60;
      pdf.setFontSize(12);
      pdf.text('FIRMAS:', 40, yPos);
      yPos += 30;
      pdf.text('_________________________', 40, yPos);
      yPos += 20;
      pdf.text('Responsable de Ventas', 40, yPos);
      
      yPos += 50;
      pdf.text('_________________________', 40, yPos);
      yPos += 20;
      pdf.text('Revisado por Administración', 40, yPos);
      
      // Pie de página en todas las páginas
      const pageCount = pdf.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(100, 100, 100);
        pdf.text(
          `Página ${i} de ${pageCount} • Reporte Completo de Ventas • Fundación Prosperidad • ${safeString(fechaHora)}`,
          pdf.internal.pageSize.getWidth() / 2,
          pdf.internal.pageSize.getHeight() - 20,
          { align: 'center' }
        );
      }
      
      // Guardar PDF
      const fechaStr = fechaActual.toISOString().split('T')[0];
      const nombreArchivo = `Reporte_Completo_Ventas_${fechaStr}.pdf`;
      pdf.save(nombreArchivo);
      
      console.log("✅ PDF exportado exitosamente:", nombreArchivo);
      
      alert(`✅ PDF exportado exitosamente!\n\n📊 Ventas: ${todasVentas.length}\n💰 Total: ${formatoMoneda(sumaTotal)}\n📁 Archivo: ${nombreArchivo}`);
    } else {
      throw new Error(data.message || "Error al cargar todas las ventas");
    }
  } catch (error) {
    console.error("❌ Error al exportar todas las ventas a PDF:", error);
    
    // Mostrar mensaje de error más detallado
    const mensajeError = error.message || "Error desconocido";
    alert(`❌ Error al exportar PDF:\n\n${mensajeError}\n\nVerifica la consola para más detalles.`);
  } finally {
    setExportando(false);
  }
};

  // Manejar cambios en filtros
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFiltros({
      ...filtros,
      [name]: value
    });
  };

  // Manejar cambio de items por página
  const handlePorPaginaChange = (e) => {
    const nuevoPorPagina = parseInt(e.target.value);
    setPaginacion({
      ...paginacion,
      por_pagina: nuevoPorPagina,
      pagina_actual: 1
    });
    // No cargar aquí, se cargará en el useEffect siguiente
  };

  // Efecto para recargar cuando cambien los filtros o por_pagina
  useEffect(() => {
    cargarVentas(paginacion.pagina_actual);
  }, [filtros, paginacion.por_pagina]);

  const aplicarFiltros = () => {
    setPaginacion({ ...paginacion, pagina_actual: 1 });
    cargarVentas(1);
  };

  const limpiarFiltros = () => {
    setFiltros({
      folio: "",
      cliente_id: "",
      producto_id: "",
      fecha_inicio: "",
      fecha_fin: "",
      estado_pago: "",
      metodo_pago: "",
      tipo_venta: ""
    });
    setPaginacion({ ...paginacion, pagina_actual: 1 });
  };

  // Cambiar página
  const cambiarPagina = (nuevaPagina) => {
    setPaginacion({ ...paginacion, pagina_actual: nuevaPagina });
    cargarVentas(nuevaPagina);
  };

  // Generar números de página para la paginación
  const generarNumerosPagina = () => {
    const paginas = [];
    const totalPaginas = paginacion.total_paginas;
    const paginaActual = paginacion.pagina_actual;
    
    // Mostrar máximo 5 páginas
    let inicio = Math.max(1, paginaActual - 2);
    let fin = Math.min(totalPaginas, inicio + 4);
    
    // Ajustar si estamos cerca del final
    if (fin - inicio < 4) {
      inicio = Math.max(1, fin - 4);
    }
    
    for (let i = inicio; i <= fin; i++) {
      paginas.push(i);
    }
    
    return paginas;
  };

  // Formatear moneda
  const formatoMoneda = (valor) => {
    if (valor === null || valor === undefined) return '$0.00';
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2
    }).format(valor);
  };

  // Formatear fecha
  const formatoFecha = (fechaString) => {
    if (!fechaString) return '';
    try {
      const fecha = new Date(fechaString);
      if (isNaN(fecha.getTime())) return fechaString;
      return fecha.toLocaleDateString('es-MX', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return fechaString;
    }
  };

  // Renderizar estado de pago
  const renderEstadoPago = (estado) => {
    const estados = {
      pagado: { bg: 'success', icon: '✓', text: 'Pagado' },
      pendiente: { bg: 'warning', icon: '⏱', text: 'Pendiente' },
      cancelado: { bg: 'danger', icon: '✗', text: 'Cancelado' }
    };
    const estadoInfo = estados[estado] || { bg: 'secondary', icon: '?', text: estado };
    
    return (
      <span className={`badge bg-${estadoInfo.bg} d-flex align-items-center`}>
        <span className="me-1">{estadoInfo.icon}</span>
        <span>{estadoInfo.text}</span>
      </span>
    );
  };

  // Renderizar método de pago
  const renderMetodoPago = (metodo) => {
    const metodos = {
      efectivo: { bg: 'success', icon: '💵', text: 'Efectivo' },
      tarjeta: { bg: 'info', icon: '💳', text: 'Tarjeta' },
      transferencia: { bg: 'primary', icon: '🏦', text: 'Transferencia' }
    };
    const metodoInfo = metodos[metodo] || { bg: 'secondary', icon: '💰', text: metodo };
    
    return (
      <span className={`badge bg-${metodoInfo.bg} ${metodoInfo.bg === 'info' ? 'text-dark' : ''} d-flex align-items-center`}>
        <span className="me-1">{metodoInfo.icon}</span>
        <span>{metodoInfo.text}</span>
      </span>
    );
  };

  // Calcular suma total de la página actual
  const calcularSumaPaginaActual = () => {
    return ventasAgrupadas.reduce((total, venta) => total + venta.total_venta, 0);
  };

  // Imprimir ticket
  const printTicket = (venta) => {
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    
    const contenido = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Ticket - ${venta.folio}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; width: 300px; margin: 0 auto; }
            .ticket { border: 1px dashed #000; padding: 15px; }
            .header { text-align: center; margin-bottom: 15px; }
            .folio { background: #f0f0f0; padding: 10px; text-align: center; margin: 10px 0; font-weight: bold; }
            table { width: 100%; border-collapse: collapse; margin: 10px 0; }
            th { border-bottom: 2px solid #000; padding: 5px; text-align: left; }
            td { padding: 5px; border-bottom: 1px dashed #ddd; }
            .total { text-align: right; font-weight: bold; margin-top: 15px; }
          </style>
        </head>
        <body>
          <div class="ticket">
            <div class="header">
              <h3>FUNDACIÓN PROSPERIDAD</h3>
              <p>${formatoFecha(venta.fecha_venta)}</p>
            </div>
            
            <div class="folio">FOLIO: ${venta.folio}</div>
            
            <p><strong>Cliente:</strong> ${venta.cliente}</p>
            <p><strong>Método:</strong> ${venta.metodo_pago}</p>
            
            <table>
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Cant.</th>
                  <th>Precio</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                ${venta.detalles.map(p => `
                  <tr>
                    <td>${p.nombre_producto}</td>
                    <td>${p.cantidad} ${p.unidad_medida}</td>
                    <td>${formatoMoneda(p.precio_unitario)}</td>
                    <td>${formatoMoneda(p.precio_total)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            
            <div class="total">
              <p>TOTAL: ${formatoMoneda(venta.total_venta)}</p>
            </div>
          </div>
        </body>
      </html>
    `;
    
    printWindow.document.write(contenido);
    printWindow.document.close();
    printWindow.print();
  };

  // Calcular rango mostrado
  const calcularRangoMostrado = () => {
    const inicio = ((paginacion.pagina_actual - 1) * paginacion.por_pagina) + 1;
    const fin = Math.min(paginacion.pagina_actual * paginacion.por_pagina, paginacion.total_filas);
    return { inicio, fin };
  };

  const { inicio, fin } = calcularRangoMostrado();
  const sumaPaginaActual = calcularSumaPaginaActual();

  return (
    <div className="d-flex">
      <Sidebar />
      <div className="container-fluid p-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2>📋 Lista de Ventas</h2>
            <p className="text-muted mb-0">Fundación Prosperidad - Sistema de Ventas</p>
          </div>
          <div className="d-flex gap-2">
            <button 
              onClick={() => cargarVentas(paginacion.pagina_actual)} 
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Cargando...
                </>
              ) : (
                <>
                  <i className="bi bi-arrow-clockwise me-2"></i>
                  Actualizar
                </>
              )}
            </button>
            <div className="btn-group">
              <button 
                onClick={exportarExcel} 
                className="btn btn-success"
                disabled={exportando || ventasAgrupadas.length === 0}
              >
                {exportando ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Exportando...
                  </>
                ) : (
                  <>
                    <i className="bi bi-file-excel me-2"></i>
                    Exportar Excel y PDF
                  </>
                )}
              </button>
              <button 
                type="button" 
                className="btn btn-success dropdown-toggle dropdown-toggle-split" 
                data-bs-toggle="dropdown" 
                aria-expanded="false"
                disabled={exportando}
              >
                <span className="visually-hidden">Más opciones</span>
              </button>
              <ul className="dropdown-menu">
                <li>
                  <button 
                    className="dropdown-item" 
                    onClick={exportarExcel}
                    disabled={exportando || ventasAgrupadas.length === 0}
                  >
                    <i className="bi bi-file-excel me-2"></i>
                    Exportar página actual ({ventasAgrupadas.length} ventas)
                    <br />
                    <small className="text-muted">Suma: {formatoMoneda(sumaPaginaActual)}</small>
                  </button>
                </li>
                <li>
                  <button 
                    className="dropdown-item" 
                    onClick={exportarTodasVentas}
                    disabled={exportando}
                  >
                    <i className="bi bi-file-excel-fill me-2"></i>
                    Exportar TODAS las ventas
                    <br />
                    <small className="text-muted">Total: {formatoMoneda(estadisticas.importe_total)}</small>
                  </button>
                </li>
                <li>
                  <button 
                    className="dropdown-item" 
                    onClick={exportarResumenEjecutivo}
                    disabled={exportando || ventasAgrupadas.length === 0}
                  >
                    <i className="bi bi-graph-up me-2"></i>
                    Exportar Resumen Ejecutivo
                    <br />
                    <small className="text-muted">Estadísticas y métricas</small>
                  </button>
                </li>
                <li><hr className="dropdown-divider" /></li>
                <li>
                  <button 
                    className="dropdown-item" 
                    onClick={exportarPDF}
                    disabled={exportando || ventasAgrupadas.length === 0}
                  >
                    <i className="bi bi-file-pdf me-2 text-danger"></i>
                    Exportar página a PDF
                    <br />
                    <small className="text-muted">Captura de tabla actual</small>
                  </button>
                </li>
                <li>
                  <button 
                    className="dropdown-item" 
                    onClick={exportarPDFPersonalizado}
                    disabled={exportando || ventasAgrupadas.length === 0}
                  >
                    <i className="bi bi-file-pdf me-2 text-danger"></i>
                    Exportar PDF personalizado
                    <br />
                    <small className="text-muted">Diseño profesional</small>
                  </button>
                </li>
                <li>
                  <button 
                    className="dropdown-item" 
                    onClick={exportarTodasVentasPDF}
                    disabled={exportando}
                  >
                    <i className="bi bi-file-pdf-fill me-2 text-danger"></i>
                    Exportar TODAS a PDF
                    <br />
                    <small className="text-muted">Reporte completo</small>
                  </button>
                </li>
                <li><hr className="dropdown-divider" /></li>
                <li>
                  <span className="dropdown-item-text small text-muted">
                    <i className="bi bi-info-circle me-1"></i>
                    Todos los reportes incluyen suma total
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Panel de estadísticas mejorado */}
        <div className="row mb-4">
          <div className="col-md-3">
            <div className="card bg-primary text-white">
              <div className="card-body">
                <div className="d-flex justify-content-between">
                  <div>
                    <h6 className="card-title">Ventas Totales</h6>
                    <h3>{estadisticas.total_ventas}</h3>
                  </div>
                  <i className="bi bi-receipt display-6 opacity-50"></i>
                </div>
                <small className="opacity-75">
                  {ventasAgrupadas.length} en lista • {formatoMoneda(sumaPaginaActual)} en página
                </small>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card bg-success text-white">
              <div className="card-body">
                <div className="d-flex justify-content-between">
                  <div>
                    <h6 className="card-title">Importe Total</h6>
                    <h3>{formatoMoneda(estadisticas.importe_total)}</h3>
                  </div>
                  <i className="bi bi-cash-coin display-6 opacity-50"></i>
                </div>
                <small className="opacity-75">
                  {formatoMoneda(estadisticas.importe_pagado)} pagado
                </small>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card bg-warning text-dark">
              <div className="card-body">
                <div className="d-flex justify-content-between">
                  <div>
                    <h6 className="card-title">Promedio por Venta</h6>
                    <h3>
                      {estadisticas.total_ventas > 0 
                        ? formatoMoneda(estadisticas.importe_total / estadisticas.total_ventas)
                        : '$0.00'}
                    </h3>
                  </div>
                  <i className="bi bi-graph-up display-6 opacity-50"></i>
                </div>
                <small className="opacity-75">
                  {estadisticas.total_items} items vendidos
                </small>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card bg-info text-white">
              <div className="card-body">
                <div className="d-flex justify-content-between">
                  <div>
                    <h6 className="card-title">Productos Únicos</h6>
                    <h3>{estadisticas.total_productos}</h3>
                  </div>
                  <i className="bi bi-box display-6 opacity-50"></i>
                </div>
                <small className="opacity-75">
                  {estadisticas.total_clientes} clientes diferentes
                </small>
              </div>
            </div>
          </div>
        </div>

        {/* Panel de suma actual */}
        <div className="alert alert-info d-flex justify-content-between align-items-center mb-4">
          <div>
            <i className="bi bi-calculator me-2"></i>
            <strong>Suma de ventas en página actual:</strong>
            <span className="ms-2 h4 mb-0">{formatoMoneda(sumaPaginaActual)}</span>
          </div>
          <div className="text-muted">
            Mostrando {ventasAgrupadas.length} de {paginacion.total_filas} ventas
          </div>
        </div>

        {/* Panel de filtros */}
        <div className="card mb-4">
          <div className="card-header bg-light">
            <h5 className="mb-0"><i className="bi bi-funnel me-2"></i>Filtros de Búsqueda</h5>
          </div>
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-3">
                <label className="form-label">Folio</label>
                <input
                  type="text"
                  className="form-control"
                  name="folio"
                  value={filtros.folio}
                  onChange={handleInputChange}
                  placeholder="Buscar por folio"
                />
              </div>
              <div className="col-md-3">
                <label className="form-label">Cliente</label>
                <select
                  className="form-select"
                  name="cliente_id"
                  value={filtros.cliente_id}
                  onChange={handleInputChange}
                >
                  <option value="">Todos los clientes</option>
                  {clientes.map(cliente => (
                    <option key={cliente.curp || cliente.id} value={cliente.id}>
                      {cliente.nombre_completo}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label">Producto</label>
                <select
                  className="form-select"
                  name="producto_id"
                  value={filtros.producto_id}
                  onChange={handleInputChange}
                >
                  <option value="">Todos los productos</option>
                  {productos.map(producto => (
                    <option key={producto.id} value={producto.id}>
                      {producto.producto}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label">Estado de Pago</label>
                <select
                  className="form-select"
                  name="estado_pago"
                  value={filtros.estado_pago}
                  onChange={handleInputChange}
                >
                  <option value="">Todos</option>
                  <option value="pagado">Pagado</option>
                  <option value="pendiente">Pendiente</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label">Método de Pago</label>
                <select
                  className="form-select"
                  name="metodo_pago"
                  value={filtros.metodo_pago}
                  onChange={handleInputChange}
                >
                  <option value="">Todos</option>
                  <option value="efectivo">Efectivo</option>
                  <option value="tarjeta">Tarjeta</option>
                  <option value="transferencia">Transferencia</option>
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label">Tipo de Venta</label>
                <select
                  className="form-select"
                  name="tipo_venta"
                  value={filtros.tipo_venta}
                  onChange={handleInputChange}
                >
                  <option value="">Todos</option>
                  <option value="kilos">Por Kilos</option>
                  <option value="unidades">Por Unidades</option>
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label">Desde</label>
                <input
                  type="date"
                  className="form-control"
                  name="fecha_inicio"
                  value={filtros.fecha_inicio}
                  onChange={handleInputChange}
                />
              </div>
              <div className="col-md-3">
                <label className="form-label">Hasta</label>
                <input
                  type="date"
                  className="form-control"
                  name="fecha_fin"
                  value={filtros.fecha_fin}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            <div className="mt-3 d-flex justify-content-between">
              <div>
                <button 
                  onClick={aplicarFiltros} 
                  className="btn btn-primary me-2"
                  disabled={loading}
                >
                  <i className="bi bi-search me-2"></i>
                  Aplicar Filtros
                </button>
                <button 
                  onClick={limpiarFiltros} 
                  className="btn btn-outline-secondary"
                >
                  <i className="bi bi-eraser me-2"></i>
                  Limpiar Filtros
                </button>
              </div>
              <div className="d-flex align-items-center">
                <div className="input-group" style={{ width: '150px' }}>
                  <span className="input-group-text">Mostrar</span>
                  <select 
                    className="form-select" 
                    value={paginacion.por_pagina}
                    onChange={handlePorPaginaChange}
                  >
                    <option value="5">5</option>
                    <option value="10">10</option>
                    <option value="25">25</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                  </select>
                </div>
                <span className="text-muted ms-3">
                  Mostrando {inicio} - {fin} de {paginacion.total_filas} ventas
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Mensaje de error */}
        {error && (
          <div className="alert alert-warning">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <i className="bi bi-exclamation-triangle me-2"></i>
                <strong>Advertencia:</strong> {error}
              </div>
              <button 
                className="btn-close" 
                onClick={() => setError(null)}
                aria-label="Cerrar"
              ></button>
            </div>
            <div className="mt-2">
              <small>
                Se están mostrando datos de prueba. Para ver los datos reales:
                <ol className="mb-0">
                  <li>Asegúrate de que el archivo <code>obtener_ventas.php</code> esté en la carpeta correcta</li>
                  <li>Verifica que la URL sea correcta en las líneas 73-78 del código</li>
                  <li>Prueba acceder directamente al PHP: <code>http://localhost/api/obtener_ventas.php</code></li>
                </ol>
              </small>
            </div>
          </div>
        )}

        {/* Tabla de ventas */}
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Cargando...</span>
            </div>
            <p className="mt-3">Cargando ventas...</p>
          </div>
        ) : ventasAgrupadas.length === 0 ? (
          <div className="text-center py-5">
            <i className="bi bi-inbox display-4 text-muted"></i>
            <h4 className="mt-3">No hay ventas registradas</h4>
            <p className="text-muted">No se encontraron ventas con los filtros aplicados.</p>
            <button onClick={limpiarFiltros} className="btn btn-primary">
              <i className="bi bi-eraser me-2"></i>
              Limpiar filtros
            </button>
          </div>
        ) : (
          <>
            <div className="table-responsive" id="tabla-ventas">
              <table className="table table-hover table-bordered">
                <thead className="table-dark">
                  <tr>
                    <th width="120">Folio</th>
                    <th>Cliente</th>
                    <th>Productos</th>
                    <th width="120">Total</th>
                    <th width="140">Método</th>
                    <th width="120">Estado</th>
                    <th width="160">Fecha</th>
                    <th width="100" className="text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {ventasAgrupadas.map((venta, index) => (
                    <tr key={index} className={venta.estado_pago === 'pendiente' ? 'table-warning' : venta.estado_pago === 'cancelado' ? 'table-danger' : ''}>
                      <td>
                        <span className="badge bg-primary">
                          {venta.folio}
                        </span>
                      </td>
                      <td>
                        <div>
                          <strong>{venta.cliente}</strong>
                          {venta.cliente_telefono && (
                            <div className="text-muted small">
                              <i className="bi bi-telephone me-1"></i>
                              {venta.cliente_telefono}
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <div style={{ maxWidth: '300px' }}>
                          {venta.detalles.slice(0, 2).map((producto, idx) => (
                            <div key={idx} className="mb-1">
                              <small>
                                <span className="badge bg-light text-dark me-1">
                                  {producto.nombre_producto}
                                </span>
                                <span className="text-muted">
                                  {producto.cantidad} {producto.unidad_medida} × {formatoMoneda(producto.precio_unitario)}
                                </span>
                              </small>
                            </div>
                          ))}
                          {venta.detalles.length > 2 && (
                            <small className="text-primary">
                              <i className="bi bi-three-dots me-1"></i>
                              y {venta.detalles.length - 2} productos más
                            </small>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="text-end">
                          <strong className="text-success">
                            {formatoMoneda(venta.total_venta)}
                          </strong>
                          <div className="text-muted small">
                            {venta.total_productos} items
                          </div>
                        </div>
                      </td>
                      <td>
                        {renderMetodoPago(venta.metodo_pago)}
                      </td>
                      <td>
                        {renderEstadoPago(venta.estado_pago)}
                      </td>
                      <td>
                        <div className="small">
                          {venta.fecha_venta_formateada || formatoFecha(venta.fecha_venta)}
                        </div>
                      </td>
                      <td className="text-center">
                        <div className="btn-group btn-group-sm">
                          <button
                            className="btn btn-outline-primary"
                            onClick={() => printTicket(venta)}
                            title="Imprimir Ticket"
                          >
                            <i className="bi bi-printer"></i>
                          </button>
                          <button
                            className="btn btn-outline-warning"
                            onClick={() => navigate(`/editar-estado/${venta.id}`)}
                            title="Editar Estado"
                          >
                            <i className="bi bi-pencil-square"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                {/* Fila de total */}
                <tfoot className="table-secondary">
                  <tr>
                    <td colSpan="3" className="text-end">
                      <strong>SUMA TOTAL DE LA PÁGINA:</strong>
                    </td>
                    <td className="text-end">
                      <strong className="text-success h5">
                        {formatoMoneda(sumaPaginaActual)}
                      </strong>
                      <div className="text-muted small">
                        {ventasAgrupadas.length} ventas
                      </div>
                    </td>
                    <td colSpan="4"></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Paginación */}
            {paginacion.total_paginas > 1 && (
              <div className="d-flex justify-content-between align-items-center mt-4">
                <div className="text-muted">
                  Página {paginacion.pagina_actual} de {paginacion.total_paginas} • 
                  Total: {paginacion.total_filas} ventas • 
                  Suma total: {formatoMoneda(estadisticas.importe_total)}
                </div>
                <nav aria-label="Paginación de ventas">
                  <ul className="pagination mb-0">
                    {/* Botón Anterior */}
                    <li className={`page-item ${paginacion.pagina_actual === 1 ? 'disabled' : ''}`}>
                      <button 
                        className="page-link" 
                        onClick={() => cambiarPagina(paginacion.pagina_actual - 1)}
                        disabled={paginacion.pagina_actual === 1}
                        aria-label="Anterior"
                      >
                        <i className="bi bi-chevron-left"></i>
                      </button>
                    </li>
                    
                    {/* Primera página */}
                    {paginacion.pagina_actual > 3 && (
                      <>
                        <li className="page-item">
                          <button 
                            className="page-link" 
                            onClick={() => cambiarPagina(1)}
                          >
                            1
                          </button>
                        </li>
                        {paginacion.pagina_actual > 4 && (
                          <li className="page-item disabled">
                            <span className="page-link">...</span>
                          </li>
                        )}
                      </>
                    )}
                    
                    {/* Páginas centrales */}
                    {generarNumerosPagina().map(pagina => (
                      <li key={pagina} className={`page-item ${pagina === paginacion.pagina_actual ? 'active' : ''}`}>
                        <button 
                          className="page-link" 
                          onClick={() => cambiarPagina(pagina)}
                        >
                          {pagina}
                        </button>
                      </li>
                    ))}
                    
                    {/* Última página */}
                    {paginacion.pagina_actual < paginacion.total_paginas - 2 && (
                      <>
                        {paginacion.pagina_actual < paginacion.total_paginas - 3 && (
                          <li className="page-item disabled">
                            <span className="page-link">...</span>
                          </li>
                        )}
                        <li className="page-item">
                          <button 
                            className="page-link" 
                            onClick={() => cambiarPagina(paginacion.total_paginas)}
                          >
                            {paginacion.total_paginas}
                          </button>
                        </li>
                      </>
                    )}
                    
                    {/* Botón Siguiente */}
                    <li className={`page-item ${paginacion.pagina_actual === paginacion.total_paginas ? 'disabled' : ''}`}>
                      <button 
                        className="page-link" 
                        onClick={() => cambiarPagina(paginacion.pagina_actual + 1)}
                        disabled={paginacion.pagina_actual === paginacion.total_paginas}
                        aria-label="Siguiente"
                      >
                        <i className="bi bi-chevron-right"></i>
                      </button>
                    </li>
                  </ul>
                </nav>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default TablaVentas;