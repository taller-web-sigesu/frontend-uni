/** Indicador con etiqueta, valor y una nota opcional. */
export function KpiCard({ label, value, note, variant = 'plain' }) {
  return (
    <div className={`kpi kpi--${variant}`}>
      <p className="kpi__label">{label}</p>
      <p className="kpi__value">{value}</p>
      {note && <p className="kpi__note">{note}</p>}
    </div>
  );
}
