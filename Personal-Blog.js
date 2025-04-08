// Importar módulo o librerias.
const http = require("http"); // Crear el servidor web
const fs = require("fs"); // Leer y escribir los archivos.
const path = require("path") // Gestionar rutas. 
const querystring = require("querystring"); // Leer datos envíados desde los formularios.

// Definir puerto en donde funcionará el servidor. 
const PORT = 3000;

// Contraseña para acceder al panel de administración.
const ADMIN_PASSWORD = "1234";


// Función para leer todos los articulos desde la carpeta 'articulos'.
function obtenerArticulos(){

    // representa la ruta de la carpeta que contendrá los articulos.
    const archivos = fs.readFileSync('./articulos');

    // representa el archivo json usado para almacenar la data de los articulos.
    const archivoArticulos = fs.readFileSync("./articulos/archivoArticulos.json");

    // representa el conjunto de los articulos con un elemento vacio, para almacenar todos los articulos. 
    const articulos = [];

    // Recorrer el archivo .json de la carpeta 'articulos'
    archivos.forEach(archivoArticulos => {
        const contenido = archivoArticulos;
        const articulo = JSON.parse(contenido);
        articulo.filename = archivoArticulos;
        articulos.push(articulo);

    });

    return articulos;

};


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
})
