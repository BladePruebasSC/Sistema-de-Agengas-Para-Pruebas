import { useState } from 'react';
import { supabase } from '../lib/supabase'; // Ajusta la ruta si tu archivo supabase está en otro lugar

export default function ConsultarCitas() {
  const [telefono, setTelefono] = useState('');
  const [citas, setCitas] = useState<any[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [error, setError] = useState('');

  const buscarCitas = async (e: React.FormEvent) => {
    e.preventDefault();
    setBuscando(true);
    setError('');
    setCitas([]);
    const { data, error } = await supabase
      .from('citas')
      .select('*')
      .eq('telefono', telefono);

    if (error) setError('Error al buscar citas');
    else setCitas(data || []);
    setBuscando(false);
  };

  const eliminarCita = async (id: number) => {
    await supabase.from('citas').delete().eq('id', id);
    setCitas(citas.filter(cita => cita.id !== id));
  };

  return (
    <div>
      <h2>Consultar o eliminar mis citas</h2>
      <form onSubmit={buscarCitas}>
        <input
          type="text"
          placeholder="Tu número de teléfono"
          value={telefono}
          onChange={e => setTelefono(e.target.value)}
          required
        />
        <button type="submit" disabled={buscando}>Buscar</button>
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <ul>
        {citas.map(cita => (
          <li key={cita.id}>
            {cita.fecha} - {cita.hora} - {cita.descripcion}
            <button onClick={() => eliminarCita(cita.id)}>Eliminar</button>
          </li>
        ))}
      </ul>
      {citas.length === 0 && !buscando && telefono && <p>No hay citas para este número.</p>}
    </div>
  );
}