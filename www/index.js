import {memory} from "game-of-life-3d/game_of_life_3d_bg";
import {Universe} from "game-of-life-3d";

const threeModel = require("./three-model")
const twoModel = require("./two-model")

const GRID_COLOR = "#000000";
const DEAD_COLOR = "#FFFF00";
const ALIVE_COLOR = "#FF0000";

let universe = null;
let size = 10;
let twoModelShown = true;
let isSquare = true;

const playPauseButton = document.getElementById("play-pause");
const speedSlider = document.getElementById("speed-slider");
const sizeSlider = document.getElementById("size-slider");
const stepCounter = document.getElementById("step-counter");
const resetButton = document.getElementById("reset-button");
const stopButton = document.getElementById("stop-button");
const modelButton = document.getElementById("model-button");
const figureButton = document.getElementById("figure-button");
const layerSlider = document.getElementById("layer-slider");

let animationId = null;
let ticks = 1;
let totalSteps = 0;

const isPaused = () => {
    return animationId === null;
};

const updateCells = () => {
    universe.update_changes();
    const birthsPtr = universe.births();
    const births = new Uint32Array(memory.buffer, birthsPtr, universe.nr_of_births());
    
    const deathsPtr = universe.deaths();
    const deaths = new Uint32Array(memory.buffer, deathsPtr, universe.nr_of_deaths());

    if (twoModelShown){
        twoModel.updateCells(births, deaths);
    }else{
        threeModel.updateCells(births, deaths);
    }
};

const renderLoop = () => {
    for (let i = 0; i < ticks; i++) {
        universe.tick();
        totalSteps++;
    }
    updateCells();
    stepCounter.textContent = totalSteps;
    animationId = requestAnimationFrame(renderLoop);
};

const play = () => {
    playPauseButton.textContent = "⏸";
    if (universe === null) {
        reset(true);
    }
    renderLoop();
};

const pause = () => {
    playPauseButton.textContent = "▶️";
    cancelAnimationFrame(animationId);
    animationId = null;
};

playPauseButton.addEventListener("click", event => {
    if (isPaused()) {
        play();
    } else {
        pause();
    }
});

const reset = (random) => {
    if (twoModelShown){
        twoModel.destroy();
    }else{
        threeModel.destroy();
    }
    universe = Universe.new(size, size, size, random);
    totalSteps = 0;
    stepCounter.textContent = totalSteps;
    if (twoModelShown){
        twoModel.init(universe, isPaused, isSquare);
    }else{
        threeModel.init(universe, isPaused, isSquare);
    }
};

speedSlider.addEventListener("change", event => {
    ticks = speedSlider.value;
});

sizeSlider.addEventListener("change", event => {
    size = parseInt(sizeSlider.value);
    layerSlider.max = size - 1;
    reset(true);
});

resetButton.addEventListener("click", event => {
    reset(true);
});

stopButton.addEventListener("click", event => {
    pause();
    reset(false);
});

modelButton.addEventListener("click", event => {
    if(universe === null){
        universe = Universe.new(size, size, size, true);
    }
    if (twoModelShown){
        twoModel.destroy();
        threeModel.init(universe, isPaused, isSquare);
        twoModelShown = false;
        modelButton.innerText = "3D"
    }else{
        threeModel.destroy();
        twoModel.init(universe, isPaused, isSquare);
        twoModelShown = true;
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
    if (twoModelShown){
        twoModel.destroy();
        twoModel.init(universe, isPaused, isSquare);
    }else{
        threeModel.destroy();
        threeModel.init(universe, isPaused, isSquare);
    }
});