// ================== VARIABLES GLOBALES ==================
let usuarios = [];
let usuariosFiltrados = null;
let usuarioEditandoId = null;

const tabla = document.querySelector("#tablaDocumentos tbody");
const paginacion = document.getElementById("paginacionContainer");

// Modales sin Bootstrap
const modalDetalle = crearModal();
const modalFormulario = crearModalFormulario();

let paginaActual = 1;
const elementosPorPagina = 10;
let ordenActual = { campo: null, ascendente: true };

// ================== FUNCIONES ==================

// Renderizar tabla
function renderTabla() {
  tabla.innerHTML = "";
  const lista = usuariosFiltrados ?? usuarios;

  // Ordenamiento
  if (ordenActual.campo) {
    lista.sort((a, b) => {
      const campo = ordenActual.campo;
      const valorA = a[campo] ? a[campo].toString().toLowerCase() : "";
      const valorB = b[campo] ? b[campo].toString().toLowerCase() : "";
      if (valorA < valorB) return ordenActual.ascendente ? -1 : 1;
      if (valorA > valorB) return ordenActual.ascendente ? 1 : -1;
      return 0;
    });
  }

  // Paginación
  const inicio = (paginaActual - 1) * elementosPorPagina;
  const fin = inicio + elementosPorPagina;
  const usuariosPagina = lista.slice(inicio, fin);

  usuariosPagina.forEach((u, index) => {
    const esActivo = u.estado === "activo";
    const botonColor = esActivo ? "btn-orange" : "btn-success";
    const rotacion = esActivo ? "" : "transform: rotate(180deg);";

    const fila = document.createElement("tr");
    fila.innerHTML = `
      <td>${inicio + index + 1}</td>
      <td>${u.nombre}</td>
      <td>${u.apellidos}</td>
      <td>${u.correo}</td>
      <td>${u.fecha_nacimiento}</td>
      <td>${u.dni}</td>
      <td>${u.sexo}</td>
      <td>${u.contrasena}</td>
      <td>${u.rol}</td>
      <td class="col-acciones">
        <div class="d-flex justify-content-center flex-wrap gap-1">
          <button class="btn btn-info btn-sm" onclick="verUsuario(${u.id})" title="Ver">
            <img src="/static/img/ojo.png" alt="ver">
          </button>
          <button class="btn btn-warning btn-sm" onclick="editarUsuario(${u.id})" title="Editar">
            <img src="/static/img/lapiz.png" alt="editar">
          </button>
          <button class="btn ${botonColor} btn-sm" onclick="cambiarEstado(${u.id})" title="${esActivo ? 'Dar de baja' : 'Dar de alta'}">
            <img src="/static/img/flecha-hacia-abajo.png" alt="estado" style="${rotacion}">
          </button>
          <button class="btn btn-danger btn-sm" onclick="eliminarUsuario(${u.id})" title="Eliminar">
            <img src="/static/img/x.png" alt="eliminar">
          </button>
        </div>
      </td>
    `;
    tabla.appendChild(fila);
  });

  renderPaginacion();
}

// ================== PAGINACIÓN ==================
function renderPaginacion() {
  paginacion.innerHTML = "";
  const totalPaginas = Math.ceil(usuarios.length / elementosPorPagina);
  if (totalPaginas <= 1) return;

  const ul = document.createElement("ul");
  ul.className = "pagination";

  const crearItem = (numero, activo = false, disabled = false, texto = null) => {
    const li = document.createElement("li");
    li.className = `page-item ${activo ? "active" : ""} ${disabled ? "disabled" : ""}`;
    li.innerHTML = `<button class="page-link" onclick="cambiarPagina(${numero})">${texto || numero}</button>`;
    return li;
  };

  ul.appendChild(crearItem(paginaActual - 1, false, paginaActual === 1, "<"));

  const start = Math.max(1, paginaActual - 2);
  const end = Math.min(totalPaginas, paginaActual + 2);

  if (start > 1) {
    ul.appendChild(crearItem(1, paginaActual === 1));
    if (start > 2) ul.appendChild(crearItem(null, false, true, "..."));
  }

  for (let i = start; i <= end; i++) {
    ul.appendChild(crearItem(i, paginaActual === i));
  }

  if (end < totalPaginas) {
    if (end < totalPaginas - 1) ul.appendChild(crearItem(null, false, true, "..."));
    ul.appendChild(crearItem(totalPaginas, paginaActual === totalPaginas));
  }

  ul.appendChild(crearItem(paginaActual + 1, false, paginaActual === totalPaginas, ">"));

  paginacion.appendChild(ul);
}

function cambiarPagina(pagina) {
  if (pagina < 1 || pagina > Math.ceil(usuarios.length / elementosPorPagina)) return;
  paginaActual = pagina;
  renderTabla();
}

// ================== CRUD ==================
function agregarUsuario(datos) {
  usuarios.push({
    id: Date.now(),
    ...datos,
    estado: "activo",
  });
  renderTabla();
}

function editarUsuario(id) {
  const usuario = usuarios.find((u) => u.id === id);
  if (!usuario) return;
  abrirModalFormulario("editar", usuario);
}

function eliminarUsuario(id) {
  const usuario = usuarios.find((u) => u.id === id);
  if (!usuario) return;
  if (!confirm(`¿Seguro que deseas eliminar al usuario "${usuario.nombre} ${usuario.apellidos}"?`)) return;
  usuarios = usuarios.filter((u) => u.id !== id);
  renderTabla();
}

function cambiarEstado(id) {
  const usuario = usuarios.find((u) => u.id === id);
  if (!usuario) return;
  usuario.estado = usuario.estado === "activo" ? "inactivo" : "activo";
  renderTabla();
}

function verUsuario(id) {
  const usuario = usuarios.find((u) => u.id === id);
  if (!usuario) return;
  abrirModalFormulario("ver", usuario);
}

// ================== MODALES ==================
function crearModal() {
  const modalHTML = document.createElement("div");
  modalHTML.innerHTML = `
    <div class="modal" id="modalDetalle">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Detalle del Usuario</h5>
            <button type="button" class="btn-cerrar" onclick="cerrarModal('modalDetalle')">&times;</button>
          </div>
          <div class="modal-body" id="modalDetalleContenido"></div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modalHTML);
  return document.getElementById("modalDetalle");
}

function crearModalFormulario() {
  const modalHTML = document.createElement("div");
  modalHTML.innerHTML = `
    <div class="modal" id="modalFormulario">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="modalFormularioTitulo"></h5>
            <button type="button" class="btn-cerrar" onclick="cerrarModal('modalFormulario')">&times;</button>
          </div>
          <div class="modal-body">
            <form id="formModalUsuario">
              <input type="text" id="modalNombre" placeholder="Nombre" required class="form-control mb-2">
              <input type="text" id="modalApellidos" placeholder="Apellidos" required class="form-control mb-2">
              <input type="email" id="modalCorreo" placeholder="Correo" required class="form-control mb-2">
              <input type="date" id="modalFecha" required class="form-control mb-2">
              <input type="text" id="modalDNI" placeholder="DNI" required class="form-control mb-2">
              <select id="modalSexo" required class="form-control mb-2">
                <option value="">Seleccione Sexo</option>
                <option value="Masculino">Masculino</option>
                <option value="Femenino">Femenino</option>
              </select>
              <input type="password" id="modalContrasena" placeholder="Contraseña" required class="form-control mb-2">
              <input type="text" id="modalRol" placeholder="Rol" required class="form-control mb-3">
              <div class="modal-footer">
                <button type="submit" class="btn btn-modal btn-modal-primary" id="btnGuardar">Aceptar</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modalHTML);
  return document.getElementById("modalFormulario");
}

function abrirModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.add("activo");
}

function cerrarModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove("activo");
}

function abrirModalFormulario(modo, usuario = null) {
  const titulo = document.getElementById("modalFormularioTitulo");
  const form = document.getElementById("formModalUsuario");
  const campos = {
    nombre: document.getElementById("modalNombre"),
    apellidos: document.getElementById("modalApellidos"),
    correo: document.getElementById("modalCorreo"),
    fecha_nacimiento: document.getElementById("modalFecha"),
    dni: document.getElementById("modalDNI"),
    sexo: document.getElementById("modalSexo"),
    contrasena: document.getElementById("modalContrasena"),
    rol: document.getElementById("modalRol"),
  };

  // Limpia o rellena
  for (const key in campos) campos[key].disabled = false;

  if (modo === "agregar") {
    titulo.textContent = "Agregar Usuario";
    form.onsubmit = (e) => {
      e.preventDefault();
      const nuevo = {};
      for (const key in campos) nuevo[key] = campos[key].value.trim();
      agregarUsuario(nuevo);
      cerrarModal("modalFormulario");
    };
  } else if (modo === "editar" && usuario) {
    titulo.textContent = "Editar Usuario";
    for (const key in campos) campos[key].value = usuario[key];
    form.onsubmit = (e) => {
      e.preventDefault();
      for (const key in campos) usuario[key] = campos[key].value.trim();
      cerrarModal("modalFormulario");
      renderTabla();
    };
  } else if (modo === "ver" && usuario) {
    titulo.textContent = "Detalle del Usuario";
    for (const key in campos) {
      campos[key].value = usuario[key];
      campos[key].disabled = true;
    }
    form.onsubmit = (e) => {
      e.preventDefault();
      cerrarModal("modalFormulario");
    };
  }

  abrirModal("modalFormulario");
}

// ================== BÚSQUEDA ==================
const inputUsuario = document.getElementById("inputDocumento");
const btnBuscar = document.getElementById("btn_buscar");

btnBuscar.addEventListener("click", () => {
  const termino = inputUsuario.value.trim().toLowerCase();
  usuariosFiltrados =
    termino === ""
      ? null
      : usuarios.filter((u) =>
          u.nombre.toLowerCase().includes(termino)
        );
  paginaActual = 1;
  renderTabla();
});

// ================== EVENTO PRINCIPAL ==================
document.getElementById("formDocumento").addEventListener("submit", (e) => {
  e.preventDefault();
  abrirModalFormulario("agregar");
});



renderTabla();
