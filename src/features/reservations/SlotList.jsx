import { dayLabel, slotLabel } from './reservationColumns.jsx';

/** Franjas libres y ocupadas en orden, como texto (no solo color). `current` identifica la reserva en revisión. */
export function SlotList({ availability, current = null }) {
  const slots = [
    ...availability.libres.map((s) => ({ ...s, libre: true })),
    ...availability.ocupadas.map((s) => ({ ...s, libre: false })),
  ].sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
  const isCurrent = (slot) => current
    && slot.horaInicio === current.horaInicio
    && slot.horaFin === current.horaFin;
  return (
    <ul className="slot-list" aria-label={`Franjas del ${dayLabel(availability.fecha)}`}>
      {slots.map((slot) => (
        <li key={`${slot.horaInicio}-${slot.libre}`} className={`slot-list__item slot-list__item--${slot.libre ? 'free' : 'busy'}`}>
          {slot.libre
            ? `${slotLabel(slot)} libre`
            : `${slotLabel(slot)} ${isCurrent(slot) ? 'ocupada por esta solicitud' : 'ocupada'}`}
        </li>
      ))}
    </ul>
  );
}
