// Importar módulo o librerias.
const http = require("http"); // Crear el servidor web
const fs = require("fs"); // Leer y escribir los archivos.
const path = require("path") // Gestionar rutas. 
const querystring = require("querystring"); // Leer datos envíados desde los formularios.


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
