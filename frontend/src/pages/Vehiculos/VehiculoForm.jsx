import { useState, useEffect } from 'react';
import * as vehiculoApi from '../../api/vehiculo.api';
import * as catalogosApi from '../../api/catalogos.api';
import * as clienteApi from '../../api/cliente.api';
import ModalPrompt from '../../components/ModalPrompt';

// ============================================================
// HELPERS (FUERA DEL COMPONENTE)
// ============================================================
const InputField = ({ label, name, type = 'text', placeholder, maxLength, onChange, value }) => (
    <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
        <input
            type={type}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            maxLength={maxLength}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
    </div>
);

// ============================================================
// ESTADO INICIAL
// ============================================================
const formInicial = {
    placa: '',
    numero_vin: '',
    numero_serie: '',
    id_categoria: '',
    id_marca: '',
    id_modelo: '',
    anio_fabricacion: '',
    anio_modelo: '',
    cod_color_1: '',
    cod_color_2: '',
    cod_color_3: '',
    id_carroceria: '',
    id_forma_rodamiento: '',
    longitud_m: '',
    ancho_m: '',
    altura_m: '',
    peso_bruto_tn: '',
    peso_neto_tn: '',
    carga_util_tn: '',
    asientos: '',
    pasajeros: '',
    ruedas: '',
    ejes: '',
    id_cliente: '',
    motor: {
        numero_motor: '',
        cod_combustible: '',
        cilindros: '',
        cilindrada: '',
        potencia_cv: '',
        potencia_rpm: '',
    }
};

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================
export default function VehiculoForm({ vehiculo, onGuardado, onCancelar }) {
    const esEdicion = !!vehiculo?.id_vehiculo;

    const [form, setForm]           = useState(formInicial);
    const [error, setError]         = useState('');
    const [guardando, setGuardando] = useState(false);

    // Catálogos
    const [categorias, setCategorias]             = useState([]);
    const [marcas, setMarcas]                     = useState([]);
    const [modelos, setModelos]                   = useState([]);
    const [colores, setColores]                   = useState([]);
    const [carrocerias, setCarrocerias]           = useState([]);
    const [formasRodamiento, setFormasRodamiento] = useState([]);
    const [combustibles, setCombustibles]         = useState([]);
    const [clientes, setClientes]                 = useState([]);
    const [busquedaCliente, setBusquedaCliente]   = useState('');

    // Modales
    const [modalMarca, setModalMarca]           = useState(false);
    const [modalModelo, setModalModelo]         = useState(false);
    const [guardandoMarca, setGuardandoMarca]   = useState(false);
    const [guardandoModelo, setGuardandoModelo] = useState(false);

    // ------------------------------------------------------------
    // Cargar catálogos
    // ------------------------------------------------------------
    useEffect(() => {
        Promise.all([
            catalogosApi.listarCategorias(),
            catalogosApi.listarMarcas(),
            catalogosApi.listarColores(),
            catalogosApi.listarFormasRodamiento(),
            catalogosApi.listarCombustibles(),
            clienteApi.listar(),
        ]).then(([cat, mar, col, rod, comb, cli]) => {
            setCategorias(cat.filter(c => ['L', 'M', 'N'].includes(c.grupo)));
            setMarcas(mar);
            setColores(col);
            setFormasRodamiento(rod);
            setCombustibles(comb);
            setClientes(cli);
        }).catch((err) => {
            console.error('Error cargando catálogos:', err);
            setError('Error al cargar catálogos');
        });
    }, []);

    // Cargar datos si es edición
    useEffect(() => {
        if (vehiculo) {
            setForm({
                ...formInicial,
                ...vehiculo,
                motor: {
                    numero_motor: vehiculo.numero_motor || '',
                    cod_combustible: vehiculo.cod_combustible || '',
                    cilindros: vehiculo.cilindros || '',
                    cilindrada: vehiculo.cilindrada || '',
                    potencia_cv: vehiculo.potencia_cv || '',
                    potencia_rpm: vehiculo.potencia_rpm || '',
                }
            });
        }
    }, [vehiculo]);

    // Cascada: marca → modelos
    useEffect(() => {
        if (!form.id_marca) {
            setModelos([]);
            return;
        }
        catalogosApi.listarModelosPorMarca(form.id_marca)
            .then(setModelos)
            .catch(console.error);
    }, [form.id_marca]);

    // Cascada: categoría → carrocerías
    useEffect(() => {
        if (!form.id_categoria) {
            setCarrocerias([]);
            return;
        }
        catalogosApi.listarCarrocerias(form.id_categoria)
            .then(setCarrocerias)
            .catch(console.error);
    }, [form.id_categoria]);

    // ------------------------------------------------------------
    // Handlers
    // ------------------------------------------------------------
    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => {
            const nuevo = { ...prev, [name]: value };
            // Si cambia la categoría, limpiar carrocería
            if (name === 'id_categoria') nuevo.id_carroceria = '';
            // Si cambia la marca, limpiar modelo
            if (name === 'id_marca') nuevo.id_modelo = '';
            return nuevo;
        });
    };

    const handleMotor = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({
            ...prev,
            motor: { ...prev.motor, [name]: value }
        }));
    };

    const handleNumero = (e) => {
        const { name, value } = e.target;
        const limpio = value.replace(/[^\d.]/g, '');
        setForm((prev) => ({ ...prev, [name]: limpio }));
    };

    const handleAnio = (e) => {
        const { name, value } = e.target;
        const limpio = value.replace(/\D/g, '').slice(0, 4);
        setForm((prev) => ({ ...prev, [name]: limpio }));
    };

    const handleEntero = (e) => {
        const { name, value } = e.target;
        const limpio = value.replace(/\D/g, '');
        setForm((prev) => ({ ...prev, [name]: limpio }));
    };

    // ------------------------------------------------------------
    // Crear marca
    // ------------------------------------------------------------
    const handleCrearMarca = async (nombre) => {
        setGuardandoMarca(true);
        try {
            const nueva = await catalogosApi.crearMarca(nombre);
            const lista = await catalogosApi.listarMarcas();
            setMarcas(lista);
            setForm((prev) => ({ ...prev, id_marca: nueva.id_marca, id_modelo: '' }));
            setModalMarca(false);
        } catch (err) {
            alert(err.response?.data?.mensaje || err.message);
        } finally {
            setGuardandoMarca(false);
        }
    };

    // ------------------------------------------------------------
    // Crear modelo
    // ------------------------------------------------------------
    const handleCrearModelo = async (nombre) => {
        if (!form.id_marca) {
            alert('Primero selecciona una marca');
            return;
        }
        setGuardandoModelo(true);
        try {
            const nuevo = await catalogosApi.crearModelo(form.id_marca, nombre);
            const lista = await catalogosApi.listarModelosPorMarca(form.id_marca);
            setModelos(lista);
            setForm((prev) => ({ ...prev, id_modelo: nuevo.id_modelo }));
            setModalModelo(false);
        } catch (err) {
            alert(err.response?.data?.mensaje || err.message);
        } finally {
            setGuardandoModelo(false);
        }
    };

    // Filtrar clientes
    const clientesFiltrados = busquedaCliente
        ? clientes.filter((c) => {
            const texto = busquedaCliente.toLowerCase();
            const nombre = c.tipo_persona === 'JURIDICA'
                ? c.razon_social || ''
                : `${c.nombres || ''} ${c.apellidos || ''}`;
            const doc = c.tipo_persona === 'JURIDICA' ? c.ruc : c.dni;
            return nombre.toLowerCase().includes(texto) || (doc || '').includes(texto);
        })
        : clientes;

    // ------------------------------------------------------------
    // Guardar
    // ------------------------------------------------------------
    const validar = () => {
        if (!form.placa.trim())      throw new Error('La placa es obligatoria');
        if (!form.numero_vin.trim()) throw new Error('El VIN es obligatorio');
        if (!form.id_cliente)        throw new Error('Debe seleccionar un propietario');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            validar();
            setGuardando(true);

            const limpiar = (val) => (val === '' || val === undefined ? null : val);

            const payload = {
                placa: limpiar(form.placa).toUpperCase(),
                numero_vin: limpiar(form.numero_vin).toUpperCase(),
                numero_serie: limpiar(form.numero_serie),
                id_categoria: limpiar(form.id_categoria),
                id_marca: limpiar(form.id_marca),
                id_modelo: limpiar(form.id_modelo),
                anio_fabricacion: limpiar(form.anio_fabricacion),
                anio_modelo: limpiar(form.anio_modelo),
                cod_color_1: limpiar(form.cod_color_1),
                cod_color_2: limpiar(form.cod_color_2),
                cod_color_3: limpiar(form.cod_color_3),
                id_carroceria: limpiar(form.id_carroceria),
                id_forma_rodamiento: limpiar(form.id_forma_rodamiento),
                longitud_m: limpiar(form.longitud_m),
                ancho_m: limpiar(form.ancho_m),
                altura_m: limpiar(form.altura_m),
                peso_bruto_tn: limpiar(form.peso_bruto_tn),
                peso_neto_tn: limpiar(form.peso_neto_tn),
                carga_util_tn: limpiar(form.carga_util_tn),
                asientos: limpiar(form.asientos),
                pasajeros: limpiar(form.pasajeros),
                ruedas: limpiar(form.ruedas),
                ejes: limpiar(form.ejes),
                id_cliente: form.id_cliente,
            };

            if (form.motor.numero_motor) {
                payload.motor = {
                    numero_motor: form.motor.numero_motor,
                    cod_combustible: form.motor.cod_combustible || 'SIN VALOR',
                    cilindros: limpiar(form.motor.cilindros),
                    cilindrada: limpiar(form.motor.cilindrada),
                    potencia_cv: limpiar(form.motor.potencia_cv),
                    potencia_rpm: limpiar(form.motor.potencia_rpm),
                };
            }

            if (esEdicion) {
                await vehiculoApi.actualizar(vehiculo.id_vehiculo, payload);
            } else {
                await vehiculoApi.crear(payload);
            }

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

            {/* SECCIÓN 1 */}
            <section>
                <h3 className="text-sm font-bold text-gray-800 uppercase mb-3 pb-2 border-b border-gray-200">
                    1. Identificación del Vehículo
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <InputField
                        label="Placa *"
                        name="placa"
                        placeholder="TCJ-892"
                        maxLength={10}
                        value={form.placa}
                        onChange={(e) => setForm(p => ({ ...p, placa: e.target.value.toUpperCase() }))}
                    />
                    <div className="md:col-span-2">
                        <InputField
                            label="Número de VIN *"
                            name="numero_vin"
                            placeholder="8AJBA3CD7P1738273"
                            maxLength={20}
                            value={form.numero_vin}
                            onChange={(e) => setForm(p => ({ ...p, numero_vin: e.target.value.toUpperCase() }))}
                        />
                    </div>
                    <div className="md:col-span-3">
                        <InputField
                            label="Número de Serie"
                            name="numero_serie"
                            placeholder="8AJBA3CD7P1738273"
                            maxLength={20}
                            value={form.numero_serie}
                            onChange={handleChange}
                        />
                    </div>
                </div>
            </section>

            {/* SECCIÓN 2 */}
            <section>
                <h3 className="text-sm font-bold text-gray-800 uppercase mb-3 pb-2 border-b border-gray-200">
                    2. Clasificación
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

                    {/* Categoría */}
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Categoría</label>
                        <select
                            name="id_categoria"
                            value={form.id_categoria}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        >
                            <option value="">-- Seleccionar --</option>
                            {categorias.map((c) => (
                                <option key={c.codigo} value={c.codigo}>{c.codigo}</option>
                            ))}
                        </select>
                    </div>

                    {/* Marca con botón + */}
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Marca</label>
                        <div className="flex gap-2">
                            <select
                                name="id_marca"
                                value={form.id_marca}
                                onChange={handleChange}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                            >
                                <option value="">-- Seleccionar --</option>
                                {marcas.map((m) => (
                                    <option key={m.id_marca} value={m.id_marca}>{m.nombre}</option>
                                ))}
                            </select>
                            <button
                                type="button"
                                onClick={() => setModalMarca(true)}
                                title="Agregar nueva marca"
                                className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold transition"
                            >
                                +
                            </button>
                        </div>
                    </div>

                    {/* Modelo con botón + */}
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Modelo</label>
                        <div className="flex gap-2">
                            <select
                                name="id_modelo"
                                value={form.id_modelo}
                                onChange={handleChange}
                                disabled={!form.id_marca}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                            >
                                <option value="">
                                    {!form.id_marca ? '-- Primero marca --' : '-- Seleccionar --'}
                                </option>
                                {modelos.map((m) => (
                                    <option key={m.id_modelo} value={m.id_modelo}>{m.nombre}</option>
                                ))}
                            </select>
                            <button
                                type="button"
                                onClick={() => form.id_marca ? setModalModelo(true) : alert('Selecciona una marca primero')}
                                title="Agregar nuevo modelo"
                                disabled={!form.id_marca}
                                className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                +
                            </button>
                        </div>
                    </div>

                    {/* Año Fabricación */}
                    <InputField
                        label="Año Fabricación"
                        name="anio_fabricacion"
                        placeholder="2023"
                        maxLength={4}
                        value={form.anio_fabricacion}
                        onChange={handleAnio}
                    />

                    {/* Año Modelo */}
                    <InputField
                        label="Año Modelo"
                        name="anio_modelo"
                        placeholder="2023"
                        maxLength={4}
                        value={form.anio_modelo}
                        onChange={handleAnio}
                    />

                    {/* Color 1 */}
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Color 1</label>
                        <select
                            name="cod_color_1"
                            value={form.cod_color_1}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        >
                            <option value="">-- Seleccionar --</option>
                            {colores.map((c) => (
                                <option key={c.codigo} value={c.codigo}>{c.nombre}</option>
                            ))}
                        </select>
                    </div>

                    {/* Color 2 */}
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Color 2</label>
                        <select
                            name="cod_color_2"
                            value={form.cod_color_2}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        >
                            <option value="">-- Seleccionar --</option>
                            {colores.map((c) => (
                                <option key={c.codigo} value={c.codigo}>{c.nombre}</option>
                            ))}
                        </select>
                    </div>

                    {/* Color 3 */}
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Color 3</label>
                        <select
                            name="cod_color_3"
                            value={form.cod_color_3}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        >
                            <option value="">-- Seleccionar --</option>
                            {colores.map((c) => (
                                <option key={c.codigo} value={c.codigo}>{c.nombre}</option>
                            ))}
                        </select>
                    </div>

                    {/* Carrocería */}
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Carrocería</label>
                        <select
                            name="id_carroceria"
                            value={form.id_carroceria}
                            onChange={handleChange}
                            disabled={!form.id_categoria}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                        >
                            <option value="">
                                {!form.id_categoria ? '-- Primero categoría --' : '-- Seleccionar --'}
                            </option>
                            {carrocerias.map((c) => (
                                <option key={c.id_carroceria} value={c.id_carroceria}>
                                    {c.codigo} — {c.nombre}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Forma de Rodamiento */}
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Forma de Rodamiento</label>
                        <select
                            name="id_forma_rodamiento"
                            value={form.id_forma_rodamiento}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        >
                            <option value="">-- Seleccionar --</option>
                            {formasRodamiento.map((f) => (
                                <option key={f.id_forma} value={f.id_forma}>{f.nombre}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </section>

            {/* SECCIÓN 3 */}
            <section>
                <h3 className="text-sm font-bold text-gray-800 uppercase mb-3 pb-2 border-b border-gray-200">
                    3. Dimensiones y Pesos
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <InputField label="Longitud (m)" name="longitud_m" placeholder="5.325" value={form.longitud_m} onChange={handleNumero} />
                    <InputField label="Ancho (m)" name="ancho_m" placeholder="1.855" value={form.ancho_m} onChange={handleNumero} />
                    <InputField label="Altura (m)" name="altura_m" placeholder="1.815" value={form.altura_m} onChange={handleNumero} />
                    <InputField label="Peso Bruto (t)" name="peso_bruto_tn" placeholder="2.910" value={form.peso_bruto_tn} onChange={handleNumero} />
                    <InputField label="Peso Neto (t)" name="peso_neto_tn" placeholder="2.172" value={form.peso_neto_tn} onChange={handleNumero} />
                    <InputField label="Carga Útil (t)" name="carga_util_tn" placeholder="0.738" value={form.carga_util_tn} onChange={handleNumero} />
                </div>
            </section>

            {/* SECCIÓN 4 */}
            <section>
                <h3 className="text-sm font-bold text-gray-800 uppercase mb-3 pb-2 border-b border-gray-200">
                    4. Capacidades
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <InputField label="Asientos" name="asientos" placeholder="5" value={form.asientos} onChange={handleEntero} />
                    <InputField label="Pasajeros" name="pasajeros" placeholder="4" value={form.pasajeros} onChange={handleEntero} />
                    <InputField label="Ruedas" name="ruedas" placeholder="4" value={form.ruedas} onChange={handleEntero} />
                    <InputField label="Ejes" name="ejes" placeholder="2" value={form.ejes} onChange={handleEntero} />
                </div>
            </section>

            {/* SECCIÓN 5 */}
            <section>
                <h3 className="text-sm font-bold text-gray-800 uppercase mb-3 pb-2 border-b border-gray-200">
                    5. Motor
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <InputField
                        label="Número de Motor"
                        name="numero_motor"
                        placeholder="1GDG337851"
                        value={form.motor.numero_motor}
                        onChange={handleMotor}
                    />
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Combustible</label>
                        <select
                            name="cod_combustible"
                            value={form.motor.cod_combustible}
                            onChange={handleMotor}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        >
                            <option value="">-- Seleccionar --</option>
                            {combustibles.map((c) => (
                                <option key={c.codigo} value={c.codigo}>{c.nombre}</option>
                            ))}
                        </select>
                    </div>
                    <InputField label="Cilindros" name="cilindros" placeholder="4" value={form.motor.cilindros} onChange={handleMotor} />
                    <InputField label="Cilindrada (L)" name="cilindrada" placeholder="2.755" value={form.motor.cilindrada} onChange={handleMotor} />
                    <InputField label="Potencia (CV)" name="potencia_cv" placeholder="150" value={form.motor.potencia_cv} onChange={handleMotor} />
                    <InputField label="Potencia RPM" name="potencia_rpm" placeholder="3400" value={form.motor.potencia_rpm} onChange={handleMotor} />
                </div>
            </section>

            {/* SECCIÓN 6 */}
            <section>
                <h3 className="text-sm font-bold text-gray-800 uppercase mb-3 pb-2 border-b border-gray-200">
                    6. Propietario
                </h3>
                <div className="space-y-3">
                    <input
                        type="text"
                        value={busquedaCliente}
                        onChange={(e) => setBusquedaCliente(e.target.value)}
                        placeholder="🔍 Buscar cliente por nombre o documento..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <select
                        name="id_cliente"
                        value={form.id_cliente}
                        onChange={handleChange}
                        size={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                        {clientesFiltrados.map((c) => {
                            const nombre = c.tipo_persona === 'JURIDICA'
                                ? c.razon_social
                                : `${c.nombres} ${c.apellidos}`;
                            const doc = c.tipo_persona === 'JURIDICA' ? c.ruc : c.dni;
                            return (
                                <option key={c.id_cliente} value={c.id_cliente}>
                                    [{c.tipo_persona}] {doc} — {nombre}
                                </option>
                            );
                        })}
                    </select>
                    {form.id_cliente && (
                        <p className="text-xs text-green-700 font-medium">
                            ✓ Propietario seleccionado
                        </p>
                    )}
                </div>
            </section>

            {/* Error */}
            {error && (
                <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
                    {error}
                </div>
            )}

            {/* Botones */}
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
                    disabled={guardando}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50 font-medium"
                >
                    {guardando ? 'Guardando...' : esEdicion ? 'Actualizar' : 'Crear Vehículo'}
                </button>
            </div>

            {/* Modal marca */}
            <ModalPrompt
                abierto={modalMarca}
                onCerrar={() => setModalMarca(false)}
                onGuardar={handleCrearMarca}
                titulo="Agregar nueva marca"
                label="Nombre de la marca"
                placeholder="Ej: MAHINDRA"
                cargando={guardandoMarca}
            />

            {/* Modal modelo */}
            <ModalPrompt
                abierto={modalModelo}
                onCerrar={() => setModalModelo(false)}
                onGuardar={handleCrearModelo}
                titulo="Agregar nuevo modelo"
                label={`Nombre del modelo para ${marcas.find(m => String(m.id_marca) === String(form.id_marca))?.nombre || ''}`}
                placeholder="Ej: XUV 500"
                cargando={guardandoModelo}
            />
        </form>
    );
}