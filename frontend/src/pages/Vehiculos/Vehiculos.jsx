import { useState, useEffect } from 'react';
import * as vehiculoApi from '../../api/vehiculo.api';
import Modal from '../../components/Modal';
import VehiculoForm from './VehiculoForm';

export default function Vehiculos() {
    const [vehiculos, setVehiculos] = useState([]);
    const [busqueda, setBusqueda]   = useState('');
    const [cargando, setCargando]   = useState(true);
    const [error, setError]         = useState('');

    // Modal
    const [modalAbierto, setModalAbierto]       = useState(false);
    const [vehiculoEditar, setVehiculoEditar]   = useState(null);

    useEffect(() => {
        cargarVehiculos();
    }, []);

    useEffect(() => {
        if (busqueda.trim() === '') {
            cargarVehiculos();
            return;
        }
        const timer = setTimeout(() => buscar(busqueda.trim()), 500);
        return () => clearTimeout(timer);
    }, [busqueda]);

    const cargarVehiculos = async () => {
        setCargando(true);
        setError('');
        try {
            const data = await vehiculoApi.listar();
            setVehiculos(data);
        } catch (err) {
            setError(err.response?.data?.mensaje || 'Error al cargar vehículos');
        } finally {
            setCargando(false);
        }
    };

    const buscar = async (texto) => {
        setCargando(true);
        setError('');
        try {
            let resultado;
            if (texto.includes('-')) {
                resultado = await vehiculoApi.buscarPorPlaca(texto.toUpperCase());
            } else if (texto.length >= 10) {
                resultado = await vehiculoApi.buscarPorVin(texto.toUpperCase());
            } else {
                resultado = await vehiculoApi.buscarPorPlaca(texto.toUpperCase());
            }
            setVehiculos(resultado);
        } catch (err) {
            setError(err.response?.data?.mensaje || 'Error en la búsqueda');
        } finally {
            setCargando(false);
        }
    };

    // ------------------------------------------------------------
    // Modal Crear/Editar
    // ------------------------------------------------------------
    const abrirNuevo = () => {
        setVehiculoEditar(null);
        setModalAbierto(true);
    };

    const abrirEditar = async (v) => {
        try {
            // Cargar datos completos (con motor)
            const completo = await vehiculoApi.obtener(v.id_vehiculo);
            setVehiculoEditar(completo);
            setModalAbierto(true);
        } catch (err) {
            setError('Error al cargar vehículo: ' + err.message);
        }
    };

    const cerrarModal = () => {
        setModalAbierto(false);
        setVehiculoEditar(null);
    };

    const handleGuardado = () => {
        cerrarModal();
        setBusqueda('');
        cargarVehiculos();
    };

    return (
        <div>
            {/* Encabezado */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Vehículos</h1>
                    <p className="text-gray-500 mt-1">
                        Gestión de vehículos registrados
                    </p>
                </div>
                <button
                    onClick={abrirNuevo}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg transition"
                >
                    + Nuevo Vehículo
                </button>
            </div>

            {/* Búsqueda */}
            <div className="bg-white rounded-lg shadow p-4 mb-6">
                <input
                    type="text"
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    placeholder="🔍 Buscar por placa (TCJ-892) o VIN..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {busqueda && (
                    <button
                        onClick={() => setBusqueda('')}
                        className="text-sm text-blue-600 hover:text-blue-800 mt-2 font-medium"
                    >
                        ✕ Limpiar búsqueda
                    </button>
                )}
            </div>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4">
                    {error}
                </div>
            )}

            {cargando && (
                <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
                    {busqueda ? 'Buscando...' : 'Cargando vehículos...'}
                </div>
            )}

            {!cargando && vehiculos.length === 0 && (
                <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
                    {busqueda
                        ? `No se encontraron vehículos para "${busqueda}".`
                        : 'No hay vehículos registrados.'}
                </div>
            )}

            {!cargando && vehiculos.length > 0 && (
                <div className="bg-white rounded-lg shadow overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Placa</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">VIN</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Categoría</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Marca</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Modelo</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Año</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Cliente</th>
                                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {vehiculos.map((v) => (
                                <tr key={v.id_vehiculo} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded">
                                            {v.placa}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-600 font-mono">
                                        {v.numero_vin}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800">{v.categoria || '—'}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800">{v.marca || '—'}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800">{v.modelo || '—'}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{v.anio_modelo || '—'}</td>
                                    <td className="px-4 py-3 text-sm text-gray-700 max-w-xs truncate">
                                        {v.razon_social || `${v.nombres || ''} ${v.apellidos || ''}`.trim() || '—'}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm space-x-2">
                                        <button
                                            className="text-blue-600 hover:text-blue-800 font-medium"
                                            onClick={() => abrirEditar(v)}
                                        >
                                            Editar
                                        </button>
                                        <button
                                            className="text-red-600 hover:text-red-800 font-medium"
                                            onClick={() => alert(`Eliminar vehículo ${v.id_vehiculo}`)}
                                        >
                                            Eliminar
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {!cargando && vehiculos.length > 0 && (
                <p className="text-sm text-gray-500 mt-4">
                    {busqueda
                        ? `Resultados: ${vehiculos.length}`
                        : `Total: ${vehiculos.length} vehículo${vehiculos.length !== 1 ? 's' : ''}`}
                </p>
            )}

            {/* Modal */}
            <Modal
                abierto={modalAbierto}
                onCerrar={cerrarModal}
                titulo={vehiculoEditar ? 'Editar Vehículo' : 'Nuevo Vehículo'}
                size="xl"
            >
                <VehiculoForm
                    vehiculo={vehiculoEditar}
                    onGuardado={handleGuardado}
                    onCancelar={cerrarModal}
                />
            </Modal>
        </div>
    );
}