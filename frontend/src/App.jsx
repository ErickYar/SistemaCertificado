import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import RutaProtegida from './components/RutaProtegida';
import Layout from './components/Layout';

import Login from './pages/Login/Login';
import Dashboard from './pages/Dashboard/Dashboard';
import Clientes from './pages/Clientes/Clientes';
import Vehiculos from './pages/Vehiculos/Vehiculos';
import Certificados from './pages/Certificados/Certificados';
import Pagos from './pages/Pagos/Pagos';
import Reportes from './pages/Repostes/Reportes';
import Auditoria from './pages/Auditoria/Auditoria';


export default function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    {/* Ruta pública */}
                    <Route path="/login" element={<Login />} />

                    {/* Rutas protegidas con Layout */}
                    <Route
                        element={
                            <RutaProtegida>
                                <Layout />
                            </RutaProtegida>
                        }
                    >
                        <Route path="/dashboard"    element={<Dashboard />} />
                        <Route path="/clientes"     element={<Clientes />} />
                        <Route path="/vehiculos"    element={<Vehiculos />} />
                        <Route path="/certificados" element={<Certificados />} />
                        <Route path="/pagos"        element={<Pagos />} />
                        <Route path="/reportes"     element={<Reportes />} />
                        <Route path="/auditoria"    element={<Auditoria />} />
                    </Route>

                    {/* Redirecciones */}
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}