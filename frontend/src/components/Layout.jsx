import { NavLink, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const menuItems = [
    { to: '/dashboard',    label: 'Dashboard',     icon: '📊' },
    { to: '/clientes',     label: 'Clientes',      icon: '👥' },
    { to: '/vehiculos',    label: 'Vehículos',     icon: '🚗' },
    { to: '/certificados', label: 'Certificados',  icon: '📄' },
    { to: '/pagos',        label: 'Pagos',         icon: '💰' },
    { to: '/reportes',     label: 'Reportes',      icon: '📈' },
    { to: '/auditoria',    label: 'Auditoría',     icon: '📜' },   // ← NUEVO
];

export default function Layout() {
    const { usuario, cerrarSesion } = useAuth();
    const navigate = useNavigate();

    const handleCerrarSesion = () => {
        cerrarSesion();
        navigate('/login');
    };

    return (
        <div className="min-h-screen flex">
            {/* SIDEBAR */}
            <aside className="w-64 bg-gray-900 text-white flex flex-col">
                <div className="p-6 border-b border-gray-800">
                    <h1 className="text-xl font-bold">sistemCerti</h1>
                    <p className="text-xs text-gray-400 mt-1">Certificados Vehiculares</p>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    {menuItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-4 py-2.5 rounded-lg transition ${
                                    isActive
                                        ? 'bg-blue-600 text-white'
                                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                                }`
                            }
                        >
                            <span className="text-lg">{item.icon}</span>
                            <span className="font-medium">{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className="p-4 border-t border-gray-800 text-xs text-gray-500">
                    v1.0 · {new Date().getFullYear()}
                </div>
            </aside>

            {/* CONTENIDO PRINCIPAL */}
            <div className="flex-1 flex flex-col">
                {/* NAVBAR */}
                <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-800">
                            Panel de Control
                        </h2>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-sm font-medium text-gray-800">
                                {usuario?.nombre_completo || usuario?.nombre_usuario}
                            </p>
                            <p className="text-xs text-gray-500">
                                {usuario?.rol}
                            </p>
                        </div>
                        <button
                            onClick={handleCerrarSesion}
                            className="bg-red-500 hover:bg-red-600 text-white text-sm px-3 py-1.5 rounded-lg transition"
                        >
                            Salir
                        </button>
                    </div>
                </header>

                {/* CONTENIDO */}
                <main className="flex-1 p-6 bg-gray-100 overflow-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}