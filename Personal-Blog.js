// Importar módulo o librerias.
const http = require("http"); // Crear el servidor web
const fs = require("fs"); // Leer y escribir los archivos.
const path = require("path"); // Gestionar rutas.
const querystring = require("querystring"); // Leer datos envíados desde los formularios.
const { error } = require("console");

// Definir puerto en donde funcionará el servidor.
const PORT = 3000;
// Contraseña para acceder al panel de administración.
const ADMIN_PASSWORD = "1234";
const ARTICULOS_DIR = path.join(__dirname, "articulos");

// Crear directorio de artículos si no existe
if (!fs.existsSync(ARTICULOS_DIR)) {
  fs.mkdirSync(ARTICULOS_DIR);
}

// Función para leer todos los articulos desde la carpeta 'articulos'.
function obtenerArticulos() {
  try {
    // representa la ruta de la carpeta que contendrá los articulos.
    const nombreArchivos = fs.readdirSync(ARTICULOS_DIR);
    // representa el conjunto de los articulos con un elemento vacio, para almacenar todos los articulos.
    const articulos = [];

    // Recorrer el archivo .json de la carpeta 'articulos'
    nombreArchivos.forEach((nombreArchivo) => {
      // Solo procesar archivos JSON.
      if (nombreArchivo.endsWith(".json")) {
        try {
          const rutaArchivo = path.join(ARTICULOS_DIR, nombreArchivo);
          const contenido = fs.readFileSync(rutaArchivo, "utf-8").trim();

          if (!contenido) {
            console.warn(`Archivo vacio: ${nombreArchivo}`);
            return;
          }

          const articulo = JSON.parse(contenido);
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
            throw new error ("Faltn los datos requeridos");
        }
        const nombreArchivo = `${titulo
            .toLowerCase()
            .replace(/\s+/g, "_")
            .repalce(/[^\w-]/g, "")}.json`;
        
        // representa la ruta de la carpeta que contendrá los articulos.
        const rutaArchivo = fs.readdirSync(ARTICULOS_DIR, nombreArchivo);
        if (fs.existsSync(rutaArchivo)) {
            throw new error ("El articulo ya existe.");
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
  // Objeto URL para crear la nueva ruta de navegación.
  const url = new URL(req.url, `http://${req.headers.host}`);

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
  } else if (url.pathname === "/articulo") {

    // Implementar vista del articulo individualmente. 
    const nombreArchivo = `${url.pathname.split("/articulos/")[1]}.json`;

    try {
        const rutaArchivo = path.join(ARTICULOS_DIR, nombreArchivo);
        const contenidoArchivo = fs.readFileSync(rutaArchivo, "utf-8");
        const articulo = JSON.parse(contenidoArchivo);

        const cuerpoHtmlArticulo = `
            <articule class="articule">
                <h2>${articulo.titulo}</h2>
                <small>${new Date(articulo.fecha).toLocaleDateString()}</small>
                <div>${articulo.contenido.replace(/\n/g, "<br>")}</div>
            </articule>
            <a href="/">Volver al inicio</a>
        `;

        servirPagina(res, cuerpoHtmlArticulo);
    } catch (error) {
        servirPagina(res, '<h1>Artículo no encontrado</h1><p>El artículo solicitado no existe.</p><a href="/">Volver al inicio</a>', 404);
    }
  }
  
  else {
    res.writeHead(404);
    res.end("Página no encontrada.");
  }
});

// Encender servidor en el puerto 3000.
servidor.listen(PORT, () => {
  console.log(`Servidor funcionando en http, corriendo en el puerto: ${PORT}`);
});
