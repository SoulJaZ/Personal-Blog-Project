// Importar módulo o librerias.

const http = require("http"); // Crear el servidor web
const fs = require("fs"); // Leer y escribir los archivos.
const path = require("path"); // Gestionar rutas.
const querystring = require("querystring"); // Leer datos envíados desde los formularios.
const { error } = require("console");

const PORT = 3000; // Definir puerto en donde funcionará el servidor.
const ADMIN_PASSWORD = "1234"; // Contraseña para acceder al panel de administración.
const ARTICULOS_DIR = path.join(__dirname, "articulos");

// Crear directorio de artículos si no existe
if (!fs.existsSync(ARTICULOS_DIR)) {
  fs.mkdirSync(ARTICULOS_DIR);
}

// Función para escapar caracteres especiales (prevención XSS)
function escapeHTML(str) {
  return str.replace(/[&<>"']/g, (match) => {
    const escapes = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return escapes[match];
  });
}

// Función para leer todos los articulos desde la carpeta 'articulos'.
function obtenerArticulos() {
  try {
    const nombreArchivos = fs.readdirSync(ARTICULOS_DIR); // representa la ruta de la carpeta que contendrá los articulos.

    const articulos = []; // representa el conjunto de los articulos con un elemento vacio, para almacenar todos los articulos.

    // Recorrer el archivo .json de la carpeta 'articulos'
    nombreArchivos.forEach((nombreArchivo) => {
      // Solo procesar archivos JSON.
      if (nombreArchivo.endsWith(".json")) {
        try {
          const rutaArchivo = path.join(ARTICULOS_DIR, nombreArchivo);
          const contenidoArchivo = fs.readFileSync(rutaArchivo, "utf-8").trim();

          if (!contenidoArchivo) {
            console.warn(`Archivo vacio: ${nombreArchivo}`);
            return;
          }

          const articulo = JSON.parse(contenidoArchivo);
          articulo.filename = nombreArchivo; // Guardar nombre del archivo.
          articulos.push(articulo);
        } catch (error) {
          console.error(
            `Error al procesar el archivo: ${nombreArchivo}: `,
            error
          );
          console.error(
            `Ruta completa: ${path.resolve(
              __dirname,
              "articulos",
              nombreArchivo
            )}`
          );
        }
      }
    });

    return articulos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha)); // Ordenar por fecha.
  } catch (error) {
    console.error("Error al obtener artículos:", error);
    return [];
  }
}

// Función para guardar/crear un nuevo articulo en el archivo .json
function crearArticulo(titulo, contenido, fecha) {
  try {
    // Validar datos.
    if (!titulo || !contenido || !fecha) {
      throw new Error("Faltan los datos requeridos");
    }
    const nombreArchivo = `${titulo
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^\w-]/g, "")}.json`;

    // representa la ruta de la carpeta que contendrá los articulos.
    const rutaArchivo = path.join(ARTICULOS_DIR, nombreArchivo);
    if (fs.existsSync(rutaArchivo)) {
      throw new Error("El articulo ya existe.");
    }

    const articulo = {
      titulo,
      contenido,
      fecha: new Date(fecha).toISOString() || new Date().toISOString(),
      filename: nombreArchivo,
    };

    fs.writeFileSync(rutaArchivo, JSON.stringify(articulo, null, 2));
    return articulo;
  } catch (error) {
    console.error("Error al crear artículo:", error.message);
    throw error;
  }
}
// Función para editar un articulo
function editarArticulo(
  nombreArchivo,
  nuevoTitulo,
  nuevoContenido,
  nuevaFecha
) {
  // representa la ruta de la carpeta que contendrá los articulos.
  const rutaArticulos = path.join(ARTICULOS_DIR, `${nombreArchivo}.json`);

  if (!fs.existsSync(rutaArticulos)) {
    throw new Error("El artículo no existe.");
  }

  const articulo = {
    titulo: escapeHTML(nuevoTitulo),
    contenido: escapeHTML(nuevoContenido),
    fecha: new Date(nuevaFecha).toISOString(),
    filename: `${nombreArchivo}.json`,
  };

  fs.writeFileSync(rutaArticulos, JSON.stringify(articulo, null, 2));
  return articulo;
}

// Función encarda de generar y aplicar estructura Html y estilos Css, a la metadata del archivo .json que almacena el contenido de los articulos.
function servirPagina(res, contenido, statusCode = 200) {
  const html = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Mi Blog Personal</title>
        <style>
  body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background: #f4f4f4;
    color: #333;
    max-width: 800px;
    margin: 0 auto;
    padding: 40px 20px;
  }

  h1, h2 {
    color: #333;
    text-align: center;
  }

  ul {
    list-style-type: none;
    padding: 0;
  }

  li {
    background: #fff;
    margin-bottom: 15px;
    padding: 15px;
    border-radius: 8px;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  }

  a {
    text-decoration: none;
    color: #0077cc;
  }

  a:hover {
    text-decoration: underline;
  }

  .admin-link, .btn-delete {
    display: inline-block;
    margin-top: 20px;
    color: #fff;
    background: #0077cc;
    padding: 10px 15px;
    border-radius: 5px;
    text-decoration: none;
    transition: background 0.3s ease;
  }

  .admin-link:hover, .btn-delete:hover {
    background: #005fa3;
  }

  form {
    background: #fff;
    padding: 20px;
    margin-bottom: 40px;
    border-radius: 8px;
    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
  }

  form div {
    margin-bottom: 10px;
  }

  input[type="text"],
  input[type="date"],
  input[type="password"],
  textarea {
    width: 100%;
    padding: 5px;
    margin-top: 5px;
    border-radius: 5px;
    border: 1px solid #ccc;
    font-size: 1em;
  }

  button[type="submit"] {
    background-color: #28a745;
    color: white;
    padding: 10px 20px;
    border: none;
    border-radius: 5px;
    cursor: pointer;
  }

  button[type="submit"]:hover {
    background-color: #218838;
  }

  .article h2 {
    margin-bottom: 0;
  }

  .article small {
    display: block;
    color: #777;
    margin-bottom: 10px;
  }

  .article div {
    margin-top: 10px;
    white-space: pre-wrap;
  }
</style>

      </head>
      <body>
        ${contenido}
      </body>
      </html>
    `;

  res.writeHead(statusCode, { "Content-Type": "text/html" });
  res.end(html);
}

// Crear Servidor.
const servidor = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`); // Parsea la URL de la solicitud.

  // Condición que verifica si es posible acceder a la página de inicio - lista de articulos.
  if (url.pathname === "/") {
    const articulos = obtenerArticulos();
    let listaArticulos = "<h1>Bienvenido a Mi Blog</h1>";

    if (articulos.length === 0) {
      listaArticulos += "<p>No hay artículos disponibles.</p>";
    } else {
      listaArticulos += "<ul>";
      articulos.forEach((articulo) => {
        listaArticulos += `
          <li>
            <a href="/articulo/${articulo.filename.replace(".json", "")}">
              ${articulo.titulo}
            </a> 
            (${new Date(articulo.fecha).toLocaleDateString()})
          </li>`;
      });
      listaArticulos += "</ul>";
    }

    listaArticulos += `<a href="/admin" class="admin-link">Administrar</a>`;
    servirPagina(res, listaArticulos);
  } else if (url.pathname.startsWith("/articulo")) {
    // Implementar vista del articulo individualmente.
    const nombreArchivo = `${url.pathname.split("/articulo/")[1]}.json`;

    try {
      const rutaArchivo = path.join(ARTICULOS_DIR, nombreArchivo);
      const contenidoArchivo = fs.readFileSync(rutaArchivo, "utf-8");
      const articulo = JSON.parse(contenidoArchivo);

      const cuerpoHtmlArticulo = `
            <article class="article">
                <h2>${articulo.titulo}</h2>
                <small>${new Date(articulo.fecha).toLocaleDateString()}</small>
                <div>${articulo.contenido.replace(/\n/g, "<br>")}</div>
            </article>
            <a href="/">Volver al inicio</a>
        `;

      servirPagina(res, cuerpoHtmlArticulo);
    } catch (error) {
      servirPagina(
        res,
        '<h1>Artículo no encontrado</h1><p>El artículo solicitado no existe.</p><a href="/">Volver al inicio</a>',
        404
      );
    }
  } else if (url.pathname === "/admin") {
    const articulos = obtenerArticulos();
    // Implementar el panal de administración.
    let panel = `
    <h1>Panel de Administración</h1>
    <form action="/crear-articulo" method="POST">
      <h2>Crear Artículo</h2>
      <div><label>Título: <input type="text" name="titulo" required></label></div>
      <div><label>Contenido: <textarea name="contenido" rows="6" required></textarea></label></div>
      <div><label>Fecha: <input type="date" name="fecha" required></label></div>
      <div><label>Contraseña: <input type="password" name="password" required></label></div>
      <button type="submit">Publicar</button>
    </form>
    <h2>Artículos existentes</h2>
    <ul>`;

    articulos.forEach((articulo) => {
      const nombre = articulo.filename.replace(".json", "");
      panel += `
      <li>
        <strong>${articulo.titulo}</strong> (${new Date(
        articulo.fecha
      ).toLocaleDateString()})<br>
        <a href="/editar?archivo=${nombre}">Editar</a> |
        <a class="btn-delete" href="/eliminar?archivo=${nombre}&password=${ADMIN_PASSWORD}" onclick="return confirm('¿Eliminar este artículo?')">Eliminar</a>
      </li>`;
    });
    panel += `</ul><a href="/">Volver al inicio</a>`;
    servirPagina(res, panel);

    // Crear artículo
  } else if (url.pathname === "/crear-articulo" && req.method === "POST") {
    // Procesar formulario de creación de articulo.
    let body = "";
    req.on("data", (chunk) => (body += chunk.toString()));
    req.on("end", () => {
      const informacionFormulario = querystring.parse(body);

      if (informacionFormulario.password !== ADMIN_PASSWORD) {
        servirPagina(
          res,
          "<h1>Acceso denegado</h1><p>Contraseña incorrecta.</p>",
          403
        );
        return;
      }

      try {
        const nuevoArticulo = crearArticulo(
          informacionFormulario.titulo,
          informacionFormulario.contenido,
          informacionFormulario.fecha
        );

        servirPagina(
          res,
          `
                     <h1>Artículo creado</h1>
                    <p>El artículo "${nuevoArticulo.titulo}" ha sido creado exitosamente.</p>
                    <a href="/">Volver al inicio</a>
                `
        );
      } catch (error) {
        servirPagina(
          res,
          `
                    <h1>Error al crear artículo</h1>
                    <p>${error.message}</p>
                    <a href="/admin">Volver al panel de administración</a>
                `,
          400
        );
      }
    });

    // Editar artículo - formulario
  } else if (url.pathname === "/editar" && req.method === "GET") {
    const nombre = url.searchParams.get("archivo");
    const ruta = path.join(ARTICULOS_DIR, `${nombre}.json`);
    if (!fs.existsSync(ruta)) {
      servirPagina(res, "<h1>Artículo no encontrado</h1>", 404);
      return;
    }
    const articulo = JSON.parse(fs.readFileSync(ruta, "utf-8"));
    servirPagina(
      res,
      `
      <h1>Editar Artículo</h1>
      <form action="/editar-articulo" method="POST">
        <input type="hidden" name="archivo" value="${nombre}">
        <div><label>Título: <input type="text" name="titulo" value="${
          articulo.titulo
        }" required></label></div>
        <div><label>Contenido: <textarea name="contenido" rows="6" required>${
          articulo.contenido
        }</textarea></label></div>
        <div><label>Fecha: <input type="date" name="fecha" value="${new Date(
          articulo.fecha
        )
          .toISOString()
          .slice(0, 10)}" required></label></div>
        <div><label>Contraseña: <input type="password" name="password" required></label></div>
        <button type="submit">Guardar Cambios</button>
      </form>
      <a href="/admin">Volver</a>
    `
    );

    // Guardar edición
  } else if (url.pathname === "/editar-articulo" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => (body += chunk.toString()));
    req.on("end", () => {
      const datos = querystring.parse(body);
      if (datos.password !== ADMIN_PASSWORD) {
        servirPagina(res, "<h1>Contraseña incorrecta</h1>", 403);
        return;
      }
      try {
        editarArticulo(
          datos.archivo,
          datos.titulo,
          datos.contenido,
          datos.fecha
        );
        servirPagina(
          res,
          `<h1>Artículo actualizado</h1><a href="/">Volver</a>`
        );
      } catch (e) {
        servirPagina(res, `<h1>Error</h1><p>${e.message}</p>`, 400);
      }
    });
  } else {
    servirPagina(
      res,
      `<h1>404 - Página no encontrada</h1><a href="/">Volver al inicio</a>`,
      404
    );
  }
});

// Encender servidor en el puerto 3000.
servidor.listen(PORT, () => {
  console.log(`Servidor funcionando en http, corriendo en el puerto: ${PORT}`);
});
