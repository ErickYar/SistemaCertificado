export default function ModalConfirmacion({
    abierto,
    onCerrar,
    onConfirmar,
    titulo = 'Confirmar acción',
    mensaje,
    textoConfirmar = 'Sí, eliminar',
    textoCancelar = 'Cancelar',
    variante = 'danger', // 'danger' o 'warning'
    cargando = false
}) {
    if (!abierto) return null;

    const colores = {
        danger: {
            icono: '🗑️',
            boton: 'bg-red-600 hover:bg-red-700',
            circulo: 'bg-red-100 text-red-600'
        },
        warning: {
            icono: '⚠️',
            boton: 'bg-yellow-600 hover:bg-yellow-700',
            circulo: 'bg-yellow-100 text-yellow-600'
        }
    };

    const c = colores[variante] || colores.danger;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-md">
                <div className="p-6 text-center">
                    <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center text-3xl mb-4 ${c.circulo}`}>
                        {c.icono}
                    </div>

                    <h3 className="text-xl font-bold text-gray-800 mb-2">
                        {titulo}
                    </h3>

                    <p className="text-gray-600 mb-6">
                        {mensaje}
                    </p>

                    <div className="flex justify-center gap-3">
                        <button
                            type="button"
                            onClick={onCerrar}
                            disabled={cargando}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
                        >
                            {textoCancelar}
                        </button>
                        <button
                            type="button"
                            onClick={onConfirmar}
                            disabled={cargando}
                            className={`px-4 py-2 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed font-medium ${c.boton}`}
                        >
                            {cargando ? 'Eliminando...' : textoConfirmar}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}