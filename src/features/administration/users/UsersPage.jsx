import { useState } from 'react';
import { useCurrentUser } from '../../../app/userContext.js';
import {
  Badge, Button, ConfirmDialog, DataTable, EmptyState, ErrorState, Pagination, Skeleton, Tabs,
} from '../../../components/ui/index.js';
import { ROLE_LABELS } from '../../../services/format.js';
import { useResource } from '../../../services/useResource.js';
import { useSubmit } from '../../../services/useSubmit.js';
import { listAll } from '../catalogsAdminApi.js';
import { listRoles, listUsers, updateUser } from '../usersApi.js';
import { PendingAccountsPanel } from './PendingAccountsPanel.jsx';
import { ResetPasswordDialog } from './ResetPasswordDialog.jsx';
import { UserFormDialog } from './UserFormDialog.jsx';

const PAGE_SIZE = 20;

const ACCOUNT_BADGES = {
  PENDIENTE: { tone: 'warning', label: 'Pendiente' },
  RECHAZADA: { tone: 'danger', label: 'Rechazada' },
};

export function AccountBadge({ user }) {
  const account = ACCOUNT_BADGES[user.estadoCuenta];
  if (account) return <Badge tone={account.tone}>{account.label}</Badge>;
  return user.activo ? <Badge tone="success">Activo</Badge> : <Badge tone="neutral">Inactivo</Badge>;
}

async function loadOptions(signal) {
  const [roles, areas] = await Promise.all([listRoles(signal), listAll('areas', signal)]);
  return { roles, areas };
}

/** Solo cuentas activas y aprobadas, y nunca la propia (el backend responde 403). */
export function canResetPassword(user, currentUser) {
  return user.activo && (user.estadoCuenta === undefined || user.estadoCuenta === 'ACTIVA') && user.id !== currentUser?.id;
}

/** Lista de cuentas con alta, edición, desactivación y restablecimiento de contraseña. */
function UsersList({ options }) {
  const currentUser = useCurrentUser();
  const [page, setPage] = useState(0);
  const [editing, setEditing] = useState(null); // null | 'nuevo' | usuario
  const [deactivating, setDeactivating] = useState(null);
  const [resetting, setResetting] = useState(null);
  const { data, error, status, reload } = useResource((signal) => listUsers({ page, size: PAGE_SIZE }, signal), [page]);
  const toggle = useSubmit((user, activo) => updateUser(user.id, { activo }));

  const roleLabel = (code) => options.roles.find((r) => r.codigo === code)?.nombre || ROLE_LABELS[code] || code;
  const areaLabel = (id) => (id ? options.areas.find((a) => a.id === id)?.nombre || `Área ${id}` : '—');

  async function setActive(user, activo) {
    const result = await toggle.submit(user, activo);
    if (result.ok) {
      setDeactivating(null);
      reload();
    }
  }

  const columns = [
    { key: 'nombreCompleto', header: 'Nombre completo' },
    { key: 'correo', header: 'Correo', render: (u) => <span className="mono-soft">{u.correo}</span> },
    { key: 'rol', header: 'Rol', render: (u) => roleLabel(u.rol) },
    { key: 'areaId', header: 'Área', render: (u) => areaLabel(u.areaId) },
    { key: 'activo', header: 'Estado', render: (u) => <AccountBadge user={u} /> },
    {
      key: 'acciones',
      header: 'Acciones',
      render: (u) => (
        <div className="row-actions">
          <Button variant="ghost" onClick={() => setEditing(u)}>Editar</Button>
          {u.id !== currentUser?.id && u.activo && (
            <Button variant="ghost" onClick={() => setDeactivating(u)}>Desactivar</Button>
          )}
          {!u.activo && (
            <Button variant="ghost" pending={toggle.pending} onClick={() => setActive(u, true)}>Activar</Button>
          )}
          {canResetPassword(u, currentUser) && (
            <Button variant="ghost" onClick={() => setResetting(u)}>Restablecer contraseña</Button>
          )}
        </div>
      ),
    },
  ];

  let content;
  if (status === 'error' && !data) content = <ErrorState error={error} onRetry={reload} />;
  else if (!data) content = <Skeleton lines={5} />;
  else if (data.totalElements === 0) content = <EmptyState title="No hay usuarios registrados" />;
  else {
    content = (
      <>
        <DataTable caption="Usuarios" columns={columns} rows={data.items} getRowKey={(u) => u.id} />
        <Pagination page={data.page} size={data.size} totalElements={data.totalElements} onChange={setPage} />
      </>
    );
  }

  return (
    <>
      <div className="section-toolbar">
        {data && <p className="page__lead">{data.totalElements} usuarios</p>}
        <Button onClick={() => setEditing('nuevo')}>Crear usuario</Button>
      </div>
      {toggle.error && !deactivating && <p className="form-error" role="alert">{toggle.error.detail}</p>}
      {content}
      <UserFormDialog
        open={editing !== null}
        user={editing === 'nuevo' ? null : editing}
        roles={options.roles}
        areas={options.areas}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          reload();
        }}
      />
      {resetting && <ResetPasswordDialog key={resetting.id} user={resetting} onClose={() => setResetting(null)} />}
      <ConfirmDialog
        open={deactivating !== null}
        title="Desactivar usuario"
        message={deactivating ? `${deactivating.nombreCompleto} no podrá iniciar sesión y se cerrarán sus sesiones activas.` : ''}
        confirmLabel="Desactivar"
        tone="danger"
        pending={toggle.pending}
        onConfirm={() => setActive(deactivating, false)}
        onCancel={() => {
          setDeactivating(null);
          toggle.reset();
        }}
      >
        {toggle.error && <p className="form-error" role="alert">{toggle.error.detail}</p>}
      </ConfirmDialog>
    </>
  );
}

/** P12: usuarios y bandeja de cuentas auto-registradas. */
export default function UsersPage() {
  const { data: options, error, reload } = useResource((signal) => loadOptions(signal), []);
  let users;
  if (error) users = () => <ErrorState error={error} onRetry={reload} />;
  else if (!options) users = () => <Skeleton lines={5} />;
  else users = () => <UsersList options={options} />;

  return (
    <section className="page">
      <header className="page__header">
        <h1>Administración de usuarios</h1>
      </header>
      <Tabs
        label="Secciones de usuarios"
        tabs={[
          { id: 'usuarios', label: 'Usuarios', render: users },
          { id: 'pendientes', label: 'Pendientes de aprobación', render: () => <PendingAccountsPanel /> },
        ]}
      />
    </section>
  );
}
