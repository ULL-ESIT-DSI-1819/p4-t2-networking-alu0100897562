'use strict';

const net = require('net');
const hostname = 'http://localhost';
const port = 8000;

let sockets = [];

function broadcast(from, message) {
    if (sockets.length !== 0) {
        sockets.forEach((socket, index) => {
            if ((index) !== from) {
                socket.write(`Guest${from + 1}> ` + message);
            }
        });
    }
}

net.createServer(connection => {

    sockets.push(connection);

    // Reporting.
    console.log(`Guest${sockets.indexOf(connection) + 1} joined this chat.`);
    connection.write('Welcome to telnet chat!\n');

    // Receiving messages.
    connection.on('data', (message) => {
        console.log(`Guest${sockets.indexOf(connection) + 1}> ` + message);
        broadcast(sockets.indexOf(connection), message);
    });

    // Cleanup.
    connection.on('close', () => {
        console.log(`Guest${sockets.indexOf(connection) + 1} disconnected.`);
        broadcast(sockets.indexOf(connection), `Guest${sockets.indexOf(connection) + 1} disconnected.\n`);
        sockets.splice(sockets.indexOf(connection),1);
    });

}).listen(port, () => console.log(`Server listening at ${hostname}:${port}`));