import api from './axios';

export const login = async (nombre_usuario, password) => {
    const response = await api.post('/auth/login', { nombre_usuario, password });
    return response.data;
};