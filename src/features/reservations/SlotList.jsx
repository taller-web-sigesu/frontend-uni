import { dayLabel, slotLabel } from './reservationColumns.jsx';

/** Franjas libres y ocupadas en orden, como texto (no solo color). */
export function SlotList({ availability }) {
  const slots = [
    ...availability.libres.map((s) => ({ ...s, libre: true })),
    ...availability.ocupadas.map((s) => ({ ...s, libre: false })),
  ].sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
  return (
    <ul className="slot-list" aria-label={`Franjas del ${dayLabel(availability.fecha)}`}>
      {slots.map((slot) => (
        <li key={`${slot.horaInicio}-${slot.libre}`} className={`slot-list__item slot-list__item--${slot.libre ? 'free' : 'busy'}`}>
          {`${slotLabel(slot)} ${slot.libre ? 'libre' : 'ocupada'}`}
        </li>
      ))}
    </ul>
  );
}
