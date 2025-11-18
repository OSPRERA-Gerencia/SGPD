'use client';

import { useEffect, useState } from 'react';

type DebugInfo = {
  configured: boolean;
  message: string;
  supabaseUrlKeysFound: boolean;
  supabaseKeyKeysFound: boolean;
  supabaseUrlKeys: string[];
  supabaseKeyKeys: string[];
  error?: boolean;
};

export default function DebugPage(): React.ReactElement {
  const [config, setConfig] = useState<DebugInfo | null>(null);

  useEffect(() => {
    fetch('/api/debug')
      .then((res) => res.json())
      .then((data: DebugInfo) => {
        setConfig(data);
      })
      .catch((error) => {
        setConfig({
          configured: false,
          message: 'Error al obtener información de diagnóstico',
          supabaseUrlKeysFound: false,
          supabaseKeyKeysFound: false,
          supabaseUrlKeys: [],
          supabaseKeyKeys: [],
          error: true,
        });
      });
  }, []);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-semibold text-slate-900 mb-6">Diagnóstico de Supabase</h1>
      
      {config ? (
        <div className={`rounded-lg border p-6 ${config.configured ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
          <h2 className={`text-lg font-semibold mb-2 ${config.configured ? 'text-green-800' : 'text-red-800'}`}>
            Estado: {config.configured ? '✓ Configurado' : '✗ No configurado'}
          </h2>
          <p className={config.configured ? 'text-green-700' : 'text-red-700'}>
            {config.message}
          </p>
        </div>
      ) : (
        <p>Cargando...</p>
      )}

      {config && (
        <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold mb-4">Variables encontradas en el servidor:</h2>
          <div className="space-y-4 text-sm">
            <div>
              <strong>Variables de URL encontradas ({config.supabaseUrlKeys.length}):</strong>
              {config.supabaseUrlKeys.length > 0 ? (
                <ul className="list-disc list-inside ml-4 mt-1">
                  {config.supabaseUrlKeys.map((key) => (
                    <li key={key} className="font-mono">{key}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-red-600 ml-4 mt-1">No se encontraron variables de URL</p>
              )}
            </div>
            <div>
              <strong>Variables de Key encontradas ({config.supabaseKeyKeys.length}):</strong>
              {config.supabaseKeyKeys.length > 0 ? (
                <ul className="list-disc list-inside ml-4 mt-1">
                  {config.supabaseKeyKeys.map((key) => (
                    <li key={key} className="font-mono">{key}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-red-600 ml-4 mt-1">No se encontraron variables de Key</p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold mb-4">Variables de entorno esperadas (en orden de prioridad):</h2>
        <div className="space-y-2 text-sm">
          <div>
            <strong>URL:</strong>
            <ul className="list-disc list-inside ml-4 mt-1">
              <li>SUPABASE_URL</li>
              <li>NEXT_PUBLIC_SUPABASE_URL</li>
              <li>SUPABASE_SUPABASE_URL</li>
              <li>SUPABASE_NEXT_PUBLIC_SUPABASE_URL</li>
            </ul>
          </div>
          <div className="mt-4">
            <strong>Service Role Key:</strong>
            <ul className="list-disc list-inside ml-4 mt-1">
              <li>SUPABASE_SERVICE_ROLE_KEY</li>
              <li>SUPABASE_SUPABASE_SERVICE_ROLE_KEY</li>
            </ul>
          </div>
          <div className="mt-4">
            <strong>Anon Key (si no hay Service Role Key):</strong>
            <ul className="list-disc list-inside ml-4 mt-1">
              <li>SUPABASE_ANON_KEY</li>
              <li>NEXT_PUBLIC_SUPABASE_ANON_KEY</li>
              <li>SUPABASE_SUPABASE_ANON_KEY</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

