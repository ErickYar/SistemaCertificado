import api from './axios';

export const listar = async () => {
    const { data } = await api.get('/certificados');
    return data;
};

export const buscar = async (filtros = {}) => {
    const { data } = await api.get('/certificados/buscar', { params: filtros });
    return data;
};

export const obtener = async (id) => {
    const { data } = await api.get(`/certificados/${id}`);
    return data;
};

export const crear = async (certificado) => {
    const { data } = await api.post('/certificados', certificado);
    return data;
};

export const actualizarEstado = async (id, estado) => {
    const { data } = await api.patch(`/certificados/${id}/estado`, { estado });
    return data;
};

export const eliminar = async (id) => {
    const { data } = await api.delete(`/certificados/${id}`);
    return data;
};