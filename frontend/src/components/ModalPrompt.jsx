import { useState, useEffect } from 'react';

export default function ModalPrompt({
    abierto,
    onCerrar,
    onGuardar,
    titulo,
    label,
    placeholder = '',
    valorInicial = '',
    cargando = false
}) {
    const [valor, setValor] = useState(valorInicial);
    const [error, setError] = useState('');

    useEffect(() => {
        if (abierto) {
            setValor(valorInicial);
            setError('');
        }
    }, [abierto, valorInicial]);

    if (!abierto) return null;

    const handleGuardar = () => {
        if (!valor.trim()) {
            setError('Este campo es obligatorio');
            return;
        }
        onGuardar(valor.trim());
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-md">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-bold text-gray-800">{titulo}</h3>
                </div>

                <div className="p-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        {label}
                    </label>
                    <input
                        type="text"
                        value={valor}
                        onChange={(e) => setValor(e.target.value)}
                        placeholder={placeholder}
                        autoFocus
                        onKeyDown={(e) => e.key === 'Enter' && handleGuardar()}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {error && (
                        <p className="text-sm text-red-600 mt-2">{error}</p>
                    )}
                </div>

                <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
                    <button
                        onClick={onCerrar}
                        disabled={cargando}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleGuardar}
                        disabled={cargando}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 font-medium"
                    >
                        {cargando ? 'Guardando...' : 'Guardar'}
                    </button>
                </div>
            </div>
        </div>
    );
}