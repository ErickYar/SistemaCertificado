export default function Modal({ abierto, onCerrar, titulo, children, size = 'md' }) {
    if (!abierto) return null;

    const sizes = {
        sm: 'max-w-md',
        md: 'max-w-2xl',
        lg: 'max-w-4xl',
        xl: 'max-w-6xl',
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className={`bg-white rounded-lg shadow-2xl w-full ${sizes[size]} max-h-[90vh] flex flex-col`}>
                {/* Header */}
                <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-gray-800">{titulo}</h2>
                    <button
                        onClick={onCerrar}
                        className="text-gray-400 hover:text-gray-700 text-2xl leading-none"
                    >
                        ×
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>
    );
}