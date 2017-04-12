import { EventDispatcher } from 'three';
import { noop } from '../util';

export const PlayerEvent = Object.freeze({
  // Dispatched when a player (including ourselves) acquires a role.
  roleFilled: 'PlayerEvent.roleFilled',
  // Dispatched when a player (including ourselves) discards a role.
  roleVacated: 'PlayerEvent.roleVacated',
  // Dispatched when all of the roles are filled.
  allRolesFilled: 'PlayerEvent.allRolesFilled',
});

// this enum can't have a namespace or it will break firebase
export const PlayerRole = Object.freeze({
  picker: 'picker',
  helper: 'helper',
});

const PlayerRoleNames = Object.keys(PlayerRole);
const PlayerRoleCount = PlayerRoleNames.length;

/**
 * Create a player manager to keep track of who is connected and what
 * their roles are.
 *
 * @return {PlayerManager}
 * @constructor
 */
export function PlayerManager(options = {}) {

  if (options.network === undefined) {

    throw new Error('The player manager requires a network interface.');

  }

  if (options.network.closed === true) {

    throw new Error('The network must be open when constructing the player manager.');

  }

  const manager = Object.create(EventDispatcher.prototype, {

    /** Our own role in the game. */
    role: {
      get() { return rolesByUser.get(self); },
      set() { throw new Error('The role property is readonly.'); },
    },

    /** True if all the roles are filled. */
    full: {
      get() { return (usersByRole.size === PlayerRoleCount); },
      set() { throw new Error('The full property is readonly.'); },
    },

  });

  const self = options.network.user;

  const usersByRole = new Map();
  const rolesByUser = new Map();

  const playersRef = options.network.ref('players');

  /**
   * Dispatch connect events when a user enters the room.
   */
  playersRef.on('child_added', (snapshot) => {

    const role = snapshot.key;
    const user = snapshot.val();

    if (user === self) {

      playersRef.onDisconnect().update({ [role]: null });

    }

    usersByRole.set(role, user);
    rolesByUser.set(user, role);

    const full = manager.full;

    manager.dispatchEvent({ type: PlayerEvent.roleFilled, full, role, user });

    if (full) manager.dispatchEvent({ type: PlayerEvent.allRolesFilled, full, role, user });

  });

  /**
   * Dispatch disconnect events when a user leaves the room.
   */
  playersRef.on('child_removed', (snapshot) => {

    const role = snapshot.key;
    const user = usersByRole.get(role);

    usersByRole.delete(role);
    rolesByUser.delete(user);

    manager.dispatchEvent({ type: PlayerEvent.roleVacated, full: false, role, user });

  });

  /**
   * Attempt to select a role in the room.
   *
   * @param {String|Array} roles - One or many roles to limit the selection to.
   * @return {Promise}
   */
  manager.reserve = function (roles = PlayerRoleNames) {

    if (Array.isArray(roles) === false) {

      roles = [ roles ];

    }

    return selectRoleFromList(playersRef, self, roles).then(() => manager);

  };

  return manager;

}

/**
 * Assign the self key to the first available role in a list of roles. If none
 * are available, throws an error.
 *
 * @param ref - The database reference with the map of roles.
 * @param self - The database key of ourselves.
 * @param roles - A list of role strings.
 *
 * @return {Promise}
 */
function selectRoleFromList(ref, self, roles) {

  return ref.transaction((data) => {

    if (data === null) data = {};

    for (let role of roles) {

      if (data[role] === self) return data;

    }

    for (let role of roles) {

      if (data[role] === undefined) {

        data[role] = self;
        return data;

      }

    }

    return data;

  }, noop, false).then(result => {

    const data = result.snapshot.val();
    const foundValidRole = roles.some(role => data[role] === self);

    if (foundValidRole === false) throw new Error('Unable to select a role from', roles);

  });

}
