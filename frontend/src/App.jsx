import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import Login from './pages/Login';
import Registro from './pages/Registro';
import Dashboard from "./pages/Dashboard";
import RegistroCliente from './pages/RegistroCliente';
import TablaClientes from './pages/TablaClientes';
import TablaUsuarios from './pages/TablaUsuarios';
import Tablaproductos from './pages/Tablaproductos';
import RegistroProductos from './pages/RegistroProductos';
import EditarProducto from './pages/EditarProducto';
import EditarProductoAd from './pages/EditarProductoAd';
import EditarProductoRe from './pages/EditarProductoRe';
import RegistroVentas from './pages/RegistroVentas';
import TablaVentas from './pages/TablaVentas';
import EditarCliente from './pages/EditarCliente';
import TablaClientesR from './pages/TablaClientesR';
import RegistroClienteR from './pages/RegistroClienteR';
import EditarClienteR from './pages/EditarClienteR';
import EditarVenta from "./pages/EditarVenta";
import HistorialPrecios from './pages/HistorialPrecios';
import HistorialGlobal from './pages/HistorialGlobal';
import Sobrantes from './pages/Sobrantes';
import TablaproductosAd from './pages/TablaproductosAd';
import TablaproductosRe from './pages/TablaproductosRe';
import EditarEstadoVenta from './pages/EditarEstadoVenta';
import CodigoBarras from './pages/CodigoBarras';
import Home from "./pages/Home";
import About from "./pages/About"
import Programs from './pages/Programs';


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Registro />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/registroC" element={<RegistroCliente />} />
        <Route path="/registroCR" element={<RegistroClienteR />} />
        <Route path='/TablaC' element={<TablaClientes/>}/>
        <Route path='/TablaCR' element={<TablaClientesR/>}/>
        <Route path='/TablaU' element={<TablaUsuarios/>} />
        <Route path='/TablaP' element={<Tablaproductos/>} />
        <Route path='/registroP' element={<RegistroProductos/>} />
        <Route path="/editarP/:id" element={<EditarProducto />} />
        <Route path="/editarPAD/:id" element={<EditarProductoAd />} />
        <Route path="/editarPRE/:id" element={<EditarProductoRe />} />
        <Route path='/registroV' element={<RegistroVentas/>} />
        <Route path='/TablaV' element={<TablaVentas/>} />
        <Route path="/editar-cliente/:curp" element={<EditarCliente />} />
        <Route path="/editar-cliente-r/:curp" element={<EditarClienteR />} />
        <Route path="/editar-venta/:id" element={<EditarVenta />} />
        <Route path="/HistorialPrecios" element={<HistorialPrecios />} />
        <Route path="/HistorialGlobal" element={<HistorialGlobal />} />
        <Route path="/Sobrantes" element={<Sobrantes />} />
        <Route path="/TablaproductosAd" element={<TablaproductosAd />} />
        <Route path="/TablaproductosRe" element={<TablaproductosRe/>} />
        <Route path="/editar-estado/:id" element={<EditarEstadoVenta/>} />
        <Route path='/CodeP' element={<CodigoBarras/>}/>
        <Route path="/nosotros" element={<About />} />
        <Route path="/programas" element={<Programs />} />
        
      </Routes>
    </Router>
  );
}

export default App;
