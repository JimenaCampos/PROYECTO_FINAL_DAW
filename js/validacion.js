document.getElementById("formRegistro").addEventListener("submit", function (e) {
  e.preventDefault();
  const campos = document.querySelectorAll(".datoUsuario");

  // Validar espacios en blanco
  for (let i = 0; i < campos.length; i++) {
    if (campos[i].value.trim() === "") {
      alert("El campo '" + campos[i].name + "' está vacío.");
      campos[i].focus();
      return;
    }
  }

  // Validar correo 
  const correo = document.getElementById("correo").value.trim();
  const regexCorreo = /^[a-zA-Z0-9._%+-]+@[\w.-]+\.[a-zA-Z]{2,}$/;
  if (!regexCorreo.test(correo)) {
    alert("El correo institucional no es válido.");
    document.getElementById("correo").focus();
    return;
  }

  // Validar fecha de nacimiento
  const fecha = document.getElementById("fecha").value;
  if (new Date(fecha) > new Date()) {
    alert("La fecha de nacimiento no puede ser futura.");
    document.getElementById("fecha").focus();
    return;
  }

  // Validar número de documento
  const documento = document.getElementById("documento").value.trim();
  if (!/^\d{8,}$/.test(documento)) {
    alert("El número de documento debe ser numérico y tener al menos 8 dígitos.");
    document.getElementById("documento").focus();
    return;
  }

  // Validar terminos y privacidad
  const terminos = document.querySelector('input[name="terminos"]');
  const privacidad = document.querySelector('input[name="privacidad"]');

  if (!terminos.checked || !privacidad.checked) {
    alert("Debes aceptar los términos y la política de privacidad.");
    return;
  }

  alert("Formulario enviado correctamente.");
});