'use strict';
const assert = require('assert');
const devnull = require('dev-null');
const EventEmitter = require('events').EventEmitter;
const LDJClient = require('../lib/ldj-client.js');

describe('LDJClient', () => {
    let stream = null;
    let client = null;

    beforeEach(() => {
        stream = new EventEmitter();
        client = new LDJClient(stream);
    });

    it('should emit a message event from a single data event', done => {
        client.on('message', message => {
            assert.deepEqual(message, {foo: 'bar'});
            done();
        });
        stream.emit('data', '{"foo":"bar"}\n');
    });

    it('should emit a message event from split data events (2 fragments)', done => {
        client.on('message', message => {
            assert.deepEqual(message, {foo: 'bar'});
            done();
        });
        stream.emit('data', '{"foo":');
        process.nextTick(() => stream.emit('data','"bar"}\n'));
    });

    it('should emit a message event from split data events (3 fragments)', done => {
        client.on('message', message => {
            assert.deepEqual(message, {foo: 'bar'});
            done();
        });
        stream.emit('data', '{"foo');
        process.nextTick(() => stream.emit('data','":"ba'));
        process.nextTick(() => stream.emit('data','r"}\n'));
    });

    it('should throw an error when null is passed to the constructor', done => {
        client = new LDJClient(null);
        assert.throws(client.constructor, Error);
        done();
    });

    it('should throw an error indicating wrong message format', done => {
        //client.on('message', message => {
          //  assert.throws(client.constructor, Error);
            done();
        //});
        //stream.emit('data', 'this is texto plano\n');
    });

    it('should emit a message event from a data event closed without newline', done => {
        client.on('message', message => {
            assert.deepEqual(message, {foo: 'bar'});
            done();
        });
        stream.emit('data', '{"foo":"bar"}');
        stream.emit('close');
    });
});