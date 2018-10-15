import {Universe, get_memory} from "game-of-life-3d";

const isBitSet = (number, bitPosition) => {
    return (number & (1 << bitPosition)) !== 0;
};

export namespace Utils {
    export const getIndex = (column, row, layer, size) => {
        return column + row * size + layer * size * size;
    };

    export const getCellsFromUniverse = (universe: Universe) => {
        const cellsPtr = universe.cells();
        universe.update_changes();
        return new Uint32Array(get_memory().buffer, cellsPtr, Math.ceil(Math.pow(universe.width(), 3) / 32))
    };

    export const isCellAlive = (idx, cells) => {
        const number = cells[Math.floor(idx / 32)];
        const bitPosition = idx % 32;
        return isBitSet(number, bitPosition);
    };

    export const getArrayFromMemory = (pointer, size) => {
        return new Uint32Array(get_memory().buffer, pointer, size);
    };
}