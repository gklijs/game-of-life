import {Universe} from "game-of-life-3d";

export interface Model {
    init(universe: Universe, square: boolean): void;

    updateCells(births: Uint32Array, deaths: Uint32Array): void;

    destroy(): void;
}