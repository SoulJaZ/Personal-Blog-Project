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
            throw new Error ("Faltan los datos requeridos");
        }
        const nombreArchivo = `${titulo
            .toLowerCase()
            .replace(/\s+/g, "_")
            .replace(/[^\w-]/g, "")}.json`;
        
        // representa la ruta de la carpeta que contendrá los articulos.
        const rutaArchivo = path.join(ARTICULOS_DIR, nombreArchivo);
        if (fs.existsSync(rutaArchivo)) {
            throw new Error ("El articulo ya existe.");
        }
        
        const articulo = {
            titulo,
            contenido, 
            fecha: new Date(fecha).toISOString() || new Date().toISOString(),
            filename: nombreArchivo
        };

        fs.writeFileSync(rutaArchivo, JSON.stringify(articulo, null, 2));
        return articulo;

    } catch (error) {
        console.error("Error al crear artículo:", error.message);
        throw error;
    }
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
          body { font-family: Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; }
          .article { margin-bottom: 30px; border-bottom: 1px solid #eee; padding-bottom: 20px; }
          .admin-link { display: block; margin-top: 20px; }
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
      articulos.forEach(articulo => {
        listaArticulos += `
          <li>
            <a href="/articulo/${articulo.filename.replace('.json', '')}">
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
        servirPagina(res, '<h1>Artículo no encontrado</h1><p>El artículo solicitado no existe.</p><a href="/">Volver al inicio</a>', 404);
    }
  } else if (url.pathname === "/admin") {
    
    // Implementar el panal de administración.
    servirPagina(res, `
        <h1>Panel de Adminitración</h1>
        <form action="/crear-articulo" method="POST">
        <h2>Crear Nuevo Artículo</h2>
        <div>
          <label for="titulo">Título:</label>
          <input type="text" id="titulo" name="titulo" required>
        </div>
        <div>
          <label for="contenido">Contenido:</label>
          <textarea id="contenido" name="contenido" required></textarea>
        </div>
        <div>
          <label for="fecha">Fecha:</label>
          <input type="date" id="fecha" name="fecha">
        </div>
        <div>
          <label for="password">Contraseña:</label>
          <input type="password" id="password" name="password" required>
        </div>
        <button type="submit">Publicar Artículo</button>
        </form>
        <a href="/" >Volver al inicio.</a>
        `);
  } else if(url.pathname === "/crear-articulo" && req.method === "POST"){

    // Procesar formulario de creación de articulo.
    let body = "";
    req.on("data", (chunk) => body += chunk.toString());
    req.on("end", () => {
        const informacionFormulario = querystring.parse(body);
        
        if (informacionFormulario.password !== ADMIN_PASSWORD) {
            servirPagina(res, "<h1>Acceso denegado</h1><p>Contraseña incorrecta.</p>", 403);
            return;
        }

        try {
            const nuevoArticulo = crearArticulo(
                informacionFormulario.titulo,
                informacionFormulario.contenido,
                informacionFormulario.fecha
            );

            servirPagina(res, `
                     <h1>Artículo creado</h1>
                    <p>El artículo "${nuevoArticulo.titulo}" ha sido creado exitosamente.</p>
                    <a href="/">Volver al inicio</a>
                `);
        } catch (error) {
            servirPagina(res, `
                    <h1>Error al crear artículo</h1>
                    <p>${error.message}</p>
                    <a href="/admin">Volver al panel de administración</a>
                `, 400)
        }
    });
  } else {
    servirPagina(res, `<h1>404 - Página no encontrada</h1><a href="/">Volver al inicio</a>`, 404);
  }
});

// Encender servidor en el puerto 3000.
servidor.listen(PORT, () => {
  console.log(`Servidor funcionando en http, corriendo en el puerto: ${PORT}`);
});
