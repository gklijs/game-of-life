const utils = require("./utils");

const twoModel = document.getElementById("two-model");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext('2d');
const layerSlider = document.getElementById("layer-slider");
const layerDisplay = document.getElementById("layer-display");

const GRID_COLOR = "#000000";
const DEAD_COLOR = "#FFFFFF";
const ALIVE_COLOR = "#FF0000";

let universe = null;
let size = null;
let cellSize = null;
let isSquare = null;
let layer = 0;
let eventHandlersSet = false;

export const setEventHandlers = () => {
    if (!eventHandlersSet) {
        canvas.addEventListener("click", editUniverse);
        layerSlider.addEventListener("change", changeLayer);
        eventHandlersSet = true;
    }
};

export const init = (newUniverse, square) => {
    isSquare = square;
    twoModel.classList.add("is-visible");
    size = newUniverse.width();
    universe = newUniverse;
    layerSlider.max = size - 1;
    onWindowResize();
    setEventHandlers();
    window.addEventListener("resize", onWindowResize);
};

export const destroy = () => {
    twoModel.classList.remove("is-visible");
    window.removeEventListener("resize", onWindowResize);
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

const drawFromUniverse = () => {
    if (universe !== null) {
        const cells = utils.getCellsFromUniverse(universe);
        drawAllCellsInLayer(cells);
    }
};

const drawSquare = (col, row) => {
    ctx.fillRect(
        col * (cellSize + 1) + 1,
        row * (cellSize + 1) + 1,
        cellSize,
        cellSize
    );
};

const drawCircle = (col, row) => {
    ctx.beginPath();
    ctx.arc(
        col * (cellSize + 1) + 1 + cellSize / 2,
        row * (cellSize + 1) + 1 + cellSize / 2,
        cellSize / 2,
        0,
        2 * Math.PI);
    ctx.fill()
};

const drawAllCellsInLayer = (cells) => {
    ctx.fillStyle = ALIVE_COLOR;

    for (let col = 0; col < size; col++) {
        for (let row = 0; row < size; row++) {
            const idx = utils.getIndex(col, row, layer, size);
            if (!utils.isCellAlive(idx, cells)) {
                continue;
            }
            if (isSquare) {
                drawSquare(col, row);
            } else {
                drawCircle(col, row);
            }
        }
    }

    ctx.fillStyle = DEAD_COLOR;
    for (let col = 0; col < size; col++) {
        for (let row = 0; row < size; row++) {
            const idx = utils.getIndex(col, row, layer, size);
            if (utils.isCellAlive(idx, cells)) {
                continue;
            }
            drawSquare(col, row);
        }
    }
};

export const updateCells = (births, deaths) => {
    ctx.fillStyle = ALIVE_COLOR;
    births.forEach(
        idx => {
            const for_layer = Math.floor(idx / (size * size));
            if (for_layer !== layer) {
                return;
            }
            const row = Math.floor((idx - (layer * size * size)) / size);
            const col = idx % size;
            if (isSquare) {
                drawSquare(col, row);
            } else {
                drawCircle(col, row);
            }
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
            drawSquare(col, row);
        }
    );
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

const editUniverse = (event) => {
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
    } else if (event.altKey) {
        universe.pulse(col, row, layer);
    } else {
        universe.toggle_cell(col, row, layer);
    }
    drawFromUniverse()
};

const changeLayer = () => {
    layer = parseInt(layerSlider.value);
    layerDisplay.innerText = layer + 1;
    drawFromUniverse();
};