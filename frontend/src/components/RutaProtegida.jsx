import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RutaProtegida({ children }) {
    const { estaAutenticado, cargando } = useAuth();

    if (cargando) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-gray-500">Cargando...</p>
            </div>
        );
    }

    if (!estaAutenticado) {
        return <Navigate to="/login" replace />;
    }

    return children;
}