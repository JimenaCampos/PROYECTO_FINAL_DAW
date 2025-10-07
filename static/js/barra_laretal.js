fetch('/templates/barra_lateral.html')
  .then(response => response.text())
  .then(data => {
    document.getElementById('barra_lateral-placeholder').innerHTML = data;
  });