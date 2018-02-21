var express = require('express');
var bcrypt = require('bcryptjs');
var jwt = require('jsonwebtoken');

var SEED = require('../config/config').SEED;

var GoogleAuth = require('google-auth-library');
var auth = new GoogleAuth;

var app = express();
var Usuario = require('../models/usuario');

const GOOGLE_CLIENT_ID = require('../config/config').GOOGLE_CLIENT_ID;
const GOOGLE_SECRET = require('../config/config').GOOGLE_SECRET;

// ==========================================
// Autentificación google
// ==========================================
app.post('/google', (req, res) => {

    var token = req.body.token || 'XXX';

    var client = new auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_SECRET, '');

    client.verifyIdToken(
        token,
        GOOGLE_CLIENT_ID,  // Specify the CLIENT_ID of the app that accesses the backend
        // Or, if multiple clients access the backend:
        //[CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3],
        (e, login) => {

            if (e) {
                return res.status(400).json({
                    ok: false,
                    mensaje: 'Token no válido',
                    errors: e
                });
            }

            var payload = login.getPayload();
            var userid = payload['sub'];
            // If request specified a G Suite domain:
            //var domain = payload['hd'];

            Usuario.findOne({email: payload.email}, (err, usuario) => {
                if (err) {
                    return res.status(500).json({
                        ok: false,
                        mensaje: 'Error al buscar usuario - login',
                        errors: e
                    });
                }

                if (usuario) {
                    if (usuario.google === false) {
                        return res.status(400).json({
                            ok: false,
                            mensaje: 'Debe de usar su autentificación normal'
                        });
                    } else {

                        // Crear un token!!!
                        usuario.password = ':)';

                        var token = jwt.sign({usuario: usuario}, SEED, {expiresIn: 14400}); // 4 horas

                        res.status(200).json({
                            ok: true,
                            usuario: usuario,
                            token: token,
                            id: usuario._id
                        });
                    }
                } else { //Si el correo no existe en la coleccion de usuarios

                    var usuario = new Usuario();

                    usuario.nombre = payload.name;
                    usuario.email = payload.email;
                    usuario.password = ':)';
                    usuario.img = payload.picture;
                    usuario.google = true;

                    usuario.save((err, usuarioDB)=>{
                        if (err) {
                            return res.status(500).json({
                                ok: false,
                                mensaje: 'Error al buscar usuario - google',
                                errors: e
                            });
                        }

                        var token = jwt.sign({usuario: usuarioDB}, SEED, {expiresIn: 14400}); // 4 horas

                        res.status(200).json({
                            ok: true,
                            usuario: usuarioDB,
                            token: token,
                            id: usuarioDB._id
                        });
                    })
                }
            })
        });
})
// ==========================================
// Autentificación normal
// ==========================================

app.post('/', (req, res) => {

    var body = req.body;

    Usuario.findOne({email: body.email}, (err, usuarioDB) => {

        if (err) {
            return res.status(500).json({
                ok: false,
                mensaje: 'Error al buscar usuario',
                errors: err
            });
        }

        if (!usuarioDB) {
            return res.status(400).json({
                ok: false,
                mensaje: 'Credenciales incorrectas - email',
                errors: err
            });
        }

        if (!bcrypt.compareSync(body.password, usuarioDB.password)) {
            return res.status(400).json({
                ok: false,
                mensaje: 'Credenciales incorrectas - password',
                errors: err
            });
        }

        // Crear un token!!!
        usuarioDB.password = ':)';

        var token = jwt.sign({usuario: usuarioDB}, SEED, {expiresIn: 14400}); // 4 horas

        res.status(200).json({
            ok: true,
            usuario: usuarioDB,
            token: token,
            id: usuarioDB._id
        });

    })


});


module.exports = app;