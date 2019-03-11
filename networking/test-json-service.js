'use strict';
const server = require('net').createServer(connection => {
    console.log('Subscriber connected.');

    // Dos trozos de mensaje que juntos forman uno completo
    const firstChunk = '{"type": "changed", "timesta';
    const secondChunk = 'mp":1450694370094}\n';

    // Se envía el primer trozo 
    connection.write(firstChunk);

    // Tras un pequeño retraso, se envía el segundo
    const timer = setTimeout(() => {
        connection.write(secondChunk);
        connection.end();
    }, 100);

    // Se resetea el temporizador cuando la conexión se cierra
    connection.on('end', () => {
        clearTimeout(timer);
        console.log('Subscriber disconnected.');
    });
});

server.listen(60300, function() {
    console.log('Test server listening for subscribers...');
});