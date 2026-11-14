import { useState } from 'react';
import { Link } from 'react-router';
import { Button, EmptyState, ErrorState, SelectField, Skeleton, TextArea, TextField } from '../../components/ui/index.js';
import { todayInLima } from '../../services/format.js';
import { useResource } from '../../services/useResource.js';
import { useSubmit } from '../../services/useSubmit.js';
import { dayLabel, slotLabel } from './reservationColumns.jsx';
import { SlotList } from './SlotList.jsx';
import { SLOT_CONFLICT, slotFits } from './reservationRules.js';
import { createReservation, getAvailability, listSpaces } from './reservationsApi.js';
import { useSpaceNames } from './useSpaceNames.js';

export const NO_AVAILABILITY = 'No hay disponibilidad para la fecha seleccionada';
const EMPTY_FORM = { horaInicio: '', horaFin: '', motivo: '', numAsistentes: '' };


function validate(values, libres) {
  const errors = {};
  if (!values.horaInicio) errors.horaInicio = 'Indica la hora de inicio.';
  if (!values.horaFin) errors.horaFin = 'Indica la hora de fin.';
  else if (values.horaInicio && values.horaFin <= values.horaInicio) errors.horaFin = 'La hora de fin debe ser posterior al inicio.';
  if (!errors.horaInicio && !errors.horaFin && !slotFits(libres, values.horaInicio, values.horaFin)) {
    errors.horaInicio = 'La franja debe quedar dentro de un horario libre.';
  }
  if (!values.motivo.trim()) errors.motivo = 'Indica el motivo.';
  const asistentes = values.numAsistentes.trim();
  if (asistentes && !(/^\d+$/.test(asistentes) && Number(asistentes) > 0)) {
    errors.numAsistentes = 'Usa un número entero mayor que cero.';
  }
  return errors;
}

function SpaceList({ data, selectedId, onSelect }) {
  if (data.items.length === 0) return <EmptyState title="No hay espacios con esos filtros" />;
  return (
    <ul className="choice-list" aria-label="Espacios disponibles">
      {data.items.map((space) => {
        const selected = space.id === selectedId;
        return (
          <li key={space.id} className={`choice-list__item${selected ? ' choice-list__item--selected' : ''}`}>
            <div>
              <p className="choice-list__title">{space.nombre}</p>
              <p className="choice-list__meta">
                {[space.tipo?.nombre, space.pabellon, `Capacidad ${space.capacidad}`].filter(Boolean).join(' · ')}
              </p>
              <p className="choice-list__meta">
                {space.horario ? `Horario ${space.horario.horaApertura}–${space.horario.horaCierre}` : 'Cerrado este día'}
              </p>
            </div>
            <Button
              variant="ghost"
              aria-pressed={selected}
              aria-label={`Elegir ${space.nombre}`}
              onClick={() => onSelect(space)}
            >
              {selected ? 'Seleccionado' : 'Elegir'}
            </Button>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * P09: elige espacio y fecha, consulta la disponibilidad (informativa) y
 * registra la reserva pendiente. Duración, anticipación y límite diario los
 * valida el servidor al enviar.
 */
export default function NewReservationPage() {
  const { spaceTypes } = useSpaceNames();
  const [filters, setFilters] = useState({ tipoEspacioId: '', pabellon: '', capacidadMinima: '', fecha: todayInLima() });
  const [selected, setSelected] = useState(null);
  const [values, setValues] = useState(EMPTY_FORM);
  const [localErrors, setLocalErrors] = useState({});
  const [conflict, setConflict] = useState(null);
  const [created, setCreated] = useState(null);

  const capacidad = /^\d+$/.test(filters.capacidadMinima) && Number(filters.capacidadMinima) > 0 ? filters.capacidadMinima : undefined;
  const spaces = useResource(
    (signal) => listSpaces({ ...filters, capacidadMinima: capacidad, pabellon: filters.pabellon.trim(), page: 0, size: 50 }, signal),
    [filters.tipoEspacioId, filters.pabellon, capacidad, filters.fecha],
  );
  const availability = useResource(
    (signal) => (selected && filters.fecha ? getAvailability(selected.id, filters.fecha, signal) : null),
    [selected?.id, filters.fecha],
  );
  const { submit, pending, error, fieldErrors, reset } = useSubmit(createReservation);

  // Solo vale la disponibilidad del espacio y la fecha elegidos: mientras llega
  // la nueva (o si falló) no se muestran ni se usan las franjas anteriores.
  const current = availability.status !== 'error' && availability.data?.espacioId === selected?.id
    && availability.data?.fecha === filters.fecha ? availability.data : null;
  const libres = current?.libres || [];
  const closed = Boolean(current) && libres.length === 0;
  const setFilter = (field) => (event) => setFilters((prev) => ({ ...prev, [field]: event.target.value }));
  const setValue = (field) => (event) => setValues((prev) => ({ ...prev, [field]: event.target.value }));
  const errorFor = (field) => localErrors[field] || fieldErrors[field];

  function selectSpace(space) {
    setSelected(space);
    setValues((prev) => ({ ...prev, horaInicio: '', horaFin: '' }));
    setLocalErrors({});
    setConflict(null);
    reset();
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!selected || closed || !current) return;
    const errors = validate(values, libres);
    setLocalErrors(errors);
    setConflict(null);
    if (Object.keys(errors).length) return;
    const body = {
      espacioId: selected.id,
      fecha: filters.fecha,
      horaInicio: values.horaInicio,
      horaFin: values.horaFin,
      motivo: values.motivo.trim(),
    };
    if (values.numAsistentes.trim()) body.numAsistentes = Number(values.numAsistentes);
    const result = await submit(body);
    if (result.ok) {
      setCreated(result.data);
      return;
    }
    if (result.error?.status === 409 && result.error.codigo === 'FRANJA_OCUPADA') {
      // Se conservan motivo y asistentes; se pide otra franja con la disponibilidad al día.
      setConflict(SLOT_CONFLICT);
      setValues((prev) => ({ ...prev, horaInicio: '', horaFin: '' }));
      availability.reload();
    }
  }

  function startOver() {
    setCreated(null);
    setValues(EMPTY_FORM);
    setLocalErrors({});
    availability.reload();
    reset();
  }

  if (created) {
    return (
      <section className="page">
        <header className="page__header">
          <h1>Reservar ambiente</h1>
        </header>
        <div className="card notice notice--success" role="status">
          <h2>Reserva registrada, pendiente de aprobación</h2>
          <p>Código <strong>{created.codigo}</strong> · {selected?.nombre} · {dayLabel(created.fecha)} {slotLabel(created)}</p>
          <div className="form-actions">
            <Button variant="secondary" onClick={startOver}>Registrar otra</Button>
            <Link className="btn btn--primary" to="/reservas">Ver mis reservas</Link>
          </div>
        </div>
      </section>
    );
  }

  const hasFieldErrors = Object.keys(fieldErrors).length > 0;
  const serverMessage = conflict || (error && !hasFieldErrors ? error.detail : null);

  let spaceContent;
  if (spaces.status === 'error' && !spaces.data) spaceContent = <ErrorState error={spaces.error} onRetry={spaces.reload} />;
  else if (!spaces.data) spaceContent = <Skeleton lines={3} />;
  else spaceContent = <SpaceList data={spaces.data} selectedId={selected?.id} onSelect={selectSpace} />;

  let availabilityContent = null;
  if (selected) {
    if (availability.status === 'error') {
      availabilityContent = <ErrorState error={availability.error} onRetry={availability.reload} />;
    } else if (!current) availabilityContent = <Skeleton lines={2} />;
    else if (closed) availabilityContent = <EmptyState title={NO_AVAILABILITY} />;
    else availabilityContent = <SlotList availability={current} />;
  }

  return (
    <section className="page">
      <header className="page__header">
        <h1>Reservar ambiente</h1>
        <p className="page__lead">Elige espacio, fecha y horario</p>
      </header>
      <div className="filters">
        <SelectField
          label="Tipo de espacio"
          name="tipoEspacioId"
          placeholder="Todos"
          options={spaceTypes.map((t) => ({ value: t.id, label: t.nombre }))}
          value={filters.tipoEspacioId}
          onChange={setFilter('tipoEspacioId')}
        />
        <TextField label="Pabellón" name="pabellon" value={filters.pabellon} onChange={setFilter('pabellon')} />
        <TextField
          label="Capacidad mínima"
          name="capacidadMinima"
          type="number"
          inputMode="numeric"
          min="1"
          value={filters.capacidadMinima}
          onChange={setFilter('capacidadMinima')}
        />
        <TextField label="Fecha" name="fecha" type="date" min={todayInLima()} value={filters.fecha} onChange={setFilter('fecha')} />
      </div>
      <div className="profile-grid">
        <div className="stack">
          <section className="card" aria-labelledby="reserva-espacios">
            <h2 id="reserva-espacios">Espacios disponibles</h2>
            <p className="card__lead">{dayLabel(filters.fecha)}</p>
            {spaceContent}
          </section>
          {selected && (
            <section className="card" aria-labelledby="reserva-disponibilidad">
              <h2 id="reserva-disponibilidad">Disponibilidad · {dayLabel(filters.fecha)}</h2>
              <p className="card__lead">{selected.nombre}. La disponibilidad es informativa; se confirma al enviar.</p>
              {availabilityContent}
            </section>
          )}
        </div>
        <form className="card" onSubmit={handleSubmit} noValidate aria-labelledby="reserva-datos">
          <h2 id="reserva-datos">Datos de la reserva</h2>
          <p className="card__lead">{selected ? `${selected.nombre} · ${dayLabel(filters.fecha)}` : 'Primero elige un espacio.'}</p>
          <TextField
            label="Hora de inicio"
            name="horaInicio"
            type="time"
            step="900"
            value={values.horaInicio}
            onChange={setValue('horaInicio')}
            error={errorFor('horaInicio')}
          />
          <TextField
            label="Hora de fin"
            name="horaFin"
            type="time"
            step="900"
            value={values.horaFin}
            onChange={setValue('horaFin')}
            error={errorFor('horaFin')}
          />
          <TextArea label="Motivo" name="motivo" rows={3} value={values.motivo} onChange={setValue('motivo')} error={errorFor('motivo')} />
          <TextField
            label="Asistentes (opcional)"
            name="numAsistentes"
            type="number"
            inputMode="numeric"
            min="1"
            value={values.numAsistentes}
            onChange={setValue('numAsistentes')}
            error={errorFor('numAsistentes')}
          />
          <p className="notice notice--info">La política vigente de reservas se valida al enviar.</p>
          {serverMessage && <p className="form-error" role="alert">{serverMessage}</p>}
          <div className="form-actions">
            <Link className="btn btn--secondary" to="/reservas">Cancelar</Link>
            <Button type="submit" pending={pending} disabled={!selected || closed || !current}>Registrar reserva</Button>
          </div>
        </form>
      </div>
    </section>
  );
}
