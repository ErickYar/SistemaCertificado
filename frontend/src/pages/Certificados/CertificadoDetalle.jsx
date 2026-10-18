export default function CertificadoDetalle({ certificado }) {
    if (!certificado) return null;

    const formatearFecha = (f) => {
        if (!f) return '—';
        return new Date(f).toLocaleDateString('es-PE', {
            day: '2-digit', month: '2-digit', year: 'numeric'
        });
    };

    const getBadgeEstado = (estado) => {
        const estilos = {
            BORRADOR:  'bg-gray-100 text-gray-700',
            EMITIDO:   'bg-yellow-100 text-yellow-700',
            PAGADO:    'bg-green-100 text-green-700',
            ENTREGADO: 'bg-blue-100 text-blue-700',
            ANULADO:   'bg-red-100 text-red-700',
        };
        return `text-xs px-2 py-1 rounded-full font-medium ${estilos[estado] || 'bg-gray-100 text-gray-700'}`;
    };

    return (
        <div className="space-y-6">
            {/* CABECERA */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex justify-between items-center">
                <div>
                    <div className="text-xs text-blue-600 font-bold uppercase mb-1">Certificado N°</div>
                    <div className="text-2xl font-mono font-bold text-blue-800">
                        {certificado.numero_certificado}
                    </div>
                    <div className="text-sm text-blue-600 font-mono mt-1">
                        Control: {certificado.codigo_control || '—'}
                    </div>
                </div>
                <div className="text-right">
                    <span className={getBadgeEstado(certificado.estado)}>
                        {certificado.estado}
                    </span>
                    <div className="text-sm text-gray-600 mt-2">
                        {certificado.tipo_certificado}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                        Emitido: {formatearFecha(certificado.fecha_emision)}
                    </div>
                </div>
            </div>

            {/* DATOS DEL VEHÍCULO Y CLIENTE */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h4 className="text-sm font-bold text-gray-800 uppercase border-b border-gray-200 pb-2 mb-3">
                        🚗 Vehículo
                    </h4>
                    <dl className="space-y-1.5 text-sm">
                        <div className="flex justify-between"><dt className="text-gray-500">Placa:</dt><dd className="font-bold text-gray-800">{certificado.placa}</dd></div>
                        <div className="flex justify-between"><dt className="text-gray-500">VIN:</dt><dd className="font-mono text-xs text-gray-800">{certificado.numero_vin}</dd></div>
                        <div className="flex justify-between"><dt className="text-gray-500">Marca:</dt><dd className="text-gray-800">{certificado.marca || '—'}</dd></div>
                        <div className="flex justify-between"><dt className="text-gray-500">Modelo:</dt><dd className="text-gray-800">{certificado.modelo || '—'}</dd></div>
                        <div className="flex justify-between"><dt className="text-gray-500">Categoría:</dt><dd className="text-gray-800">{certificado.categoria_desc || '—'}</dd></div>
                    </dl>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h4 className="text-sm font-bold text-gray-800 uppercase border-b border-gray-200 pb-2 mb-3">
                        👤 Cliente
                    </h4>
                    <dl className="space-y-1.5 text-sm">
                        <div className="flex justify-between">
                            <dt className="text-gray-500">Nombre:</dt>
                            <dd className="font-medium text-gray-800">
                                {certificado.razon_social || `${certificado.nombres || ''} ${certificado.apellidos || ''}`.trim()}
                            </dd>
                        </div>
                        <div className="flex justify-between"><dt className="text-gray-500">Documento:</dt><dd className="text-gray-800">{certificado.ruc || certificado.dni}</dd></div>
                        <div className="flex justify-between"><dt className="text-gray-500">Tipo:</dt><dd className="text-gray-800">{certificado.tipo_persona}</dd></div>
                    </dl>
                </div>
            </div>

            {/* SECCIÓN DINÁMICA SEGÚN TIPO */}
            {certificado.tipo_certificado === 'MODIFICACION' && certificado.modificaciones?.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h4 className="text-sm font-bold text-gray-800 uppercase border-b border-gray-200 pb-2 mb-3">
                        🔧 Características Modificadas
                    </h4>
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50 text-left">
                                <th className="p-2 font-semibold text-gray-600">Acción</th>
                                <th className="p-2 font-semibold text-gray-600">Característica</th>
                                <th className="p-2 font-semibold text-gray-600">Valor a registrar</th>
                            </tr>
                        </thead>
                        <tbody>
                            {certificado.modificaciones.map((m, i) => (
                                <tr key={i} className="border-t border-gray-100">
                                    <td className="p-2">
                                        <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                                            {m.accion}
                                        </span>
                                    </td>
                                    <td className="p-2 text-gray-800">{m.campo_modificado}</td>
                                    <td className="p-2 text-gray-800 font-medium">{m.valor_nuevo}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {certificado.tipo_certificado === 'BONIFICACION' && certificado.bonificacion && (
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h4 className="text-sm font-bold text-gray-800 uppercase border-b border-gray-200 pb-2 mb-3">
                        💎 Detalle de Bonificación
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-4">
                        <div><span className="text-gray-500 block text-xs">Marca</span>{certificado.bonificacion.marca}</div>
                        <div><span className="text-gray-500 block text-xs">Modelo</span>{certificado.bonificacion.modelo}</div>
                        <div><span className="text-gray-500 block text-xs">Año</span>{certificado.bonificacion.anio_modelo}</div>
                        <div><span className="text-gray-500 block text-xs">N° Ejes</span>{certificado.bonificacion.numero_ejes}</div>
                        <div><span className="text-gray-500 block text-xs">Distancia Ejes</span>{certificado.bonificacion.distancia_ejes_m} m</div>
                        <div><span className="text-gray-500 block text-xs">Distancia Kingpin</span>{certificado.bonificacion.distancia_kingpin_m} m</div>
                        <div><span className="text-gray-500 block text-xs">Ciudad Emisión</span>{certificado.bonificacion.ciudad_emision}</div>
                        <div><span className="text-gray-500 block text-xs">Fecha Emisión</span>{formatearFecha(certificado.bonificacion.fecha_emision_doc)}</div>
                    </div>

                    {certificado.ejes?.length > 0 && (
                        <>
                            <h5 className="text-xs font-bold text-gray-700 uppercase mt-4 mb-2">Detalle por Eje</h5>
                            <div className="overflow-x-auto">
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr className="bg-gray-50 text-left">
                                            <th className="p-2">Eje</th>
                                            <th className="p-2">Rodada</th>
                                            <th className="p-2">Suspensión</th>
                                            <th className="p-2">Cap. Eje (kg)</th>
                                            <th className="p-2">Cap. Susp. (kg)</th>
                                            <th className="p-2">Neumáticos</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {certificado.ejes.map((e, i) => (
                                            <tr key={i} className="border-t border-gray-100">
                                                <td className="p-2 font-bold">{e.orden}</td>
                                                <td className="p-2">{e.tipo_rodada || '—'}</td>
                                                <td className="p-2">{e.cod_tipo_suspension}</td>
                                                <td className="p-2">{e.capacidad_eje_kg}</td>
                                                <td className="p-2">{e.capacidad_suspension_kg}</td>
                                                <td className="p-2">{e.medida_neumatico} ({e.cod_clase_neumatico})</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* OBSERVACIONES */}
            {certificado.observaciones_numeradas?.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h4 className="text-sm font-bold text-gray-800 uppercase border-b border-gray-200 pb-2 mb-3">
                        📝 Observaciones
                    </h4>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
                        {certificado.observaciones_numeradas.map((o, i) => (
                            <li key={i}>{o.texto}</li>
                        ))}
                    </ol>
                </div>
            )}

            {/* EMISOR */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex justify-between items-end">
                <div>
                    <div className="text-xs text-gray-500 uppercase font-semibold mb-1">Emitido por</div>
                    <div className="font-bold text-gray-800">{certificado.emisor}</div>
                    <div className="text-xs text-gray-600">{certificado.emisor_representante}</div>
                </div>
                <div className="text-right text-xs text-gray-500">
                    CIP: {certificado.emisor_colegiatura || '—'}
                </div>
            </div>
        </div>
    );
}