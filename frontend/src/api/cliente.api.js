import api from './axios';

// Listar todos los clientes activos
export const listar = async () => {
    const { data } = await api.get('/clientes');
    return data;
};

// Buscar por DNI o RUC
export const buscarPorDocumento = async (documento) => {
    const { data } = await api.get('/clientes/buscar', {
        params: { documento }
    });
    return data;
};

// Buscar por nombre o razón social
export const buscarPorNombre = async (nombre) => {
    const { data } = await api.get('/clientes/buscar', {
        params: { nombre }
    });
    return data;
};

// Obtener uno por ID
export const obtener = async (id) => {
    const { data } = await api.get(`/clientes/${id}`);
    return data;
};

// Crear
export const crear = async (cliente) => {
    const { data } = await api.post('/clientes', cliente);
    return data;
};

// Actualizar
export const actualizar = async (id, cliente) => {
    const { data } = await api.put(`/clientes/${id}`, cliente);
    return data;
};

// Eliminar (lógico)
export const eliminar = async (id) => {
    const { data } = await api.delete(`/clientes/${id}`);
    return data;
};