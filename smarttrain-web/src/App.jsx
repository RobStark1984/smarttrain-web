import React, { useState } from 'react';

export default function SmartTrainApp() {
  const [operadores, setOperadores] = useState([
    { id: 1, nombre: 'Juan Pérez', area: 'Ensamble', fechaCert: '2026-11-15' },
    { id: 2, nombre: 'María López', area: 'Pruebas', fechaCert: '2026-09-25' },
    { id: 3, nombre: 'Carlos Ruiz', area: 'Calidad', fechaCert: '2026-09-10' }
  ]);

  const [form, setForm] = useState({ nombre: '', area: '', fechaCert: '' });

  const calcularEstatus = (fecha) => {
    const hoy = new Date();
    const fechaVenc = new Date(fecha);
    const diffDias = Math.ceil((fechaVenc - hoy) / (1000 * 60 * 60 * 24));

    if (diffDias > 60) {
      return { label: 'Vigente', color: '#38a169', dias: diffDias };
    } else if (diffDias >= 20) {
      return { label: 'Próximo a vencer', color: '#dd6b20', dias: diffDias };
    } else {
      return { label: 'Urgente / Expirado', color: '#e53e3e', dias: diffDias };
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.nombre || !form.area || !form.fechaCert) return;
    setOperadores([...operadores, { ...form, id: Date.now() }]);
    setForm({ nombre: '', area: '', fechaCert: '' });
  };

  return (
    <div style={{ padding: '25px', fontFamily: 'Arial, sans-serif', maxWidth: '1000px', margin: '0 auto' }}>
      <h1 style={{ color: '#1a365d' }}>SmartTrain Web - Control de Capacitaciones</h1>
      
      {/* PBI-01: Registro de Operadores */}
      <section style={{ marginBottom: '30px', padding: '20px', border: '1px solid #cbd5e0', borderRadius: '8px', backgroundColor: '#f8fafc' }}>
        <h2 style={{ marginTop: 0, color: '#2b6cb0' }}>Registrar Operador (PBI-01)</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <input 
            type="text" 
            placeholder="Nombre completo" 
            value={form.nombre} 
            onChange={(e) => setForm({...form, nombre: e.target.value})}
            style={{ padding: '8px', flex: '1', minWidth: '200px' }}
          />
          <input 
            type="text" 
            placeholder="Área operativa" 
            value={form.area} 
            onChange={(e) => setForm({...form, area: e.target.value})}
            style={{ padding: '8px', flex: '1', minWidth: '150px' }}
          />
          <input 
            type="date" 
            value={form.fechaCert} 
            onChange={(e) => setForm({...form, fechaCert: e.target.value})}
            style={{ padding: '8px' }}
          />
          <button type="submit" style={{ padding: '8px 16px', backgroundColor: '#2b6cb0', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            Guardar Operador
          </button>
        </form>
      </section>

      {/* PBI-02: Tablero con Semáforo Dinámico */}
      <section style={{ padding: '20px', border: '1px solid #cbd5e0', borderRadius: '8px' }}>
        <h2 style={{ marginTop: 0, color: '#2b6cb0' }}>Tablero de Estatus de Certificaciones (PBI-02)</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
          <thead>
            <tr style={{ backgroundColor: '#2b6cb0', color: 'white' }}>
              <th style={{ padding: '10px', textAlign: 'left' }}>Operador</th>
              <th style={{ padding: '10px', textAlign: 'left' }}>Área</th>
              <th style={{ padding: '10px', textAlign: 'left' }}>Fecha Vencimiento</th>
              <th style={{ padding: '10px', textAlign: 'center' }}>Días Restantes</th>
              <th style={{ padding: '10px', textAlign: 'center' }}>Estatus Semáforo</th>
            </tr>
          </thead>
          <tbody>
            {operadores.map((op) => {
              const estatus = calcularEstatus(op.fechaCert);
              return (
                <tr key={op.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '10px' }}>{op.nombre}</td>
                  <td style={{ padding: '10px' }}>{op.area}</td>
                  <td style={{ padding: '10px' }}>{op.fechaCert}</td>
                  <td style={{ padding: '10px', textAlign: 'center' }}>{estatus.dias} días</td>
                  <td style={{ backgroundColor: estatus.color, color: 'white', fontWeight: 'bold', textAlign: 'center', padding: '10px', borderRadius: '4px' }}>
                    {estatus.label}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </div>
  );
}