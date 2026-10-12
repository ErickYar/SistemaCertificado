import api from './axios';

// Ubigeo
export const listarDepartamentos = async () => {
    const { data } = await api.get('/catalogos/departamentos');
    return data;
};

export const listarProvincias = async (idDepartamento) => {
    const { data } = await api.get(`/catalogos/departamentos/${idDepartamento}/provincias`);
    return data;
};

export const listarDistritos = async (idProvincia) => {
    const { data } = await api.get(`/catalogos/provincias/${idProvincia}/distritos`);
    return data;
};

// Vehículos
export const listarCategorias = async () => {
    const { data } = await api.get('/catalogos/categorias');
    return data;
};

export const listarMarcas = async () => {
    const { data } = await api.get('/catalogos/marcas');
    return data;
};

export const listarModelosPorMarca = async (idMarca) => {
    const { data } = await api.get(`/catalogos/marcas/${idMarca}/modelos`);
    return data;
};

export const listarColores = async () => {
    const { data } = await api.get('/catalogos/colores');
    return data;
};

export const listarCarrocerias = async (categoria) => {
    const params = categoria ? { categoria } : {};
    const { data } = await api.get('/catalogos/carrocerias', { params });
    return data;
};

export const listarTiposUso = async () => {
    const { data } = await api.get('/catalogos/tipos-uso');
    return data;
};

export const listarFormasRodamiento = async () => {
    const { data } = await api.get('/catalogos/formas-rodamiento');
    return data;
};

export const listarCondiciones = async () => {
    const { data } = await api.get('/catalogos/condiciones');
    return data;
};

export const listarCombustibles = async () => {
    const { data } = await api.get('/catalogos/combustibles');
    return data;
};

export const listarZonasRegistrales = async () => {
    const { data } = await api.get('/catalogos/zonas-registrales');
    return data;
};

export const listarSedesPorZona = async (codZona) => {
    const { data } = await api.get(`/catalogos/zonas-registrales/${codZona}/sedes`);
    return data;
};

export const listarTiposSuspension = async () => {
    const { data } = await api.get('/catalogos/tipos-suspension');
    return data;
};

export const listarClasesNeumatico = async () => {
    const { data } = await api.get('/catalogos/clases-neumatico');
    return data;
};
export const crearMarca = async (nombre) => {
    const { data } = await api.post('/catalogos/marcas', { nombre });
    return data;
};

export const crearModelo = async (idMarca, nombre) => {
    const { data } = await api.post(`/catalogos/marcas/${idMarca}/modelos`, { nombre });
    return data;
};

export const listarEmisores = async () => {
    const { data } = await api.get('/catalogos/emisores');
    return data;
};