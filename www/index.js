import {memory} from "roads-rivers-and-residences/roads_rivers_and_residences_bg";
import {Universe} from "roads-rivers-and-residences";

let cellSize = 5; // px
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
const zoomSlider = document.getElementById("zoom-slider");
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

const drawAllCells = () => {
    const cellsPtr = universe.cells();
    const cells = new Uint32Array(memory.buffer, cellsPtr, Math.ceil((width * height) / 32));

    ctx.beginPath();

    ctx.fillStyle = ALIVE_COLOR;
    for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
            const idx = getIndex(row, col);
            const number = cells[Math.floor(idx / 32)];
            const bitPosition = idx % 32;
            if (!isBitSet(number, bitPosition)) {
                continue;
            }
            ctx.fillRect(
                col * (cellSize + 1) + 1,
                row * (cellSize + 1) + 1,
                cellSize,
                cellSize
            );
        }
    }

    ctx.fillStyle = DEAD_COLOR;
    for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
            const idx = getIndex(row, col);
            const number = cells[Math.floor(idx / 32)];
            const bitPosition = idx % 32;
            if (isBitSet(number, bitPosition)) {
                continue;
            }
            ctx.fillRect(
                col * (cellSize + 1) + 1,
                row * (cellSize + 1) + 1,
                cellSize,
                cellSize
            );
        }
    }

    ctx.stroke();
};

const drawChangedCells = () => {
    universe.update_changes();
    const birthsPtr = universe.births();
    const births = new Uint32Array(memory.buffer, birthsPtr, universe.nr_of_births());

    ctx.beginPath();

    ctx.fillStyle = ALIVE_COLOR;
    births.forEach(
        idx => {
            const row = Math.floor(idx/width);
            const col = idx % width;
            ctx.fillRect(
                col * (cellSize + 1) + 1,
                row * (cellSize + 1) + 1,
                cellSize,
                cellSize
            );
        }
    )

    const deathsPtr = universe.deaths();
    const deaths = new Uint32Array(memory.buffer, deathsPtr, universe.nr_of_deaths());

    ctx.fillStyle = DEAD_COLOR;
    deaths.forEach(
        idx => {
            const row = Math.floor(idx/width);
            const col = idx % width;
            ctx.fillRect(
                col * (cellSize + 1) + 1,
                row * (cellSize + 1) + 1,
                cellSize,
                cellSize
            );
        }
    )

    ctx.stroke();
};

const drawGrid = () => {
    ctx.beginPath();
    ctx.strokeStyle = GRID_COLOR;

    // Vertical lines.
    for (let i = 0; i <= width; i++) {
        ctx.moveTo(i * (cellSize + 1) + 1, 0);
        ctx.lineTo(i * (cellSize + 1) + 1, (cellSize + 1) * height + 1);
    }

    // Horizontal lines.
    for (let j = 0; j <= height; j++) {
        ctx.moveTo(0, j * (cellSize + 1) + 1);
        ctx.lineTo((cellSize + 1) * width + 1, j * (cellSize + 1) + 1);
    }

    ctx.stroke();
};

const renderLoop = () => {
    for (let i = 0; i < ticks; i++) {
        universe.tick();
        totalSteps++;
    }
    drawChangedCells();
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
    canvas.height = (cellSize + 1) * height + 1;
    canvas.width = (cellSize + 1) * width + 1;
    totalSteps = 0;
    stepCounter.textContent = totalSteps;
    drawGrid();
    drawAllCells();
};

canvas.addEventListener("click", event => {
    const boundingRect = canvas.getBoundingClientRect();

    const scaleX = canvas.width / boundingRect.width;
    const scaleY = canvas.height / boundingRect.height;

    const canvasLeft = (event.clientX - boundingRect.left) * scaleX;
    const canvasTop = (event.clientY - boundingRect.top) * scaleY;

    const row = Math.min(Math.floor(canvasTop / (cellSize + 1)), height - 1);
    const col = Math.min(Math.floor(canvasLeft / (cellSize + 1)), width - 1);
    if (event.metaKey) {
        universe.glider(row, col);
    } else {
        universe.toggle_cell(row, col);
    }
    drawChangedCells();
});

speedSlider.addEventListener("change", event => {
    ticks = speedSlider.value;
});

widthSlider.addEventListener("change", event => {
    width = parseInt(widthSlider.value);
    reset(true);
});

heightSlider.addEventListener("change", event => {
    height = parseInt(heightSlider.value);
    reset(true)
});

zoomSlider.addEventListener("change", event => {
    cellSize = parseInt(zoomSlider.value);
    canvas.height = (cellSize + 1) * height + 1;
    canvas.width = (cellSize + 1) * width + 1;
    drawGrid();
    drawAllCells();
});

resetButton.addEventListener("click", event => {
    reset(true);
});

stopButton.addEventListener("click", event => {
    pause();
    reset(false);
    drawAllCells();
});