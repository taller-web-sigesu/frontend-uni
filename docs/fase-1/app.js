'use strict';

/* ============================================================
   Gestal · Prototipo Fase I
   HTML + CSS + JavaScript puro, datos simulados con fetch.
   No usa backend ni frameworks. La sesión es simulada.
   ============================================================ */

const STORAGE_KEY = 'gestal-fase1-solicitudes';
const SESSION_KEY = 'gestal-fase1-sesion';

const FALLBACK_DATA = {
  areas: [
    { id: 1, nombre: 'Soporte informático' },
    { id: 2, nombre: 'Mantenimiento' }
  ],
  categorias: [
    { id: 1, nombre: 'Soporte informático', areaId: 1, prioridadPredeterminadaId: 2 },
    { id: 2, nombre: 'Mantenimiento', areaId: 2, prioridadPredeterminadaId: 3 }
  ],
  prioridades: [
    { id: 1, nombre: 'Baja', nivel: 1 },
    { id: 2, nombre: 'Media', nivel: 2 },
    { id: 3, nombre: 'Alta', nivel: 3 },
    { id: 4, nombre: 'Crítica', nivel: 4 }
  ],
  tecnicos: [
    { id: 1, nombre: 'Luis Técnico', areaId: 1 },
    { id: 2, nombre: 'María Técnica', areaId: 1 },
    { id: 3, nombre: 'Carlos Mantenimiento', areaId: 2 }
  ],
  solicitudes: [
    {
      id: 1,
      codigo: 'SOL-2026-000101',
      solicitante: 'Ana Estudiante',
      correo: 'ana@universidad.example',
      categoriaId: 1,
      ubicacion: 'Laboratorio 204 - Pabellón nuevo',
      descripcion: 'La computadora del laboratorio no enciende y hay una clase a las 10:00.',
      prioridadId: 3,
      estado: 'Nuevo',
      areaId: 1,
      responsableId: null,
      fecha: '2026-11-10T09:15:00',
      historial: [{ estado: 'Nuevo', fecha: '2026-11-10T09:15:00', autor: 'Ana Estudiante' }],
      comentarios: []
    },
    {
      id: 2,
      codigo: 'SOL-2026-000102',
      solicitante: 'Ana Estudiante',
      correo: 'ana@universidad.example',
      categoriaId: 2,
      ubicacion: 'Pabellón antiguo - Aula 105',
      descripcion: 'La puerta del aula no cierra correctamente.',
      prioridadId: 2,
      estado: 'Asignado',
      areaId: 2,
      responsableId: 3,
      fecha: '2026-11-09T14:30:00',
      historial: [
        { estado: 'Nuevo', fecha: '2026-11-09T14:30:00', autor: 'Ana Estudiante' },
        { estado: 'Asignado', fecha: '2026-11-09T15:00:00', autor: 'Supervisor' }
      ],
      comentarios: []
    },
    {
      id: 3,
      codigo: 'SOL-2026-000103',
      solicitante: 'Pedro Docente',
      correo: 'docente@universidad.example',
      categoriaId: 1,
      ubicacion: 'Laboratorio 301',
      descripcion: 'El proyector no muestra imagen.',
      prioridadId: 3,
      estado: 'En proceso',
      areaId: 1,
      responsableId: 1,
      fecha: '2026-11-08T08:20:00',
      historial: [
        { estado: 'Nuevo', fecha: '2026-11-08T08:20:00', autor: 'Pedro Docente' },
        { estado: 'Asignado', fecha: '2026-11-08T09:00:00', autor: 'Supervisor' },
        { estado: 'En proceso', fecha: '2026-11-08T10:15:00', autor: 'Luis Técnico' }
      ],
      comentarios: []
    }
  ]
};

const state = {
  data: null,
  solicitudes: [],
  user: null,
  currentView: 'list',
  selectedId: null,
  filters: { estado: 'Todos', search: '' },
  managementFilter: 'Todos'
};

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

const els = {
  loginView: $('#login-view'),
  appView: $('#app-view'),
  loginForm: $('#login-form'),
  loginError: $('#login-error'),
  email: $('#email'),
  password: $('#password'),
  roleSelect: $('#role-select'),
  userName: $('#user-name'),
  userRole: $('#user-role'),
  userAvatar: $('#user-avatar'),
  viewTitle: $('#view-title'),
  listTable: $('#list-table'),
  listEmpty: $('#list-empty'),
  kpis: $('#kpis'),
  filterStatus: $('#filter-status'),
  filterSearch: $('#filter-search'),
  newForm: $('#new-form'),
  newCategory: $('#new-category'),
  newPriority: $('#new-priority'),
  newLocation: $('#new-location'),
  newDescription: $('#new-description'),
  newEvidence: $('#new-evidence'),
  detailTitle: $('#detail-title'),
  detailContent: $('#detail-content'),
  managementTable: $('#management-table'),
  managementStatus: $('#management-status'),
  toast: $('#toast')
};

/* ---------- Utilidades ---------- */

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function formatDate(iso) {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat('es-PE', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date);
}

function formatDateOnly(iso) {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium' }).format(date);
}

function badgeForStatus(estado) {
  const slug = String(estado).toLowerCase().replaceAll(' ', '-');
  return `<span class="badge badge-${escapeHtml(slug)}">${escapeHtml(estado)}</span>`;
}

function priorityFor(id) {
  const priority = state.data.prioridades.find((item) => item.id === Number(id));
  if (!priority) return '—';
  return `<span class="priority priority-${priority.nombre.toLowerCase()}">${escapeHtml(priority.nombre)}</span>`;
}

function categoryName(id) {
  return state.data.categorias.find((item) => item.id === Number(id))?.nombre ?? 'Sin categoría';
}

function areaName(id) {
  return state.data.areas.find((item) => item.id === Number(id))?.nombre ?? 'Sin área';
}

function technicianName(id) {
  if (!id) return 'Sin asignar';
  return state.data.tecnicos.find((item) => item.id === Number(id))?.nombre ?? 'Sin asignar';
}

function nextCode() {
  const year = new Date().getFullYear();
  const numbers = state.solicitudes
    .map((item) => Number(String(item.codigo).split('-').pop()))
    .filter((value) => Number.isFinite(value));
  const next = (numbers.length ? Math.max(...numbers) : 100) + 1;
  return `SOL-${year}-${String(next).padStart(6, '0')}`;
}

function findRequest(id) {
  return state.solicitudes.find((item) => item.id === Number(id));
}

function isManagementRole() {
  return ['Técnico', 'Supervisor', 'Administrador'].includes(state.user?.role);
}

function isSupervisorOrAdmin() {
  return ['Supervisor', 'Administrador'].includes(state.user?.role);
}

function currentTechnician() {
  return state.data.tecnicos.find((item) => item.nombre === state.user?.name) ?? null;
}

function canAttend(request) {
  if (!request) return false;
  if (state.user?.role === 'Administrador') return true;
  if (state.user?.role !== 'Técnico') return false;
  const technician = currentTechnician();
  return Boolean(technician && request.responsableId === technician.id);
}

function visibleRequestsForList() {
  if (isManagementRole()) return state.solicitudes;
  return state.solicitudes.filter((item) => {
    return item.correo === state.user?.email || item.solicitante === state.user?.name;
  });
}

function visibleRequestsForManagement() {
  if (state.user?.role === 'Técnico') {
    const technician = currentTechnician();
    return technician
      ? state.solicitudes.filter((item) => item.responsableId === technician.id)
      : [];
  }
  return state.solicitudes;
}

function saveRequests() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.solicitudes));
  } catch {
    /* El prototipo sigue funcionando en memoria. */
  }
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.hidden = false;
  window.clearTimeout(showToast.timeout);
  showToast.timeout = window.setTimeout(() => {
    els.toast.hidden = true;
  }, 3200);
}

/* ---------- Carga de datos ---------- */

async function loadData() {
  try {
    const response = await fetch('./data.json', { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    state.data = await response.json();
  } catch {
    state.data = structuredClone(FALLBACK_DATA);
    showToast('Modo local: se usaron datos de respaldo. Abre con un servidor para probar fetch.');
  }

  let saved = null;
  try {
    saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
  } catch {
    saved = null;
  }

  state.solicitudes = Array.isArray(saved) && saved.length
    ? saved
    : structuredClone(state.data.solicitudes);
}

/* ---------- Login y sesión ---------- */

function roleFromEmail(email) {
  const local = String(email).split('@')[0].toLowerCase();
  if (local.includes('admin')) return 'Administrador';
  if (local.includes('supervisor')) return 'Supervisor';
  if (local.includes('tecnico') || local.includes('técnico')) return 'Técnico';
  if (local.includes('docente')) return 'Docente';
  return 'Estudiante';
}

function nameFromEmail(email, role) {
  const local = String(email).split('@')[0].toLowerCase();
  if (local.includes('ana')) return 'Ana Estudiante';
  if (local.includes('pedro')) return 'Pedro Docente';
  if (local.includes('tecnico')) return 'Luis Técnico';
  if (local.includes('supervisor')) return 'Sofía Supervisora';
  if (local.includes('admin')) return 'Admin General';
  return role === 'Docente' ? 'Docente Demo' : 'Usuario Demo';
}

function validateLogin() {
  let valid = true;
  $$('[data-error-for]', els.loginForm).forEach((node) => {
    node.textContent = '';
  });

  const email = els.email.value.trim();
  const password = els.password.value;

  if (!email) {
    $('[data-error-for="email"]', els.loginForm).textContent = 'Ingresa tu correo institucional.';
    valid = false;
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    $('[data-error-for="email"]', els.loginForm).textContent = 'El correo no tiene un formato válido.';
    valid = false;
  }

  if (!password) {
    $('[data-error-for="password"]', els.loginForm).textContent = 'Ingresa tu contraseña.';
    valid = false;
  }

  return valid;
}

function handleLogin(event) {
  event.preventDefault();
  els.loginError.hidden = true;

  if (!validateLogin()) return;

  const email = els.email.value.trim();
  const password = els.password.value;

  if (password !== 'Demo2026!') {
    els.loginError.textContent = 'Correo o contraseña incorrectos. Usa la contraseña de demostración Demo2026!.';
    els.loginError.hidden = false;
    return;
  }

  const role = roleFromEmail(email);
  state.user = {
    email,
    role,
    name: nameFromEmail(email, role)
  };

  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(state.user));
  } catch {
    /* Sesión solo en memoria. */
  }

  showApp();
}

function restoreSession() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null');
    if (saved?.email) {
      state.user = saved;
      return true;
    }
  } catch {
    /* Sin sesión guardada. */
  }
  return false;
}

function logout() {
  state.user = null;
  state.selectedId = null;
  state.currentView = 'list';
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* Sin sesión guardada. */
  }
  els.appView.hidden = true;
  els.loginView.hidden = false;
  els.loginForm.reset();
  els.loginError.hidden = true;
}

/* ---------- Navegación ---------- */

function setView(view) {
  state.currentView = view;
  if (view === 'detail' && state.selectedId) {
    renderDetail(state.selectedId);
  }
  if (view === 'list') renderList();
  if (view === 'management') renderManagement();

  $$('.view').forEach((section) => {
    section.hidden = section.id !== `view-${view}`;
  });

  $$('.nav-item').forEach((button) => {
    button.classList.toggle('is-active', button.dataset.view === view);
  });

  const titles = {
    list: 'Mis solicitudes',
    new: 'Nueva solicitud',
    detail: 'Detalle de la solicitud',
    management: 'Gestión de área'
  };
  els.viewTitle.textContent = titles[view] ?? 'Gestal';
}

function showApp() {
  els.loginView.hidden = true;
  els.appView.hidden = false;
  els.roleSelect.value = state.user.role;
  els.userName.textContent = state.user.name;
  els.userRole.textContent = state.user.role;
  els.userAvatar.textContent = state.user.name.charAt(0).toUpperCase();

  const managementNav = $('[data-view="management"]');
  if (managementNav) managementNav.hidden = !isManagementRole();

  populateNewForm();
  setView('list');
}

/* ---------- Formulario de nueva solicitud ---------- */

function populateNewForm() {
  els.newCategory.innerHTML = '<option value="">Selecciona una categoría</option>' +
    state.data.categorias
      .map((item) => `<option value="${item.id}">${escapeHtml(item.nombre)}</option>`)
      .join('');

  els.newPriority.innerHTML = '<option value="">Según la categoría</option>' +
    state.data.prioridades
      .map((item) => `<option value="${item.id}">${escapeHtml(item.nombre)}</option>`)
      .join('');
}

function validateNewRequest() {
  let valid = true;
  $$('[data-error-for]', els.newForm).forEach((node) => {
    node.textContent = '';
  });

  const category = els.newCategory.value;
  const location = els.newLocation.value.trim();
  const description = els.newDescription.value.trim();

  if (!category) {
    $('[data-error-for="categoria"]', els.newForm).textContent = 'Selecciona una categoría.';
    valid = false;
  }

  if (!location) {
    $('[data-error-for="ubicacion"]', els.newForm).textContent = 'Indica la ubicación del problema.';
    valid = false;
  }

  if (!description) {
    $('[data-error-for="descripcion"]', els.newForm).textContent = 'Describe el problema o requerimiento.';
    valid = false;
  } else if (description.length < 10) {
    $('[data-error-for="descripcion"]', els.newForm).textContent = 'La descripción debe tener al menos 10 caracteres.';
    valid = false;
  }

  return valid;
}

function handleNewRequest(event) {
  event.preventDefault();
  if (!validateNewRequest()) return;

  const category = state.data.categorias.find((item) => item.id === Number(els.newCategory.value));
  const selectedPriority = els.newPriority.value
    ? Number(els.newPriority.value)
    : category?.prioridadPredeterminadaId ?? 2;

  const now = new Date().toISOString();
  const request = {
    id: Date.now(),
    codigo: nextCode(),
    solicitante: state.user.name,
    correo: state.user.email,
    categoriaId: category.id,
    ubicacion: els.newLocation.value.trim(),
    descripcion: els.newDescription.value.trim(),
    prioridadId: selectedPriority,
    estado: 'Nuevo',
    areaId: category.areaId,
    responsableId: null,
    fecha: now,
    historial: [{ estado: 'Nuevo', fecha: now, autor: state.user.name }],
    comentarios: []
  };

  if (els.newEvidence.files?.[0]) {
    request.evidencia = els.newEvidence.files[0].name;
  }

  state.solicitudes.unshift(request);
  saveRequests();
  els.newForm.reset();
  showToast(`Solicitud ${request.codigo} registrada correctamente.`);
  setView('list');
}

/* ---------- Listado ---------- */

function filteredList() {
  const search = state.filters.search.trim().toLowerCase();
  return visibleRequestsForList().filter((item) => {
    const statusOk = state.filters.estado === 'Todos' || item.estado === state.filters.estado;
    const text = `${item.codigo} ${categoryName(item.categoriaId)} ${item.ubicacion} ${item.descripcion}`.toLowerCase();
    return statusOk && (!search || text.includes(search));
  });
}

function renderKpis() {
  const requests = visibleRequestsForList();
  const pending = requests.filter((item) => ['Nuevo', 'Asignado', 'En proceso'].includes(item.estado)).length;
  const inProgress = requests.filter((item) => item.estado === 'En proceso').length;
  const resolved = requests.filter((item) => ['Resuelto', 'Cerrado'].includes(item.estado)).length;

  const kpis = [
    { label: 'Total registradas', value: requests.length },
    { label: 'Pendientes', value: pending },
    { label: 'En proceso', value: inProgress },
    { label: 'Resueltas / cerradas', value: resolved }
  ];

  els.kpis.innerHTML = kpis
    .map((item) => `<article class="kpi"><span>${escapeHtml(item.label)}</span><strong>${item.value}</strong></article>`)
    .join('');
}

function renderList() {
  renderKpis();
  const requests = filteredList();
  els.listEmpty.hidden = requests.length > 0;

  if (!requests.length) {
    els.listTable.innerHTML = '';
    return;
  }

  els.listTable.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Código</th>
          <th>Categoría</th>
          <th>Ubicación</th>
          <th>Estado</th>
          <th>Prioridad</th>
          <th>Fecha</th>
        </tr>
      </thead>
      <tbody>
        ${requests.map((item) => `
          <tr data-id="${item.id}">
            <td class="cell-code">${escapeHtml(item.codigo)}</td>
            <td>${escapeHtml(categoryName(item.categoriaId))}</td>
            <td class="cell-muted">${escapeHtml(item.ubicacion)}</td>
            <td>${badgeForStatus(item.estado)}</td>
            <td>${priorityFor(item.prioridadId)}</td>
            <td class="cell-muted">${escapeHtml(formatDateOnly(item.fecha))}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

/* ---------- Detalle ---------- */

function renderDetail(id) {
  const request = findRequest(id);
  if (!request) {
    els.detailContent.innerHTML = '<div class="empty-state"><strong>No se encontró la solicitud.</strong></div>';
    return;
  }

  state.selectedId = request.id;
  els.detailTitle.textContent = request.codigo;

  const history = (request.historial ?? [])
    .map((item) => `
      <li>
        <strong>${escapeHtml(item.estado)}</strong>
        <small>${escapeHtml(formatDate(item.fecha))} · ${escapeHtml(item.autor)}</small>
      </li>
    `)
    .join('');

  const comments = (request.comentarios ?? []).length
    ? request.comentarios.map((item) => `
        <article class="comment">
          <header><strong>${escapeHtml(item.autor)}</strong><small>${escapeHtml(formatDate(item.fecha))}</small></header>
          <p>${escapeHtml(item.texto)}</p>
        </article>
      `).join('')
    : '<p class="muted">Todavía no hay comentarios.</p>';

  const technicians = state.data.tecnicos.filter((item) => item.areaId === request.areaId);
  const technicianOptions = (technicians.length ? technicians : state.data.tecnicos)
    .map((item) => `<option value="${item.id}" ${request.responsableId === item.id ? 'selected' : ''}>${escapeHtml(item.nombre)}</option>`)
    .join('');

  const actions = [];
  if (isSupervisorOrAdmin() && ['Nuevo', 'Asignado'].includes(request.estado)) {
    actions.push(`
      <select id="assign-select" aria-label="Técnico responsable">${technicianOptions}</select>
      <button class="btn btn-primary btn-small" type="button" data-action="assign" data-id="${request.id}">Asignar responsable</button>
    `);
  }

  if (canAttend(request) && request.estado === 'Asignado') {
    actions.push(`<button class="btn btn-primary btn-small" type="button" data-action="start" data-id="${request.id}">Iniciar atención</button>`);
  }

  if (canAttend(request) && request.estado === 'En proceso') {
    actions.push(`<button class="btn btn-primary btn-small" type="button" data-action="resolve" data-id="${request.id}">Marcar como resuelta</button>`);
  }

  if (isSupervisorOrAdmin() && request.estado === 'Resuelto') {
    actions.push(`<button class="btn btn-primary btn-small" type="button" data-action="close" data-id="${request.id}">Cerrar solicitud</button>`);
  }

  if (isSupervisorOrAdmin() && !['Cerrado', 'Rechazado'].includes(request.estado)) {
    actions.push(`<button class="btn btn-secondary btn-small" type="button" data-action="reject" data-id="${request.id}">Rechazar</button>`);
  }

  els.detailContent.innerHTML = `
    <div class="detail-grid">
      <div class="card detail-card">
        <h3>Datos de la solicitud</h3>
        <dl class="detail-list">
          <div><dt>Código</dt><dd class="cell-code">${escapeHtml(request.codigo)}</dd></div>
          <div><dt>Estado</dt><dd>${badgeForStatus(request.estado)}</dd></div>
          <div><dt>Solicitante</dt><dd>${escapeHtml(request.solicitante)}</dd></div>
          <div><dt>Prioridad</dt><dd>${priorityFor(request.prioridadId)}</dd></div>
          <div><dt>Categoría</dt><dd>${escapeHtml(categoryName(request.categoriaId))}</dd></div>
          <div><dt>Área responsable</dt><dd>${escapeHtml(areaName(request.areaId))}</dd></div>
          <div><dt>Ubicación</dt><dd>${escapeHtml(request.ubicacion)}</dd></div>
          <div><dt>Responsable</dt><dd>${escapeHtml(technicianName(request.responsableId))}</dd></div>
          <div><dt>Fecha de registro</dt><dd>${escapeHtml(formatDate(request.fecha))}</dd></div>
          <div><dt>Evidencia</dt><dd>${escapeHtml(request.evidencia ?? 'Sin evidencia adjunta')}</dd></div>
        </dl>
        <p class="muted" style="margin-top:16px">${escapeHtml(request.descripcion)}</p>
        <div class="actions">${actions.join('')}</div>
      </div>

      <div class="card detail-card">
        <h3>Historial</h3>
        <ul class="timeline">${history}</ul>
      </div>

      <div class="card detail-card" style="grid-column:1/-1">
        <h3>Comentarios</h3>
        <div class="comment-list">${comments}</div>
        <form id="comment-form" class="comment-form">
          <label for="comment-text">Nuevo comentario</label>
          <textarea id="comment-text" rows="3" placeholder="Escribe un avance, una consulta o una precisión." required></textarea>
          <p class="error" data-error-for="comentario"></p>
          <div><button class="btn btn-primary btn-small" type="submit">Publicar comentario</button></div>
        </form>
      </div>
    </div>
  `;
}

/* ---------- Gestión ---------- */

function renderManagement() {
  if (!isManagementRole()) {
    els.managementTable.innerHTML = '<div class="empty-state"><strong>Esta vista es solo para técnicos, supervisores y administradores.</strong></div>';
    return;
  }

  const requests = visibleRequestsForManagement().filter((item) => {
    return state.managementFilter === 'Todos' || item.estado === state.managementFilter;
  });

  if (!requests.length) {
    els.managementTable.innerHTML = '<div class="empty-state"><strong>No hay solicitudes para este filtro.</strong><span>Cambia el estado o revisa más tarde.</span></div>';
    return;
  }

  els.managementTable.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Código</th>
          <th>Categoría</th>
          <th>Estado</th>
          <th>Prioridad</th>
          <th>Responsable</th>
          <th>Acción</th>
        </tr>
      </thead>
      <tbody>
        ${requests.map((item) => `
          <tr data-id="${item.id}">
            <td class="cell-code">${escapeHtml(item.codigo)}</td>
            <td>${escapeHtml(categoryName(item.categoriaId))}</td>
            <td>${badgeForStatus(item.estado)}</td>
            <td>${priorityFor(item.prioridadId)}</td>
            <td class="cell-muted">${escapeHtml(technicianName(item.responsableId))}</td>
            <td><button class="btn btn-secondary btn-small" type="button" data-action="detail" data-id="${item.id}">Ver detalle</button></td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

/* ---------- Acciones ---------- */

function updateRequest(id, changes, historyEntry, message) {
  const request = findRequest(id);
  if (!request) return;
  Object.assign(request, changes);
  if (historyEntry) request.historial.push(historyEntry);
  saveRequests();
  showToast(message);
  renderList();
  renderManagement();
  if (state.currentView === 'detail') renderDetail(id);
}

function assignTechnician(id) {
  const select = $('#assign-select');
  if (!select) return;
  const technicianId = Number(select.value);
  const technician = state.data.tecnicos.find((item) => item.id === technicianId);
  updateRequest(
    id,
    { responsableId: technicianId, estado: 'Asignado' },
    { estado: 'Asignado', fecha: new Date().toISOString(), autor: state.user.name },
    `Solicitud asignada a ${technician?.nombre ?? 'un técnico'}.`
  );
}

function startAttention(id) {
  updateRequest(
    id,
    { estado: 'En proceso' },
    { estado: 'En proceso', fecha: new Date().toISOString(), autor: state.user.name },
    'Atención iniciada.'
  );
}

function resolveRequest(id) {
  updateRequest(
    id,
    { estado: 'Resuelto' },
    { estado: 'Resuelto', fecha: new Date().toISOString(), autor: state.user.name },
    'Solicitud marcada como resuelta.'
  );
}

function closeRequest(id) {
  if (!window.confirm('¿Confirmas el cierre de la solicitud?')) return;
  updateRequest(
    id,
    { estado: 'Cerrado' },
    { estado: 'Cerrado', fecha: new Date().toISOString(), autor: state.user.name },
    'Solicitud cerrada.'
  );
}

function rejectRequest(id) {
  const reason = window.prompt('Motivo del rechazo (obligatorio):');
  if (reason === null) return;
  if (!reason.trim()) {
    showToast('El motivo del rechazo es obligatorio.');
    return;
  }
  updateRequest(
    id,
    { estado: 'Rechazado', motivoRechazo: reason.trim() },
    { estado: 'Rechazado', fecha: new Date().toISOString(), autor: state.user.name },
    'Solicitud rechazada.'
  );
}

function addComment(id, text) {
  const request = findRequest(id);
  if (!request || !text.trim()) return;
  request.comentarios.push({
    autor: state.user.name,
    rol: state.user.role,
    fecha: new Date().toISOString(),
    texto: text.trim()
  });
  saveRequests();
  showToast('Comentario publicado.');
  renderDetail(id);
}

/* ---------- Eventos ---------- */

function bindEvents() {
  els.loginForm.addEventListener('submit', handleLogin);
  els.newForm.addEventListener('submit', handleNewRequest);

  els.roleSelect.addEventListener('change', () => {
    const namesByRole = {
      Estudiante: 'Ana Estudiante',
      Docente: 'Pedro Docente',
      Técnico: 'Luis Técnico',
      Supervisor: 'Sofía Supervisora',
      Administrador: 'Admin General'
    };
    state.user.role = els.roleSelect.value;
    state.user.name = namesByRole[state.user.role] ?? state.user.name;
    if (!isManagementRole() && state.currentView === 'management') setView('list');
    const managementNav = $('[data-view="management"]');
    if (managementNav) managementNav.hidden = !isManagementRole();
    els.userName.textContent = state.user.name;
    els.userRole.textContent = state.user.role;
    els.userAvatar.textContent = state.user.name.charAt(0).toUpperCase();
    renderList();
    renderManagement();
  });

  els.filterStatus.addEventListener('change', () => {
    state.filters.estado = els.filterStatus.value;
    renderList();
  });

  els.filterSearch.addEventListener('input', () => {
    state.filters.search = els.filterSearch.value;
    renderList();
  });

  els.managementStatus.addEventListener('change', () => {
    state.managementFilter = els.managementStatus.value;
    renderManagement();
  });

  els.newCategory.addEventListener('change', () => {
    const category = state.data.categorias.find((item) => item.id === Number(els.newCategory.value));
    if (category?.prioridadPredeterminadaId) {
      els.newPriority.value = String(category.prioridadPredeterminadaId);
    }
  });

  document.addEventListener('click', (event) => {
    const go = event.target.closest('[data-go]');
    if (go) {
      setView(go.dataset.go);
      return;
    }

    const nav = event.target.closest('[data-view]');
    if (nav) {
      setView(nav.dataset.view);
      return;
    }

    const action = event.target.closest('[data-action]');
    if (action) {
      const id = Number(action.dataset.id);
      if (action.dataset.action === 'detail') {
        state.selectedId = id;
        setView('detail');
      }
      if (action.dataset.action === 'assign') assignTechnician(id);
      if (action.dataset.action === 'start') startAttention(id);
      if (action.dataset.action === 'resolve') resolveRequest(id);
      if (action.dataset.action === 'close') closeRequest(id);
      if (action.dataset.action === 'reject') rejectRequest(id);
      return;
    }

    const row = event.target.closest('tbody tr[data-id]');
    if (row && !event.target.closest('button, select, a')) {
      state.selectedId = Number(row.dataset.id);
      setView('detail');
    }
  });

  els.detailContent.addEventListener('submit', (event) => {
    if (event.target.id !== 'comment-form') return;
    event.preventDefault();
    const input = $('#comment-text', event.target);
    const error = $('[data-error-for="comentario"]', event.target);
    const text = input.value.trim();
    if (!text) {
      error.textContent = 'Escribe un comentario antes de publicar.';
      return;
    }
    error.textContent = '';
    addComment(state.selectedId, text);
  });

  $('#logout').addEventListener('click', logout);

  $('#reset-demo').addEventListener('click', async () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* Sin almacenamiento. */
    }
    await loadData();
    showToast('Datos de demostración restablecidos.');
    setView('list');
  });
}

/* ---------- Arranque ---------- */

async function init() {
  bindEvents();
  await loadData();

  if (restoreSession()) {
    showApp();
  } else {
    els.loginView.hidden = false;
    els.appView.hidden = true;
    els.email.focus();
  }
}

init();
