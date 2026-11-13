import { useState } from 'react';
import { Button, Dialog, SelectField, TextField } from '../../../components/ui/index.js';
import { useSubmit } from '../../../services/useSubmit.js';
import { validatePassword } from '../../auth/passwordPolicy.js';
import { createUser, updateUser } from '../usersApi.js';

export const ROLES_WITH_AREA = ['TECNICO', 'SUPERVISOR'];
const FIELDS = ['nombreCompleto', 'correo', 'telefono', 'rol', 'areaId'];

function initialValues(user) {
  return {
    nombreCompleto: user?.nombreCompleto || '',
    correo: user?.correo || '',
    telefono: user?.telefono || '',
    rol: user?.rol || '',
    areaId: user?.areaId || '',
    contrasenaInicial: '',
  };
}

function localErrors(values, creating) {
  const errors = {};
  if (!values.nombreCompleto.trim()) errors.nombreCompleto = 'Indica el nombre completo.';
  if (!values.correo.trim()) errors.correo = 'Indica el correo.';
  if (!values.rol) errors.rol = 'Elige un rol.';
  if (ROLES_WITH_AREA.includes(values.rol) && !values.areaId) errors.areaId = 'Elige un área.';
  if (creating) {
    const password = validatePassword(values.contrasenaInicial);
    if (password) errors.contrasenaInicial = password;
  }
  return errors;
}

/** Valor normalizado de un campo para el cuerpo (vacío = no enviado o null). */
function normalized(values, field) {
  if (field === 'areaId') return ROLES_WITH_AREA.includes(values.rol) ? values.areaId || null : null;
  const value = values[field].trim();
  return value || null;
}

function createBody(values) {
  const body = {
    nombreCompleto: values.nombreCompleto.trim(),
    correo: values.correo.trim(),
    contrasenaInicial: values.contrasenaInicial,
    rol: values.rol,
  };
  if (ROLES_WITH_AREA.includes(values.rol)) body.areaId = values.areaId;
  if (values.telefono.trim()) body.telefono = values.telefono.trim();
  return body;
}

/** Solo los campos que cambiaron; pasar a un rol sin área envía `areaId: null`. */
function patchBody(values, user) {
  const before = initialValues(user);
  return FIELDS.reduce((patch, field) => {
    const next = normalized(values, field);
    const previous = field === 'areaId' ? user.areaId || null : normalized(before, field);
    if (next !== previous) patch[field] = next;
    return patch;
  }, {});
}

function UserForm({ user, roles, areas, onSaved, onCancel }) {
  const creating = !user;
  const [values, setValues] = useState(() => initialValues(user));
  const [errors, setErrors] = useState({});
  const { submit, pending, error, fieldErrors } = useSubmit((body) => (
    creating ? createUser(body) : updateUser(user.id, body)
  ));

  const set = (field) => (event) => setValues((prev) => ({ ...prev, [field]: event.target.value }));
  const needsArea = ROLES_WITH_AREA.includes(values.rol);
  // El área actual se ofrece aunque esté inactiva, para no perderla al editar otro campo.
  const areaOptions = areas.filter((a) => a.activo || a.id === user?.areaId).map((a) => ({ value: a.id, label: a.nombre }));

  async function handleSubmit(event) {
    event.preventDefault();
    const found = localErrors(values, creating);
    setErrors(found);
    if (Object.keys(found).length) return;
    const body = creating ? createBody(values) : patchBody(values, user);
    if (!creating && Object.keys(body).length === 0) {
      onCancel();
      return;
    }
    const result = await submit(body);
    if (result.ok) onSaved(result.data);
  }

  const conflict = error?.status === 409 ? error.detail : null;
  const serverError = (field) => fieldErrors[field] || (field === 'correo' ? conflict : null);
  const fieldError = (field) => errors[field] || serverError(field);
  const general = error && error.status !== 409 && !Object.keys(fieldErrors).length ? error.detail : null;

  return (
    <form onSubmit={handleSubmit} noValidate>
      <TextField label="Nombre completo" name="nombreCompleto" value={values.nombreCompleto} onChange={set('nombreCompleto')} error={fieldError('nombreCompleto')} autoComplete="off" />
      <TextField label="Correo" name="correo" type="email" value={values.correo} onChange={set('correo')} error={fieldError('correo')} autoComplete="off" />
      <SelectField
        label="Rol"
        name="rol"
        placeholder="Elige un rol"
        options={roles.map((r) => ({ value: r.codigo, label: r.nombre }))}
        value={values.rol}
        onChange={set('rol')}
        error={fieldError('rol')}
      />
      {needsArea && (
        <SelectField label="Área" name="areaId" placeholder="Elige un área" options={areaOptions} value={values.areaId} onChange={set('areaId')} error={fieldError('areaId')} />
      )}
      <TextField label="Teléfono (opcional)" name="telefono" type="tel" value={values.telefono} onChange={set('telefono')} error={fieldError('telefono')} />
      {creating && (
        <TextField
          label="Contraseña inicial"
          name="contrasenaInicial"
          type="password"
          value={values.contrasenaInicial}
          onChange={set('contrasenaInicial')}
          error={fieldError('contrasenaInicial')}
          hint="Al menos 8 caracteres, con una letra y un dígito. Se pedirá cambiarla en el primer ingreso."
          autoComplete="new-password"
        />
      )}
      {general && <p className="form-error" role="alert">{general}</p>}
      <div className="form-actions">
        <Button variant="secondary" onClick={onCancel} disabled={pending}>Cancelar</Button>
        <Button type="submit" pending={pending}>{creating ? 'Crear usuario' : 'Guardar cambios'}</Button>
      </div>
    </form>
  );
}

/** Alta (sin `user`) o edición de una cuenta. Al cerrar se descarta el borrador. */
export function UserFormDialog({ open, user, roles, areas, onSaved, onClose }) {
  return (
    <Dialog open={open} title={user ? 'Editar usuario' : 'Crear usuario'} onClose={onClose}>
      {open && <UserForm key={user?.id || 'nuevo'} user={user} roles={roles} areas={areas} onSaved={onSaved} onCancel={onClose} />}
    </Dialog>
  );
}
