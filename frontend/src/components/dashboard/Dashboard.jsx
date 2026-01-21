import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
    BarChart3, 
    Users, 
    Package, 
    FileText, 
    Settings,
    Bell,
    Calendar,
    TrendingUp,
    Shield,
    Eye
} from 'lucide-react';


const Dashboard = () => {
    const { user, hasPermission } = useAuth();

    const getDashboardContent = () => {
        switch(user?.rol) {
            case 'superadministrador':
                return (
                    <div className="dashboard-content">
                        <h1 className="dashboard-title">Panel de Superadministrador</h1>
                        <p className="dashboard-subtitle">Control total del sistema</p>
                        
                        <div className="dashboard-grid">
                            <div className="dashboard-card primary">
                                <Users size={32} />
                                <h3>Gestión de Usuarios</h3>
                                <p>Administra todos los usuarios del sistema</p>
                            </div>
                            <div className="dashboard-card secondary">
                                <Settings size={32} />
                                <h3>Configuración</h3>
                                <p>Ajustes globales del sistema</p>
                            </div>
                            <div className="dashboard-card accent">
                                <Shield size={32} />
                                <h3>Permisos</h3>
                                <p>Gestiona roles y permisos</p>
                            </div>
                            <div className="dashboard-card success">
                                <BarChart3 size={32} />
                                <h3>Reportes</h3>
                                <p>Ver estadísticas del sistema</p>
                            </div>
                        </div>
                    </div>
                );
                
            case 'administrador':
                return (
                    <div className="dashboard-content">
                        <h1 className="dashboard-title">Panel de Administrador</h1>
                        <p className="dashboard-subtitle">Administración general</p>
                        {/* ... contenido específico */}
                    </div>
                );
                
            case 'punto_venta':
                return (
                    <div className="dashboard-content">
                        <h1 className="dashboard-title">Panel de Punto de Venta</h1>
                        <p className="dashboard-subtitle">Gestión de ventas e inventario</p>
                        {/* ... contenido específico */}
                    </div>
                );
                
            // ... otros roles
                
            default:
                return (
                    <div className="dashboard-content">
                        <h1 className="dashboard-title">Bienvenido, {user?.nombre_completo}</h1>
                        <p className="dashboard-subtitle">Rol: {user?.rol}</p>
                    </div>
                );
        }
    };

    return (
        <div className="dashboard-container">
            {getDashboardContent()}
        </div>
    );
};

export default Dashboard;