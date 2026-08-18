import { useEffect, useState } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import Sidebar from '../components/Sidebar';
import { useNavigate } from 'react-router-dom';

const RegistroVentas = () => {
  const navigate = useNavigate();

  const [clientes, setClientes] = useState([]);
  const [productos, setProductos] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([{ 
    producto_id: "", 
    tipo_venta: "unidades", 
    cantidad: 1, 
    precio_unitario: 0,
    notas: ""
  }]);
  const [ticketData, setTicketData] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const [barcode, setBarcode] = useState('');
  const [barcodeError, setBarcodeError] = useState('');
  const [barcodeLoading, setBarcodeLoading] = useState(false);
  const [clientesEncontrados, setClientesEncontrados] = useState([]);
  const [mostrarListaClientes, setMostrarListaClientes] = useState(false);

  const [formData, setFormData] = useState({
    cliente_id: "",
    estado_pago: "pagado", // Nuevo campo: pagado, pendiente, no pagado
    metodo_pago: "efectivo",
    monto_entregado: "",
    cambio: "",
    numero_tarjeta: "",
    monto_efectivo: "",
    monto_tarjeta: ""
  });

  const [precioTotal, setPrecioTotal] = useState(0);
  const [folioGenerado, setFolioGenerado] = useState('');
  const [productosSuspendidos, setProductosSuspendidos] = useState([]);

  // Cargar clientes y productos
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const baseURL = window.location.origin;
        
        // Cargar clientes
        let clientesData = [];
        try {
          const clientesRes = await fetch(`${baseURL}/api/clientes.php`);
          if (clientesRes.ok) {
            clientesData = await clientesRes.json();
          }
        } catch (clientesError) {
          console.error("Error cargando clientes:", clientesError);
          clientesData = [
            {
              id: 1,
              nombre_completo: "CLIENTE GENERAL (NO MIEMBRO)",
              curp: "NO-MIEMBRO",
              telefono: "0000000000",
              barcode_img: "NO-MIEMBRO"
            }
          ];
        }

        // Cargar productos
        let productosData = [];
        try {
          const productosRes = await fetch(`${baseURL}/api/productos.php`);
          if (productosRes.ok) {
            productosData = await productosRes.json();
          }
        } catch (productosError) {
          console.error("Error cargando productos:", productosError);
          productosData = [
            {
              id: 1,
              producto: "Manzanas",
              kilos: 10.5,
              precio_venderK: 25.50,
              unidades: 50,
              precio_venderD: 5.00,
              activo: 1
            },
            {
              id: 2,
              producto: "Naranjas",
              kilos: 8.2,
              precio_venderK: 18.75,
              unidades: 100,
              precio_venderD: 3.50,
              activo: 1
            }
          ];
        }

        setClientes(clientesData);
        setProductos(productosData);
        
        // Verificar productos suspendidos al cargar
        const suspendidos = productosData.filter(p => p.activo === 0);
        if (suspendidos.length > 0) {
          console.warn("Productos suspendidos cargados:", suspendidos.map(p => p.producto));
        }
        
      } catch (error) {
        console.error("Error general al cargar datos:", error);
        
        // Datos de prueba
        setClientes([
          {
            id: 1,
            nombre_completo: "CLIENTE GENERAL (NO MIEMBRO)",
            curp: "NO-MIEMBRO",
            telefono: "0000000000",
            barcode_img: "NO-MIEMBRO"
          }
        ]);
        
        setProductos([
          {
            id: 1,
            producto: "Producto de Prueba",
            kilos: 10,
            precio_venderK: 20.00,
            unidades: 100,
            precio_venderD: 2.00,
            activo: 1
          }
        ]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Función para actualizar productos después de venta
  const actualizarProductos = async () => {
    try {
      const baseURL = window.location.origin;
      const productosRes = await fetch(`${baseURL}/api/productos.php`);
      if (productosRes.ok) {
        const productosData = await productosRes.json();
        setProductos(productosData);
      }
    } catch (error) {
      console.error("Error actualizando productos:", error);
    }
  };

  // Función para verificar si un producto está suspendido
  const verificarProductoSuspendido = (productoId) => {
    const producto = productos.find(p => p.id == productoId);
    if (!producto) return false;
    return producto.activo === 0;
  };

  // Obtener stock disponible de un producto
  const getStockDisponible = (productoId, tipoVenta) => {
    const producto = productos.find(p => p.id == productoId);
    if (!producto) return 0;
    
    if (tipoVenta === "kilos") {
      return parseFloat(producto.kilos) || 0;
    } else {
      return parseInt(producto.unidades) || 0;
    }
  };

  // Detectar escaneo de CURP
  useEffect(() => {
    if (barcode && barcode.length === 18) {
      handleBuscarPorBarcode();
    }
  }, [barcode]);

  // Buscar cliente por CURP
  const handleBuscarPorBarcode = async () => {
    if (!barcode.trim()) {
      setBarcodeError('Por favor ingresa un CURP');
      return;
    }

    setBarcodeLoading(true);
    setBarcodeError('');
    setSearchTerm('');
    setClientesEncontrados([]);
    setMostrarListaClientes(false);

    try {
      const curpNormalizado = barcode.toUpperCase().trim();
      const baseURL = window.location.origin;
      
      const response = await fetch(`${baseURL}/api/clientes.php?barcode=${encodeURIComponent(curpNormalizado)}`);
      
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data || data.length === 0) {
        setBarcodeError(`No se encontró cliente con CURP: ${curpNormalizado}`);
      } else if (data.length === 1) {
        const clienteEncontrado = data[0];
        setFormData(prev => ({ 
          ...prev, 
          cliente_id: clienteEncontrado.id.toString() 
        }));
        setSearchTerm(clienteEncontrado.nombre_completo || '');
        setBarcode("");
      } else {
        setClientesEncontrados(data);
        setMostrarListaClientes(true);
      }
    } catch (err) {
      console.error('Error al buscar por CURP:', err);
      setBarcodeError(err.message || 'Error al conectar con el servidor');
    } finally {
      setBarcodeLoading(false);
    }
  };

  // Seleccionar cliente de lista
  const seleccionarCliente = (cliente) => {
    setFormData(prev => ({ 
      ...prev, 
      cliente_id: cliente.id.toString() 
    }));
    setSearchTerm(cliente.nombre_completo || '');
    setClientesEncontrados([]);
    setMostrarListaClientes(false);
    setBarcode("");
  };

  // Botón "No es miembro"
  const handleNoEsMiembro = async () => {
    const clienteGeneralExistente = clientes.find(cliente => {
      if (!cliente.nombre_completo) return false;
      const nombre = cliente.nombre_completo.toUpperCase();
      return nombre.includes('CLIENTE GENERAL') || 
             nombre.includes('NO MIEMBRO') ||
             nombre.includes('GENERAL');
    });

    if (clienteGeneralExistente) {
      setFormData(prev => ({ 
        ...prev, 
        cliente_id: clienteGeneralExistente.id.toString() 
      }));
      setSearchTerm(clienteGeneralExistente.nombre_completo);
      
      setSuccessMessage(`Cliente seleccionado: ${clienteGeneralExistente.nombre_completo}`);
      setTimeout(() => setSuccessMessage(""), 3000);
      return;
    }

    // Usar primer cliente disponible
    if (clientes.length > 0) {
      const primerCliente = clientes[0];
      setFormData(prev => ({ 
        ...prev, 
        cliente_id: primerCliente.id.toString() 
      }));
      setSearchTerm(`[NO MIEMBRO] - ${primerCliente.nombre_completo}`);
      
      setSuccessMessage(`Usando cliente existente: ${primerCliente.nombre_completo}`);
      setTimeout(() => setSuccessMessage(""), 3000);
    } else {
      alert("No hay clientes registrados. Registra al menos un cliente primero.");
    }
  };

  // Venta rápida
  const handleNoEsMiembroDirecto = () => {
    const clienteParaUsar = clientes.find(c => c.id) || clientes[0];
    
    if (clienteParaUsar) {
      setFormData(prev => ({ 
        ...prev, 
        cliente_id: clienteParaUsar.id.toString() 
      }));
      setSearchTerm(`VENTA GENERAL - ${clienteParaUsar.nombre_completo}`);
      
      setSuccessMessage("Modo 'No es miembro' activado");
      setTimeout(() => setSuccessMessage(""), 3000);
    } else {
      alert("No hay clientes disponibles.");
    }
  };

  // Filtrar clientes
  const filteredClients = clientes.filter(cliente =>
    cliente.nombre_completo && cliente.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Manejar cambios en productos CON VALIDACIÓN DE STOCK
  const handleProductChange = (index, field, value) => {
    const updated = [...selectedProducts];
    
    if (field === "producto_id") {
      updated[index][field] = value;
      const producto = productos.find(p => p.id == value);
      
      if (producto) {
        // Verificar si el producto está suspendido
        if (producto.activo === 0) {
          alert(`❌ El producto "${producto.producto}" está SUSPENDIDO y no se puede vender. Por favor, reactívelo primero desde la tabla de productos.`);
          // No permitir seleccionar producto suspendido
          updated[index][field] = "";
          setSelectedProducts(updated);
          return;
        }
        
        const tipoVenta = producto.kilos > 0 ? "kilos" : "unidades";
        updated[index]["tipo_venta"] = tipoVenta;
        
        let precioUnitario = 0;
        if (tipoVenta === "kilos") {
          precioUnitario = parseFloat(producto.precio_venderK) || 0;
          
          // Validar stock al seleccionar producto (solo si el estado es pagado)
          if (formData.estado_pago === 'pagado' && updated[index]["cantidad"] > producto.kilos) {
            alert(`⚠️ Stock insuficiente. Solo hay ${producto.kilos.toFixed(2)} kg disponibles.`);
            updated[index]["cantidad"] = producto.kilos;
          }
        } else {
          precioUnitario = parseFloat(producto.precio_venderD) || 0;
          
          // Validar stock al seleccionar producto (solo si el estado es pagado)
          if (formData.estado_pago === 'pagado' && updated[index]["cantidad"] > producto.unidades) {
            alert(`⚠️ Stock insuficiente. Solo hay ${producto.unidades} unidades disponibles.`);
            updated[index]["cantidad"] = producto.unidades;
          }
        }
        updated[index]["precio_unitario"] = precioUnitario;
        
        if (updated[index]["cantidad"] > 1) {
          updated[index]["cantidad"] = tipoVenta === "unidades" ? 1 : 0.5;
        }
      }
    } else if (field === "tipo_venta") {
      updated[index][field] = value;
      const producto = productos.find(p => p.id == updated[index].producto_id);
      if (producto) {
        let precioUnitario = 0;
        if (value === "kilos") {
          precioUnitario = parseFloat(producto.precio_venderK) || 0;
          
          // Validar stock al cambiar tipo de venta (solo si el estado es pagado)
          if (formData.estado_pago === 'pagado' && updated[index]["cantidad"] > producto.kilos) {
            alert(`⚠️ Stock insuficiente. Solo hay ${producto.kilos.toFixed(2)} kg disponibles.`);
            updated[index]["cantidad"] = producto.kilos;
          }
        } else {
          precioUnitario = parseFloat(producto.precio_venderD) || 0;
          
          // Validar stock al cambiar tipo de venta (solo si el estado es pagado)
          if (formData.estado_pago === 'pagado' && updated[index]["cantidad"] > producto.unidades) {
            alert(`⚠️ Stock insuficiente. Solo hay ${producto.unidades} unidades disponibles.`);
            updated[index]["cantidad"] = producto.unidades;
          }
        }
        updated[index]["precio_unitario"] = precioUnitario;
      }
    } else if (field === "cantidad") {
      const cantidadNum = value === "" ? 0 : parseFloat(value);
      
      // Verificar si el producto está suspendido antes de cambiar cantidad
      const producto = productos.find(p => p.id == updated[index].producto_id);
      if (producto && producto.activo === 0) {
        alert(`❌ El producto "${producto.producto}" está SUSPENDIDO y no se puede vender. Por favor, reactívelo primero desde la tabla de productos.`);
        updated[index]["cantidad"] = 0;
        setSelectedProducts(updated);
        return;
      }
      
      // Validar stock al cambiar cantidad (solo si el estado es pagado)
      if (producto && formData.estado_pago === 'pagado') {
        if (updated[index].tipo_venta === "kilos" && cantidadNum > producto.kilos) {
          alert(`⚠️ Stock insuficiente. Solo hay ${producto.kilos.toFixed(2)} kg disponibles.`);
          updated[index][field] = producto.kilos;
        } else if (updated[index].tipo_venta === "unidades" && cantidadNum > producto.unidades) {
          alert(`⚠️ Stock insuficiente. Solo hay ${producto.unidades} unidades disponibles.`);
          updated[index][field] = producto.unidades;
        } else {
          updated[index][field] = cantidadNum > 0 ? cantidadNum : (updated[index].tipo_venta === "kilos" ? 0.5 : 1);
        }
      } else {
        updated[index][field] = cantidadNum > 0 ? cantidadNum : (updated[index].tipo_venta === "kilos" ? 0.5 : 1);
      }
    } else {
      updated[index][field] = value;
    }

    setSelectedProducts(updated);
  };

  // Agregar producto
  const addProduct = () => {
    setSelectedProducts([...selectedProducts, { 
      producto_id: "", 
      tipo_venta: "unidades", 
      cantidad: 1, 
      precio_unitario: 0,
      notas: ""
    }]);
  };

  // Quitar producto
  const removeProduct = (index) => {
    if (selectedProducts.length > 1) {
      const updated = [...selectedProducts];
      updated.splice(index, 1);
      setSelectedProducts(updated);
    }
  };

  // Calcular total
  useEffect(() => {
    let total = 0;
    selectedProducts.forEach(p => {
      const precio = parseFloat(p.precio_unitario) || 0;
      const cantidad = parseFloat(p.cantidad) || 0;
      total += precio * cantidad;
    });
    setPrecioTotal(total);
    
    // Solo calcular pagos si el estado es "pagado"
    if (formData.estado_pago === 'pagado') {
      // Calcular cambio para efectivo
      if (formData.metodo_pago === "efectivo" && formData.monto_entregado) {
        const montoNum = parseFloat(formData.monto_entregado) || 0;
        const cambioCalc = montoNum - total;
        setFormData(prev => ({
          ...prev,
          cambio: cambioCalc >= 0 ? cambioCalc.toFixed(2) : "0.00"
        }));
      }
      
      // Validar montos para pago mixto
      if (formData.metodo_pago === "mixto") {
        const efectivo = parseFloat(formData.monto_efectivo) || 0;
        const tarjeta = parseFloat(formData.monto_tarjeta) || 0;
        const sumaMontos = efectivo + tarjeta;
        
        if (sumaMontos >= total) {
          const cambioCalc = sumaMontos - total;
          setFormData(prev => ({
            ...prev,
            cambio: cambioCalc >= 0 ? cambioCalc.toFixed(2) : "0.00"
          }));
        } else {
          setFormData(prev => ({
            ...prev,
            cambio: "0.00"
          }));
        }
      }
    } else {
      // Limpiar campos de pago si no es pagado
      setFormData(prev => ({
        ...prev,
        monto_entregado: "",
        cambio: "0.00",
        numero_tarjeta: "",
        monto_efectivo: "",
        monto_tarjeta: ""
      }));
    }
  }, [selectedProducts, formData.estado_pago, formData.metodo_pago, formData.monto_entregado, formData.monto_efectivo, formData.monto_tarjeta]);

  // Manejar cambios en formulario
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "estado_pago") {
      setFormData(prev => ({ 
        ...prev, 
        [name]: value,
        // Limpiar campos de pago al cambiar estado
        monto_entregado: "",
        cambio: "0.00",
        numero_tarjeta: "",
        monto_efectivo: "",
        monto_tarjeta: ""
      }));
    } else if (name === "monto_entregado" && formData.estado_pago === 'pagado') {
      const montoNum = parseFloat(value) || 0;
      const cambioCalc = montoNum - precioTotal;
      setFormData(prev => ({
        ...prev,
        [name]: value,
        cambio: cambioCalc >= 0 ? cambioCalc.toFixed(2) : "0.00"
      }));
    } else if ((name === "monto_efectivo" || name === "monto_tarjeta") && formData.estado_pago === 'pagado') {
      const efectivo = name === "monto_efectivo" ? parseFloat(value) || 0 : parseFloat(formData.monto_efectivo) || 0;
      const tarjeta = name === "monto_tarjeta" ? parseFloat(value) || 0 : parseFloat(formData.monto_tarjeta) || 0;
      const sumaMontos = efectivo + tarjeta;
      
      setFormData(prev => ({ 
        ...prev, 
        [name]: value,
        cambio: sumaMontos >= precioTotal ? (sumaMontos - precioTotal).toFixed(2) : "0.00"
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // Imprimir ticket
  const printTicket = () => {
    const printWindow = window.open('', '', 'width=600,height=600');
    
    const maskCardNumber = (cardNumber) => {
      if (!cardNumber) return 'N/A';
      return `**** **** **** ${cardNumber.slice(-4)}`;
    };

    // Formatear método de pago para el ticket
    const getMetodoPagoTexto = () => {
      if (ticketData.estadoPago !== 'pagado') {
        return ticketData.estadoPago.toUpperCase();
      }
      
      if (ticketData.metodoPago === 'efectivo') {
        return 'EFECTIVO';
      } else if (ticketData.metodoPago === 'tarjeta') {
        return 'TARJETA';
      } else if (ticketData.metodoPago === 'mixto') {
        return 'MIXTO (Efectivo + Tarjeta)';
      }
      return ticketData.metodoPago;
    };

    const getEstadoPagoClass = () => {
      if (ticketData.estadoPago === 'pagado') return 'estado-pagado';
      if (ticketData.estadoPago === 'pendiente') return 'estado-pendiente';
      return 'estado-no-pagado';
    };

    printWindow.document.write(`
      <html>
        <head>
          <title>Ticket de Compra - Folio: ${ticketData.folio}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
            .ticket { width: 300px; max-width: 100%; margin: 0 auto; border: 1px solid #000; padding: 15px; }
            .header { text-align: center; margin-bottom: 15px; }
            .header h3 { margin: 5px 0; font-size: 16px; }
            .folio { background: #f0f0f0; padding: 8px; text-align: center; margin: 10px 0; border: 1px dashed #666; font-weight: bold; }
            .estado-pagado { background-color: #d4edda; color: #155724; padding: 5px; border-radius: 3px; }
            .estado-pendiente { background-color: #fff3cd; color: #856404; padding: 5px; border-radius: 3px; }
            .estado-no-pagado { background-color: #f8d7da; color: #721c24; padding: 5px; border-radius: 3px; }
            .info { margin-bottom: 10px; font-size: 12px; }
            .table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 11px; }
            .table th { border-bottom: 2px solid #000; padding: 5px; text-align: left; }
            .table td { padding: 5px; border-bottom: 1px solid #ddd; }
            .total { text-align: right; font-weight: bold; margin-top: 10px; font-size: 14px; }
            .footer { text-align: center; margin-top: 15px; font-size: 10px; color: #666; }
            .separator { border-top: 1px dashed #000; margin: 10px 0; }
            .pago-detalle { background: #f9f9f9; padding: 5px; margin: 5px 0; font-size: 11px; border-radius: 3px; }
            @media print {
              .no-print { display: none; }
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="ticket">
            <div class="header">
              <h3>FUNDACIÓN PROSPERIDAD</h3>
              <p>Rancho Sierra Hermosa, Mz.17, Lt.15</p>
              <p>Sierra Hermosa, C.P.55749</p>
              <p>Tel: (55) 2534 1060</p>
              <p>Fecha: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
            </div>
            
            <div class="separator"></div>
            
            <div class="folio">
              FOLIO: ${ticketData.folio || 'PENDIENTE'}
            </div>
            
            <div class="info">
              <p><strong>Cliente:</strong> ${ticketData.clienteNombre}</p>
              <p><strong>Estado de pago:</strong> <span class="${getEstadoPagoClass()}">${ticketData.estadoPago.toUpperCase()}</span></p>
              
              ${ticketData.estadoPago === 'pagado' ? `
                <p><strong>Método de pago:</strong> ${getMetodoPagoTexto()}</p>
                
                ${ticketData.metodoPago === 'efectivo' ? `
                  <div class="pago-detalle">
                    <p><strong>Monto recibido:</strong> $${parseFloat(ticketData.montoEntregado || 0).toFixed(2)}</p>
                    <p><strong>Cambio:</strong> $${parseFloat(ticketData.cambio || 0).toFixed(2)}</p>
                  </div>
                ` : ticketData.metodoPago === 'tarjeta' ? `
                  <div class="pago-detalle">
                    <p><strong>Tarjeta:</strong> ${maskCardNumber(ticketData.numeroTarjeta || '')}</p>
                  </div>
                ` : ticketData.metodoPago === 'mixto' ? `
                  <div class="pago-detalle">
                    <p><strong>PAGO MIXTO</strong></p>
                    <p><strong>Efectivo:</strong> $${parseFloat(ticketData.montoEfectivo || 0).toFixed(2)}</p>
                    <p><strong>Tarjeta:</strong> $${parseFloat(ticketData.montoTarjeta || 0).toFixed(2)}</p>
                    ${ticketData.numeroTarjeta ? `<p><strong>Tarjeta:</strong> ${maskCardNumber(ticketData.numeroTarjeta)}</p>` : ''}
                    ${parseFloat(ticketData.cambio || 0) > 0 ? `<p><strong>Cambio:</strong> $${parseFloat(ticketData.cambio).toFixed(2)}</p>` : ''}
                  </div>
                ` : ''}
              ` : `
                <div class="pago-detalle">
                  <p><strong>Nota:</strong> Venta registrada como <strong>${ticketData.estadoPago.toUpperCase()}</strong></p>
                  <p><em>El stock NO ha sido afectado</em></p>
                </div>
              `}
            </div>
            
            <div class="separator"></div>
            
            <table class="table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Cant.</th>
                  <th>Precio</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                ${ticketData.productos.map(p => `
                  <tr>
                    <td>${p.nombre}</td>
                    <td>${p.tipo_venta === 'kilos' ? parseFloat(p.cantidad).toFixed(2) + ' kg' : p.cantidad + ' unid'}</td>
                    <td>$${parseFloat(p.precio_unitario).toFixed(2)}</td>
                    <td>$${(parseFloat(p.precio_unitario) * parseFloat(p.cantidad)).toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            
            <div class="separator"></div>
            
            <div class="total">
              <p>TOTAL: $${parseFloat(ticketData.total).toFixed(2)}</p>
            </div>
            
            <div class="separator"></div>
            
            <div class="footer">
              <p>¡Gracias por su compra!</p>
              <p>Vuelva pronto</p>
              <p>Folio: ${ticketData.folio}</p>
              <div class="no-print" style="margin-top: 15px;">
                <button onclick="window.print()" style="padding: 5px 10px; margin-right: 10px;">Imprimir</button>
                <button onclick="window.close()" style="padding: 5px 10px;">Cerrar</button>
              </div>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Enviar formulario CON VALIDACIÓN DE STOCK Y PRODUCTOS SUSPENDIDOS
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.cliente_id) {
      alert("Por favor selecciona o crea un cliente");
      return;
    }

    if (selectedProducts.some(p => p.producto_id === "")) {
      alert("Por favor selecciona un producto para todos los items");
      return;
    }

    // Verificar productos suspendidos antes de validar stock
    let productosSuspendidosEncontrados = [];
    selectedProducts.forEach((p, index) => {
      if (verificarProductoSuspendido(p.producto_id)) {
        const producto = productos.find(prod => prod.id == p.producto_id);
        if (producto) {
          productosSuspendidosEncontrados.push({
            nombre: producto.producto,
            id: producto.id
          });
        }
      }
    });
    
    if (productosSuspendidosEncontrados.length > 0) {
      const nombresProductos = productosSuspendidosEncontrados.map(p => p.nombre).join(", ");
      alert(`❌ ERROR: Los siguientes productos están SUSPENDIDOS y no se pueden vender:\n\n${nombresProductos}\n\nPor favor, reactívelos primero desde la tabla de productos.`);
      return;
    }

    // Validar stock solo si el estado es "pagado"
    if (formData.estado_pago === 'pagado') {
      let stockInvalido = false;
      let mensajeError = "";
      
      selectedProducts.forEach((p, index) => {
        const producto = productos.find(prod => prod.id == p.producto_id);
        if (producto) {
          if (p.tipo_venta === "kilos" && p.cantidad > producto.kilos) {
            stockInvalido = true;
            mensajeError = `Stock insuficiente para "${producto.producto}". Disponible: ${producto.kilos.toFixed(2)} kg, Solicitado: ${p.cantidad} kg`;
          } else if (p.tipo_venta === "unidades" && p.cantidad > producto.unidades) {
            stockInvalido = true;
            mensajeError = `Stock insuficiente para "${producto.producto}". Disponible: ${producto.unidades} unidades, Solicitado: ${p.cantidad} unidades`;
          }
        }
      });
      
      if (stockInvalido) {
        alert(`Error: ${mensajeError}`);
        return;
      }

      // Validar según método de pago
      if (formData.metodo_pago === "efectivo") {
        if (parseFloat(formData.monto_entregado || 0) < precioTotal) {
          alert("El monto entregado no puede ser menor que el total");
          return;
        }
      } else if (formData.metodo_pago === "mixto") {
        const efectivo = parseFloat(formData.monto_efectivo) || 0;
        const tarjeta = parseFloat(formData.monto_tarjeta) || 0;
        const sumaMontos = efectivo + tarjeta;
        
        if (sumaMontos < precioTotal) {
          alert(`La suma de efectivo ($${efectivo.toFixed(2)}) y tarjeta ($${tarjeta.toFixed(2)}) es $${sumaMontos.toFixed(2)}. Debe ser igual o mayor al total ($${precioTotal.toFixed(2)})`);
          return;
        }
        
        if (!formData.numero_tarjeta && tarjeta > 0) {
          alert("Por favor ingresa el número de tarjeta para el pago con tarjeta");
          return;
        }
      }
    }

    setIsLoading(true);

    // Construir datos de venta según estado y método de pago
    const ventaData = {
      cliente_id: formData.cliente_id,
      estado_pago: formData.estado_pago,
      productos: selectedProducts.map(p => ({
        producto_id: p.producto_id,
        tipo_venta: p.tipo_venta,
        cantidad: p.cantidad,
        notas: p.notas
      }))
    };

    // Agregar método de pago y campos específicos solo si el estado es "pagado"
    if (formData.estado_pago === 'pagado') {
      ventaData.metodo_pago = formData.metodo_pago;
      
      if (formData.metodo_pago === "efectivo") {
        ventaData.monto_entregado = formData.monto_entregado;
        ventaData.cambio = formData.cambio;
      } else if (formData.metodo_pago === "tarjeta") {
        ventaData.numero_tarjeta = formData.numero_tarjeta;
      } else if (formData.metodo_pago === "mixto") {
        ventaData.monto_efectivo = formData.monto_efectivo;
        ventaData.monto_tarjeta = formData.monto_tarjeta;
        ventaData.numero_tarjeta = formData.numero_tarjeta;
        ventaData.cambio = formData.cambio;
      }
    } else {
      // Para estados no pagados, establecer método de pago por defecto
      ventaData.metodo_pago = "pendiente";
    }

    try {
      const baseURL = window.location.origin;
      const res = await fetch(`${baseURL}/api/guardar_venta.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ventaData)
      });

      const text = await res.text();

      try {
        const result = JSON.parse(text);
        if (result.success) {
          const estadoTexto = result.estado_pago === 'pagado' ? 'Pagada' : 
                              result.estado_pago === 'pendiente' ? 'Pendiente' : 'No pagada';
          
          setSuccessMessage(`✅ Venta registrada - Folio: ${result.folio} | Estado: ${estadoTexto} ${result.stock_actualizado ? '| Stock actualizado' : '| Stock NO afectado'}`);
          setFolioGenerado(result.folio);
          
          const clienteNombre = clientes.find(c => c.id == formData.cliente_id)?.nombre_completo || searchTerm || "Cliente General";
          const productosConNombre = selectedProducts.map(p => {
            const producto = productos.find(prod => prod.id == p.producto_id);
            return {
              ...p,
              nombre: producto ? producto.producto : "Producto desconocido"
            };
          });

          // Preparar datos del ticket
          const ticketDataObj = {
            folio: result.folio,
            clienteNombre,
            estadoPago: result.estado_pago,
            metodoPago: formData.metodo_pago,
            productos: productosConNombre,
            total: precioTotal.toFixed(2)
          };

          // Agregar datos específicos según método (solo si es pagado)
          if (result.estado_pago === 'pagado') {
            if (formData.metodo_pago === "efectivo") {
              ticketDataObj.montoEntregado = formData.monto_entregado;
              ticketDataObj.cambio = formData.cambio;
            } else if (formData.metodo_pago === "tarjeta") {
              ticketDataObj.numeroTarjeta = formData.numero_tarjeta;
            } else if (formData.metodo_pago === "mixto") {
              ticketDataObj.montoEfectivo = formData.monto_efectivo;
              ticketDataObj.montoTarjeta = formData.monto_tarjeta;
              ticketDataObj.numeroTarjeta = formData.numero_tarjeta;
              ticketDataObj.cambio = formData.cambio;
            }
          }

          setTicketData(ticketDataObj);

          // Actualizar lista de productos solo si se afectó el stock
          if (result.stock_actualizado) {
            await actualizarProductos();
          }

          // Limpiar formulario después de 3 segundos
          setTimeout(() => {
            setFormData({
              cliente_id: "",
              estado_pago: "pagado",
              metodo_pago: "efectivo",
              monto_entregado: "",
              cambio: "",
              numero_tarjeta: "",
              monto_efectivo: "",
              monto_tarjeta: ""
            });
            setSelectedProducts([{ 
              producto_id: "", 
              tipo_venta: "unidades", 
              cantidad: 1, 
              precio_unitario: 0,
              notas: ""
            }]);
            setPrecioTotal(0);
            setSearchTerm("");
            setBarcode("");
            setSuccessMessage("");
          }, 3000);
        } else {
          if (result.error && result.error.includes("SUSPENDIDO")) {
            alert(`❌ ${result.error}\n\nPor favor, verifique los productos en el carrito.`);
          } else {
            alert("Error: " + (result.error || "Error al registrar la venta"));
          }
        }
      } catch (err) {
        console.error("Respuesta no es JSON:", text);
        alert("Error del servidor. Ver consola para detalles.");
      }
    } catch (err) {
      console.error("Error al conectar:", err);
      alert("No se pudo conectar con el servidor.");
    } finally {
      setIsLoading(false);
    }
  };

  // Mostrar ticket
  useEffect(() => {
    if (ticketData) {
      setTimeout(() => {
        printTicket();
      }, 500);
    }
  }, [ticketData]);

  return (
    <div className="d-flex">
      <Sidebar />
      <div className="container-fluid py-3">
        <div className="row justify-content-center">
          <div className="col-12 col-lg-10 col-xl-8">
            <div className="card shadow-sm">
              <div className="card-header bg-primary text-white py-2">
                <div className="d-flex justify-content-between align-items-center">
                  <h4 className="mb-0">📝 Registro de Ventas</h4>
                  {folioGenerado && (
                    <span className="badge bg-light text-primary">
                      Folio: <strong>{folioGenerado}</strong>
                    </span>
                  )}
                </div>
              </div>
              
              <div className="card-body p-3">
                {isLoading && !successMessage ? (
                  <div className="text-center py-4">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Cargando...</span>
                    </div>
                    <p className="mt-2">Procesando venta...</p>
                  </div>
                ) : successMessage ? (
                  <div className="alert alert-success text-center py-2">
                    <i className="bi bi-check-circle-fill me-2"></i>
                    {successMessage}
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="needs-validation" noValidate>
                    
                    {/* SECCIÓN CLIENTE - COMPACTA */}
                    <div className="mb-3">
                      <h6 className="text-primary mb-2">👤 Cliente</h6>
                      
                      {/* Búsqueda por CURP */}
                      <div className="mb-2">
                        <div className="input-group input-group-sm">
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Escanear CURP (18 caracteres)"
                            value={barcode}
                            onChange={(e) => setBarcode(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleBuscarPorBarcode()}
                          />
                          <button 
                            type="button" 
                            className="btn btn-primary"
                            onClick={handleBuscarPorBarcode}
                            disabled={barcodeLoading}
                          >
                            {barcodeLoading ? (
                              <span className="spinner-border spinner-border-sm"></span>
                            ) : (
                              'Buscar'
                            )}
                          </button>
                        </div>
                        {barcodeError && (
                          <div className="text-danger small mt-1">{barcodeError}</div>
                        )}
                      </div>

                      {/* Cliente seleccionado */}
                      {formData.cliente_id ? (
                        <div className="alert alert-success py-1 px-2 mb-2">
                          <div className="d-flex justify-content-between align-items-center">
                            <small>
                              <strong>Cliente:</strong> 
                              {clientes.find(c => c.id.toString() === formData.cliente_id.toString())?.nombre_completo || searchTerm}
                            </small>
                            <button 
                              type="button" 
                              className="btn btn-sm btn-outline-danger py-0 px-1"
                              onClick={() => {
                                setFormData(prev => ({...prev, cliente_id: ""}));
                                setSearchTerm("");
                                setBarcode("");
                                setClientesEncontrados([]);
                                setMostrarListaClientes(false);
                              }}
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {/* Botones rápidos */}
                          <div className="row g-2 mb-2">
                            <div className="col-6">
                              <button 
                                type="button" 
                                className="btn btn-warning btn-sm w-100"
                                onClick={handleNoEsMiembro}
                              >
                                No es miembro
                              </button>
                            </div>
                            <div className="col-6">
                              <button 
                                type="button" 
                                className="btn btn-outline-secondary btn-sm w-100"
                                onClick={handleNoEsMiembroDirecto}
                              >
                                Venta rápida
                              </button>
                            </div>
                          </div>

                          {/* Búsqueda por nombre */}
                          <div className="mb-2">
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              placeholder="Buscar cliente por nombre..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                            />
                          </div>
                          
                          {/* Lista de clientes */}
                          <select
                            name="cliente_id"
                            className="form-select form-select-sm"
                            onChange={handleChange}
                            value={formData.cliente_id}
                            required
                          >
                            <option value="">Seleccione un cliente</option>
                            {filteredClients.map(c => (
                              <option key={c.id} value={c.id}>
                                {c.nombre_completo} - {c.curp || 'Sin CURP'}
                              </option>
                            ))}
                          </select>
                        </>
                      )}
                    </div>

                    {/* SECCIÓN PRODUCTOS - MEJORADA */}
                    <div className="mb-3">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <h6 className="text-primary mb-0">🛒 Productos</h6>
                        <button 
                          type="button" 
                          className="btn btn-outline-primary btn-sm"
                          onClick={addProduct}
                        >
                          <i className="bi bi-plus"></i> Agregar
                        </button>
                      </div>
                      
                      {selectedProducts.map((p, index) => {
                        const productoSeleccionado = productos.find(prod => prod.id == p.producto_id);
                        const stockDisponible = getStockDisponible(p.producto_id, p.tipo_venta);
                        const estaSuspendido = verificarProductoSuspendido(p.producto_id);
                        
                        return (
                          <div key={index} className={`border rounded p-2 mb-2 ${estaSuspendido ? 'border-danger bg-danger-light' : ''}`}>
                            <div className="row g-2 align-items-center">
                              <div className="col-md-5">
                                <select
                                  className={`form-select form-select-sm ${estaSuspendido ? 'border-danger' : ''}`}
                                  value={p.producto_id}
                                  onChange={e => handleProductChange(index, "producto_id", e.target.value)}
                                  required
                                >
                                  <option value="">Producto...</option>
                                  {productos.map(prod => {
                                    const tipoProducto = prod.kilos > 0 ? "kilos" : "unidades";
                                    const precioSugerido = tipoProducto === "kilos" 
                                      ? prod.precio_venderK 
                                      : prod.precio_venderD;
                                    
                                    // Mostrar stock disponible
                                    const stockDisponible = tipoProducto === "kilos" 
                                      ? parseFloat(prod.kilos || 0)
                                      : parseInt(prod.unidades || 0);
                                    
                                    const stockInfo = tipoProducto === "kilos" 
                                      ? ` (${stockDisponible.toFixed(2)} kg)` 
                                      : ` (${stockDisponible} unid)`;
                                    
                                    // Indicador visual para productos suspendidos
                                    const estaSuspendido = prod.activo === 0;
                                    const estadoTexto = estaSuspendido ? ' [SUSPENDIDO]' : '';
                                    
                                    return (
                                      <option 
                                        key={prod.id} 
                                        value={prod.id}
                                        disabled={estaSuspendido}
                                        style={estaSuspendido ? { backgroundColor: '#ffcccc' } : {}}
                                      >
                                        {prod.producto} - ${parseFloat(precioSugerido || 0).toFixed(2)}{stockInfo}{estadoTexto}
                                      </option>
                                    );
                                  })}
                                </select>
                                {productoSeleccionado && (
                                  <>
                                    {estaSuspendido ? (
                                      <small className="d-block mt-1 text-danger fw-bold">
                                        ❌ PRODUCTO SUSPENDIDO - No se puede vender
                                      </small>
                                    ) : (
                                      <small className={`d-block mt-1 ${stockDisponible <= 0 ? "text-danger fw-bold" : stockDisponible < 5 ? "text-warning" : "text-success"}`}>
                                        {stockDisponible <= 0 ? (
                                          "⚠️ AGOTADO"
                                        ) : stockDisponible < 5 ? (
                                          `⚠️ Stock bajo: ${stockDisponible} ${p.tipo_venta === "kilos" ? "kg" : "unid"}`
                                        ) : (
                                          `Stock disponible: ${stockDisponible} ${p.tipo_venta === "kilos" ? "kg" : "unid"}`
                                        )}
                                      </small>
                                    )}
                                  </>
                                )}
                              </div>

                              <div className="col-md-2">
                                <select
                                  className={`form-select form-select-sm ${estaSuspendido ? 'border-danger' : ''}`}
                                  value={p.tipo_venta}
                                  onChange={e => handleProductChange(index, "tipo_venta", e.target.value)}
                                  disabled={!p.producto_id || estaSuspendido}
                                >
                                  <option value="unidades">Unid</option>
                                  <option value="kilos">Kilos</option>
                                </select>
                              </div>

                              <div className="col-md-2">
                                <input
                                  type="number"
                                  className={`form-control form-control-sm ${estaSuspendido ? 'border-danger' : ''}`}
                                  value={p.cantidad}
                                  onChange={e => handleProductChange(index, "cantidad", e.target.value)}
                                  min={p.tipo_venta === "kilos" ? "0.1" : "1"}
                                  step={p.tipo_venta === "kilos" ? "0.1" : "1"}
                                  placeholder="Cant."
                                  required
                                  max={formData.estado_pago === 'pagado' ? stockDisponible : undefined}
                                  disabled={estaSuspendido}
                                />
                                {formData.estado_pago !== 'pagado' && (
                                  <small className="text-muted d-block">Stock no validado</small>
                                )}
                              </div>

                              <div className="col-md-2">
                                <div className="text-center">
                                  <small className="text-muted">
                                    ${parseFloat(p.precio_unitario).toFixed(2)}
                                  </small>
                                  <div className="text-success fw-bold">
                                    ${(parseFloat(p.precio_unitario) * parseFloat(p.cantidad)).toFixed(2)}
                                  </div>
                                </div>
                              </div>

                              <div className="col-md-1">
                                {selectedProducts.length > 1 && (
                                  <button 
                                    type="button" 
                                    className="btn btn-sm btn-outline-danger"
                                    onClick={() => removeProduct(index)}
                                    title="Eliminar"
                                  >
                                    ✕
                                  </button>
                                )}
                              </div>
                            </div>
                            
                            {/* Notas del producto */}
                            {p.producto_id && (
                              <div className="mt-2">
                                <input
                                  type="text"
                                  className={`form-control form-control-sm ${estaSuspendido ? 'border-danger' : ''}`}
                                  value={p.notas}
                                  onChange={e => handleProductChange(index, "notas", e.target.value)}
                                  placeholder="Notas (opcional)"
                                  disabled={estaSuspendido}
                                />
                              </div>
                            )}
                            
                            {estaSuspendido && (
                              <div className="alert alert-danger py-1 px-2 mt-2 mb-0">
                                <small>
                                  <i className="bi bi-exclamation-triangle me-1"></i>
                                  <strong>Producto suspendido:</strong> Reactívelo desde la tabla de productos para poder venderlo.
                                </small>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* TOTAL - COMPACTO */}
                    <div className="mb-3 p-2 bg-light rounded">
                      <div className="d-flex justify-content-between align-items-center">
                        <h6 className="mb-0">Total:</h6>
                        <h4 className="mb-0 text-success">${precioTotal.toFixed(2)}</h4>
                      </div>
                    </div>

                    {/* ESTADO DE PAGO - NUEVO */}
                    <div className="mb-3">
                      <h6 className="text-primary mb-2">💰 Estado de Pago</h6>
                      
                      <div className="row g-2 mb-3">
                        <div className="col-4">
                          <div className="form-check">
                            <input
                              type="radio"
                              className="form-check-input"
                              name="estado_pago"
                              id="pagado"
                              value="pagado"
                              checked={formData.estado_pago === "pagado"}
                              onChange={handleChange}
                              required
                            />
                            <label className="form-check-label text-success" htmlFor="pagado">
                              <strong>Pagado</strong>
                            </label>
                          </div>
                        </div>
                        <div className="col-4">
                          <div className="form-check">
                            <input
                              type="radio"
                              className="form-check-input"
                              name="estado_pago"
                              id="pendiente"
                              value="pendiente"
                              checked={formData.estado_pago === "pendiente"}
                              onChange={handleChange}
                            />
                            <label className="form-check-label text-warning" htmlFor="pendiente">
                              <strong>Pendiente</strong>
                            </label>
                          </div>
                        </div>
                        <div className="col-4">
                          <div className="form-check">
                            <input
                              type="radio"
                              className="form-check-input"
                              name="estado_pago"
                              id="no_pagado"
                              value="no pagado"
                              checked={formData.estado_pago === "no pagado"}
                              onChange={handleChange}
                            />
                            <label className="form-check-label text-danger" htmlFor="no_pagado">
                              <strong>No pagado</strong>
                            </label>
                          </div>
                        </div>
                      </div>

                      {formData.estado_pago !== 'pagado' && (
                        <div className="alert alert-info py-2">
                          <i className="bi bi-info-circle me-2"></i>
                          <small>
                            <strong>Nota:</strong> Al registrar como <strong>{formData.estado_pago}</strong>, 
                            el stock <strong>NO</strong> será afectado y no se requerirán datos de pago.
                          </small>
                        </div>
                      )}
                    </div>

                    {/* MÉTODO DE PAGO - SOLO SI ES PAGADO */}
                    {formData.estado_pago === 'pagado' && (
                      <div className="mb-3">
                        <h6 className="text-primary mb-2">💳 Método de Pago</h6>
                        
                        <div className="row g-2 mb-3">
                          <div className="col-4">
                            <div className="form-check">
                              <input
                                type="radio"
                                className="form-check-input"
                                name="metodo_pago"
                                id="efectivo"
                                value="efectivo"
                                checked={formData.metodo_pago === "efectivo"}
                                onChange={handleChange}
                                required
                              />
                              <label className="form-check-label" htmlFor="efectivo">
                                Efectivo
                              </label>
                            </div>
                          </div>
                          <div className="col-4">
                            <div className="form-check">
                              <input
                                type="radio"
                                className="form-check-input"
                                name="metodo_pago"
                                id="tarjeta"
                                value="tarjeta"
                                checked={formData.metodo_pago === "tarjeta"}
                                onChange={handleChange}
                              />
                              <label className="form-check-label" htmlFor="tarjeta">
                                Tarjeta
                              </label>
                            </div>
                          </div>
                          <div className="col-4">
                            <div className="form-check">
                              <input
                                type="radio"
                                className="form-check-input"
                                name="metodo_pago"
                                id="mixto"
                                value="mixto"
                                checked={formData.metodo_pago === "mixto"}
                                onChange={handleChange}
                              />
                              <label className="form-check-label" htmlFor="mixto">
                                Mixto
                              </label>
                            </div>
                          </div>
                        </div>

                        {formData.metodo_pago === "efectivo" && (
                          <div className="row g-2">
                            <div className="col-md-6">
                              <label className="form-label small">Monto Entregado</label>
                              <div className="input-group input-group-sm">
                                <span className="input-group-text">$</span>
                                <input
                                  type="number"
                                  className="form-control"
                                  name="monto_entregado"
                                  value={formData.monto_entregado}
                                  onChange={handleChange}
                                  min={precioTotal}
                                  step="0.01"
                                  required
                                />
                              </div>
                            </div>
                            <div className="col-md-6">
                              <label className="form-label small">Cambio</label>
                              <div className="input-group input-group-sm">
                                <span className="input-group-text">$</span>
                                <input
                                  type="text"
                                  className="form-control bg-light"
                                  value={formData.cambio}
                                  readOnly
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        {formData.metodo_pago === "tarjeta" && (
                          <div>
                            <label className="form-label small">Número de Tarjeta</label>
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              name="numero_tarjeta"
                              value={formData.numero_tarjeta}
                              onChange={handleChange}
                              maxLength={20}
                              placeholder="1234 5678 9012 3456"
                              required
                            />
                          </div>
                        )}

                        {formData.metodo_pago === "mixto" && (
                          <div>
                            <div className="row g-2 mb-2">
                              <div className="col-md-6">
                                <label className="form-label small">Efectivo</label>
                                <div className="input-group input-group-sm">
                                  <span className="input-group-text">$</span>
                                  <input
                                    type="number"
                                    className="form-control"
                                    name="monto_efectivo"
                                    value={formData.monto_efectivo}
                                    onChange={handleChange}
                                    min="0"
                                    step="0.01"
                                    required
                                  />
                                </div>
                              </div>
                              <div className="col-md-6">
                                <label className="form-label small">Tarjeta</label>
                                <div className="input-group input-group-sm">
                                  <span className="input-group-text">$</span>
                                  <input
                                    type="number"
                                    className="form-control"
                                    name="monto_tarjeta"
                                    value={formData.monto_tarjeta}
                                    onChange={handleChange}
                                    min="0"
                                    step="0.01"
                                    required
                                  />
                                </div>
                              </div>
                            </div>
                            
                            <div className="mb-2">
                              <label className="form-label small">Número de Tarjeta</label>
                              <input
                                type="text"
                                className="form-control form-control-sm"
                                name="numero_tarjeta"
                                value={formData.numero_tarjeta}
                                onChange={handleChange}
                                maxLength={20}
                                placeholder="1234 5678 9012 3456"
                                required={parseFloat(formData.monto_tarjeta || 0) > 0}
                              />
                            </div>
                            
                            <div className="row g-2">
                              <div className="col-md-6">
                                <label className="form-label small">Total Pagado</label>
                                <div className="input-group input-group-sm">
                                  <span className="input-group-text">$</span>
                                  <input
                                    type="text"
                                    className="form-control bg-info bg-opacity-10"
                                    value={((parseFloat(formData.monto_efectivo) || 0) + (parseFloat(formData.monto_tarjeta) || 0)).toFixed(2)}
                                    readOnly
                                  />
                                </div>
                              </div>
                              <div className="col-md-6">
                                <label className="form-label small">Cambio</label>
                                <div className="input-group input-group-sm">
                                  <span className="input-group-text">$</span>
                                  <input
                                    type="text"
                                    className="form-control bg-light"
                                    value={formData.cambio}
                                    readOnly
                                  />
                                </div>
                              </div>
                            </div>
                            
                            <div className={`mt-2 small ${((parseFloat(formData.monto_efectivo) || 0) + (parseFloat(formData.monto_tarjeta) || 0)) < precioTotal ? 'text-danger fw-bold' : 'text-success'}`}>
                              {((parseFloat(formData.monto_efectivo) || 0) + (parseFloat(formData.monto_tarjeta) || 0)) < precioTotal ? (
                                <i className="bi bi-exclamation-triangle me-1"></i>
                              ) : (
                                <i className="bi bi-check-circle me-1"></i>
                              )}
                              Suma de pagos: ${((parseFloat(formData.monto_efectivo) || 0) + (parseFloat(formData.monto_tarjeta) || 0)).toFixed(2)} / Total: ${precioTotal.toFixed(2)}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* BOTÓN REGISTRAR */}
                    <div className="d-grid gap-2">
                      <button 
                        type="submit" 
                        className="btn btn-primary"
                        disabled={isLoading || !formData.cliente_id}
                      >
                        {isLoading ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                            Procesando...
                          </>
                        ) : (
                          `Registrar Venta (${formData.estado_pago === 'pagado' ? 'Pagado' : formData.estado_pago === 'pendiente' ? 'Pendiente' : 'No pagado'})`
                        )}
                      </button>
                      
                      {folioGenerado && (
                        <button 
                          type="button" 
                          className="btn btn-outline-success"
                          onClick={() => printTicket()}
                        >
                          <i className="bi bi-printer me-2"></i>
                          Reimprimir Ticket ({folioGenerado})
                        </button>
                      )}
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegistroVentas;