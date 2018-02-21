var express = require('express');

var fileUpload = require('express-fileupload');

var app = express();

// default options
app.use(fileUpload());

app.put('/:tipo/:id', (req, res) => {

    var tipo = req.params.tipo;
    var id = req.params.id;

    // Tipos de colección
    var tiposValidos = ['hospitales', 'medicos', 'usuarios'];

    if (tiposValidos.indexOf(tipo) < 0) {
        return res.status(400).json({
            ok: false,
            mensaje: 'Colección no válida',
            errors: {message: 'Las colecciones válidas son ' + tiposValidos.join(', ')}
        });
    }

    if (!req.files) {
        return res.status(400).json({
            ok: false,
            mensaje: 'No selecciono nada',
            errors: {message: 'Debe seleccionar una imagen'}
        });
    }

    // Obtener nombre del archivo

    var archivo = req.files.imagen;
    var nombreCortado = archivo.name.split('.');
    var extensionArchivo = nombreCortado[nombreCortado.length - 1];

    //Solo estas extensiones aceptamos

    var extensionesValidas = ['png', 'jpg', 'gif', 'jpeg'];

    if (extensionesValidas.indexOf(extensionArchivo) < 0) {
        return res.status(400).json({
            ok: false,
            mensaje: 'Extensión no válida',
            errors: {message: 'Las extensiones válidas son ' + extensionesValidas.join(', ')}
        });
    }

    // Nombre de archivo personalizado
    var nombreArchivo = `${ id }-${ new Date().getMilliseconds()}.${ extensionArchivo }`;

    // Mover el archivo del temporal a un path
    var path  = `./uploads/${ tipo }/${nombreArchivo}`;

    archivo.mv(path, err =>{
        if (err){
            return res.status(500).json({
                ok: false,
                mensaje: 'Error al mover archivo',
                errors: err
            });
        }

        res.status(200).json({
            ok: true,
            mensaje: 'Archivo movido'
        });
    });



});

module.exports = app;