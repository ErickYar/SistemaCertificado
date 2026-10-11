import { useState, useEffect } from 'react';
import * as auditoriaApi from '../../api/auditoria.api';

export default function Auditoria() {
    const [registros, setRegistros] = useState([]);
    const [cargando, setCargando]   = useState(true);
    const [error, setError]         = useState('');

    // Filtros
    const [tabla, setTabla]     = useState('');
    const [accion, setAccion]   = useState('');
    const [usuario, setUsuario] = useState('');

    useEffect(() => {
        cargar();
    }, [tabla, accion]);

    const cargar = async () => {
        setCargando(true);
        setError('');
        try {
            const filtros = {};
            if (tabla)   filtros.tabla  = tabla;
            if (accion)  filtros.accion = accion;
            if (usuario) filtros.busqueda = usuario;

            const data = await auditoriaApi.listar(filtros);
            setRegistros(data);
        } catch (err) {
            setError(err.response?.data?.mensaje || 'Error al cargar auditoría');
        } finally {
            setCargando(false);
        }
    };

    const getBadgeAccion = (a) => {
        const estilos = {
            CREAR:      'bg-green-100 text-green-700',
            ACTUALIZAR: 'bg-yellow-100 text-yellow-700',
            ELIMINAR:   'bg-red-100 text-red-700',
            REACTIVAR:  'bg-blue-100 text-blue-700'
        };
        return (
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${estilos[a] || 'bg-gray-100 text-gray-700'}`}>
                {a}
            </span>
        );
    };

    const formatearFecha = (f) => {
        const d = new Date(f);
        return d.toLocaleString('es-PE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div>
            {/* Encabezado */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Auditoría</h1>
                <p className="text-gray-500 mt-1">
                    Historial de acciones realizadas en el sistema
                </p>
            </div>

            {/* Filtros */}
            <div className="bg-white rounded-lg shadow p-4 mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Tabla</label>
                    <select
                        value={tabla}
                        onChange={(e) => setTabla(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                        <option value="">-- Todas --</option>
                        <option value="cliente">Cliente</option>
                        <option value="vehiculo">Vehículo</option>
                        <option value="certificado">Certificado</option>
                        <option value="pago">Pago</option>
                    </select>
                </div>

                <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Acción</label>
                    <select
                        value={accion}
                        onChange={(e) => setAccion(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                        <option value="">-- Todas --</option>
                        <option value="CREAR">Crear</option>
                        <option value="ACTUALIZAR">Actualizar</option>
                        <option value="ELIMINAR">Eliminar</option>
                    </select>
                </div>

                <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Usuario</label>
                    <input
                        type="text"
                        value={usuario}
                        onChange={(e) => setUsuario(e.target.value)}
                        onBlur={cargar}
                        placeholder="Buscar usuario..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div className="flex items-end">
                    <button
                        onClick={cargar}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition"
                    >
                        🔄 Actualizar
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4">
                    {error}
                </div>
            )}

            {cargando && (
                <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
                    Cargando historial...
                </div>
            )}

            {!cargando && registros.length === 0 && (
                <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
                    No hay registros de auditoría.
                </div>
            )}

            {!cargando && registros.length > 0 && (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Fecha</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Usuario</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Acción</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Tabla</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">ID</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Descripción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {registros.map((r) => (
                                <tr key={r.id_auditoria} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                                        {formatearFecha(r.fecha)}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-700">
                                        {r.nombre_usuario || '—'}
                                    </td>
                                    <td className="px-4 py-3">
                                        {getBadgeAccion(r.accion)}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-700">
                                        {r.tabla}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-700">
                                        #{r.id_registro}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600">
                                        {r.descripcion || '—'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {!cargando && registros.length > 0 && (
                <p className="text-sm text-gray-500 mt-4">
                    Total: {registros.length} registro{registros.length !== 1 ? 's' : ''}
                </p>
            )}
        </div>
    );
}