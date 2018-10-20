import {Model, Shape} from "./types";
import {Universe} from "game-of-life-3d";

const infoModel: HTMLElement = document.getElementById("info-model")!;
const infoBox: HTMLElement = document.getElementById("info-box")!;

export class InfoModel implements Model {

    public init(universe: Universe, shape: Shape): void {
        infoModel.classList.add("is-visible");
    }

    public updateCells(births: Uint32Array, deaths: Uint32Array): void {
        infoBox.innerText = `These cells where being created: ${births} 
        while these ones died: ${deaths}`;
    }

    public destroy(): void {
        infoModel.classList.remove("is-visible");
    }
}