import { useState, useEffect } from 'react';
import * as clienteApi from '../../api/cliente.api';
import Modal from '../../components/Modal';
import ModalConfirmacion from '../../components/ModalConfirmacion';
import ClienteForm from './ClienteForm';

export default function Clientes() {
    const [clientes, setClientes]   = useState([]);
    const [busqueda, setBusqueda]   = useState('');
    const [cargando, setCargando]   = useState(true);
    const [error, setError]         = useState('');

    // Modal crear/editar
    const [modalAbierto, setModalAbierto] = useState(false);
    const [clienteEditar, setClienteEditar] = useState(null);

    // Modal eliminar
    const [modalEliminar, setModalEliminar]     = useState(false);
    const [clienteEliminar, setClienteEliminar] = useState(null);
    const [eliminando, setEliminando]           = useState(false);

    // Aviso
    const [aviso, setAviso] = useState(null);

    useEffect(() => {
        cargarClientes();
    }, []);

    useEffect(() => {
        if (busqueda.trim() === '') {
            cargarClientes();
            return;
        }
        const timer = setTimeout(() => buscar(busqueda.trim()), 500);
        return () => clearTimeout(timer);
    }, [busqueda]);

    // Ocultar aviso automáticamente a los 3 segundos
    useEffect(() => {
        if (!aviso) return;
        const timer = setTimeout(() => setAviso(null), 3000);
        return () => clearTimeout(timer);
    }, [aviso]);

    const cargarClientes = async () => {
        setCargando(true);
        setError('');
        try {
            const data = await clienteApi.listar();
            setClientes(data);
        } catch (err) {
            setError(err.response?.data?.mensaje || 'Error al cargar clientes');
        } finally {
            setCargando(false);
        }
    };

    const buscar = async (texto) => {
        setCargando(true);
        setError('');
        try {
            if (/^\d+$/.test(texto)) {
                const resultado = await clienteApi.buscarPorDocumento(texto);
                setClientes(resultado ? [resultado] : []);
            } else {
                const resultado = await clienteApi.buscarPorNombre(texto);
                setClientes(resultado);
            }
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
        setClienteEditar(null);
        setModalAbierto(true);
    };

    const abrirEditar = (cliente) => {
        setClienteEditar(cliente);
        setModalAbierto(true);
    };

    const cerrarModal = () => {
        setModalAbierto(false);
        setClienteEditar(null);
    };

    const handleGuardado = () => {
        cerrarModal();
        setBusqueda('');
        cargarClientes();
        setAviso({ tipo: 'success', mensaje: 'Cliente guardado correctamente' });
    };

    // ------------------------------------------------------------
    // Modal Eliminar
    // ------------------------------------------------------------
    const abrirEliminar = (cliente) => {
        setClienteEliminar(cliente);
        setModalEliminar(true);
    };

    const cerrarEliminar = () => {
        setModalEliminar(false);
        setClienteEliminar(null);
    };

    const confirmarEliminar = async () => {
        if (!clienteEliminar) return;

        setEliminando(true);
        try {
            await clienteApi.eliminar(clienteEliminar.id_cliente);
            cerrarEliminar();
            cargarClientes();
            setAviso({ tipo: 'success', mensaje: 'Cliente eliminado correctamente' });
        } catch (err) {
            setError(err.response?.data?.mensaje || 'Error al eliminar cliente');
            cerrarEliminar();
        } finally {
            setEliminando(false);
        }
    };

    // ------------------------------------------------------------
    // Helpers
    // ------------------------------------------------------------
    const getNombre = (c) => {
        if (c.tipo_persona === 'JURIDICA') return c.razon_social || '—';
        return `${c.nombres || ''} ${c.apellidos || ''}`.trim() || '—';
    };

    const getDocumento = (c) =>
        c.tipo_persona === 'JURIDICA' ? c.ruc : c.dni;

    return (
        <div>
            {/* Encabezado */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Clientes</h1>
                    <p className="text-gray-500 mt-1">
                        Gestión de clientes naturales y jurídicos
                    </p>
                </div>
                <button
                    onClick={abrirNuevo}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg transition"
                >
                    + Nuevo Cliente
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

            {/* Barra de búsqueda */}
            <div className="bg-white rounded-lg shadow p-4 mb-6">
                <input
                    type="text"
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    placeholder="🔍 Buscar por DNI, RUC, nombre o razón social..."
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
                    {busqueda ? 'Buscando...' : 'Cargando clientes...'}
                </div>
            )}

            {!cargando && clientes.length === 0 && (
                <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
                    {busqueda
                        ? `No se encontraron clientes para "${busqueda}".`
                        : 'No hay clientes registrados.'}
                </div>
            )}

            {!cargando && clientes.length > 0 && (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Tipo</th>
                                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Documento</th>
                                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Nombre / Razón Social</th>
                                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Teléfono</th>
                                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Correo</th>
                                <th className="text-right px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {clientes.map((c) => (
                                <tr key={c.id_cliente} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                            c.tipo_persona === 'NATURAL'
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-blue-100 text-blue-700'
                                        }`}>
                                            {c.tipo_persona}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                                        {getDocumento(c)}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-800 font-medium">
                                        {getNombre(c)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                        {c.telefono || '—'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                        {c.correo || '—'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm space-x-2">
                                        <button
                                            className="text-blue-600 hover:text-blue-800 font-medium"
                                            onClick={() => abrirEditar(c)}
                                        >
                                            Editar
                                        </button>
                                        <button
                                            className="text-red-600 hover:text-red-800 font-medium"
                                            onClick={() => abrirEliminar(c)}
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

            {!cargando && clientes.length > 0 && (
                <p className="text-sm text-gray-500 mt-4">
                    {busqueda
                        ? `Resultados: ${clientes.length}`
                        : `Total: ${clientes.length} cliente${clientes.length !== 1 ? 's' : ''}`}
                </p>
            )}

            {/* MODAL: Crear/Editar */}
            <Modal
                abierto={modalAbierto}
                onCerrar={cerrarModal}
                titulo={clienteEditar ? 'Editar Cliente' : 'Nuevo Cliente'}
                size="lg"
            >
                <ClienteForm
                    cliente={clienteEditar}
                    onGuardado={handleGuardado}
                    onCancelar={cerrarModal}
                />
            </Modal>

            {/* MODAL: Confirmar Eliminar */}
            <ModalConfirmacion
                abierto={modalEliminar}
                onCerrar={cerrarEliminar}
                onConfirmar={confirmarEliminar}
                titulo="Eliminar cliente"
                mensaje={
                    clienteEliminar
                        ? `¿Estás seguro de eliminar a "${getNombre(clienteEliminar)}" (${getDocumento(clienteEliminar)})? Esta acción desactivará al cliente.`
                        : ''
                }
                textoConfirmar="Sí, eliminar"
                variante="danger"
                cargando={eliminando}
            />
        </div>
    );
}