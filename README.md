# Spot The Bot
A cooperative [WebVR](webvr.info) game by [Hook Studios](http://byhook.com). 

Try the game [here](https://spot-the-bot.com)

Checkout other WebVR experiments [here](https://webvrexperiments.com)

#### Update
As of 9/11/2018, the WebVR API is no longer supported so some features may not work as intended.

##### Building Locally

All of the build scripts are run through `npm`. Here are some common tasks:

- `npm run build` - Rebuild the project into the `out` folder.
- `npm run watch` - Rebuild the project and watch for changes.
- `npm run serve` - Start a BrowserSync server, serving the `out` folder.
- `npm run prod`  - Rebuild the project for production; this will take a little extra time.
- `npm run gae`   - Rebuild the project for production and copy the `out` folder to `gae/static` to prep for deployment.

You can run the game locally by running `npm run watch` in one terminal and `npm run server` in another. 

##### Static Dependencies

Some of the dependencies are included as static external scripts, because the are incompatible with
Rollup, they slow down the build process too much, or they are not available through NPM.

| Library         | Version |
| --------------- | -------:|
| dat.gui         | 0.6.2   |
| Font Awesome    | 4.7.0   |
| Firebase        | 3.6.10  |
| Normalize.css   | 5.0.0   |
| seedrandom      | 2.4.0   |
| three.js        | r84     |
| TweenMax        | 1.19.0  |
| Vue             | 2.2.0   |
| WebVR Polyfill  | 807d594 |
