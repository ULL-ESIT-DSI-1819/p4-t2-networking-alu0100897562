'use strict';

/** -- Sección declarativa del código -- */

/** Variable donde cargamos EventEmitter del módulo events */
const EventEmitter = require('events').EventEmitter;

/** Variable donde cargamos el módulo dev-null */
const devnull = require('dev-null');



/** -- Sección funcional del código -- */

/** 
 * Función auxiliar que comprueba si el string que se le pasa como
 * parámetro está en formato JSON o no, devolviendo true o false
 * @param {string} str - String a comprobar
 */
function isJSON(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}

/**
 * Clase LDJClient, que hereda de EventEmitter
 */
class LDJClient extends EventEmitter {
    /**
     * Constructor de la clase que recibe un stream
     * @param {stream} stream 
     */
    constructor(stream) {
        super();

        if (stream === null){
            throw Error('Error: No message specified.');
        }
        else {
            let buffer = '';
            stream.on('data', data => {
                buffer += data;
                let boundary = buffer.indexOf('\n');
                while (boundary !== -1) {
                    const input = buffer.substring(0, boundary); // Subcadena desde el inicio a la posición \n
                    buffer = buffer.substring(boundary + 1); // Se quita la subcadena del buffer
                    if (isJSON(input)) {
                        this.emit('message', JSON.parse(input));
                    }
                    else {
                        throw Error('Error: No JSON format.'); 
                    }
                    boundary = buffer.indexOf('\n'); // Siguiente fin de mensaje
                }
                stream.on('close', () => {
                    this.emit('message', JSON.parse(buffer)); 
                });
            });
        }
    }

    /**
     * Método static que evita a los usuarios instanciar la clase
     * @param {stream} stream 
     */
    static connect(stream) {
        return new LDJClient(stream);
    }
}

module.exports = LDJClient;