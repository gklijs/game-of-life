import * as THREE from "three";

const utils = require("./utils");

const threeModel = document.getElementById("three-model");
let scene = null;
let camera = null;
let renderer = null;
let size = null;
let cellShapes = null;
let sceneSet = false;
let parentPaused = null;
let isSquare = null;
let mouseX = 0;
let mouseY = 0;
let threeHalfX = null;
let threeHalfY = null;

const initCamera = () => {
    camera = new THREE.PerspectiveCamera(50, threeModel.clientWidth / threeModel.clientHeight, 1, 2000);
    camera.position.set(400, 700, 400);
    camera.lookAt(scene.position);
};

const initRenderer = () => {
    renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true
    });
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setSize(threeModel.clientWidth, threeModel.clientHeight);
    threeModel.appendChild(renderer.domElement);
    return renderer;
};

const initCells = (numberOfCells) => {
    const cellSize = Math.floor(200 / size);
    cellShapes = new Array(numberOfCells);
    const geometry = isSquare ? new THREE.BoxBufferGeometry(cellSize * 2, cellSize * 2, cellSize * 2) : new THREE.SphereBufferGeometry(cellSize, 32, 32);
    const material = new THREE.MeshStandardMaterial({color: 0xFF0000});
    const liveCell = new THREE.Mesh(geometry, material);
    liveCell.castShadow = true;
    liveCell.receiveShadow = true;
    const correction = 0 - size * (cellSize + 1);
    const distance = cellSize * 2 + 1;
    for (let layer = 0; layer < size; layer++) {
        for (let row = 0; row < size; row++) {
            for (let column = 0; column < size; column++) {
                const cell = liveCell.clone();
                cell.position.set(correction + column * distance, correction + layer * distance, correction + row * distance);
                cellShapes[utils.getIndex(column, row, layer, size)] = cell;
            }
        }
    }
};

const initLights = () => {
    const light = new THREE.SpotLight(0xFFFFFF, 1);
    light.position.set(0, 400, 0);

    light.target = scene;
    light.castShadow = true;
    light.receiveShadow = true;
    light.shadow.camera.near = 0.5;

    scene.add(light);
    scene.add(new THREE.AmbientLight(0xAAAAAA));
};

const setMoveListeners = () => {
    threeModel.addEventListener("mousemove", onDocumentMouseMove);
    threeModel.addEventListener("touchstart", onDocumentTouchStart);
    threeModel.addEventListener("touchmove", onDocumentTouchMove);
};

export const destroy = () => {
    threeModel.classList.remove("is-visible");
    window.removeEventListener("resize", onWindowResize);
    size = null;
    cellShapes.forEach(
        cell => {
            scene.remove(cell);
            cell.geometry.dispose();
        }
    )
};

export const init = (universe, isPaused, square) => {
    parentPaused = isPaused;
    isSquare = square;
    threeModel.classList.add("is-visible");
    size = universe.width();
    const numberOfCells = Math.pow(size, 3);
    if (!sceneSet) {
        scene = new THREE.Scene();
        initRenderer();
        initCamera();
        initLights();
        setMoveListeners();
        sceneSet = true;
    }
    initCells(numberOfCells);
    const cells = utils.getCellsFromUniverse(universe);
    for (let idx = 0; idx < numberOfCells; idx++) {
        if (utils.isCellAlive(idx, cells)) {
            scene.add(cellShapes[idx])
        }
    }
    onWindowResize();
    window.addEventListener("resize", onWindowResize);
};

const render = () => {
    if (mouseX !== 0) {
        camera.position.x += (mouseX - camera.position.x) * .05;
    }
    if (mouseY !== 0) {
        camera.position.y += (-mouseY + 700 - camera.position.y) * .05;
    }
    camera.lookAt(scene.position);
    renderer.render(scene, camera);
};

export const updateCells = (births, deaths) => {
    births.forEach(
        idx => {
            scene.add(cellShapes[idx]);
        }
    );
    deaths.forEach(
        idx => {
            scene.remove(cellShapes[idx]);
        }
    );
    render()
};

const inMiddle = (currentX, currentY) => {
    return currentX > threeHalfX * 0.2
        && currentX < window.innerWidth - threeHalfX * 0.2
        && currentY > threeHalfY * 0.2
        && currentY < window.innerHeight - threeHalfX * 0.2
};

const onDocumentMouseMove = (event) => {
    let currentX = event.offsetX;
    let currentY = event.offsetY;
    if (inMiddle(currentX, currentY)) {
        mouseX = currentX - threeHalfX;
        mouseY = currentY - threeHalfY - 30;
        if (parentPaused()) {
            render()
        }
    } else {
        mouseX = 0;
        mouseY = 0;
    }
};

const onDocumentTouchStart = (event) => {
    if (event.touches.length > 1) {
        event.preventDefault();
        mouseX = event.touches[0].pageX - threeHalfX;
        mouseY = event.touches[0].pageY - threeHalfY;
    }
    if (parentPaused()) {
        render()
    }
};

const onDocumentTouchMove = (event) => {
    if (event.touches.length === 1) {
        event.preventDefault();
        mouseX = event.touches[0].pageX - threeHalfX;
        mouseY = event.touches[0].pageY - threeHalfY;
    }
    if (parentPaused()) {
        render()
    }
};

const onWindowResize = () => {
    if (size != null) {
        threeHalfX = threeModel.clientWidth / 2;
        threeHalfY = threeModel.clientHeight / 2;
        camera.aspect = threeModel.clientWidth / threeModel.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(threeModel.clientWidth, threeModel.clientHeight);
        if (parentPaused) {
            render()
        }
    }
};