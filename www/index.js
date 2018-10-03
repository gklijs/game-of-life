import {memory} from "roads-rivers-and-residences/roads_rivers_and_residences_bg";
import {Universe} from "roads-rivers-and-residences";

const CELL_SIZE = 5; // px
const GRID_COLOR = "#000000";
const DEAD_COLOR = "#FFFF00";
const ALIVE_COLOR = "#FF0000";

// Construct the universe, and get its width and height.
let universe = null;
let width = 260;
let height = 140;

// Give the canvas room for all of our cells and a 1px border
// around each of them.
const canvas = document.getElementById("game-of-life-canvas");
const playPauseButton = document.getElementById("play-pause");
const speedSlider = document.getElementById("speed-slider");
const widthSlider = document.getElementById("width-slider");
const heightSlider = document.getElementById("height-slider");
const stepCounter = document.getElementById("step-counter");
const resetButton = document.getElementById("reset-button");
const stopButton = document.getElementById("stop-button");

const ctx = canvas.getContext('2d');
let animationId = null;
let ticks = 1;
let totalSteps = 0;

const getIndex = (row, column) => {
    return row * width + column;
};

const isPaused = () => {
    return animationId === null;
};

const isBitSet = (number, bitPosition) => {
    return (number & (1 << bitPosition)) !== 0;
};

const drawCells = () => {
    const cellsPtr = universe.cells();
    const cells = new Uint32Array(memory.buffer, cellsPtr, Math.ceil((width * height) / 32));

    ctx.beginPath();

    for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
            const idx = getIndex(row, col);
            const number = cells[Math.floor(idx / 32)];
            const bitPosition = idx % 32;

            ctx.fillStyle = isBitSet(number, bitPosition)
                ? ALIVE_COLOR
                : DEAD_COLOR;

            ctx.fillRect(
                col * (CELL_SIZE + 1) + 1,
                row * (CELL_SIZE + 1) + 1,
                CELL_SIZE,
                CELL_SIZE
            );
        }
    }

    ctx.stroke();
};

const drawGrid = () => {
    ctx.beginPath();
    ctx.strokeStyle = GRID_COLOR;

    // Vertical lines.
    for (let i = 0; i <= width; i++) {
        ctx.moveTo(i * (CELL_SIZE + 1) + 1, 0);
        ctx.lineTo(i * (CELL_SIZE + 1) + 1, (CELL_SIZE + 1) * height + 1);
    }

    // Horizontal lines.
    for (let j = 0; j <= height; j++) {
        ctx.moveTo(0, j * (CELL_SIZE + 1) + 1);
        ctx.lineTo((CELL_SIZE + 1) * width + 1, j * (CELL_SIZE + 1) + 1);
    }

    ctx.stroke();
};

const renderLoop = () => {
    for (let i = 0; i < ticks; i++) {
        universe.tick();
        totalSteps++;
    }
    drawGrid();
    drawCells();
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
    universe = Universe.new(width, height, random);
    canvas.height = (CELL_SIZE + 1) * height + 1;
    canvas.width = (CELL_SIZE + 1) * width + 1;
    totalSteps = 0;
    stepCounter.textContent = totalSteps;
};

canvas.addEventListener("click", event => {
    const boundingRect = canvas.getBoundingClientRect();

    const scaleX = canvas.width / boundingRect.width;
    const scaleY = canvas.height / boundingRect.height;

    const canvasLeft = (event.clientX - boundingRect.left) * scaleX;
    const canvasTop = (event.clientY - boundingRect.top) * scaleY;

    const row = Math.min(Math.floor(canvasTop / (CELL_SIZE + 1)), height - 1);
    const col = Math.min(Math.floor(canvasLeft / (CELL_SIZE + 1)), width - 1);

    universe.toggle_cell(row, col);

    drawGrid();
    drawCells();
});

speedSlider.addEventListener("change", event => {
    ticks = speedSlider.value;
});

widthSlider.addEventListener("change", event => {
    width = widthSlider.value;
    reset(true);
});

heightSlider.addEventListener("change", event => {
    height = heightSlider.value;
    reset(true)
});

resetButton.addEventListener("click", event => {
    reset(true);
});

stopButton.addEventListener("click", event => {
    pause();
    reset(false);
    drawGrid();
    drawCells();
});