'use strict';
const EventEmitter = require('events').EventEmitter;
const devnull = require('dev-null');

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
                    const input = buffer.substring(0, boundary);
                    buffer = buffer.substring(boundary + 1);
                    this.emit('message', JSON.parse(input));
                    boundary = buffer.indexOf('\n');
                }
            });
        }
    }

    static connect(stream) {
        return new LDJClient(stream);
    }
}

module.exports = LDJClient;