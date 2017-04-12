import { AudioContext, FileLoader, DefaultLoadingManager } from 'three';

export class FixedAudioLoader {

  constructor(manager) {

    this.manager = (manager !== undefined) ? manager : DefaultLoadingManager;

  }

  load(url, onLoad, onProgress, onError) {

    const loader = new FileLoader(this.manager);
    loader.setResponseType('arraybuffer');
    loader.load(url, function (buffer) {

      const context = AudioContext.getContext();
      context.decodeAudioData(buffer, onLoad, onError);

    }, onProgress, onError);


  }

}
