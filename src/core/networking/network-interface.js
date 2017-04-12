import Debug from 'debug';
import firebase from 'firebase';
import config from '../config';
import { EventDispatcher, Math as MathExt } from 'three';

const debug = Debug('app:network');

export const NetworkEvent = Object.freeze({
  connected:    'NetworkEvent.connected',
  disconnected: 'NetworkEvent.disconnected',
});

export const NetworkDisconnectedReason = Object.freeze({
  manual: 'NetworkDisconnectedReason.manual',
  selfDisconnected: 'NetworkDisconnectedReason.selfDisconnected',
  ownerDisconnected: 'NetworkDisconnectedReason.ownerDisconnected',
});

export const NonexistentRoomError = Symbol();

export function connect(options = {}) {

  // assume the main database
  const database = firebase.database();

  // if the user doesn't provide a room # they are creating (and owning) one
  const owner = (typeof options.room === 'string') === false;
  const userPromise = createUser(database);
  const roomPromise = owner ? createRoom(database) : verifyRoom(database, options.room);

  // reject the connection operation after 2 seconds
  const connectPromise = Promise.all([ userPromise, roomPromise ]);
  const timeoutPromise = new Promise((resolve, reject) => setTimeout(() => reject('timeout'), 2000));

  return Promise.race([
    connectPromise,
    timeoutPromise,
  ]).then(result => {
    const [ user, room ] = result;
    return NetworkInterface({ database, user, room, owner });
  });
}

/**
 * Create a network interface.
 *
 * @param {Object} options - The network options.
 * @param {Object} options.database - The firebase database to use.
 * @param {String} options.room - The room ID to namespace refs with.
 * @param {String} options.user - The user ID to connect with.
 * @param {Boolean} options.owner - True if the user is the owner of the room; the owner is
 * responsible for removing refs upon disconnecting.
 *
 * @return {NetworkInterface}
 * @constructor
 */
function NetworkInterface(options) {

  if (options.database === undefined) throw new Error('options.database is required');
  if (options.user === undefined) throw new Error('options.user is required');
  if (options.room === undefined) throw new Error('options.room is required');
  if (options.owner === undefined) throw new Error('options.owner is required');

  const { database, user, room, owner } = options;
  // a list of refs this interface has loaned out; if we own the room, we need to remove these
  const refs = [];
  // true if the interface has been closed
  let closed = false;
  const networkInterface = Object.create(EventDispatcher.prototype, {
    closed: { get() { return closed; } },
    user:   { get() { return closed ? null : user } },
    room:   { get() { return closed ? null : room } },
    time:   { get() { return Date.now(); } },
  });

  const userRef = database.ref('users').child(user);
  const roomRef = database.ref('rooms').child(room);

  roomRef.on('value', onRoomValue);

  if (owner) {
    userRef.onDisconnect().remove();
    roomRef.onDisconnect().remove();
  } else {
    userRef.onDisconnect().remove();
  }

  /**
   * Close the network interface if the room is removed.
   */
  function onRoomValue(snapshot) {
    if (snapshot.val() === null) {
      if (config.log) debug('room was removed, closing');
      networkInterface.close(NetworkDisconnectedReason.ownerDisconnected);
    }
  }

  /**
   * Create a reference to a data type, name-spaced by the room.
   *
   * @param {String} datatype - The datatype of the ref.
   */
  networkInterface.ref = function (datatype) {
    if (closed) {
      throw new Error('The network interface was closed.');
    } else if (typeof datatype !== 'string' || datatype.length === 0) {
      throw new Error('The data type must be a string.');
    }

    const ref = database.ref(datatype).child(room);

    if (owner) {
      if (config.log) debug(`registering ref "${ datatype }/${ room }" for removal`);
      ref.onDisconnect().remove();
    } else {
      if (config.log) debug(`deferring removal of "${ datatype }/${ room }" to room creator`);
    }

    refs.push(ref);
    return ref;
  };

  /**
   * Remove all of the tracked refs, and then delete the associated user.
   *
   * @return {Promise}
   */
  networkInterface.close = function (reason = NetworkDisconnectedReason.manual) {
    if (closed)
      return Promise.resolve();

    closed = true;
    networkInterface.dispatchEvent({ type: NetworkEvent.disconnected, reason });
    roomRef.off('value', onRoomValue);

    const promises = owner ? refs.map(ref => ref.remove()) : [];

    if (owner) {
      promises.push(userRef.remove());
      promises.push(roomRef.remove());
    } else {
      promises.push(userRef.remove());
      if (config.log) debug('deferring room cleanup to room creator');
    }

    return Promise.all(promises).catch(onNetworkError);
  };

  function onNetworkError(err) {
    console.error('There was an error while disconnecting the network interface; some references might have leaked. Caused by:\n' + err.stack);
    networkInterface.close();
    throw err;
  }

  // The local database updates `.info/connected` with a null value when the socket disconnects.
  database.ref('.info/connected').on('value', (snapshot) => {
    const connected = snapshot.val();

    if (!connected) {
      if (config.log) debug('lost socket connection, closing');
      networkInterface.close(NetworkDisconnectedReason.selfDisconnected);
    }
  });

  return networkInterface;
}

/**
 * Create a user ID that will be automatically removed on disconnect.
 *
 * @return {Promise} A promise for the user ID.
 */
function createUser(database) {
  const ref = database.ref('users').push();
  return ref.set(true).then(nil => ref.key);
}

/**
 * Create a room with a random ID. If it's taken, keep retrying.
 *
 * @return {Promise} resolves to the room ID.
 */
function createRoom(database) {

  const ref = database.ref('rooms');

  let room = null;

  function resolved() {
    if (config.log) debug('room created');
    return room;
  }

  function rejected() {
    if (config.log) debug('room taken, retrying');
    return retry();
  }

  function retry() {
    room = generateRandomRoomID();
    return ref.child(room).set(true).then(resolved, rejected);
  }

  return retry();
}

/**
 * Verify that a room exists; if it does not, reject with the NonexistentRoomError
 *
 * @return {Promise} resolves to the room ID.
 */
function verifyRoom(database, room) {

  const ref = database.ref('rooms').child(room);
  return new Promise((resolve, reject) => {
    ref.once('value', snapshot => {
      snapshot.val() ? resolve(room) : reject(NonexistentRoomError);
    });
  });
}

/**
 * Generate a random alphanumeric room ID.
 *
 * @param {Number} length - The length of the room ID.
 * @return {String} The room ID.
 */
function generateRandomRoomID(length = 4) {
  const charset = config.roomCharset || '0123456789';
  const roomID = [];
  for (let i = 0; i < length; i++) {
    const rand = MathExt.randInt(0, charset.length - 1);
    roomID[i] = charset[rand];
  }
  return roomID.join('');
}
