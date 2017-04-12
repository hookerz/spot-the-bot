/**
 * Run a coroutine via an event dispatcher, and return a Promise that resolves
 * when the coroutine is done. The iterator is provided the dt on each yield.
 *
 * @param engine - Something that emits events of type eventType.
 * @param iterator - An iterator (probably from a function generator).
 * @param eventType - The type of event to subscribe to
 *
 * @return {Promise}
 */
export function PromisedCoroutine(engine, iterator, eventType='update') {

  return new Promise((resolve, reject) => {

    function update(event) {

      try {

        const next = iterator.next(event.dt);

        if (next.done) {

          engine.removeEventListener('update', update);
          resolve(next.value);

        }

      } catch (err) {

        console.error('Error in promised coroutine:\n' + (err.stack || err.message));
        // reject(err); TODO not sure if this makes sense

      }

    }

    engine.addEventListener(eventType, update);

  });

}
