import {Model} from "./types";
import {ThreeModel} from "./three-model";
import {TwoModel} from "./two-model";
import {Universe, Utils} from "game-of-life-3d";

let universe: Universe | null = null;
let size: number = 10;
let twoModelSelected: boolean = true;
let model: Model = new TwoModel;
let isSquare: boolean = true;

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
let totalRenders = 0;
let totalSteps = 0;

const updateCells = () => {
    if(universe == null){
        return;
    }
    universe.update_changes();
    const births = Utils.getArrayFromMemory(universe.births(), universe.nr_of_births());
    const deaths = Utils.getArrayFromMemory(universe.deaths(), universe.nr_of_deaths());

    model.updateCells(births, deaths);
};

const renderLoop = () => {
    if(!paused && universe!= null){
        if (totalRenders % skipRenders === 0) {
            for (let i = 0; i < ticksPerRender; i++) {
                universe.tick();
                totalSteps++;
            }
            stepCounter.textContent = String(totalSteps);
        }
        totalRenders++;
    }
    updateCells();
    requestAnimationFrame(renderLoop);
};

const reset = (random: boolean) => {
    model.destroy();
    if (universe !== null) {
        universe.free();
    }
    universe = Universe.new(size, size, size, random);
    totalSteps = 0;
    stepCounter.textContent = String(totalSteps);
    model.init(universe, isSquare);
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
        universe = Universe.new(size, size, size, true);
    }
    if (twoModelSelected) {
        model.destroy();
        model = new ThreeModel;
        model.init(universe, isSquare);
        twoModelSelected = false;
        modelButton.innerText = "3D"
    }else{
        model.destroy();
        model = new TwoModel;
        model.init(universe, isSquare);
        twoModelSelected = true;
        modelButton.innerText = "2D"
    }
});

figureButton.addEventListener("click", event => {
    if(universe === null){
        universe = Universe.new(size, size, size, true);
    }
    if(isSquare){
        figureButton.innerText = "🔘️"
    }else{
        figureButton.innerText = "🔲️"
    }
    isSquare = !isSquare;
    model.destroy();
    model.init(universe, isSquare);
});

renderLoop();