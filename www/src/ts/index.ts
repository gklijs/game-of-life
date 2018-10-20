import {Model, Shape} from "./types";
import {ThreeModel} from "./three-model";
import {TwoModel} from "./two-model";
import {Universe, Utils} from "game-of-life-3d";
import {InfoModel} from "./info-model";

let universe: Universe | null = null;
let size: number = 10;
let model: Model = new InfoModel();
let shape: Shape = Shape.square;

const playPauseButton: HTMLElement = document.getElementById("play-pause")!;
const speedSlider: HTMLInputElement = <HTMLInputElement>document.getElementById("speed-slider");
const sizeSlider: HTMLInputElement = <HTMLInputElement>document.getElementById("size-slider");
const stepCounter: HTMLElement = document.getElementById("step-counter")!;
const resetButton: HTMLElement = document.getElementById("reset-button")!;
const stopButton: HTMLElement = document.getElementById("stop-button")!;
const modelButton: HTMLElement = document.getElementById("model-button")!;
const figureButton: HTMLElement = document.getElementById("figure-button")!;

let paused = true;
let ticksPerRender = 1;
let skipRenders = 1;
let renders = 0;

const updateCells = () => {
    if(universe == null){
        return;
    }
    const changes = Utils.getChanges(universe);
    model.updateCells(changes[0], changes[1]);
};

const renderLoop = () => {
    if(!paused && universe!= null){
        renders ++;
        if (renders >= skipRenders) {
            universe.multi_tick(ticksPerRender);
            stepCounter.textContent = String(universe.ticks());
            updateCells();
            renders = 0
        }
    }
    requestAnimationFrame(renderLoop);
};

const reset = (random: boolean) => {
    model.destroy();
    if( universe === null || universe.width() !== size){
        universe = Universe.new(size, size, size);
    }else{
        universe.reset()
    }
    if(random){
        universe.randomize();
    }
    stepCounter.textContent = String(universe.ticks());
    model.init(universe, shape);
};

playPauseButton.addEventListener("click", event => {
    if (paused) {
        playPauseButton.textContent = "⏸";
        paused = false;
    } else {
        playPauseButton.textContent = "▶️";
        paused = true;
    }
});

speedSlider.addEventListener("change", event => {
    const speedValue = parseInt(speedSlider.value);
    if(speedValue >= 10){
        skipRenders = 1;
        ticksPerRender = Math.pow(speedValue-9, 2);
    }else{
        skipRenders = Math.pow(10-speedValue, 2) + 1;
        ticksPerRender = 1;
    }
});

sizeSlider.addEventListener("change", event => {
    size = parseInt(sizeSlider.value);
    reset(true);
});

resetButton.addEventListener("click", event => {
    reset(true);
});

stopButton.addEventListener("click", event => {
    playPauseButton.textContent = "▶️";
    paused = true;
    reset(false);
});

modelButton.addEventListener("click", event => {
    if(universe === null){
        universe = Universe.new(size, size, size);
        universe.randomize();
    }
    if (model instanceof InfoModel) {
        model.destroy();
        model = new TwoModel;
        model.init(universe, shape);
        modelButton.innerText = "2D"
    }else if (model instanceof TwoModel){
        model.destroy();
        model = new ThreeModel;
        model.init(universe, shape);
        modelButton.innerText = "3D"
    }else{
        model.destroy();
        model = new InfoModel();
        model.init(universe, shape);
        modelButton.innerText = "ℹ️"
    }
});

figureButton.addEventListener("click", event => {
    if(universe === null){
        universe = Universe.new(size, size, size);
        universe.randomize();
    }
    if(shape === Shape.square){
        shape = Shape.circle;
        figureButton.innerText = "🔘️"
    }else{
        shape = Shape.square;
        figureButton.innerText = "🔲️"
    }
    model.destroy();
    model.init(universe, shape);
});

renderLoop();