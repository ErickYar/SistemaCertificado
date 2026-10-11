import { useAuth } from '../../context/AuthContext';

export default function Dashboard() {
    const { usuario } = useAuth();

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
                Bienvenido, {usuario?.nombre_completo || usuario?.nombre_usuario}
            </h1>
            <p className="text-gray-500 mb-6">
                Panel principal del sistema de certificados.
            </p>

            {/* Tarjetas de resumen */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                    <p className="text-sm text-gray-500">Certificados del día</p>
                    <p className="text-3xl font-bold text-gray-800 mt-2">0</p>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                    <p className="text-sm text-gray-500">Certificados de la semana</p>
                    <p className="text-3xl font-bold text-gray-800 mt-2">0</p>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                    <p className="text-sm text-gray-500">Recaudado hoy</p>
                    <p className="text-3xl font-bold text-gray-800 mt-2">S/ 0.00</p>
                </div>
            </div>
        </div>
    );
}