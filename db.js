(function () {
    'use strict';

    var PREFIX = 'ggschool_';

    var KEYS = {
        usuarios: PREFIX + 'usuarios',
        clases: PREFIX + 'clases',
        inscripciones: PREFIX + 'inscripciones',
        trabajos: PREFIX + 'trabajos',
        config: PREFIX + 'config',
        sesion: PREFIX + 'sesion'
    };

    var CONFIG_POR_DEFECTO = {
        nombre_escuela: 'E.E.S.T. N°1',
        nombre_sistema: 'Edunet',
        telefono: '',
        email_institucional: '',
        direccion: ''
    };

    function leer(clave, porDefecto) {
        try {
            var crudo = localStorage.getItem(clave);
            if (crudo === null) {
                return porDefecto;
            }
            return JSON.parse(crudo);
        } catch (error) {
            console.error('No se pudo leer el almacenamiento local:', clave, error);
            return porDefecto;
        }
    }

    function escribir(clave, valor) {
        try {
            localStorage.setItem(clave, JSON.stringify(valor));
            return true;
        } catch (error) {
            console.error('No se pudo guardar en el almacenamiento local:', clave, error);
            return false;
        }
    }

    function siguienteId(elementos) {
        return elementos.reduce(function (maximo, elemento) {
            return Math.max(maximo, Number(elemento.id) || 0);
        }, 0) + 1;
    }

    function normalizarEmail(email) {
        return String(email || '').trim().toLowerCase();
    }

    function normalizarTexto(texto) {
        return String(texto || '').trim();
    }

    function eliminarSesion() {
        try {
            localStorage.removeItem(KEYS.sesion);
        } catch (error) {
            console.error('No se pudo eliminar la sesión del almacenamiento local:', error);
        }
    }

    function generarCodigo() {
        var caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        var codigo = '';

        if (window.crypto && typeof window.crypto.getRandomValues === 'function') {
            var valores = new Uint32Array(6);
            window.crypto.getRandomValues(valores);
            for (var i = 0; i < 6; i++) {
                codigo += caracteres.charAt(valores[i] % caracteres.length);
            }
        } else {
            for (var j = 0; j < 6; j++) {
                codigo += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
            }
        }

        return codigo;
    }

    function inicializar() {
        if (leer(KEYS.usuarios, null) === null) {
            escribir(KEYS.usuarios, [
                {
                    id: 1,
                    nombre: 'Administrador',
                    email: 'admin@edunet.com',
                    password: 'admin123',
                    rol: 'administrador',
                    creado_en: new Date().toISOString()
                },
                {
                    id: 2,
                    nombre: 'Profesora Demo',
                    email: 'profesor@edunet.com',
                    password: 'profesor123',
                    rol: 'profesor',
                    creado_en: new Date().toISOString()
                },
                {
                    id: 3,
                    nombre: 'Alumno Demo',
                    email: 'alumno@edunet.com',
                    password: 'alumno123',
                    rol: 'alumno',
                    creado_en: new Date().toISOString()
                }
            ]);
        }

        if (leer(KEYS.clases, null) === null) {
            escribir(KEYS.clases, []);
        }

        if (leer(KEYS.inscripciones, null) === null) {
            escribir(KEYS.inscripciones, []);
        }

        if (leer(KEYS.trabajos, null) === null) {
            escribir(KEYS.trabajos, []);
        }

        if (leer(KEYS.config, null) === null) {
            escribir(KEYS.config, CONFIG_POR_DEFECTO);
        }
    }

    /* ---------------------------------------------------------------------
       Usuarios y sesión
       --------------------------------------------------------------------- */

    function getUsuarios() {
        return leer(KEYS.usuarios, []);
    }

    function registrar(datos) {
        var usuarios = getUsuarios();
        var nombre = normalizarTexto(datos.nombre);
        var email = normalizarEmail(datos.email);
        var password = String(datos.password || '');
        var rol = datos.rol;

        if (!nombre || !email || !password) {
            throw new Error('Completá todos los campos.');
        }

        if (rol !== 'alumno' && rol !== 'profesor') {
            throw new Error('El rol seleccionado no es válido.');
        }

        var existe = usuarios.some(function (usuario) {
            return normalizarEmail(usuario.email) === email;
        });

        if (existe) {
            throw new Error('El email ya está registrado.');
        }

        var nuevoUsuario = {
            id: siguienteId(usuarios),
            nombre: nombre,
            email: email,
            password: password,
            rol: rol,
            creado_en: new Date().toISOString()
        };

        usuarios.push(nuevoUsuario);

        if (!escribir(KEYS.usuarios, usuarios)) {
            throw new Error('No se pudo guardar el usuario en el almacenamiento local.');
        }

        return nuevoUsuario;
    }

    function login(email, password) {
        var usuario = getUsuarios().find(function (item) {
            return normalizarEmail(item.email) === normalizarEmail(email) &&
                String(item.password) === String(password);
        });

        if (!usuario) {
            return null;
        }

        var sesion = {
            usuario_id: usuario.id,
            nombre: usuario.nombre,
            rol: usuario.rol,
            iniciada_en: new Date().toISOString()
        };

        if (!escribir(KEYS.sesion, sesion)) {
            return null;
        }

        return sesion;
    }

    function getSesion() {
        var sesion = leer(KEYS.sesion, null);

        if (!sesion || !sesion.usuario_id) {
            return null;
        }

        var usuario = getUsuarios().find(function (item) {
            return Number(item.id) === Number(sesion.usuario_id);
        });

        if (!usuario) {
            eliminarSesion();
            return null;
        }

        return {
            usuario_id: usuario.id,
            nombre: usuario.nombre,
            rol: usuario.rol,
            iniciada_en: sesion.iniciada_en || null
        };
    }

    function logout() {
        eliminarSesion();
    }

    /* ---------------------------------------------------------------------
       Configuración institucional
       --------------------------------------------------------------------- */

    function getConfig() {
        var guardada = leer(KEYS.config, null);
        var config = {};

        Object.keys(CONFIG_POR_DEFECTO).forEach(function (clave) {
            config[clave] = CONFIG_POR_DEFECTO[clave];
        });

        if (guardada && typeof guardada === 'object') {
            Object.keys(guardada).forEach(function (clave) {
                config[clave] = guardada[clave];
            });
        }

        return config;
    }

    function guardarConfig(datos) {
        var config = getConfig();

        Object.keys(CONFIG_POR_DEFECTO).forEach(function (clave) {
            if (Object.prototype.hasOwnProperty.call(datos, clave)) {
                config[clave] = normalizarTexto(datos[clave]);
            }
        });

        if (!config.nombre_escuela || !config.nombre_sistema) {
            throw new Error('Los campos Nombre de la escuela y Nombre del sistema son obligatorios.');
        }

        if (!escribir(KEYS.config, config)) {
            throw new Error('No se pudo guardar la configuración.');
        }

        return config;
    }

    /* ---------------------------------------------------------------------
       Clases
       --------------------------------------------------------------------- */

    function getClases() {
        return leer(KEYS.clases, []);
    }

    function getClasePorId(id) {
        return getClases().find(function (clase) {
            return Number(clase.id) === Number(id);
        }) || null;
    }

    function getClasePorCodigo(codigo) {
        var buscado = normalizarTexto(codigo).toUpperCase();
        return getClases().find(function (clase) {
            return String(clase.codigo_acceso).toUpperCase() === buscado;
        }) || null;
    }

    function getClasesDeProfesor(profesorId) {
        return getClases()
            .filter(function (clase) {
                return Number(clase.profesor_id) === Number(profesorId);
            })
            .sort(function (a, b) {
                return Number(b.id) - Number(a.id);
            });
    }

    function crearClase(profesorId, nombre, tema) {
        var nombreClase = normalizarTexto(nombre);

        if (!nombreClase) {
            throw new Error('El nombre de la clase es obligatorio.');
        }

        var clases = getClases();
        var codigo;

        do {
            codigo = generarCodigo();
        } while (clases.some(function (clase) {
            return String(clase.codigo_acceso).toUpperCase() === codigo;
        }));

        var nuevaClase = {
            id: siguienteId(clases),
            profesor_id: Number(profesorId),
            nombre_clase: nombreClase,
            tema: normalizarTexto(tema),
            codigo_acceso: codigo,
            creada_en: new Date().toISOString()
        };

        clases.push(nuevaClase);

        if (!escribir(KEYS.clases, clases)) {
            throw new Error('No se pudo guardar la clase en el almacenamiento local.');
        }

        return nuevaClase;
    }

    function eliminarClase(claseId, profesorId) {
        var clases = getClases();
        var clase = clases.find(function (item) {
            return Number(item.id) === Number(claseId) &&
                Number(item.profesor_id) === Number(profesorId);
        });

        if (!clase) {
            return false;
        }

        escribir(KEYS.clases, clases.filter(function (item) {
            return Number(item.id) !== Number(claseId);
        }));

        escribir(KEYS.inscripciones, getInscripciones().filter(function (item) {
            return Number(item.clase_id) !== Number(claseId);
        }));

        escribir(KEYS.trabajos, getTrabajos().filter(function (item) {
            return Number(item.clase_id) !== Number(claseId);
        }));

        return true;
    }

    /* ---------------------------------------------------------------------
       Inscripciones
       --------------------------------------------------------------------- */

    function getInscripciones() {
        return leer(KEYS.inscripciones, []);
    }

    function estaInscripto(claseId, alumnoId) {
        return getInscripciones().some(function (inscripcion) {
            return Number(inscripcion.clase_id) === Number(claseId) &&
                Number(inscripcion.alumno_id) === Number(alumnoId);
        });
    }

    function unirseAClase(codigo, alumnoId) {
        var clase = getClasePorCodigo(codigo);

        if (!clase) {
            return { ok: false, motivo: 'codigo' };
        }

        if (estaInscripto(clase.id, alumnoId)) {
            return { ok: false, motivo: 'duplicado', clase: clase };
        }

        var inscripciones = getInscripciones();

        inscripciones.push({
            id: siguienteId(inscripciones),
            clase_id: clase.id,
            alumno_id: Number(alumnoId),
            fecha: new Date().toISOString()
        });

        if (!escribir(KEYS.inscripciones, inscripciones)) {
            return { ok: false, motivo: 'almacenamiento' };
        }

        return { ok: true, clase: clase };
    }

    function getClasesDeAlumno(alumnoId) {
        var usuarios = getUsuarios();

        return getInscripciones()
            .filter(function (inscripcion) {
                return Number(inscripcion.alumno_id) === Number(alumnoId);
            })
            .map(function (inscripcion) {
                var clase = getClasePorId(inscripcion.clase_id);

                if (!clase) {
                    return null;
                }

                var profesor = usuarios.find(function (usuario) {
                    return Number(usuario.id) === Number(clase.profesor_id);
                });

                return {
                    id: clase.id,
                    nombre_clase: clase.nombre_clase,
                    tema: clase.tema,
                    codigo_acceso: clase.codigo_acceso,
                    profesor_id: clase.profesor_id,
                    profesor_nombre: profesor ? profesor.nombre : 'Profesor'
                };
            })
            .filter(Boolean)
            .sort(function (a, b) {
                return String(a.nombre_clase).localeCompare(String(b.nombre_clase), 'es');
            });
    }

    function getAlumnosDeClase(claseId) {
        var usuarios = getUsuarios();

        return getInscripciones()
            .filter(function (inscripcion) {
                return Number(inscripcion.clase_id) === Number(claseId);
            })
            .map(function (inscripcion) {
                return usuarios.find(function (usuario) {
                    return Number(usuario.id) === Number(inscripcion.alumno_id);
                }) || null;
            })
            .filter(Boolean)
            .sort(function (a, b) {
                return String(a.nombre).localeCompare(String(b.nombre), 'es');
            });
    }

    /* ---------------------------------------------------------------------
       Trabajos
       --------------------------------------------------------------------- */

    function getTrabajos() {
        return leer(KEYS.trabajos, []);
    }

    function getTrabajo(id) {
        return getTrabajos().find(function (trabajo) {
            return Number(trabajo.id) === Number(id);
        }) || null;
    }

    function getTrabajosDeAlumnoEnClase(claseId, alumnoId) {
        return getTrabajos()
            .filter(function (trabajo) {
                return Number(trabajo.clase_id) === Number(claseId) &&
                    Number(trabajo.alumno_id) === Number(alumnoId);
            })
            .sort(function (a, b) {
                return new Date(b.fecha_entrega).getTime() - new Date(a.fecha_entrega).getTime();
            });
    }

    function guardarTrabajo(datos) {
        var titulo = normalizarTexto(datos.titulo_trabajo);

        if (!datos.clase_id || !datos.alumno_id || !titulo || !datos.ggb_base64) {
            throw new Error('Faltan datos requeridos.');
        }

        if (!getClasePorId(datos.clase_id)) {
            throw new Error('La clase indicada no existe.');
        }

        var trabajos = getTrabajos();

        var trabajo = {
            id: siguienteId(trabajos),
            clase_id: Number(datos.clase_id),
            alumno_id: Number(datos.alumno_id),
            titulo_trabajo: titulo,
            ggb_base64: datos.ggb_base64,
            fecha_entrega: new Date().toISOString()
        };

        trabajos.push(trabajo);

        if (!escribir(KEYS.trabajos, trabajos)) {
            throw new Error('No se pudo guardar el trabajo. Es posible que el almacenamiento del navegador esté lleno.');
        }

        return trabajo;
    }

    inicializar();

    window.GGS_DB = {
        KEYS: KEYS,
        getUsuarios: getUsuarios,
        registrar: registrar,
        login: login,
        getSesion: getSesion,
        logout: logout,
        getConfig: getConfig,
        guardarConfig: guardarConfig,
        getClases: getClases,
        getClasePorId: getClasePorId,
        getClasePorCodigo: getClasePorCodigo,
        getClasesDeProfesor: getClasesDeProfesor,
        crearClase: crearClase,
        eliminarClase: eliminarClase,
        getInscripciones: getInscripciones,
        estaInscripto: estaInscripto,
        unirseAClase: unirseAClase,
        getClasesDeAlumno: getClasesDeAlumno,
        getAlumnosDeClase: getAlumnosDeClase,
        getTrabajos: getTrabajos,
        getTrabajo: getTrabajo,
        getTrabajosDeAlumnoEnClase: getTrabajosDeAlumnoEnClase,
        guardarTrabajo: guardarTrabajo
    };
})();
