import {memory} from "game-of-life-3d/game_of_life_3d_bg";
import {Universe} from "game-of-life-3d";

const CELL_SIZE = 20; // px
const GRID_COLOR = "#000000";
const DEAD_COLOR = "#FFFF00";
const ALIVE_COLOR = "#FF0000";

// global var for the universe, and get its size.
let universe = null;
let size = 10;
let layer = 0;

// Give the canvas room for all of our cells and a 1px border
// around each of them.
const canvas = document.getElementById("game-of-life-canvas");
const playPauseButton = document.getElementById("play-pause");
const speedSlider = document.getElementById("speed-slider");
const sizeSlider = document.getElementById("size-slider");
const layerSlider = document.getElementById("layer-slider");
const stepCounter = document.getElementById("step-counter");
const resetButton = document.getElementById("reset-button");
const stopButton = document.getElementById("stop-button");

const ctx = canvas.getContext('2d');
let animationId = null;
let ticks = 1;
let totalSteps = 0;

const getIndex = (column, row, layer) => {
    return column + row * size + layer * size * size;
};

const isPaused = () => {
    return animationId === null;
};

const isBitSet = (number, bitPosition) => {
    return (number & (1 << bitPosition)) !== 0;
};

const drawAllCellsInLayer = () => {
    const cellsPtr = universe.cells();
    const cells = new Uint32Array(memory.buffer, cellsPtr, Math.ceil(Math.pow(size, 3) / 32));

    ctx.beginPath();

    ctx.fillStyle = ALIVE_COLOR;

    for (let col = 0; col < size; col++) {
        for (let row = 0; row < size; row++) {
            const idx = getIndex(col, row, layer);
            const number = cells[Math.floor(idx / 32)];
            const bitPosition = idx % 32;
            if (!isBitSet(number, bitPosition)) {
                continue;
            }
            ctx.fillRect(
                col * (CELL_SIZE + 1) + 1,
                row * (CELL_SIZE + 1) + 1,
                CELL_SIZE,
                CELL_SIZE
            );
        }
    }

    ctx.fillStyle = DEAD_COLOR;
    for (let col = 0; col < size; col++) {
        for (let row = 0; row < size; row++) {
            const idx = getIndex(col, row, layer);
            const number = cells[Math.floor(idx / 32)];
            const bitPosition = idx % 32;
            if (isBitSet(number, bitPosition)) {
                continue;
            }
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

const drawChangedCellsInLayer = () => {
    universe.update_changes();
    const birthsPtr = universe.births();
    const births = new Uint32Array(memory.buffer, birthsPtr, universe.nr_of_births());

    ctx.beginPath();

    ctx.fillStyle = ALIVE_COLOR;
    births.forEach(
        idx => {
            const for_layer = Math.floor(idx / (size * size));
            if (for_layer !== layer) {
                return;
            }
            const row = Math.floor((idx - (layer * size * size))/size);
            const col = idx % size;
            ctx.fillRect(
                col * (CELL_SIZE + 1) + 1,
                row * (CELL_SIZE + 1) + 1,
                CELL_SIZE,
                CELL_SIZE
            );
        }
    )

    const deathsPtr = universe.deaths();
    const deaths = new Uint32Array(memory.buffer, deathsPtr, universe.nr_of_deaths());

    ctx.fillStyle = DEAD_COLOR;
    deaths.forEach(
        idx => {
            const for_layer = Math.floor(idx / (size * size));
            if (for_layer !== layer) {
                return;
            }
            const row = Math.floor((idx - (layer * size * size))/size);
            const col = idx % size;
            ctx.fillRect(
                col * (CELL_SIZE + 1) + 1,
                row * (CELL_SIZE + 1) + 1,
                CELL_SIZE,
                CELL_SIZE
            );
        }
    )

    ctx.stroke();
};

const drawGrid = () => {
    ctx.beginPath();
    ctx.strokeStyle = GRID_COLOR;

    // Vertical lines.
    for (let i = 0; i <= size; i++) {
        ctx.moveTo(i * (CELL_SIZE + 1) + 1, 0);
        ctx.lineTo(i * (CELL_SIZE + 1) + 1, (CELL_SIZE + 1) * size + 1);
    }

    // Horizontal lines.
    for (let j = 0; j <= size; j++) {
        ctx.moveTo(0, j * (CELL_SIZE + 1) + 1);
        ctx.lineTo((CELL_SIZE + 1) * size + 1, j * (CELL_SIZE + 1) + 1);
    }

    ctx.stroke();
};

const renderLoop = () => {
    for (let i = 0; i < ticks; i++) {
        universe.tick();
        totalSteps++;
    }
    drawChangedCellsInLayer();
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
    universe = Universe.new(size, size, size, random);
    canvas.height = (CELL_SIZE + 1) * size + 1;
    canvas.width = (CELL_SIZE + 1) * size + 1;
    totalSteps = 0;
    stepCounter.textContent = totalSteps;
    drawGrid();
    drawAllCellsInLayer();
    universe.update_changes();
};

canvas.addEventListener("click", event => {
    const boundingRect = canvas.getBoundingClientRect();

    const scaleX = canvas.width / boundingRect.width;
    const scaleY = canvas.height / boundingRect.height;

    const canvasLeft = (event.clientX - boundingRect.left) * scaleX;
    const canvasTop = (event.clientY - boundingRect.top) * scaleY;

    const col = Math.min(Math.floor(canvasLeft / (CELL_SIZE + 1)), size - 1);
    const row = Math.min(Math.floor(canvasTop / (CELL_SIZE + 1)), size - 1);
    if (event.metaKey) {
        universe.glider(col, row, layer);
    } else {
        universe.toggle_cell(col, row, layer);
    }
    drawChangedCellsInLayer();
});

speedSlider.addEventListener("change", event => {
    ticks = speedSlider.value;
});

sizeSlider.addEventListener("change", event => {
    size = parseInt(sizeSlider.value);
    layerSlider.max = size - 1;
    reset(true);
});

layerSlider.addEventListener("change", event => {
    layer = parseInt(layerSlider.value);
    drawGrid();
    drawAllCellsInLayer();
    universe.update_changes();
});

resetButton.addEventListener("click", event => {
    reset(true);
});

stopButton.addEventListener("click", event => {
    pause();
    reset(false);
    drawAllCellsInLayer();
});