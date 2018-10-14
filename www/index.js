import {Universe} from "game-of-life-3d";

const utils = require("./utils");
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
    const births = utils.getArrayFromMemory(universe.births(), universe.nr_of_births());
    const deaths = utils.getArrayFromMemory(universe.deaths(), universe.nr_of_deaths());

    if (twoModelShown){
        twoModel.updateCells(births, deaths);
    }else{
        threeModel.updateCells(births, deaths);
    }
};

const renderLoop = () => {
    if(!paused && universe!= null){
        if(totalRenders % skipRenders == 0){
            for (let i = 0; i < ticksPerRender; i++) {
                universe.tick();
                totalSteps++;
            }
            stepCounter.textContent = totalSteps;
        }
        totalRenders++;
    }
    updateCells();
    requestAnimationFrame(renderLoop);
};

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
        twoModel.init(universe, isSquare);
    }else{
        threeModel.init(universe, isSquare);
    }
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
    if (twoModelShown){
        twoModel.destroy();
        threeModel.init(universe, isSquare);
        twoModelShown = false;
        modelButton.innerText = "3D"
    }else{
        threeModel.destroy();
        twoModel.init(universe, isSquare);
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
        twoModel.init(universe, isSquare);
    }else{
        threeModel.destroy();
        threeModel.init(universe, isSquare);
    }
});

renderLoop();