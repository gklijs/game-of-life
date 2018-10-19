import * as THREE from "three";

import {Model} from "./types";
import {Universe, Utils} from "game-of-life-3d";

const threeModel = document.getElementById("three-model");
const webGlBox = document.getElementById("web-gl-box");
const zoomSlider: HTMLInputElement = <HTMLInputElement>document.getElementById("zoom-slider");
const zoomDisplay = document.getElementById("zoom-display");

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
let boxHalfX = null;
let boxHalfY = null;
let zoom = 1000;

const initCamera = () => {
    camera = new THREE.PerspectiveCamera(50, webGlBox.clientWidth / webGlBox.clientHeight, 1, 2000);
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
    renderer.setSize(webGlBox.clientWidth, webGlBox.clientHeight);
    webGlBox.appendChild(renderer.domElement);
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
    const correction = -((size - 1) * distance) / 2;
    for (let layer = 0; layer < size; layer++) {
        for (let row = 0; row < size; row++) {
            for (let column = 0; column < size; column++) {
                const cell = liveCell.clone();
                cell.position.set(correction + column * distance, correction + layer * distance, correction + row * distance);
                cellShapes[Utils.getIndex(column, row, layer, size, size)] = cell;
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

const setListeners = () => {
    webGlBox.addEventListener("mousemove", onDocumentMouseMove);
    webGlBox.addEventListener("touchstart", onDocumentTouchStart);
    webGlBox.addEventListener("touchmove", onDocumentTouchMove);
    zoomSlider.addEventListener("change", onZoomChange);
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
        const newY = bringInRange(camera.position.y - moveY, zoom - 10);
        const maxX = Math.sqrt(Math.pow(zoom, 2) - Math.pow(newY, 2));
        let newX;
        let newZ;
        if (Math.abs(camera.position.x + moveXZ * directionXZ) > maxX) {
            directionXZ = -1 * directionXZ;
            newX = camera.position.x > 0 ? maxX - 0.5 : 0.5 - maxX;
            newZ = -getThirdCord(newX, newY, camera.position.z)
        } else {
            newX = bringInRange(camera.position.x + moveXZ * directionXZ, maxX);
            newZ = getThirdCord(newX, newY, camera.position.z);
        }
        camera.position.set(newX, newY, newZ);
        camera.lookAt(scene.position);
    }
    renderer.render(scene, camera);
};

const inMiddle = (currentX, currentY) => {
    return currentX > boxHalfX * 0.2
        && currentX < window.innerWidth - boxHalfX * 0.2
        && currentY > boxHalfY * 0.2
        && currentY < window.innerHeight - boxHalfX * 0.2
};

const updateMove = (currentX, currentY) => {
    if (inMiddle(currentX, currentY)) {
        if (currentX > boxHalfX * 1.2 || currentX < window.innerWidth - boxHalfX * 1.2) {
            moveXZ = currentX > boxHalfX ? 1 : -1;
        } else {
            moveXZ = 0;
        }
        if (currentY > boxHalfY * 1.2 || currentY < window.innerHeight - boxHalfY * 1.2) {
            moveY = currentY > boxHalfY ? 1 : -1;
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
        boxHalfX = webGlBox.clientWidth / 2;
        boxHalfY = webGlBox.clientHeight / 2;
        camera.aspect = webGlBox.clientWidth / webGlBox.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(webGlBox.clientWidth, webGlBox.clientHeight);
    }
};

const onZoomChange = () => {
    const previousZoom = zoom;
    const sliderValue = parseInt(zoomSlider.value);
    zoom = 2000 - sliderValue;
    const zoomFactor = zoom / previousZoom;
    zoomDisplay.innerText = String((Math.floor(sliderValue / 10)));
    camera.position.x = camera.position.x * zoomFactor;
    camera.position.y = camera.position.y * zoomFactor;
    camera.position.z = camera.position.z * zoomFactor;
};

export class ThreeModel implements Model {
    public init(universe: Universe, square: boolean): void {
        isSquare = square;
        threeModel.classList.add("is-visible");
        size = universe.width();
        const numberOfCells = Math.pow(size, 3);
        if (!sceneSet) {
            scene = new THREE.Scene();
            initRenderer();
            initCamera();
            initLights();
            setListeners();
            sceneSet = true;
        }
        initCells(numberOfCells);
        const cells = Utils.getCellsFromUniverse(universe);
        for (let idx = 0; idx < numberOfCells; idx++) {
            if (Utils.isCellAlive(idx, cells)) {
                scene.add(cellShapes[idx])
            }
        }
        onWindowResize();
        window.addEventListener("resize", onWindowResize);
    }


    public updateCells(births: Uint32Array, deaths: Uint32Array): void {
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
    }

    public destroy(): void {
        threeModel.classList.remove("is-visible");
        window.removeEventListener("resize", onWindowResize);
        size = null;
        cellShapes.forEach(
            cell => {
                scene.remove(cell);
                cell.geometry.dispose();
            }
        )
    }
}