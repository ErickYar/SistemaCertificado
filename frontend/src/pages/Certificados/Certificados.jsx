import { useState, useEffect } from 'react';
import * as certificadoApi from '../../api/certificado.api';
import Modal from '../../components/Modal';
import CertificadoForm from './CertificadoForm';
import CertificadoDetalle from './CertificadoDetalle';

const TIPOS = ['TODOS', 'MODIFICACION', 'MONTAJE', 'FABRICACION', 'BONIFICACION'];
const ESTADOS = ['TODOS', 'BORRADOR', 'EMITIDO', 'PAGADO', 'ENTREGADO', 'ANULADO'];

export default function Certificados() {
    const [certificados, setCertificados] = useState([]);
    const [busqueda, setBusqueda]         = useState('');
    const [filtroTipo, setFiltroTipo]     = useState('TODOS');
    const [filtroEstado, setFiltroEstado] = useState('TODOS');
    const [cargando, setCargando]         = useState(true);
    const [error, setError]               = useState('');
    const [aviso, setAviso]               = useState(null);

    // Modales
    const [modalAbierto, setModalAbierto] = useState(false);
    const [modalDetalle, setModalDetalle] = useState(false);
    const [certificadoSeleccionado, setCertificadoSeleccionado] = useState(null);
    const [cargandoDetalle, setCargandoDetalle] = useState(false);

    // Modal Cambiar Estado
    const [modalEstado, setModalEstado]         = useState(false);
    const [certificadoEstado, setCertificadoEstado] = useState(null);
    const [nuevoEstado, setNuevoEstado]         = useState('');
    const [guardandoEstado, setGuardandoEstado] = useState(false);
    const [montoPago, setMontoPago] = useState('');
    const [fechaPago, setFechaPago] = useState('');
    const [medioPago, setMedioPago] = useState('EFECTIVO');
    const [nroTransaccion, setNroTransaccion] = useState('');

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

    useEffect(() => {
        if (!aviso) return;
        const timer = setTimeout(() => setAviso(null), 3000);
        return () => clearTimeout(timer);
    }, [aviso]);

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

    const handleGuardado = () => {
        setModalAbierto(false);
        setBusqueda('');
        cargarCertificados();
        setAviso({ tipo: 'success', mensaje: 'Certificado creado correctamente' });
    };

    const abrirDetalle = async (id) => {
        setCargandoDetalle(true);
        setModalDetalle(true);
        try {
            const data = await certificadoApi.obtener(id);
            setCertificadoSeleccionado(data);
        } catch (err) {
            alert('Error al cargar el detalle: ' + err.message);
            setModalDetalle(false);
        } finally {
            setCargandoDetalle(false);
        }
    };

    const cerrarDetalle = () => {
        setModalDetalle(false);
        setCertificadoSeleccionado(null);
    };

    // --- HANDLERS DE CAMBIO DE ESTADO ---
    const abrirEstado = (cert) => {
        setCertificadoEstado(cert);
        setNuevoEstado(cert.estado);
        setMontoPago('');
        setFechaPago(new Date().toISOString().slice(0, 16)); // Fecha actual YYYY-MM-DDTHH:mm
        setMedioPago('EFECTIVO');
        setNroTransaccion('');
        setModalEstado(true);
    };

    const cerrarEstado = () => {
        setModalEstado(false);
        setCertificadoEstado(null);
    };

   const confirmarCambioEstado = async () => {
    if (!nuevoEstado || nuevoEstado === certificadoEstado.estado) return;

    // Validación para métodos que requieren número de operación
    if (nuevoEstado === 'PAGADO' && medioPago !== 'EFECTIVO' && !nroTransaccion) {
        alert('Por favor, ingrese el número de operación para ' + medioPago);
        return;
    }
    
    setGuardandoEstado(true);
    try {
        const payload = { estado: nuevoEstado };

        // Si es PAGADO, enviamos los datos del pago
        if (nuevoEstado === 'PAGADO') {
            payload.datosPago = {
                monto: parseFloat(montoPago) || 0,
                fecha_pago: fechaPago.replace('T', ' ') + ':00', // Formatear para MySQL
                medio_pago: medioPago,
                nro_transaccion: medioPago === 'EFECTIVO' ? null : nroTransaccion
            };
        }

        await certificadoApi.actualizarEstado(certificadoEstado.id_certificado, payload);
        cerrarEstado();
        cargarCertificados();
        setAviso({ tipo: 'success', mensaje: `Estado actualizado a ${nuevoEstado}` });
    } catch (err) {
        alert(err.response?.data?.mensaje || 'Error al actualizar estado');
    } finally {
        setGuardandoEstado(false);
    }
};

    // Filtros locales
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
        return <span className={`text-xs px-2 py-1 rounded-full font-medium ${estilos[tipo] || 'bg-gray-100'}`}>{tipo}</span>;
    };

    const getBadgeEstado = (estado) => {
        const estilos = {
            BORRADOR:  'bg-gray-100 text-gray-700',
            EMITIDO:   'bg-yellow-100 text-yellow-700',
            PAGADO:    'bg-green-100 text-green-700',
            ENTREGADO: 'bg-blue-100 text-blue-700',
            ANULADO:   'bg-red-100 text-red-700',
        };
        return <span className={`text-xs px-2 py-1 rounded-full font-medium ${estilos[estado] || 'bg-gray-100'}`}>{estado}</span>;
    };

    const formatearFecha = (f) => {
        if (!f) return '—';
        return new Date(f).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const getNombreCliente = (c) => c.razon_social || `${c.nombres || ''} ${c.apellidos || ''}`.trim() || '—';

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Certificados</h1>
                    <p className="text-gray-500 mt-1">Gestión de certificados vehiculares SUNARP</p>
                </div>
                <button onClick={() => setModalAbierto(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg transition">
                    + Nuevo Certificado
                </button>
            </div>

            {aviso && (
                <div className={`mb-4 px-4 py-3 rounded-lg border ${aviso.tipo === 'success' ? 'bg-green-100 border-green-400 text-green-700' : 'bg-red-100 border-red-400 text-red-700'}`}>
                    {aviso.mensaje}
                </div>
            )}

            <div className="bg-white rounded-lg shadow p-4 mb-4">
                <input
                    type="text"
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    placeholder="🔍 Buscar por N° certificado (26 000457), código control (SA-50-000686) o placa (ARQ-783)..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {busqueda && (
                    <button onClick={() => setBusqueda('')} className="text-sm text-blue-600 hover:text-blue-800 mt-2 font-medium">
                        ✕ Limpiar búsqueda
                    </button>
                )}
            </div>

            <div className="bg-white rounded-lg shadow p-4 mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Tipo de certificado</label>
                    <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white">
                        {TIPOS.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Estado</label>
                    <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white">
                        {ESTADOS.map((e) => <option key={e} value={e}>{e}</option>)}
                    </select>
                </div>
            </div>

            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4">{error}</div>}

            {cargando && <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">{busqueda ? 'Buscando...' : 'Cargando certificados...'}</div>}

            {!cargando && certificadosFiltrados.length === 0 && (
                <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
                    {busqueda ? `No se encontraron certificados para "${busqueda}".` : 'No hay certificados registrados.'}
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
                                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {certificadosFiltrados.map((c) => (
                                <tr key={c.id_certificado} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <div className="font-mono font-bold text-gray-800">{c.numero_certificado}</div>
                                        <div className="text-xs text-gray-500 font-mono">{c.codigo_control}</div>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">{getBadgeTipo(c.tipo_certificado)}</td>
                                    <td className="px-4 py-3 whitespace-nowrap">{getBadgeEstado(c.estado)}</td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded">{c.placa || '—'}</span>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-700 max-w-xs truncate">{getNombreCliente(c)}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm space-x-2">
                                        <button onClick={() => abrirDetalle(c.id_certificado)} className="text-blue-600 hover:text-blue-800 font-medium">Ver</button>
                                        <button onClick={() => abrirEstado(c)} className="text-green-600 hover:text-green-800 font-medium">Estado</button>
                                        <button onClick={() => alert('Próximamente: Eliminar')} className="text-red-600 hover:text-red-800 font-medium">Eliminar</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {!cargando && certificadosFiltrados.length > 0 && (
                <p className="text-sm text-gray-500 mt-4">
                    {busqueda ? `Resultados: ${certificadosFiltrados.length}` : `Total: ${certificadosFiltrados.length} certificado${certificadosFiltrados.length !== 1 ? 's' : ''}`}
                </p>
            )}

            {/* MODAL CREAR */}
            <Modal abierto={modalAbierto} onCerrar={() => setModalAbierto(false)} titulo="Nuevo Certificado" size="xl">
                <CertificadoForm onGuardado={handleGuardado} onCancelar={() => setModalAbierto(false)} />
            </Modal>

            {/* MODAL DETALLE */}
            <Modal abierto={modalDetalle} onCerrar={cerrarDetalle} titulo={`Detalle del Certificado ${certificadoSeleccionado?.numero_certificado || ''}`} size="xl">
                {cargandoDetalle || !certificadoSeleccionado ? (
                    <div className="p-8 text-center text-gray-500">Cargando información...</div>
                ) : (
                    <CertificadoDetalle certificado={certificadoSeleccionado} />
                )}
            </Modal>

            {/* MODAL CAMBIAR ESTADO */}
      <Modal abierto={modalEstado} onCerrar={cerrarEstado} titulo="Estado del Certificado" size="md">
    {certificadoEstado && (
        <div className="space-y-4">
            <div className="bg-gray-50 p-3 rounded-lg text-sm text-center">
                Certificado: <span className="font-bold font-mono">{certificadoEstado.numero_certificado}</span>
            </div>

            {/* 🚨 ALERTA DE YA PAGADO 🚨 */}
            {certificadoEstado.estado === 'PAGADO' && (
                <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg mb-4">
                    <div className="flex items-center">
                        <div className="flex-shrink-0 text-2xl">✅</div>
                        <div className="ml-3">
                            <p className="text-sm font-bold text-green-800">
                                Este certificado ya ha sido PAGADO.
                            </p>
                            <p className="text-xs text-green-700 mt-1">
                                El estado está bloqueado y no puede ser modificado.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Estado Actual</label>
                <select 
                    value={nuevoEstado} 
                    onChange={(e) => setNuevoEstado(e.target.value)}
                    disabled={certificadoEstado.estado === 'PAGADO'} // 🔒 BLOQUEADO SI ESTÁ PAGADO
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
                >
                    <option value="BORRADOR">BORRADOR</option>
                    <option value="EMITIDO">EMITIDO</option>
                    <option value="PAGADO">PAGADO</option>
                    <option value="ENTREGADO">ENTREGADO</option>
                    <option value="ANULADO">ANULADO</option>
                </select>
            </div>

            {/* CAMPOS EXTRA SI SE SELECCIONA PAGADO Y AÚN NO LO ESTÁ */}
            {nuevoEstado === 'PAGADO' && certificadoEstado.estado !== 'PAGADO' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                    <h4 className="text-sm font-bold text-blue-800 mb-2">Datos del Pago</h4>
                    
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Monto (S/)</label>
                            <input type="number" step="0.01" value={montoPago} onChange={(e) => setMontoPago(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="0.00" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Fecha y Hora</label>
                            <input type="datetime-local" value={fechaPago} onChange={(e) => setFechaPago(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Medio de Pago</label>
                        <select value={medioPago} onChange={(e) => setMedioPago(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
                            <option value="EFECTIVO">EFECTIVO</option>
                            <option value="YAPE">YAPE</option>
                            <option value="PLIN">PLIN</option>
                            <option value="TRANSFERENCIA">TRANSFERENCIA</option>
                            <option value="DEPOSITO">DEPOSITO</option>
                            <option value="TARJETA">TARJETA</option>
                        </select>
                    </div>

                    {medioPago !== 'EFECTIVO' && (
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">N° de Operación *</label>
                            <input type="text" value={nroTransaccion} onChange={(e) => setNroTransaccion(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Ej: 12345678" />
                        </div>
                    )}
                </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 mt-6">
                <button 
                    onClick={cerrarEstado} 
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                    {certificadoEstado.estado === 'PAGADO' ? 'Cerrar' : 'Cancelar'}
                </button>
                
                {/* 🔒 OCULTAMOS O DESHABILITAMOS EL BOTÓN SI YA ESTÁ PAGADO */}
                {certificadoEstado.estado !== 'PAGADO' && (
                    <button 
                        onClick={confirmarCambioEstado} 
                        disabled={guardandoEstado || nuevoEstado === certificadoEstado.estado} 
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {guardandoEstado ? 'Guardando...' : 'Actualizar Estado'}
                    </button>
                )}
            </div>
        </div>
    )}
</Modal>
        </div>
    );
}