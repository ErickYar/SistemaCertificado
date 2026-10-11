import { createContext, useContext, useState, useEffect } from 'react';
import * as authApi from '../api/auth.api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [usuario, setUsuario]   = useState(null);
    const [token, setToken]       = useState(null);
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        const tokenGuardado   = localStorage.getItem('token');
        const usuarioGuardado = localStorage.getItem('usuario');

        if (tokenGuardado && usuarioGuardado) {
            setToken(tokenGuardado);
            setUsuario(JSON.parse(usuarioGuardado));
        }

        setCargando(false);
    }, []);

    const iniciarSesion = async (nombre_usuario, password) => {
        const data = await authApi.login(nombre_usuario, password);

        localStorage.setItem('token', data.token);
        localStorage.setItem('usuario', JSON.stringify(data.usuario));

        setToken(data.token);
        setUsuario(data.usuario);

        return data;
    };

    const cerrarSesion = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        setToken(null);
        setUsuario(null);
    };

    return (
        <AuthContext.Provider value={{
            usuario,
            token,
            cargando,
            iniciarSesion,
            cerrarSesion,
            estaAutenticado: !!token
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
    return ctx;
}