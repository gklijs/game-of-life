import * as THREE from "three";

const utils = require("./utils");

const threeModel = document.getElementById("three-model");
let scene = null;
let camera = null;
let renderer = null;
let size = null;
let cellShapes = null;
let sceneSet = false;
let isSquare = null;
let moveXZ = 0;
let directionXZ = 1;
let moveY = 0;
let threeHalfX = null;
let threeHalfY = null;
const zoom = 1000;

const initCamera = () => {
    camera = new THREE.PerspectiveCamera(50, threeModel.clientWidth / threeModel.clientHeight, 1, 2000);
    camera.position.set(300, 905, 300);
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
    const distance = cellSize * 2 + 1;
    const correction = -(size * distance) / 2;
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
    const light = new THREE.SpotLight(0xFFFFFF, 1, 1000);
    light.position.set(0, 500, 0);

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

export const init = (universe, square) => {
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

const bringInRange = (number, range) => {
    if (number > range) {
        return range;
    }
    if (number < -range) {
        return -range;
    }
    return number
};

const getThirdCord = (firstCord, secondCord, currentThirdCord) => {
    const roomLeft = Math.pow(zoom, 2) - Math.pow(secondCord, 2) - Math.pow(firstCord, 2);
    if (roomLeft < 0) {
        return 0;
    }
    if (currentThirdCord > 0) {
        return Math.sqrt(roomLeft);
    } else {
        return -Math.sqrt(roomLeft)
    }
};

const render = () => {
    if (moveY !== 0 || moveXZ !== 0) {
        const newY = bringInRange(camera.position.y - moveY, zoom);
        const maxX = Math.sqrt(Math.pow(zoom, 2) - Math.pow(newY, 2));
        let directionChanged = 1;
        if (Math.abs(camera.position.x + moveXZ * directionXZ) > maxX) {
            directionXZ = -1 * directionXZ;
            directionChanged = -1;
        }
        const newX = bringInRange(camera.position.x + moveXZ * directionXZ, maxX);
        const newZ = directionChanged * getThirdCord(newX, newY, camera.position.z);
        camera.position.set(newX, newY, newZ);
        camera.lookAt(scene.position);
    }
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

const updateMove = (currentX, currentY) => {
    if (inMiddle(currentX, currentY)) {
        if (currentX > threeHalfX * 1.2 || currentX < window.innerWidth - threeHalfX * 1.2) {
            moveXZ = currentX > threeHalfX ? 1 : -1;
        } else {
            moveXZ = 0;
        }
        if (currentY > threeHalfY * 1.2 || currentY < window.innerHeight - threeHalfY * 1.2) {
            moveY = currentY > threeHalfY ? 1 : -1;
        } else {
            moveY = 0;
        }
    } else {
        moveXZ = 0;
        moveY = 0;
    }
};

const onDocumentMouseMove = (event) => {
    updateMove(event.offsetX, event.offsetY);
};

const onDocumentTouchStart = (event) => {
    if (event.touches.length > 1) {
        event.preventDefault();
        updateMove(event.touches[0].clientX, event.touches[0].clientY);
    }
};

const onDocumentTouchMove = (event) => {
    if (event.touches.length === 1) {
        event.preventDefault();
        updateMove(event.touches[0].clientX, event.touches[0].clientY);
    }
};

const onWindowResize = () => {
    if (size != null) {
        threeHalfX = threeModel.clientWidth / 2;
        threeHalfY = threeModel.clientHeight / 2;
        camera.aspect = threeModel.clientWidth / threeModel.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(threeModel.clientWidth, threeModel.clientHeight);
    }
};