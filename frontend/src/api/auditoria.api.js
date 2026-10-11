import api from './axios';

export const listar = async (filtros = {}) => {
    const { data } = await api.get('/auditoria', { params: filtros });
    return data;
};

export const resumen = async () => {
    const { data } = await api.get('/auditoria/resumen');
    return data;
};

export const historial = async (tabla, idRegistro) => {
    const { data } = await api.get(`/auditoria/${tabla}/${idRegistro}`);
    return data;
};