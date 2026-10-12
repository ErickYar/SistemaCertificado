import { useState, useEffect } from 'react';
import * as vehiculoApi from '../../api/vehiculo.api';
import Modal from '../../components/Modal';
import ModalConfirmacion from '../../components/ModalConfirmacion';
import VehiculoForm from './VehiculoForm';

export default function Vehiculos() {
    const [vehiculos, setVehiculos] = useState([]);
    const [busqueda, setBusqueda]   = useState('');
    const [cargando, setCargando]   = useState(true);
    const [error, setError]         = useState('');

    // Modal crear/editar
    const [modalAbierto, setModalAbierto]     = useState(false);
    const [vehiculoEditar, setVehiculoEditar] = useState(null);

    // Modal eliminar
    const [modalEliminar, setModalEliminar]       = useState(false);
    const [vehiculoEliminar, setVehiculoEliminar] = useState(null);
    const [eliminando, setEliminando]             = useState(false);

    // Aviso
    const [aviso, setAviso] = useState(null);

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

    useEffect(() => {
        if (!aviso) return;
        const timer = setTimeout(() => setAviso(null), 3000);
        return () => clearTimeout(timer);
    }, [aviso]);

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
    // Crear/Editar
    // ------------------------------------------------------------
    const abrirNuevo = () => {
        setVehiculoEditar(null);
        setModalAbierto(true);
    };

    const abrirEditar = async (v) => {
        try {
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
        setAviso({ tipo: 'success', mensaje: 'Vehículo guardado correctamente' });
    };

    // ------------------------------------------------------------
    // Eliminar
    // ------------------------------------------------------------
    const abrirEliminar = (v) => {
        setVehiculoEliminar(v);
        setModalEliminar(true);
    };

    const cerrarEliminar = () => {
        setModalEliminar(false);
        setVehiculoEliminar(null);
    };

    const confirmarEliminar = async () => {
        if (!vehiculoEliminar) return;

        setEliminando(true);
        try {
            await vehiculoApi.eliminar(vehiculoEliminar.id_vehiculo);
            cerrarEliminar();
            cargarVehiculos();
            setAviso({ tipo: 'success', mensaje: 'Vehículo eliminado correctamente' });
        } catch (err) {
            setError(err.response?.data?.mensaje || 'Error al eliminar vehículo');
            cerrarEliminar();
        } finally {
            setEliminando(false);
        }
    };

    // ------------------------------------------------------------
    // Helpers
    // ------------------------------------------------------------
    const getNombreCliente = (v) =>
        v.razon_social || `${v.nombres || ''} ${v.apellidos || ''}`.trim() || '—';

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

            {/* Aviso */}
            {aviso && (
                <div className={`mb-4 px-4 py-3 rounded-lg border ${
                    aviso.tipo === 'success'
                        ? 'bg-green-100 border-green-400 text-green-700'
                        : 'bg-red-100 border-red-400 text-red-700'
                }`}>
                    {aviso.mensaje}
                </div>
            )}

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
                                        {getNombreCliente(v)}
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
                                            onClick={() => abrirEliminar(v)}
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

            {/* Modal Crear/Editar */}
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

            {/* Modal Confirmar Eliminar */}
            <ModalConfirmacion
                abierto={modalEliminar}
                onCerrar={cerrarEliminar}
                onConfirmar={confirmarEliminar}
                titulo="Eliminar vehículo"
                mensaje={
                    vehiculoEliminar
                        ? `¿Estás seguro de eliminar el vehículo con placa "${vehiculoEliminar.placa}"? Esta acción desactivará el registro.`
                        : ''
                }
                textoConfirmar="Sí, eliminar"
                variante="danger"
                cargando={eliminando}
            />
        </div>
    );
}