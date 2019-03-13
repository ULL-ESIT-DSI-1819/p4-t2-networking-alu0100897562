'use strict';

const net = require('net');
const hostname = 'http://localhost';
const port = 8000;

let sockets = [];

net.createServer(connection => {

    sockets.push(connection);
    let id = sockets.indexOf(connection);

    // Reporting.
    console.log(`Guest`);
    connection.write('Welcome to telnet chat!\n');

    // Watcher setup.
    //const watcher = fs.watch(filename, () => connection.write(
    //    JSON.stringify({type: 'changed', timestamp: Date.now()}) + '\n'));

    // Cleanup.
    connection.on('close', () => {
        console.log('Suscriber disconnected.');
    });

}).listen(port, () => console.log(`Server listening at ${hostname}:${port}`));