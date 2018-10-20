import {Universe} from "game-of-life-3d";

export interface Model {
    init(universe: Universe, shape: Shape): void;
    updateCells(births: Uint32Array, deaths: Uint32Array): void;
    destroy(): void;
}

export enum Shape {
    square,
    circle,
}