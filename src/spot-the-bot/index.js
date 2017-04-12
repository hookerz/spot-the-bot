import { EventDispatcher } from 'three';
import { NonVRPlayer } from './non-vr-player/non-vr-player';
import { VRPlayer } from './vr-player/vr-player';
import { PlayerManager, PlayerRole } from '../core/player-manager';
import * as Network from '../core/networking/network-interface';
import { default as UI } from '../ui/ui-root';
import { UIEvent } from '../ui/ui-event';
import * as manifest from './manifest';

export function SpotTheBot() {
  const eventbus = new EventDispatcher();

  const ui = new UI({
    el: '#ui',
    data: {
      manifest: manifest.build(),
      eventbus: eventbus,
    }
  });

  eventbus.addEventListener(UIEvent.start, (event) => {
    if (event.network === undefined) throw new Error('The start event needs a network interface.');
    if (event.players === undefined) throw new Error('The start event needs a player interface.');

    const { network, players } = event;

    let ctr;

    if (players.role === PlayerRole.picker) ctr = VRPlayer;
    if (players.role === PlayerRole.helper) ctr = NonVRPlayer;

    if (ctr === undefined) throw new Error('Unknown player role' + players.role);

    const world = ctr({ ui: eventbus, network, players });

    document.getElementById('canvas').appendChild(world.canvas);
  });

}

/**
 * Create a room and reserve the VR player role.
 *
 * @return a Promise for [ network, players ]
 */
export function reserveVRPlayer() {
  return Network.connect().then(network => {

    const players = PlayerManager({ network });
    const reserve = players.reserve(PlayerRole.picker);

    return reserve.then(() => [ network, players ]);
  });
}

/**
 * Join a room and reserve the SR player role.
 *
 * @param {String} room - The room ID.
 *
 * @return a Promise for [ network, players ]
 */
export function reserveSRPlayer(room) {
  if (room === undefined) throw new Error('The SR player must provide a room.');

  return Network.connect({ room }).then(network => {

    const players = PlayerManager({ network });
    const reserve = players.reserve(PlayerRole.helper);

    return reserve.then(() => [ network, players ]);
  })
}
