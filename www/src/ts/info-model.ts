import {Model, Shape} from "./types";
import {Universe, Utils} from "game-of-life-3d";

const infoModel: HTMLElement = document.getElementById("info-model")!;
const infoBox: HTMLElement = document.getElementById("info-box")!;
let alive: number = 0;

export class InfoModel implements Model {

    public init(universe: Universe, shape: Shape): void {
        const cells = Utils.getCellsFromUniverse(universe);
        for (let layer = 0; layer < universe.depth(); layer++) {
            for (let row = 0; row < universe.height(); row++) {
                for (let column = 0; column < universe.width(); column++) {
                    const idx = Utils.getIndex(column, row, layer, universe.width(),universe.height())
                    if(Utils.isCellAlive(idx, cells)){
                        alive = alive + 1;
                    }
                }
            }
        }
        const changes = Utils.getChanges(universe);
        this.updateCells(changes[0], changes[1]);
        infoModel.classList.add("is-visible");
    }

    public updateCells(births: Uint32Array, deaths: Uint32Array): void {
        alive = alive + births.length - deaths.length;
        infoBox.innerText = `Cells alive: ${alive}
        These cells where being created: ${births} 
        While these ones died: ${deaths}`;
    }

    public render = () => {};

    public destroy(): void {
        alive = 0;
        infoModel.classList.remove("is-visible");
    }
}