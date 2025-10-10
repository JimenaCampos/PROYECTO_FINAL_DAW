/***** ====== ESTADO Y CONFIG ====== *****/
let preguntas = [];
let indiceEdicion = null;
let mediaDataUrl = null; // DataURL de la imagen en edición

const MAX_OPCIONES = 8;
const COLORES = ["#ef4444", "#3b82f6", "#f59e0b", "#22c55e", "#a855f7", "#14b8a6", "#f97316", "#64748b"];

/***** ====== REFERENCIAS ====== *****/
const btnAdd = document.getElementById("btnAdd");                     // botón Añadir (sidebar)
const slidesContainer = document.getElementById("slidesContainer");   // contenedor de diapositivas
const inputTitulo = document.getElementById("titulo");                // input titulo pregunta
const opcionesContainer = document.querySelector(".opciones");        // grid de opciones
const btnAddMore = document.querySelector(".add-more");               // Añadir más respuesta

// Imagen / Multimedia
const multimediaBox  = document.getElementById("multimediaBox");
const fileInput      = document.getElementById("archivo");
const fileLabelTop   = document.getElementById("fileLabel");          // label superior (cuando no hay imagen)
const mediaPreview   = document.getElementById("mediaPreview");
const mediaActions   = document.getElementById("mediaActions");       // contenedor de botones debajo (cuando hay imagen)
const btnRemoveImage = document.getElementById("btnRemoveImage");     // botón rojo quitar imagen

/***** ====== HELPERS (listas vivas) ====== *****/
const getTextoInputs   = () => Array.from(opcionesContainer.querySelectorAll(".opcion input[type='text']"));
const getCorrectRadios = () => Array.from(opcionesContainer.querySelectorAll(".opcion input[type='radio']"));

/***** ====== NORMALIZACIÓN Y DUPLICADOS ====== *****/
// Normaliza texto: quita tildes, espacios extra y pasa a minúsculas
function normalizarTexto(s) {
  return (s ?? "")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // quita acentos
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

// Devuelve pares de índices duplicados (ej. [[0,2], [1,3]])
function obtenerDuplicados(opciones) {
  const mapa = new Map();
  const duplicados = [];
  opciones.forEach((txt, i) => {
    if (!txt) return; // ignorar vacíos
    const key = normalizarTexto(txt);
    if (mapa.has(key)) {
      duplicados.push([mapa.get(key), i]);
    } else {
      mapa.set(key, i);
    }
  });
  return duplicados;
}

// Quita resaltado de error en todos los inputs de opción
function limpiarErroresOpciones() {
  getTextoInputs().forEach(inp => {
    inp.classList.remove("dupe-error");
    inp.style.outline = "";
    inp.style.boxShadow = "";
  });
}

// Resalta los índices indicados
function resaltarIndices(indices) {
  const inputs = getTextoInputs();
  indices.forEach(i => {
    const el = inputs[i];
    if (!el) return;
    el.classList.add("dupe-error");
    el.style.outline = "2px solid #ef4444";
    el.style.boxShadow = "0 0 0 3px rgba(239,68,68,0.2)";
  });
}

/***** ====== UI IMAGEN ====== *****/
function updateMediaUI() {
  if (mediaDataUrl) {
    mediaPreview.style.backgroundImage = `url('${mediaDataUrl}')`;
    mediaPreview.style.display = "block";
    mediaActions.style.display = "flex";
    multimediaBox.classList.add("has-image");   // oculta botón superior por CSS
  } else {
    mediaPreview.style.display = "none";
    mediaPreview.style.backgroundImage = "";
    fileInput.value = "";
    mediaActions.style.display = "none";
    multimediaBox.classList.remove("has-image");
  }
}

/***** ====== MANEJO ARCHIVO IMAGEN ====== *****/
fileInput.addEventListener("change", () => {
  const file = fileInput.files?.[0];
  if (!file) {
    mediaDataUrl = null;
    updateMediaUI();
    return;
  }
  if (!file.type.startsWith("image/")) {
    alert("⚠️ Selecciona un archivo de imagen (jpg, png, etc.).");
    fileInput.value = "";
    return;
  }
  const reader = new FileReader();
  reader.onload = (e) => {
    mediaDataUrl = e.target.result; // base64 DataURL
    updateMediaUI();
  };
  reader.readAsDataURL(file);
});

btnRemoveImage.addEventListener("click", () => {
  mediaDataUrl = null;
  updateMediaUI();
});

/***** ====== OPCIONES DE RESPUESTA DINÁMICAS ====== *****/
function crearOpcion(index, valor = "") {
  const color = COLORES[(index - 1) % COLORES.length];

  const wrap = document.createElement("div");
  wrap.className = "opcion";
  wrap.style.background = color;

  wrap.innerHTML = `
    <input type="radio" name="correcta" value="${index}" aria-label="Respuesta correcta ${index}">
    <input type="text" placeholder="Añadir respuesta ${index}${index > 2 ? ' (opcional)' : ''}" value="${valor}">
  `;
  opcionesContainer.appendChild(wrap);
}

function asegurarCantidadOpciones(n) {
  let actuales = getTextoInputs().length;
  if (n > MAX_OPCIONES) n = MAX_OPCIONES;
  while (actuales < n) {
    crearOpcion(actuales + 1);
    actuales++;
  }
}

function normalizarIndicesOpciones() {
  const textos = getTextoInputs();
  const radios = getCorrectRadios();

  textos.forEach((input, i) => {
    const idx = i + 1;
    input.placeholder = `Añadir respuesta ${idx}${idx > 2 ? ' (opcional)' : ''}`;
  });

  radios.forEach((radio, i) => {
    radio.value = i + 1; // 1-based
  });
}

/***** ====== DIAPOSITIVAS ====== *****/
function renderSlides() {
  slidesContainer.innerHTML = "<h4>Preguntas guardadas</h4>";

  preguntas.forEach((p, index) => {
    const card = document.createElement("div");
    card.classList.add("slide-item");

    const thumb = p.mediaDataUrl
      ? `<div class="slide-thumb" style="background-image:url('${p.mediaDataUrl}')"></div>`
      : "";

    let opcionesHTML = "";
    p.opciones.forEach((op, i) => {
      if (op && op.trim() !== "") {
        const bg = COLORES[i % COLORES.length];
        const check = (p.correcta === i + 1) ? "✅ " : "";
        opcionesHTML += `<div class="mini-opcion" style="background:${bg}">${check}${op}</div>`;
      }
    });

    card.innerHTML = `
      ${thumb}
      <div class="slide-num">Pregunta ${index + 1}</div>
      <div class="slide-title" title="${p.titulo}">${p.titulo}</div>
      <div class="slide-opciones">${opcionesHTML}</div>
    `;

    card.addEventListener("click", () => cargarPregunta(index));
    slidesContainer.appendChild(card);
  });
}

/***** ====== GUARDAR (AÑADIR/ACTUALIZAR) ====== *****/
btnAdd.addEventListener("click", () => {
  const titulo = inputTitulo.value.trim();
  const textos = getTextoInputs();
  const radios = getCorrectRadios();

  const opciones = textos.map(op => op.value.trim());
  const correctaSel = radios.find(r => r.checked);

  // Validaciones básicas
  if (!titulo) return alert("⚠️ Escribe la pregunta antes de añadir.");
  if (opciones.filter(op => op !== "").length < 2)
    return alert("⚠️ Debes ingresar al menos 2 respuestas con texto.");
  if (!correctaSel) return alert("⚠️ Selecciona una respuesta correcta.");

  // Validación de duplicados (case/acentos/espacios insensitive)
  limpiarErroresOpciones();
  const duplicados = obtenerDuplicados(opciones);
  if (duplicados.length > 0) {
    const indices = Array.from(new Set(duplicados.flat()));
    resaltarIndices(indices);
    alert("⚠️ Hay respuestas duplicadas. Modifica las opciones resaltadas.");
    return;
  }

  const pregunta = {
    titulo,
    opciones,
    correcta: parseInt(correctaSel.value, 10), // 1-based
    mediaDataUrl
  };

  if (indiceEdicion !== null) {
    preguntas[indiceEdicion] = pregunta;
    indiceEdicion = null;
  } else {
    preguntas.push(pregunta);
  }

  renderSlides();

  // Limpiar TODO y volver a estado inicial (4 opciones, sin imagen)
  limpiarFormulario(true);
});

/***** ====== CARGAR PARA EDICIÓN ====== *****/
function cargarPregunta(index) {
  limpiarErroresOpciones();

  const p = preguntas[index];
  indiceEdicion = index;

  inputTitulo.value = p.titulo;

  asegurarCantidadOpciones(p.opciones.length);

  const textos = getTextoInputs();
  const radios = getCorrectRadios();

  textos.forEach((input, i) => input.value = p.opciones[i] || "");
  radios.forEach((r, i) => r.checked = (p.correcta === i + 1));

  mediaDataUrl = p.mediaDataUrl || null;
  updateMediaUI();

  normalizarIndicesOpciones();
}

/***** ====== LIMPIAR FORMULARIO ====== *****/
function limpiarFormulario(recortarA4 = false) {
  limpiarErroresOpciones();

  inputTitulo.value = "";
  getTextoInputs().forEach(i => (i.value = ""));
  getCorrectRadios().forEach(r => (r.checked = false));

  // Reset imagen + UI
  mediaDataUrl = null;
  updateMediaUI();

  if (recortarA4) {
    const todas = Array.from(opcionesContainer.querySelectorAll(".opcion"));
    while (todas.length > 4) {
      opcionesContainer.removeChild(todas.pop());
    }
    normalizarIndicesOpciones();
  }

  // UX: focus al título
  inputTitulo.focus();
}

/***** ====== AÑADIR MÁS RESPUESTA ====== *****/
btnAddMore.addEventListener("click", () => {
  const actuales = getTextoInputs().length;
  if (actuales >= MAX_OPCIONES) {
    alert(`⚠️ Máximo de ${MAX_OPCIONES} respuestas alcanzado.`);
    return;
  }
  crearOpcion(actuales + 1);
  normalizarIndicesOpciones();
});

/***** ====== UX: limpiar error al tipear en una opción ====== *****/
opcionesContainer.addEventListener("input", (e) => {
  const t = e.target;
  if (t && t.matches(".opcion input[type='text']")) {
    t.classList.remove("dupe-error");
    t.style.outline = "";
    t.style.boxShadow = "";
  }
});

/***** ====== INIT ====== *****/
renderSlides();
updateMediaUI(); // asegura estado visual inicial
