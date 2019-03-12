'use strict';
const EventEmitter = require('events').EventEmitter;
const devnull = require('dev-null');

function isJSON(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}

class LDJClient extends EventEmitter {
    constructor(stream) {
        super();

        if (stream === null){
            //throw Error('Error: No message specified.');
           // process.stderr  // Se queda colgado
             //   .pipe(devnull())
               // .write('ERROR: No message specifed.\n');
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

    static connect(stream) {
        return new LDJClient(stream);
    }
}

module.exports = LDJClient;