import { useState, useEffect } from 'react';
import * as clienteApi from '../../api/cliente.api';
import * as catalogosApi from '../../api/catalogos.api';

export default function ClienteForm({ cliente, onGuardado, onCancelar }) {
    const esEdicion = !!cliente?.id_cliente;

    const [form, setForm] = useState({
        tipo_persona: 'NATURAL',
        nombres: '',
        apellidos: '',
        dni: '',
        razon_social: '',
        ruc: '',
        direccion: '',
        distrito: '',
        provincia: '',
        departamento: '',
        telefono: '',
        correo: '',
    });

    const [error, setError]         = useState('');
    const [guardando, setGuardando] = useState(false);

    // Catálogos
    const [departamentos, setDepartamentos] = useState([]);
    const [provincias, setProvincias]       = useState([]);
    const [distritos, setDistritos]         = useState([]);

    // IDs seleccionados (para cascada)
    const [idDepartamento, setIdDepartamento] = useState('');
    const [idProvincia, setIdProvincia]       = useState('');

    // ------------------------------------------------------------
    // Cargar departamentos al inicio
    // ------------------------------------------------------------
    useEffect(() => {
        catalogosApi.listarDepartamentos()
            .then(setDepartamentos)
            .catch((err) => console.error('Error cargando departamentos:', err));
    }, []);

    // ------------------------------------------------------------
    // Cargar datos si es edición
    // ------------------------------------------------------------
    useEffect(() => {
        if (cliente) {
            setForm({
                tipo_persona: cliente.tipo_persona || 'NATURAL',
                nombres: cliente.nombres || '',
                apellidos: cliente.apellidos || '',
                dni: cliente.dni || '',
                razon_social: cliente.razon_social || '',
                ruc: cliente.ruc || '',
                direccion: cliente.direccion || '',
                distrito: cliente.distrito || '',
                provincia: cliente.provincia || '',
                departamento: cliente.departamento || '',
                telefono: cliente.telefono || '',
                correo: cliente.correo || '',
            });
        }
    }, [cliente]);

    // ------------------------------------------------------------
    // Cambios simples en inputs
    // ------------------------------------------------------------
    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    // ------------------------------------------------------------
    // Teléfono: solo dígitos, máx 9
    // ------------------------------------------------------------
    const handleTelefono = (e) => {
        const soloNumeros = e.target.value.replace(/\D/g, '').slice(0, 9);
        setForm((prev) => ({ ...prev, telefono: soloNumeros }));
    };

    // ------------------------------------------------------------
    // DNI: solo dígitos, máx 8
    // ------------------------------------------------------------
    const handleDni = (e) => {
        const soloNumeros = e.target.value.replace(/\D/g, '').slice(0, 8);
        setForm((prev) => ({ ...prev, dni: soloNumeros }));
    };

    // ------------------------------------------------------------
    // RUC: solo dígitos, máx 11
    // ------------------------------------------------------------
    const handleRuc = (e) => {
        const soloNumeros = e.target.value.replace(/\D/g, '').slice(0, 11);
        setForm((prev) => ({ ...prev, ruc: soloNumeros }));
    };

    // ------------------------------------------------------------
    // Cascada: Departamento → Provincias
    // ------------------------------------------------------------
    const handleDepartamento = async (e) => {
        const id = e.target.value;
        const nombre = departamentos.find(d => String(d.id_departamento) === id)?.nombre || '';

        setIdDepartamento(id);
        setIdProvincia('');
        setProvincias([]);
        setDistritos([]);

        setForm((prev) => ({
            ...prev,
            departamento: nombre,
            provincia: '',
            distrito: '',
        }));

        if (!id) return;

        try {
            const data = await catalogosApi.listarProvincias(id);
            setProvincias(data);
        } catch (err) {
            console.error('Error cargando provincias:', err);
        }
    };

    // ------------------------------------------------------------
    // Cascada: Provincia → Distritos
    // ------------------------------------------------------------
    const handleProvincia = async (e) => {
        const id = e.target.value;
        const nombre = provincias.find(p => String(p.id_provincia) === id)?.nombre || '';

        setIdProvincia(id);
        setDistritos([]);

        setForm((prev) => ({
            ...prev,
            provincia: nombre,
            distrito: '',
        }));

        if (!id) return;

        try {
            const data = await catalogosApi.listarDistritos(id);
            setDistritos(data);
        } catch (err) {
            console.error('Error cargando distritos:', err);
        }
    };

    // ------------------------------------------------------------
    // Cascada: Distrito (solo guarda el nombre)
    // ------------------------------------------------------------
    const handleDistrito = (e) => {
        const nombre = e.target.value;
        setForm((prev) => ({ ...prev, distrito: nombre }));
    };

    // ------------------------------------------------------------
    // Cambiar tipo de persona
    // ------------------------------------------------------------
    const cambiarTipo = (tipo) => {
        setForm((prev) => ({
            ...prev,
            tipo_persona: tipo,
            nombres: tipo === 'NATURAL' ? prev.nombres : '',
            apellidos: tipo === 'NATURAL' ? prev.apellidos : '',
            dni: tipo === 'NATURAL' ? prev.dni : '',
            razon_social: tipo === 'JURIDICA' ? prev.razon_social : '',
            ruc: tipo === 'JURIDICA' ? prev.ruc : '',
        }));
    };

    // ------------------------------------------------------------
    // Validaciones
    // ------------------------------------------------------------
    const validar = () => {
        if (form.tipo_persona === 'NATURAL') {
            if (!form.dni) throw new Error('El DNI es obligatorio');
            if (form.dni.length !== 8) throw new Error('El DNI debe tener 8 dígitos');
            if (!form.nombres.trim()) throw new Error('Los nombres son obligatorios');
            if (!form.apellidos.trim()) throw new Error('Los apellidos son obligatorios');
        } else {
            if (!form.ruc) throw new Error('El RUC es obligatorio');
            if (form.ruc.length !== 11) throw new Error('El RUC debe tener 11 dígitos');
            if (!form.razon_social.trim()) throw new Error('La razón social es obligatoria');
        }

        if (form.telefono && form.telefono.length !== 9) {
            throw new Error('El teléfono debe tener exactamente 9 dígitos');
        }
        if (form.telefono && !form.telefono.startsWith('9')) {
            throw new Error('El teléfono debe empezar con 9 (formato celular Perú)');
        }
        if (form.correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo)) {
            throw new Error('El correo no es válido');
        }
    };

    // ------------------------------------------------------------
    // Guardar
    // ------------------------------------------------------------
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            validar();
            setGuardando(true);

            const payload = {
                tipo_persona: form.tipo_persona,
                direccion: form.direccion || null,
                distrito: form.distrito || null,
                provincia: form.provincia || null,
                departamento: form.departamento || null,
                telefono: form.telefono || null,
                correo: form.correo || null,
            };

            if (form.tipo_persona === 'NATURAL') {
                payload.nombres   = form.nombres.trim();
                payload.apellidos = form.apellidos.trim();
                payload.dni       = form.dni;
            } else {
                payload.razon_social = form.razon_social.trim();
                payload.ruc          = form.ruc;
            }

            if (esEdicion) {
                await clienteApi.actualizar(cliente.id_cliente, payload);
            } else {
                await clienteApi.crear(payload);
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
        <form onSubmit={handleSubmit} className="space-y-4">

            {/* Tipo de persona */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de persona
                </label>
                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={() => cambiarTipo('NATURAL')}
                        className={`flex-1 py-2 px-4 rounded-lg border-2 transition font-medium ${
                            form.tipo_persona === 'NATURAL'
                                ? 'border-green-500 bg-green-50 text-green-700'
                                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                    >
                        👤 Persona Natural
                    </button>
                    <button
                        type="button"
                        onClick={() => cambiarTipo('JURIDICA')}
                        className={`flex-1 py-2 px-4 rounded-lg border-2 transition font-medium ${
                            form.tipo_persona === 'JURIDICA'
                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                    >
                        🏢 Persona Jurídica
                    </button>
                </div>
            </div>

            {/* Campos según tipo */}
            {form.tipo_persona === 'NATURAL' ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            DNI * <span className="text-xs text-gray-400">(8 dígitos)</span>
                        </label>
                        <input
                            type="text"
                            value={form.dni}
                            onChange={handleDni}
                            placeholder="12345678"
                            inputMode="numeric"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nombres *
                        </label>
                        <input
                            type="text"
                            name="nombres"
                            value={form.nombres}
                            onChange={handleChange}
                            placeholder="Juan Carlos"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Apellidos *
                        </label>
                        <input
                            type="text"
                            name="apellidos"
                            value={form.apellidos}
                            onChange={handleChange}
                            placeholder="Pérez López"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            RUC * <span className="text-xs text-gray-400">(11 dígitos)</span>
                        </label>
                        <input
                            type="text"
                            value={form.ruc}
                            onChange={handleRuc}
                            placeholder="20123456789"
                            inputMode="numeric"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Razón Social *
                        </label>
                        <input
                            type="text"
                            name="razon_social"
                            value={form.razon_social}
                            onChange={handleChange}
                            placeholder="EMPRESA S.A.C."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>
            )}

            {/* Dirección */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dirección
                </label>
                <input
                    type="text"
                    name="direccion"
                    value={form.direccion}
                    onChange={handleChange}
                    placeholder="Av. Los Álamos 123"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>

            {/* Ubigeo en cascada */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Departamento */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Departamento
                    </label>
                    <select
                        value={idDepartamento}
                        onChange={handleDepartamento}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                        <option value="">-- Seleccionar --</option>
                        {departamentos.map((d) => (
                            <option key={d.id_departamento} value={d.id_departamento}>
                                {d.nombre}
                            </option>
                        ))}
                    </select>
                    {form.departamento && !idDepartamento && esEdicion && (
                        <p className="text-xs text-gray-500 mt-1">
                            Actual: {form.departamento}
                        </p>
                    )}
                </div>

                {/* Provincia */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Provincia
                    </label>
                    <select
                        value={idProvincia}
                        onChange={handleProvincia}
                        disabled={!idDepartamento}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                        <option value="">
                            {idDepartamento ? '-- Seleccionar --' : '-- Primero departamento --'}
                        </option>
                        {provincias.map((p) => (
                            <option key={p.id_provincia} value={p.id_provincia}>
                                {p.nombre}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Distrito */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Distrito
                    </label>
                    <select
                        value={form.distrito}
                        onChange={handleDistrito}
                        disabled={!idProvincia}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                        <option value="">
                            {idProvincia ? '-- Seleccionar --' : '-- Primero provincia --'}
                        </option>
                        {distritos.map((d) => (
                            <option key={d.id_distrito} value={d.nombre}>
                                {d.nombre}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Contacto */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Teléfono <span className="text-xs text-gray-400">(9 dígitos, empieza con 9)</span>
                    </label>
                    <input
                        type="text"
                        value={form.telefono}
                        onChange={handleTelefono}
                        placeholder="987654321"
                        inputMode="numeric"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {form.telefono && form.telefono.length !== 9 && (
                        <p className="text-xs text-red-500 mt-1">
                            Faltan {9 - form.telefono.length} dígito(s)
                        </p>
                    )}
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Correo
                    </label>
                    <input
                        type="email"
                        name="correo"
                        value={form.correo}
                        onChange={handleChange}
                        placeholder="correo@ejemplo.com"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>

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
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                    {guardando
                        ? 'Guardando...'
                        : esEdicion ? 'Actualizar' : 'Crear Cliente'}
                </button>
            </div>
        </form>
    );
}