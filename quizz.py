from flask import Flask, render_template, request, redirect, url_for, flash
import pymysql, re
from datetime import datetime

app = Flask(__name__)
app.secret_key = "clave_secreta"

def obtener_conexion():
    try:    
        return pymysql.connect(
            host="localhost",
            port=3306,
            user="root",
            password="",
            database="app_daw",
            cursorclass=pymysql.cursors.DictCursor
        )
    except:
        return None

@app.route("/")
def inicio():
    return redirect(url_for("registro"))

@app.route("/registro")
def registro():
    return render_template("registrarse.html")

@app.route("/registrar", methods=["POST"])
def registrar():
    nombres = request.form.get("nombres")
    ape_pat = request.form.get("ape_pat")
    ape_mat = request.form.get("ape_mat")
    correo = request.form.get("correo")
    fecha_nac = request.form.get("fecha_nac")
    dni = request.form.get("dni")
    sexo = request.form.get("sexo")
    password = request.form.get("contrasena")
    password_conf = request.form.get("contrasena_conf")
    terminos = request.form.get("terminos")
    privacidad = request.form.get("privacidad")

    if not re.match(r"[^@]+@[^@]+\.[^@]+", correo):
        flash("Correo inválido", "error")
        return redirect(url_for("registro"))

    if not re.match(r"^\d{8}$", dni):
        flash("El DNI debe tener exactamente 8 dígitos", "error")
        return redirect(url_for("registro"))

    if len(password) < 6:
        flash("La contraseña debe tener al menos 6 caracteres", "error")
        return redirect(url_for("registro"))

    if password != password_conf:
        flash("Las contraseñas no coinciden", "error")
        return redirect(url_for("registro"))

    try:
        datetime.strptime(fecha_nac, "%Y-%m-%d")
    except ValueError:
        flash("Fecha de nacimiento inválida", "error")
        return redirect(url_for("registro"))

    if sexo not in ["M", "F"]:
        flash("Selecciona un sexo válido", "error")
        return redirect(url_for("registro"))

    if not terminos or not privacidad:
        flash("Debes aceptar los términos y la política de privacidad", "error")
        return redirect(url_for("registro"))

    conexion = obtener_conexion()
    if conexion is None:
        return render_template("error.html")

    try:
        with conexion.cursor() as cursor:
            cursor.execute(
            """INSERT INTO usuario 
            (nombres, ape_pat, ape_mat, correo, fecha_nac, password, dni, sexo)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s)""",
            (nombres, ape_pat, ape_mat, correo, fecha_nac, password, dni, 1 if sexo == "M" else 0)
        )

        conexion.commit()
        flash("Usuario registrado con éxito", "success")
        return redirect(url_for("iniciar_sesion"))
    except pymysql.err.IntegrityError as e:
        if "correo" in str(e).lower():
            flash("El correo ya está registrado", "error")
        elif "dni" in str(e).lower():
            flash("El DNI ya está registrado", "error")
        else:
            flash("Error en el registro", "error")
        return redirect(url_for("registro"))
    finally:
        conexion.close()

@app.route("/iniciarSesion")
def iniciar_sesion():
    return render_template("iniciarSesion.html")

@app.route("/login", methods=["POST"])
def procesar_login():
    usuario = request.form.get("usuario")
    contrasena = request.form.get("contrasena")

    if not usuario or not contrasena:
        flash("Debes completar todos los campos", "error")
        return redirect(url_for("iniciar_sesion"))

    conexion = obtener_conexion()
    if conexion is None:
        return render_template("error.html")

    try:
        with conexion.cursor() as cursor:
            cursor.execute("SELECT * FROM usuario WHERE correo=%s AND password=%s", (usuario, contrasena))

            user = cursor.fetchone()

        if user:
            flash("Inicio de sesión exitoso", "success")
            return redirect(url_for("inicio"))
        else:
            flash("Usuario o contraseña incorrectos", "error")
            return redirect(url_for("iniciar_sesion"))
    finally:
        conexion.close()

if __name__ == "__main__":
    app.run(debug=True)
