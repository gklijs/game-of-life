import * as THREE from "three";

import {Model, Shape} from "./types";
import {Universe, Utils} from "game-of-life-3d";
import {Mesh, PerspectiveCamera, Scene, WebGLRenderer} from "three";

const threeModel: HTMLElement = document.getElementById("three-model")!;
const webGlBox: HTMLElement = document.getElementById("web-gl-box")!;
const zoomSlider: HTMLInputElement = <HTMLInputElement>document.getElementById("zoom-slider");
const zoomDisplay: HTMLElement= document.getElementById("zoom-display")!;

let scene: Scene = new THREE.Scene();
let camera: PerspectiveCamera | null = null;
let renderer: WebGLRenderer | null = null;
let size: number = 5;
let cellShapes: Array<Mesh> = [];
let moveXZ: number = 0;
let moveY: number = 0;
let boxHalfX: number = 500;
let boxHalfY: number = 500;
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

const initCells = (numberOfCells: number, shape: Shape) => {
    const cellSize = Math.floor(200 / size);
    cellShapes = new Array(numberOfCells);
    const geometry = shape === Shape.square ? new THREE.BoxBufferGeometry(cellSize * 2, cellSize * 2, cellSize * 2) : new THREE.SphereBufferGeometry(cellSize, 32, 32);
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

const bringInRange = (number: number, range: number) => {
    if (number > range) {
        return range;
    }
    if (number < -range) {
        return -range;
    }
    return number
};

const dist = (newY: number) => Math.sqrt(Math.pow(zoom, 2) - Math.pow(newY, 2));

const render = () => {
    if(camera === null || renderer === null){
        return;
    }
    if (moveY !== 0 || moveXZ !== 0) {
        const newY = bringInRange(camera.position.y - moveY, zoom - 10);
        const newDist = dist(newY);
        const newAngle = Math.atan2(camera.position.z, camera.position.x) + (moveXZ * .1 * Math.PI / 180);
        const newX = newDist * Math.cos(newAngle);
        const newZ = newDist * Math.sin(newAngle);
        camera.position.set(newX, newY, newZ);
        camera.lookAt(scene.position);
    }
    renderer.render(scene, camera);
};

const inMiddle = (currentX: number, currentY: number) => {
    return currentX > boxHalfX * 0.2
        && currentX < window.innerWidth - boxHalfX * 0.2
        && currentY > boxHalfY * 0.2
        && currentY < window.innerHeight - boxHalfX * 0.2
};

const updateMove = (currentX: number, currentY: number) => {
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

const onDocumentMouseMove = (event: MouseEvent) => {
    updateMove(event.offsetX, event.offsetY);
};

const onDocumentTouchStart = (event: TouchEvent) => {
    if (event.touches.length > 1) {
        event.preventDefault();
        updateMove(event.touches[0].clientX, event.touches[0].clientY);
    }
};

const onDocumentTouchMove = (event: TouchEvent) => {
    if (event.touches.length === 1) {
        event.preventDefault();
        updateMove(event.touches[0].clientX, event.touches[0].clientY);
    }
};

const onWindowResize = () => {
    if(camera === null || renderer === null){
        return;
    }
    boxHalfX = webGlBox.clientWidth / 2;
    boxHalfY = webGlBox.clientHeight / 2;
    camera.aspect = webGlBox.clientWidth / webGlBox.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(webGlBox.clientWidth, webGlBox.clientHeight);
};

const onZoomChange = () => {
    if(camera === null){
        return;
    }
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
    public init(universe: Universe, shape: Shape): void {
        threeModel.classList.add("is-visible");
        size = universe.width();
        const numberOfCells = Math.pow(size, 3);
        if (renderer === null) {
            initRenderer();
            initCamera();
            initLights();
            setListeners();
        }
        initCells(numberOfCells, shape);
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
        cellShapes.forEach(
            cell => {
                scene.remove(cell);
                cell.geometry.dispose();
            }
        )
    }
}