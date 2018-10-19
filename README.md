# roads-rivers-and-residences
First working through [the rust wasm book](https://rustwasm.github.io/book/) later maybe a carcassonne like game.

## How to build and deploy

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
        return new Uint32Array(wasm.memory.buffer, cellsPtr, Math.ceil(Math.pow(universe.width(), 3) / 32))
    };

    static isCellAlive (idx, cells) {
        const number = cells[Math.floor(idx / 32)];
        const bitPosition = idx % 32;
        return isBitSet(number, bitPosition);
    };

    static getArrayFromMemory (pointer, size){
        return new Uint32Array(wasm.memory.buffer, pointer, size);
    };
}
```

Add to the generated game_of_life_3d.d.ts:
```typescript
export class Utils{
    static getIndex(column: number, row: number, layer: number, width: number, height: number): number;

    static getCellsFromUniverse(universe: Universe): Uint32Array;

    static isCellAlive(idx: number, cells: Uint32Array): boolean;

    static getArrayFromMemory(pointer: number, size: number): Uint32Array;
}
```

Then `npm link` in the created pkg folder
Then `npm link game-of-life-3d` in the www folder

Then www directory first run `npm install` and then `npm run start`
