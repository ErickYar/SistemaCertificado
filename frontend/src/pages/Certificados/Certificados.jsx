import { useState, useEffect } from 'react';
import * as certificadoApi from '../../api/certificado.api';
import Modal from '../../components/Modal';
import CertificadoForm from './CertificadoForm';

const TIPOS = ['TODOS', 'MODIFICACION', 'MONTAJE', 'FABRICACION', 'BONIFICACION'];
const ESTADOS = ['TODOS', 'BORRADOR', 'EMITIDO', 'PAGADO', 'ENTREGADO', 'ANULADO'];

export default function Certificados() {
    const [certificados, setCertificados] = useState([]);
    const [busqueda, setBusqueda]         = useState('');
    const [filtroTipo, setFiltroTipo]     = useState('TODOS');
    const [filtroEstado, setFiltroEstado] = useState('TODOS');
    const [cargando, setCargando]         = useState(true);
    const [error, setError]               = useState('');
    const [modalAbierto, setModalAbierto] = useState(false);

    useEffect(() => {
        cargarCertificados();
    }, []);

    useEffect(() => {
        if (busqueda.trim() === '') {
            cargarCertificados();
            return;
        }
        const timer = setTimeout(() => buscar(busqueda.trim()), 500);
        return () => clearTimeout(timer);
    }, [busqueda]);

    const cargarCertificados = async () => {
        setCargando(true);
        setError('');
        try {
            const data = await certificadoApi.listar();
            setCertificados(data);
        } catch (err) {
            setError(err.response?.data?.mensaje || 'Error al cargar certificados');
        } finally {
            setCargando(false);
        }
    };

    const buscar = async (texto) => {
        setCargando(true);
        setError('');
        try {
            // Si es solo números o tiene formato de certificado (26 000457) → buscar por número
            // Si contiene guion → buscar por placa
            // Si tiene letras y guiones con formato SA- → buscar por código de control
            const filtros = {};

            if (texto.includes('-') && texto.toUpperCase().startsWith('SA')) {
                filtros.control = texto.toUpperCase();
            } else if (texto.includes('-')) {
                filtros.placa = texto.toUpperCase();
            } else {
                filtros.numero = texto;
            }

            const data = await certificadoApi.buscar(filtros);
            setCertificados(data);
        } catch (err) {
            setError(err.response?.data?.mensaje || 'Error en la búsqueda');
        } finally {
            setCargando(false);
        }
    };

    // Aplicar filtros locales de tipo y estado
    const certificadosFiltrados = certificados.filter((c) => {
        const pasaTipo   = filtroTipo === 'TODOS'   || c.tipo_certificado === filtroTipo;
        const pasaEstado = filtroEstado === 'TODOS' || c.estado === filtroEstado;
        return pasaTipo && pasaEstado;
    });

    const getBadgeTipo = (tipo) => {
        const estilos = {
            MODIFICACION: 'bg-blue-100 text-blue-700',
            MONTAJE:      'bg-purple-100 text-purple-700',
            FABRICACION:  'bg-orange-100 text-orange-700',
            BONIFICACION: 'bg-green-100 text-green-700',
        };
        return (
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${estilos[tipo] || 'bg-gray-100 text-gray-700'}`}>
                {tipo}
            </span>
        );
    };
const handleGuardado = () => {
    setModalAbierto(false);
    cargarCertificados();
};
    const getBadgeEstado = (estado) => {
        const estilos = {
            BORRADOR:  'bg-gray-100 text-gray-700',
            EMITIDO:   'bg-yellow-100 text-yellow-700',
            PAGADO:    'bg-green-100 text-green-700',
            ENTREGADO: 'bg-blue-100 text-blue-700',
            ANULADO:   'bg-red-100 text-red-700',
        };
        return (
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${estilos[estado] || 'bg-gray-100 text-gray-700'}`}>
                {estado}
            </span>
        );
    };

    const formatearFecha = (f) => {
        if (!f) return '—';
        return new Date(f).toLocaleDateString('es-PE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const getNombreCliente = (c) =>
        c.razon_social || `${c.nombres || ''} ${c.apellidos || ''}`.trim() || '—';

    return (
        <div>
            {/* Encabezado */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Certificados</h1>
                    <p className="text-gray-500 mt-1">
                        Gestión de certificados vehiculares SUNARP
                    </p>
                </div>
                <button
                     className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg transition"
                                onClick={() => setModalAbierto(true)}
>
                    + Nuevo Certificado
                </button>
            </div>

            {/* Búsqueda */}
            <div className="bg-white rounded-lg shadow p-4 mb-4">
                <input
                    type="text"
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    placeholder="🔍 Buscar por N° certificado (26 000457), código control (SA-50-000686) o placa (ARQ-783)..."
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

            {/* Filtros */}
            <div className="bg-white rounded-lg shadow p-4 mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Tipo de certificado</label>
                    <select
                        value={filtroTipo}
                        onChange={(e) => setFiltroTipo(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                        {TIPOS.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Estado</label>
                    <select
                        value={filtroEstado}
                        onChange={(e) => setFiltroEstado(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                        {ESTADOS.map((e) => <option key={e} value={e}>{e}</option>)}
                    </select>
                </div>
            </div>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4">
                    {error}
                </div>
            )}

            {cargando && (
                <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
                    {busqueda ? 'Buscando...' : 'Cargando certificados...'}
                </div>
            )}

            {!cargando && certificadosFiltrados.length === 0 && (
                <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
                    {busqueda
                        ? `No se encontraron certificados para "${busqueda}".`
                        : 'No hay certificados registrados.'}
                </div>
            )}

            {!cargando && certificadosFiltrados.length > 0 && (
                <div className="bg-white rounded-lg shadow overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">N° Certificado</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Tipo</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Estado</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Placa</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Cliente</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Fecha</th>
                                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {certificadosFiltrados.map((c) => (
                                <tr key={c.id_certificado} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <div className="font-mono font-bold text-gray-800">
                                            {c.numero_certificado}
                                        </div>
                                        <div className="text-xs text-gray-500 font-mono">
                                            {c.codigo_control}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        {getBadgeTipo(c.tipo_certificado)}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        {getBadgeEstado(c.estado)}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded">
                                            {c.placa || '—'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-700 max-w-xs truncate">
                                        {getNombreCliente(c)}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                        {formatearFecha(c.fecha_emision)}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm space-x-2">
                                        <button
                                            className="text-blue-600 hover:text-blue-800 font-medium"
                                            onClick={() => alert(`Ver certificado ${c.id_certificado}`)}
                                        >
                                            Ver
                                        </button>
                                        <button
                                            className="text-red-600 hover:text-red-800 font-medium"
                                            onClick={() => alert(`Eliminar certificado ${c.id_certificado}`)}
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

            {!cargando && certificadosFiltrados.length > 0 && (
                <p className="text-sm text-gray-500 mt-4">
                    {busqueda
                        ? `Resultados: ${certificadosFiltrados.length}`
                        : `Total: ${certificadosFiltrados.length} certificado${certificadosFiltrados.length !== 1 ? 's' : ''}`}
                </p>
            )}

            <Modal
    abierto={modalAbierto}
    onCerrar={() => setModalAbierto(false)}
    titulo="Nuevo Certificado"
    size="xl"
>
    <CertificadoForm
        onGuardado={handleGuardado}
        onCancelar={() => setModalAbierto(false)}
    />
</Modal>
        </div>
    );
}