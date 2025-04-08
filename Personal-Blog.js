// Importar módulo o librerias.
const http = require("http"); // Crear el servidor web
const fs = require("fs"); // Leer y escribir los archivos.
const path = require("path"); // Gestionar rutas.
const querystring = require("querystring"); // Leer datos envíados desde los formularios.

// Definir puerto en donde funcionará el servidor.
const PORT = 3000;

// Contraseña para acceder al panel de administración.
const ADMIN_PASSWORD = "1234";

// Función para leer todos los articulos desde la carpeta 'articulos'.
function obtenerArticulos() {
  // representa la ruta de la carpeta que contendrá los articulos.
  const nombreArchivos = fs.readdirSync("./articulos");

  // representa el conjunto de los articulos con un elemento vacio, para almacenar todos los articulos.
  const articulos = [];

  // Recorrer el archivo .json de la carpeta 'articulos'
  nombreArchivos.forEach((nombreArchivo) => {
    // Solo procesar archivos JSON.
    if (nombreArchivo.endsWith(".json")) {
      try {
        const contenido = fs.readFileSync(
          `./articulos/${nombreArchivo}`,
          "utf-8"
        );
        const articulo = JSON.parse(contenido);
        articulo.filename = nombreArchivo; // Guardar nombre del archivo.
        articulos.push(articulo);
      } catch (error) {
        console.error(
          `Error al procesar el archivo: ${nombreArchivo}: `,
          error
        );
      }
    }
  });

  return articulos;
}

// Crear Servidor.
const servidor = http.createServer((req, res) => {
  // Objeto URL para crear la nueva ruta de navegación.
  const url = new URL(req.url, `http://${req.headers.host}`);

  // Condición que verifica si es posible acceder a la página de inicio - lista de articulos.
  if (condition) {
  } else {
    res.writeHead(404);
    res.end("Página no encontrada.");
  }
});

// Encender servidor en el puerto 3000.
servidor.listen(PORT, () => {
  console.log(`Servidor funcionando en http, corriendo en el puerto: ${PORT}`);
});
