# game-of-life-3d

Result of working through [the rust wasm book](https://rustwasm.github.io/book/) with some additions.
Its a 3d version of game of life using the the (6,6,5,3) rule using periodic boundary conditions.

## How to use from npm

You can view an example of using this with typescript [here](https://gameoflife3d.gklijs.tech).
The source for this is in the same [github repo](https://github.com/gklijs/game-of-life).

You first need to import the Universe, and Utils like:
```typescript
import {Universe, Utils} from "game-of-life-3d";
```
Then you can instantiate an universe;
```typescript
const universe = Universe.new(size, size, size);

// to create random live cells
universe.randomize();

// to reset the universe, removing all cells;
universe.reset();

// to go to the next state
universe.tick();

// you can also do several ticks ad once
universe.multi_tick(5);

// with the utils you can get all the cells as an Uint32 array for efficiency
const cells = Utils.getCellsFromUniverse(universe);

// to go though all the cells
for (let layer = 0; layer < universe.depth(); layer++) {
    for (let row = 0; row < universe.height(); row++) {
        for (let column = 0; column < universe.width(); column++) {
            const idx = Utils.getIndex(column, row, layer, universe.width(), universe.height());
            const isAlive = Utils.isCellAlive(idx, cells);
        }
    }
}

// after each tick, you can get the indexes of the changed cells
const changes = Utils.getChanges(universe);
// where changes[0] is an array of indexes of the new cells, and changes[1] an index of the removed cells

// you can toggle the status of a cell with
universe.toggle_cell(col, row, layer);

// then there are two gimmicks creating a 3d glider or pulser on the surrounding cells by setting there state
universe.glider(col, row, layer);
universe.pulse(col, row, layer);
```

## How to build

Run `wasm-pack build` in the main folder.

Add to the generated game_of_life_3d.js:
```ecmascript 6
const isBitSet = (number, bitPosition) => {
    return (number & (1 << bitPosition)) !== 0;
};

export class Utils {
    static getIndex (column, row, layer, width, height){
        return column + row * width + layer * width * height;
    };

    static getCellsFromUniverse (universe){
        const cellsPtr = universe.cells();
        universe.update_changes();
        return new Uint32Array(wasm.memory.buffer, cellsPtr, Math.ceil(universe.depth() * universe.width() * universe.height() / 32))
    };

    static getCellsAsBool (universe){
        const total = universe.depth() * universe.width() * universe.height();
        const result = new Array(total);
        const cells = this.getCellsFromUniverse(universe);
        for(let i = 0; i < total; i++){
            result[i] = this.isCellAlive(i, cells);
        }
        return result;
    };

    static isCellAlive (idx, cells) {
        const number = cells[Math.floor(idx / 32)];
        const bitPosition = idx % 32;
        return isBitSet(number, bitPosition);
    };

    static getArrayFromMemory (pointer, size){
        return new Uint32Array(wasm.memory.buffer, pointer, size);
    };

    static getChanges(universe){
        universe.update_changes();
        const births = Utils.getArrayFromMemory(universe.births(), universe.nr_of_births());
        const deaths = Utils.getArrayFromMemory(universe.deaths(), universe.nr_of_deaths());
        return [births, deaths];
    }
}
```

Add to the generated game_of_life_3d.d.ts:
```typescript
export class Utils{
    static getIndex(column: number, row: number, layer: number, width: number, height: number): number;

    static getCellsFromUniverse(universe: Universe): Uint32Array;

    static getCellsAsBool(universe: Universe): boolean[];

    static isCellAlive(idx: number, cells: Uint32Array): boolean;

    static getArrayFromMemory(pointer: number, size: number): Uint32Array;

    static getChanges(universe: Universe): [Uint32Array, Uint32Array];
}
```

Then `npm link` in the created pkg folder
Then `npm link game-of-life-3d` in the www folder

Then www directory first run `npm install` and then `npm run start`

## License

Licensed under either of

* Apache License, Version 2.0, ([LICENSE-APACHE](LICENSE-APACHE) or http://www.apache.org/licenses/LICENSE-2.0)
* MIT license ([LICENSE-MIT](LICENSE-MIT) or http://opensource.org/licenses/MIT)

at your option.

### Contribution

Unless you explicitly state otherwise, any contribution intentionally
submitted for inclusion in the work by you, as defined in the Apache-2.0
license, shall be dual licensed as above, without any additional terms or
conditions.
