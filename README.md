# roads-rivers-and-residences
First working through [the rust wasm book](https://rustwasm.github.io/book/) later maybe a carcassonne like game.

## How to build and deploy

Run `wasm-pack build` in the main folder.
Then `npm link` in the created pkg folder
Then `npm link game-of-life-3d` in the www folder
Then www directory first run `npm install` and then `npm run start`
