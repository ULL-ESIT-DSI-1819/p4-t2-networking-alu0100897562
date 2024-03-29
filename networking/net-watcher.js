'use strict';
const fs = require('fs');
const net = require('net');
const filename = process.argv[2];

if (!filename) {
    throw Error('Error: No filename specified.');
}

net.createServer(connection => {
    // Reporting.
    console.log('Suscriber connected.');
    connection.write(`Now watcing "${filename}" for changes...\n`);

    // Watcher setup.
    const watcher = 
    fs.watch(filename, () => connection.write(`File changed: ${new Date()}\n`));

    // Cleanup.
    connection.on('close', () => {
        console.log('Suscriber disconnected.');
        watcher.close();
    });

}).listen(60300, () => console.log('Listening for suscribers...'));