import {memory} from "game-of-life-3d/game_of_life_3d_bg";

const utils = require("./utils");

const twoModel = document.getElementById("two-model");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext('2d');
const layerSlider = document.getElementById("layer-slider");
const layerDisplay = document.getElementById("layer-display");

const GRID_COLOR = "#000000";
const DEAD_COLOR = "#FFFF00";
const ALIVE_COLOR = "#FF0000";

let universe = null;
let size = null;
let cellSize = null;
let layer = 0;

export const init = (newUniverse) => {
    twoModel.classList.add("is-visible");
    size = newUniverse.width();
    universe = newUniverse;
    onWindowResize();
};

export const destroy = () => {
    twoModel.classList.remove("is-visible");
    size = null;
    universe = null;
};

const drawGrid = () => {
    ctx.beginPath();
    ctx.strokeStyle = GRID_COLOR;

    // Vertical lines.
    for (let i = 0; i <= size; i++) {
        ctx.moveTo(i * (cellSize + 1) + 1, 0);
        ctx.lineTo(i * (cellSize + 1) + 1, (cellSize + 1) * size + 1);
    }

    // Horizontal lines.
    for (let j = 0; j <= size; j++) {
        ctx.moveTo(0, j * (cellSize + 1) + 1);
        ctx.lineTo((cellSize + 1) * size + 1, j * (cellSize + 1) + 1);
    }

    ctx.stroke();
};

export const drawFromUniverse = () => {
    if (universe !== null) {
        const cellsPtr = universe.cells();
        drawAllCells(new Uint32Array(memory.buffer, cellsPtr, Math.ceil(Math.pow(size, 3) / 32)));
        universe.update_changes();
    }
};

export const drawAllCells = (cells) => {
    ctx.beginPath();

    ctx.fillStyle = ALIVE_COLOR;

    for (let col = 0; col < size; col++) {
        for (let row = 0; row < size; row++) {
            const idx = utils.getIndex(col, row, layer, size);
            const number = cells[Math.floor(idx / 32)];
            const bitPosition = idx % 32;
            if (!utils.isBitSet(number, bitPosition)) {
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
    for (let col = 0; col < size; col++) {
        for (let row = 0; row < size; row++) {
            const idx = utils.getIndex(col, row, layer, size);
            const number = cells[Math.floor(idx / 32)];
            const bitPosition = idx % 32;
            if (utils.isBitSet(number, bitPosition)) {
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

export const updateCells = (births, deaths) => {
    ctx.beginPath();

    ctx.fillStyle = ALIVE_COLOR;
    births.forEach(
        idx => {
            const for_layer = Math.floor(idx / (size * size));
            if (for_layer !== layer) {
                return;
            }
            const row = Math.floor((idx - (layer * size * size)) / size);
            const col = idx % size;
            ctx.fillRect(
                col * (cellSize + 1) + 1,
                row * (cellSize + 1) + 1,
                cellSize,
                cellSize
            );
        }
    );

    ctx.fillStyle = DEAD_COLOR;
    deaths.forEach(
        idx => {
            const for_layer = Math.floor(idx / (size * size));
            if (for_layer !== layer) {
                return;
            }
            const row = Math.floor((idx - (layer * size * size)) / size);
            const col = idx % size;
            ctx.fillRect(
                col * (cellSize + 1) + 1,
                row * (cellSize + 1) + 1,
                cellSize,
                cellSize
            );
        }
    );

    ctx.stroke();
};

const onWindowResize = () => {
    if (size != null) {
        const maxCanvasWidth = twoModel.clientWidth - 11;
        const maxCanvasHeight = twoModel.clientHeight - 31;
        const maxCellSizeWidth = Math.floor(maxCanvasWidth / size) - 1;
        const maxCellSizeHeight = Math.floor(maxCanvasHeight / size) - 1;
        cellSize = Math.min(maxCellSizeWidth, maxCellSizeHeight);
        canvas.width = (cellSize + 1) * size + 1;
        canvas.height = (cellSize + 1) * size + 1;
        drawGrid();
        drawFromUniverse();
    }
};

canvas.addEventListener("click", event => {
    if (universe === null) {
        return;
    }
    const boundingRect = canvas.getBoundingClientRect();

    const scaleX = canvas.width / boundingRect.width;
    const scaleY = canvas.height / boundingRect.height;

    const canvasLeft = (event.clientX - boundingRect.left) * scaleX;
    const canvasTop = (event.clientY - boundingRect.top) * scaleY;

    const col = Math.min(Math.floor(canvasLeft / (cellSize + 1)), size - 1);
    const row = Math.min(Math.floor(canvasTop / (cellSize + 1)), size - 1);
    if (event.metaKey) {
        universe.glider(col, row, layer);
    } else {
        universe.toggle_cell(col, row, layer);
    }
    drawFromUniverse()
});

window.addEventListener("resize", onWindowResize, false);

layerSlider.addEventListener("change", event => {
    layer = parseInt(layerSlider.value);
    layerDisplay.innerText = layer + 1;
    drawFromUniverse();
});