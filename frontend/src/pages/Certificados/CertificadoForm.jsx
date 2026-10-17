import { useState, useEffect } from 'react';
import * as certificadoApi from '../../api/certificado.api';
import * as vehiculoApi from '../../api/vehiculo.api';
import * as clienteApi from '../../api/cliente.api';
import * as catalogosApi from '../../api/catalogos.api';

const TIPOS = [
    { value: 'MODIFICACION', label: 'Modificación', icon: '🔧', desc: 'Cambio de características del vehículo' },
    { value: 'BONIFICACION', label: 'Bonificación', icon: '💎', desc: 'Certificado de bonificación según RD 3336-2006' },
    { value: 'MONTAJE',      label: 'Montaje',      icon: '🔩', desc: 'Montaje de carrocería u otro componente' },
    { value: 'FABRICACION',  label: 'Fabricación',  icon: '🏭', desc: 'Certificado de fabricación' },
];

const ACCIONES_MOD = [
    { value: 'MODIFICAR',   label: 'MODIFICAR',   color: 'bg-blue-100 text-blue-700' },
    { value: 'INCORPORAR',  label: 'INCORPORAR',  color: 'bg-green-100 text-green-700' },
    { value: 'ADECUAR',     label: 'ADECUAR',     color: 'bg-purple-100 text-purple-700' },
    { value: 'RECTIFICAR',  label: 'RECTIFICAR',  color: 'bg-orange-100 text-orange-700' },
];

const formInicial = {
    tipo_certificado: '',
    id_vehiculo: '',
    id_cliente: '',
    id_emisor: '',
    observaciones_generales: '',
    observaciones: [''],
    modificaciones: [{ accion: 'MODIFICAR', campo_modificado: '', valor_nuevo: '' }],
    bonificacion: {
        categoria: '', vin_serie: '', marca: '', modelo: '', anio_modelo: '',
        numero_motor: '', numero_ejes: '', numero_ruedas: '',
        distancia_ejes_m: '', distancia_kingpin_m: '',
        ciudad_emision: 'LIMA', fecha_emision_doc: '',
        observaciones: '', ejes: []
    }
};

export default function CertificadoForm({ onGuardado, onCancelar }) {
    const [form, setForm]               = useState(formInicial);
    const [error, setError]             = useState('');
    const [guardando, setGuardando]     = useState(false);

    const [emisores, setEmisores]             = useState([]);
    const [tiposSuspension, setTiposSuspension]   = useState([]);
    const [clasesNeumatico, setClasesNeumatico]   = useState([]);

    // Búsqueda de vehículo
    const [busquedaPlaca, setBusquedaPlaca]         = useState('');
    const [resultadosVehiculo, setResultadosVehiculo] = useState([]);
    const [vehiculoSeleccionado, setVehiculoSeleccionado] = useState(null);
    const [buscandoVehiculo, setBuscandoVehiculo]   = useState(false);

    // ------------------------------------------------------------
    // Cargar catálogos
    // ------------------------------------------------------------
    useEffect(() => {
        Promise.all([
            catalogosApi.listarEmisores(),
            catalogosApi.listarTiposSuspension(),
            catalogosApi.listarClasesNeumatico(),
        ]).then(([emi, susp, cla]) => {
            setEmisores(emi);
            setTiposSuspension(susp);
            setClasesNeumatico(cla);
            if (emi.length > 0) {
                setForm((prev) => ({ ...prev, id_emisor: emi[0].id_emisor }));
            }
        }).catch((err) => {
            console.error('Error cargando catálogos:', err);
            setError('Error al cargar catálogos');
        });
    }, []);

    // ------------------------------------------------------------
    // Buscar vehículo por placa (debounce)
    // ------------------------------------------------------------
    useEffect(() => {
        if (busquedaPlaca.trim().length < 1) {
            setResultadosVehiculo([]);
            return;
        }
        const timer = setTimeout(() => buscarVehiculo(busquedaPlaca.trim()), 400);
        return () => clearTimeout(timer);
    }, [busquedaPlaca]);

    const buscarVehiculo = async (texto) => {
        setBuscandoVehiculo(true);
        try {
            const data = await vehiculoApi.buscarPorPlaca(texto.toUpperCase());
            setResultadosVehiculo(data);
        } catch (err) {
            console.error('Error buscando vehículo:', err);
            setResultadosVehiculo([]);
        } finally {
            setBuscandoVehiculo(false);
        }
    };

    // ------------------------------------------------------------
    // Seleccionar vehículo → auto-completar cliente
    // ------------------------------------------------------------
    const seleccionarVehiculo = (v) => {
        setVehiculoSeleccionado(v);
        setBusquedaPlaca('');
        setResultadosVehiculo([]);

        setForm((prev) => ({
            ...prev,
            id_vehiculo: v.id_vehiculo,
            id_cliente: v.id_cliente,
            // Si es bonificación, autocompletar campos
            bonificacion: {
                ...prev.bonificacion,
                categoria: v.categoria || '',
                vin_serie: v.numero_vin || '',
                marca: v.marca || '',
                modelo: v.modelo || '',
                anio_modelo: v.anio_modelo || '',
                numero_ejes: v.ejes || '',
                numero_ruedas: v.ruedas || ''
            }
        }));
    };

    // ------------------------------------------------------------
    // Handlers generales
    // ------------------------------------------------------------
    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleBonif = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({
            ...prev,
            bonificacion: { ...prev.bonificacion, [name]: value }
        }));
    };

    // ------------------------------------------------------------
    // Modificaciones
    // ------------------------------------------------------------
    const agregarModificacion = () => {
    setForm((prev) => ({
        ...prev,
        modificaciones: [
            ...prev.modificaciones,
            { accion: 'MODIFICAR', campo_modificado: '', valor_nuevo: '' }
        ]
    }));
};

    const eliminarModificacion = (index) => {
        setForm((prev) => ({
            ...prev,
            modificaciones: prev.modificaciones.filter((_, i) => i !== index)
        }));
    };

    const handleModificacion = (index, campo, valor) => {
        setForm((prev) => {
            const nuevos = [...prev.modificaciones];
            nuevos[index][campo] = valor;
            return { ...prev, modificaciones: nuevos };
        });
    };

    // ------------------------------------------------------------
    // Observaciones
    // ------------------------------------------------------------
    const agregarObservacion = () => {
        setForm((prev) => ({ ...prev, observaciones: [...prev.observaciones, ''] }));
    };

    const eliminarObservacion = (index) => {
        setForm((prev) => ({
            ...prev,
            observaciones: prev.observaciones.filter((_, i) => i !== index)
        }));
    };

    const handleObservacion = (index, valor) => {
        setForm((prev) => {
            const nuevas = [...prev.observaciones];
            nuevas[index] = valor;
            return { ...prev, observaciones: nuevas };
        });
    };

    // ------------------------------------------------------------
    // Ejes (bonificación)
    // ------------------------------------------------------------
    const agregarEje = () => {
        setForm((prev) => ({
            ...prev,
            bonificacion: {
                ...prev.bonificacion,
                ejes: [
                    ...prev.bonificacion.ejes,
                    {
                        orden: prev.bonificacion.ejes.length + 1,
                        tipo_rodada: '',
                        cod_tipo_suspension: '',
                        capacidad_eje_kg: '',
                        capacidad_suspension_kg: '',
                        capacidad_neumatico_kg: '',
                        medida_aro: '',
                        medida_neumatico: '',
                        cod_clase_neumatico: ''
                    }
                ]
            }
        }));
    };

    const eliminarEje = (index) => {
        setForm((prev) => ({
            ...prev,
            bonificacion: {
                ...prev.bonificacion,
                ejes: prev.bonificacion.ejes
                    .filter((_, i) => i !== index)
                    .map((e, i) => ({ ...e, orden: i + 1 }))
            }
        }));
    };

    const handleEje = (index, campo, valor) => {
        setForm((prev) => {
            const nuevos = [...prev.bonificacion.ejes];
            nuevos[index][campo] = valor;
            return {
                ...prev,
                bonificacion: { ...prev.bonificacion, ejes: nuevos }
            };
        });
    };

    // ------------------------------------------------------------
    // Validar y guardar
    // ------------------------------------------------------------
    const validar = () => {
        if (!form.tipo_certificado) throw new Error('Debe seleccionar un tipo de certificado');
        if (!form.id_vehiculo)      throw new Error('Debe seleccionar un vehículo');
        if (!form.id_cliente)       throw new Error('Debe seleccionar un cliente');
        if (!form.id_emisor)        throw new Error('Debe seleccionar un emisor');

        if (form.tipo_certificado === 'MODIFICACION') {
            const validas = form.modificaciones.filter(m => m.campo_modificado && m.valor_nuevo);
            if (validas.length === 0) {
                throw new Error('Debe ingresar al menos una modificación con campo y valor nuevo');
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            validar();
            setGuardando(true);

            const payload = {
                tipo_certificado: form.tipo_certificado,
                id_vehiculo: form.id_vehiculo,
                id_cliente: form.id_cliente,
                id_emisor: form.id_emisor,
                estado: 'EMITIDO',
                observaciones_generales: form.observaciones_generales || null,
                observaciones: form.observaciones.filter(o => o.trim() !== ''),
            };

            if (form.tipo_certificado === 'MODIFICACION') {
                payload.modificaciones = form.modificaciones.filter(m => m.campo_modificado && m.valor_nuevo);
            }

            if (form.tipo_certificado === 'BONIFICACION') {
                payload.bonificacion = {
                    ...form.bonificacion,
                    ejes: form.bonificacion.ejes.filter(e => e.orden)
                };
            }

            if (form.tipo_certificado === 'MONTAJE')     payload.montaje = {};
            if (form.tipo_certificado === 'FABRICACION') payload.fabricacion = {};

            await certificadoApi.crear(payload);
            onGuardado();
        } catch (err) {
            setError(err.response?.data?.mensaje || err.message);
        } finally {
            setGuardando(false);
        }
    };

    // ------------------------------------------------------------
    // Render
    // ------------------------------------------------------------
    return (
        <form onSubmit={handleSubmit} className="space-y-6">

            {/* 1. TIPO */}
            <section>
                <h3 className="text-sm font-bold text-gray-800 uppercase mb-3 pb-2 border-b border-gray-200">
                    1. Tipo de Certificado
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {TIPOS.map((t) => (
                        <button
                            key={t.value}
                            type="button"
                            onClick={() => setForm(prev => ({ ...prev, tipo_certificado: t.value }))}
                            className={`p-4 rounded-lg border-2 transition text-left ${
                                form.tipo_certificado === t.value
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                            }`}
                        >
                            <div className="text-3xl mb-2">{t.icon}</div>
                            <div className="font-bold text-sm text-gray-800">{t.label}</div>
                            <div className="text-xs text-gray-500 mt-1">{t.desc}</div>
                        </button>
                    ))}
                </div>
            </section>

            {/* 2. DATOS GENERALES */}
            {form.tipo_certificado && (
                <section>
                    <h3 className="text-sm font-bold text-gray-800 uppercase mb-3 pb-2 border-b border-gray-200">
                        2. Datos Generales
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                        {/* BUSCADOR DE VEHÍCULO */}
                        <div className="md:col-span-2">
                            <label className="block text-xs font-medium text-gray-700 mb-1">Vehículo *</label>
                            {vehiculoSeleccionado ? (
                                <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                                    <div>
                                        <div className="font-bold text-blue-800 font-mono">{vehiculoSeleccionado.placa}</div>
                                        <div className="text-xs text-blue-600">
                                            {vehiculoSeleccionado.marca || ''} {vehiculoSeleccionado.modelo || ''} — {vehiculoSeleccionado.numero_vin}
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setVehiculoSeleccionado(null);
                                            setForm(prev => ({ ...prev, id_vehiculo: '', id_cliente: '' }));
                                        }}
                                        className="text-red-600 hover:text-red-800 font-bold text-lg"
                                    >
                                        ×
                                    </button>
                                </div>
                            ) : (
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={busquedaPlaca}
                                        onChange={(e) => setBusquedaPlaca(e.target.value.toUpperCase())}
                                        placeholder="🔍 Escriba la placa (ej: TCJ-892)..."
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    {buscandoVehiculo && (
                                        <div className="absolute right-3 top-2.5 text-xs text-gray-400">Buscando...</div>
                                    )}

                                    {/* Resultados */}
                                    {resultadosVehiculo.length > 0 && (
                                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                                            {resultadosVehiculo.map((v) => (
                                                <button
                                                    key={v.id_vehiculo}
                                                    type="button"
                                                    onClick={() => seleccionarVehiculo(v)}
                                                    className="w-full text-left px-3 py-2 hover:bg-blue-50 border-b border-gray-100 last:border-0"
                                                >
                                                    <div className="font-bold text-blue-700 font-mono text-sm">{v.placa}</div>
                                                    <div className="text-xs text-gray-600">
                                                        {v.marca || ''} {v.modelo || ''} — {v.numero_vin}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {v.razon_social || `${v.nombres || ''} ${v.apellidos || ''}`}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {busquedaPlaca.length >= 2 && !buscandoVehiculo && resultadosVehiculo.length === 0 && (
                                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow p-3 text-sm text-gray-500">
                                            No se encontraron vehículos con esa placa.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* EMISOR */}
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Emisor *</label>
                            <select
                                name="id_emisor"
                                value={form.id_emisor}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                            >
                                <option value="">-- Seleccionar emisor --</option>
                                {emisores.map((e) => (
                                    <option key={e.id_emisor} value={e.id_emisor}>{e.razon_social}</option>
                                ))}
                            </select>
                        </div>

                        {/* CLIENTE (auto-completado, solo lectura) */}
                        <div className="md:col-span-3">
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                Cliente * <span className="text-gray-400 font-normal">(auto-completado desde el vehículo)</span>
                            </label>
                            {vehiculoSeleccionado ? (
                                <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800">
                                    {vehiculoSeleccionado.razon_social
                                        || `${vehiculoSeleccionado.nombres || ''} ${vehiculoSeleccionado.apellidos || ''}`.trim()
                                        || '—'}
                                    <span className="ml-2 text-xs text-gray-500">
                                        ({vehiculoSeleccionado.tipo_persona})
                                    </span>
                                </div>
                            ) : (
                                <div className="bg-gray-100 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-400 italic">
                                    Seleccione un vehículo para auto-completar
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            )}

            {/* 3. MODIFICACIONES */}
            {form.tipo_certificado === 'MODIFICACION' && (
                <section>
                    <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-200">
                        <h3 className="text-sm font-bold text-gray-800 uppercase">
                            3. Modificaciones
                        </h3>
                        <button
                            type="button"
                            onClick={agregarModificacion}
                            className="text-sm bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg font-medium"
                        >
                            + Agregar campo a modificar
                        </button>
                    </div>

                    <p className="text-xs text-gray-500 mb-3">
                        Agregue una fila por cada característica a modificar (peso, color, motor, etc.).
                    </p>

                    <div className="space-y-3">
                        {form.modificaciones.map((m, idx) => (
                            <div key={idx} className="bg-gray-50 rounded-lg p-3">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-bold text-gray-600">#{idx + 1}</span>
                                    {form.modificaciones.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => eliminarModificacion(idx)}
                                            className="text-red-600 hover:text-red-800 text-xs font-medium"
                                        >
                                            ✕ Quitar
                                        </button>
                                    )}
                                </div>

                                <div className="grid grid-cols-12 gap-2">
                                    {/* Acción */}
                                    <div className="col-span-12 md:col-span-2">
                                        <label className="block text-xs text-gray-600 mb-1">Acción</label>
                                        <select
                                            value={m.accion}
                                            onChange={(e) => handleModificacion(idx, 'accion', e.target.value)}
                                            className="w-full px-2 py-2 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            {ACCIONES_MOD.map(a => (
                                                <option key={a.value} value={a.value}>{a.label}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Campo */}
                                    <div className="col-span-12 md:col-span-4">
                                        <label className="block text-xs text-gray-600 mb-1">Característica</label>
                                        <input
                                            type="text"
                                            value={m.campo_modificado}
                                            onChange={(e) => handleModificacion(idx, 'campo_modificado', e.target.value)}
                                            placeholder="Ej: Peso Neto, Color, N° Motor"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    {/* Valor nuevo (lo que saldrá en el certificado) */}
                                    <div className="col-span-12 md:col-span-6">
                                        <label className="block text-xs text-gray-600 mb-1">
                                            Valor a registrar <span className="text-gray-400">(el que aparecerá en el certificado)</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={m.valor_nuevo}
                                            onChange={(e) => handleModificacion(idx, 'valor_nuevo', e.target.value)}
                                            placeholder="Ej: 8,800 Tn"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                 
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* BONIFICACIÓN (sin cambios) */}
            {form.tipo_certificado === 'BONIFICACION' && (
                <section>
                    <h3 className="text-sm font-bold text-gray-800 uppercase mb-3 pb-2 border-b border-gray-200">
                        3. Datos de Bonificación
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Categoría</label>
                            <input type="text" name="categoria" value={form.bonificacion.categoria} onChange={handleBonif}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">VIN / Serie</label>
                            <input type="text" name="vin_serie" value={form.bonificacion.vin_serie} onChange={handleBonif}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Marca</label>
                            <input type="text" name="marca" value={form.bonificacion.marca} onChange={handleBonif}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Modelo</label>
                            <input type="text" name="modelo" value={form.bonificacion.modelo} onChange={handleBonif}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Año Modelo</label>
                            <input type="text" name="anio_modelo" value={form.bonificacion.anio_modelo} onChange={handleBonif}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">N° Motor</label>
                            <input type="text" name="numero_motor" value={form.bonificacion.numero_motor} onChange={handleBonif}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">N° Ejes</label>
                            <input type="text" name="numero_ejes" value={form.bonificacion.numero_ejes} onChange={handleBonif}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">N° Ruedas</label>
                            <input type="text" name="numero_ruedas" value={form.bonificacion.numero_ruedas} onChange={handleBonif}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Distancia entre ejes (m)</label>
                            <input type="text" name="distancia_ejes_m" value={form.bonificacion.distancia_ejes_m} onChange={handleBonif}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Distancia Kingpin (m)</label>
                            <input type="text" name="distancia_kingpin_m" value={form.bonificacion.distancia_kingpin_m} onChange={handleBonif}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Ciudad emisión</label>
                            <input type="text" name="ciudad_emision" value={form.bonificacion.ciudad_emision} onChange={handleBonif}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Fecha emisión documento</label>
                            <input type="date" name="fecha_emision_doc" value={form.bonificacion.fecha_emision_doc} onChange={handleBonif}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                    </div>

                    <div className="mt-6">
                        <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-200">
                            <h4 className="text-sm font-bold text-gray-800 uppercase">Detalle por eje</h4>
                            <button
                                type="button"
                                onClick={agregarEje}
                                className="text-sm bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg font-medium"
                            >
                                + Agregar eje
                            </button>
                        </div>

                        {form.bonificacion.ejes.length === 0 && (
                            <p className="text-sm text-gray-500 italic">Sin ejes registrados.</p>
                        )}

                        {form.bonificacion.ejes.map((e, idx) => (
                            <div key={idx} className="bg-gray-50 rounded-lg p-3 mb-3">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="font-bold text-sm text-gray-700">Eje #{e.orden}</span>
                                    <button
                                        type="button"
                                        onClick={() => eliminarEje(idx)}
                                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                                    >
                                        ✕ Quitar
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                    <input type="text" placeholder="Rodada (RD/RS)" value={e.tipo_rodada}
                                        onChange={(ev) => handleEje(idx, 'tipo_rodada', ev.target.value)}
                                        className="px-2 py-1 border border-gray-300 rounded text-xs" />
                                    <select value={e.cod_tipo_suspension}
                                        onChange={(ev) => handleEje(idx, 'cod_tipo_suspension', ev.target.value)}
                                        className="px-2 py-1 border border-gray-300 rounded text-xs bg-white">
                                        <option value="">Suspensión...</option>
                                        {tiposSuspension.map(s => <option key={s.codigo} value={s.codigo}>{s.nombre}</option>)}
                                    </select>
                                    <input type="text" placeholder="Cap. eje (kg)" value={e.capacidad_eje_kg}
                                        onChange={(ev) => handleEje(idx, 'capacidad_eje_kg', ev.target.value)}
                                        className="px-2 py-1 border border-gray-300 rounded text-xs" />
                                    <input type="text" placeholder="Cap. susp (kg)" value={e.capacidad_suspension_kg}
                                        onChange={(ev) => handleEje(idx, 'capacidad_suspension_kg', ev.target.value)}
                                        className="px-2 py-1 border border-gray-300 rounded text-xs" />
                                    <input type="text" placeholder="Cap. neum (kg)" value={e.capacidad_neumatico_kg}
                                        onChange={(ev) => handleEje(idx, 'capacidad_neumatico_kg', ev.target.value)}
                                        className="px-2 py-1 border border-gray-300 rounded text-xs" />
                                    <input type="text" placeholder="Medida aro" value={e.medida_aro}
                                        onChange={(ev) => handleEje(idx, 'medida_aro', ev.target.value)}
                                        className="px-2 py-1 border border-gray-300 rounded text-xs" />
                                    <input type="text" placeholder="Medida neumático" value={e.medida_neumatico}
                                        onChange={(ev) => handleEje(idx, 'medida_neumatico', ev.target.value)}
                                        className="px-2 py-1 border border-gray-300 rounded text-xs" />
                                    <select value={e.cod_clase_neumatico}
                                        onChange={(ev) => handleEje(idx, 'cod_clase_neumatico', ev.target.value)}
                                        className="px-2 py-1 border border-gray-300 rounded text-xs bg-white">
                                        <option value="">Clase...</option>
                                        {clasesNeumatico.map(c => <option key={c.codigo} value={c.codigo}>{c.nombre}</option>)}
                                    </select>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* MONTAJE / FABRICACION */}
            {(form.tipo_certificado === 'MONTAJE' || form.tipo_certificado === 'FABRICACION') && (
                <section>
                    <h3 className="text-sm font-bold text-gray-800 uppercase mb-3 pb-2 border-b border-gray-200">
                        3. Datos Específicos
                    </h3>
                    <p className="text-sm text-gray-500 italic">
                        Este tipo de certificado se guarda con datos básicos.
                    </p>
                </section>
            )}

            {/* 4. OBSERVACIONES */}
            {form.tipo_certificado && (
                <section>
                    <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-200">
                        <h3 className="text-sm font-bold text-gray-800 uppercase">4. Observaciones</h3>
                        <button
                            type="button"
                            onClick={agregarObservacion}
                            className="text-sm bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg font-medium"
                        >
                            + Agregar observación
                        </button>
                    </div>

                    <div className="mb-3">
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                            Observaciones generales (opcional)
                        </label>
                        <textarea
                            name="observaciones_generales"
                            value={form.observaciones_generales}
                            onChange={handleChange}
                            rows={2}
                            placeholder="Comentarios generales del certificado..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {form.observaciones.map((o, idx) => (
                        <div key={idx} className="flex gap-2 mb-2">
                            <span className="font-mono text-sm text-gray-500 pt-2 w-8">{idx + 1}.</span>
                            <input
                                type="text"
                                value={o}
                                onChange={(e) => handleObservacion(idx, e.target.value)}
                                placeholder="Ej: SE RESPETA LOS PARÁMETROS DEL FABRICANTE..."
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            {form.observaciones.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => eliminarObservacion(idx)}
                                    className="px-3 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg text-sm font-medium"
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                    ))}
                </section>
            )}

            {error && (
                <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
                    {error}
                </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                    type="button"
                    onClick={onCancelar}
                    disabled={guardando}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    disabled={guardando || !form.tipo_certificado}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                    {guardando ? 'Guardando...' : 'Crear Certificado'}
                </button>
            </div>
        </form>
    );
}