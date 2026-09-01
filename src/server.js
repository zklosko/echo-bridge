// echo-host-server.js
import dgram from 'node:dgram';
import { EventEmitter } from 'node:events';
import { createControllerState } from './state.js';
import { parseCommand } from './protocol.js';
import { FadeEngine } from './fade-engine.js';
import {
  buildHelpReply,
  buildOffGetReply,
  buildPstGetReply,
  buildZoneIntGetReply,
  buildSyncGetReply,
  buildSpaceDumpLines,
  buildSeqGetReply,
} from './reply-builder.js';
import { isValidIPv4, isValidPort } from './validate.js';

/**
 * Removes eom character from incoming command
 * @param {string} buffer
 * @param {string} eom
 * @returns
 */
function splitCommands(buffer, eom) {
  return buffer
    .toString('ascii')
    .split(eom)
    .map(s => s.trim())
    .filter(Boolean);
}

/**
 * Class representing the Echo Interface's transport server
 */
export class EchoServer extends EventEmitter {
  #socket;
  #eom;
  #port;
  #fadeEngine;
  #subscribers = new Map(); // Map<address, port>
  state;

  constructor({ listenPort, eom = '\n', subscribers = [] } = {}) {
    super();
    this.state = createControllerState();
    this.#eom = eom;
    this.#fadeEngine = new FadeEngine(this.state, spaceId =>
      this.#notifyChange(spaceId),
    );
    this.#bindSocket(listenPort);

    for (const sub of subscribers) this.addSubscriber(sub.address, sub.port);
  }

  /**
   * Creates UDP server for both incoming and outgoing commands
   * @param {number} port
   */
  #bindSocket(port) {
    this.#socket = dgram.createSocket('udp4');
    this.#socket.on('message', (msg, rinfo) => this.#handleMessage(msg, rinfo));
    this.#socket.on('error', e => this.emit('error', e));
    this.#socket.bind(port);
    this.#port = port;
  }

  get port() {
    return this.#port;
  }
  get eom() {
    return this.#eom;
  }
  set eom(value) {
    if (!value) throw new Error('eom must be a non-empty string')
    this.#eom = value;
  }

  /**
   * Updates listen port for UDP server, then restarts server
   * @param {number} port
   * @returns
   */
  updatePort(port) {
    return new Promise((res, reject) => {
      this.#socket.close(() => {
        try {
          this.#bindSocket(port);
          res();
        } catch (e) {
          reject(e);
        }
      });
    });
  }

  /**
   * Adds subscriber record to state
   * @param {string} address
   * @param {number} port
   */
  addSubscriber(address, port) {
    if (!isValidIPv4(address)) {
      throw new Error(`Invalid IPv4 Address: ${address}`);
    }
    if (!isValidPort(port)) {
      throw new Error(`Invalid port: ${port}`);
    }

    const key = `${address}:${port}`;
    this.#subscribers.set(key, { address, port });
    this.emit('subscribersChanged', this.listSubscribers());
  }

  updateSubscriber(oldAddress, oldPort, newAddress, newPort) {
    if (!isValidIPv4(newAddress)) {
      throw new Error(`Invalid IPv4 Address: ${newAddress}`);
    }
    if (!isValidPort(newPort)) {
      throw new Error(`Invalid port: ${newPort}`);
    }

    const oldKey = `${oldAddress}:${oldPort}`;
    const newKey = `${newAddress}:${newPort}`;

    this.#subscribers.delete(oldKey);
    this.#subscribers.set(newKey, { address: newAddress, port: newPort });
    this.emit('subscribersChanged', this.listSubscribers());
  }

  /**
   * Removes subscriber record from state
   * @param {string} address
   * @param {number} port
   */
  removeSubscriber(address, port) {
    this.#subscribers.delete(`${address}:${port}`);
    this.emit('subscribersChanged', this.listSubscribers());
  }

  /**
   * Lists subscriber records from state
   * @returns string[] of subscribers
   */
  listSubscribers() {
    return [...this.#subscribers.values()];
  }

  #broadcastToSubscribers(spaceId) {
    if (this.#subscribers.size === 0) return;

    const dump = Buffer.from(
      buildSpaceDumpLines(spaceId, this.state, this.#eom),
      'ascii',
    );
    for (const { address, port } of this.#subscribers.values()) {
      this.#socket.send(dump, port, address);
    }
  }

  #notifyChange(spaceId) {
    this.emit('statusChange', spaceId, this.state.getSpace(spaceId));
    this.#broadcastToSubscribers(spaceId);
  }

  /**
   * Emits event 'log' to update frontend when new data arrives
   * @param {*} direction
   * @param {string} raw
   * @param {dgram.RemoteInfo} rinfo
   */
  #log(direction, raw, rinfo) {
    this.emit('log', {
      direction,
      raw: raw.trim(),
      address: rinfo.address,
      port: rinfo.port,
      timestamp: Date.now(),
    });
  }

  #reply(str, rinfo) {
    const buf = Buffer.from(str, 'ascii');
    this.#socket.send(buf, rinfo.port, rinfo.address);
    this.#log('out', str, rinfo);
  }

  #handleMessage(msg, rinfo) {
    for (const raw of splitCommands(msg, this.#eom)) {
      this.#log('in', raw, rinfo);
      const cmd = parseCommand(raw);
      this.#dispatch(cmd, rinfo);
    }
  }

  /**
   * Runs appropriate callback for received command based on verb
   * @param {*} command
   * @param {dgram.RemoteInfo} rinfo
   */
  #dispatch(command, rinfo) {
    switch (command.type) {
      case 'setPreset':
        this.state.setPreset(command.spaceId, command.presetId);
        this.#notifyChange(command.spaceId);
        break;
      case 'off':
        this.#fadeEngine.requestSpaceOff(command.spaceId, command.time ?? 0);
        break;
      case 'zoneIntensity':
        this.#fadeEngine.requestZoneLevel(
          command.spaceId,
          command.zoneId,
          command.level,
          command.time ?? 0,
        );
        break;
      case 'seqActivate':
        this.state.setSequence(command.spaceId, command.seqId, true);
        break;
      case 'seqDeactivate':
        this.state.setSequence(command.spaceId, command.seqId, false);
        break;
      case 'presetGet':
        this.#reply(
          buildPstGetReply(command.spaceId, this.state, this.#eom),
          rinfo,
        );
        break;
      case 'offGet':
        this.#reply(
          buildOffGetReply(command.spaceId, this.state, this.#eom),
          rinfo,
        );
        break;
      case 'zoneIntensityGet':
        this.#reply(
          buildZoneIntGetReply(command.spaceId, this.state, this.#eom),
          rinfo,
        );
        break;
      case 'syncGet':
        this.#reply(
          buildSyncGetReply(command.spaceId, this.state, this.#eom),
          rinfo,
        );
        break;
      case 'seqGet':
        this.#reply(
          buildSeqGetReply(command.spaceId, this.state, this.#eom),
          rinfo,
        );
        break;
      case 'help':
        this.#reply(buildHelpReply(this.#eom), rinfo);
        break;
      default:
        break;
    }
  }

  /**
   * Shuts down UDP server and fade engine
   */
  close() {
    this.#fadeEngine.stop();
    this.#socket.close();
  }
}
