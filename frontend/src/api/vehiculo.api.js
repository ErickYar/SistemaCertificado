import api from './axios';

export const listar = async () => {
    const { data } = await api.get('/vehiculos');
    return data;
};

export const buscarPorPlaca = async (placa) => {
    const { data } = await api.get('/vehiculos/buscar', {
        params: { placa }
    });
    return data;
};

export const buscarPorVin = async (vin) => {
    const { data } = await api.get('/vehiculos/buscar', {
        params: { vin }
    });
    return data;
};

export const obtener = async (id) => {
    const { data } = await api.get(`/vehiculos/${id}`);
    return data;
};

export const crear = async (vehiculo) => {
    const { data } = await api.post('/vehiculos', vehiculo);
    return data;
};

export const actualizar = async (id, vehiculo) => {
    const { data } = await api.put(`/vehiculos/${id}`, vehiculo);
    return data;
};

export const eliminar = async (id) => {
    const { data } = await api.delete(`/vehiculos/${id}`);
    return data;
};