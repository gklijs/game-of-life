import * as THREE from "three";

const utils = require("./utils");

const threeModel = document.getElementById("three-model");
const scene = new THREE.Scene();
let camera = null;
let renderer = null;
let size = null;
let cells = [];
let cameraReady = false;
let mouseX = 0;
let mouseY = 0;
let windowHalfX = threeModel.clientWidth / 2;
let windowHalfY = threeModel.clientHeight / 2;

const initCamera = () => {
    camera = new THREE.PerspectiveCamera(50, threeModel.clientWidth / threeModel.clientHeight, 1, 2000);
    camera.position.x = 200;
    camera.position.y = 200;
    camera.position.z = 200;
    camera.lookAt(new THREE.Vector3(0, 0, 0));
};

const initRenderer = () => {
    renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true
    });
    renderer.setSize(threeModel.clientWidth, threeModel.clientHeight);
    renderer.shadowMap.enabled = true;
    threeModel.appendChild(renderer.domElement);
    return renderer;
};

const initPlane = () => {
    const planeGeometry = new THREE.PlaneBufferGeometry(400, 400, 10, 10);
    const planeMaterial = new THREE.MeshStandardMaterial({color: 0xFFFF00});
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.position.set(0, -100, 0);

    plane.receiveShadow = true;
    plane.rotation.x = -90 * Math.PI / 180;
    scene.add(plane);
};

const initCells = () => {
    const amountOfCells = Math.pow(size, 3);
    cells.length = amountOfCells;
    const geometry = new THREE.SphereBufferGeometry(5, 32, 32);
    const material = new THREE.MeshStandardMaterial({color: 0xFF0000});
    for (let i = 0; i < amountOfCells; i++) {
        const liveCell = new THREE.Mesh(geometry, material);
        liveCell.castShadow = true;
        liveCell.position.set(i, i, i);
        cells[i] = liveCell;
        scene.add(liveCell);
    }
};

const initLights = () => {
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(-100, 500, 400);
    light.castShadow = true;

    const d = 200;
    light.shadow.camera.left = -d;
    light.shadow.camera.right = d;
    light.shadow.camera.top = d;
    light.shadow.camera.bottum = -d;

    light.shadow.camera.far = 1000;

    scene.add(light);
    scene.add(new THREE.HemisphereLight(0xffffbb, 0x080820, 0.6));
    scene.add(new THREE.AmbientLight(0xa59f75, 0.6));
};

export const destroy = () => {
    //needs to remove all cells from the scene
    threeModel.classList.remove("is-visible");
    size = null;
};

export const init = (universe) => {
    threeModel.classList.add("is-visible");
    size = universe.width();
    if (!cameraReady) {
        initRenderer();
        initPlane();
        initCamera();
        initLights();
        cameraReady = true;
    }
    initCells();
};

const render = () => {
    camera.position.x += (mouseX - camera.position.x) * .05;
    camera.position.y += (-mouseY + 200 - camera.position.y) * .05;
    camera.lookAt(scene.position);
    renderer.render(scene, camera);
};

export const drawAllCells = (cells) => {
    render()
    //todo
};

export const updateCells = (births, deaths) => {
    render()
    //todo
};

const onDocumentMouseMove = (event) => {
    mouseX = event.clientX - windowHalfX;
    mouseY = event.clientY - windowHalfY;
};

const onDocumentTouchStart = (event) => {
    if (event.touches.length > 1) {
        event.preventDefault();
        mouseX = event.touches[0].pageX - windowHalfX;
        mouseY = event.touches[0].pageY - windowHalfY;
    }
};

const onDocumentTouchMove = (event) => {
    if (event.touches.length === 1) {
        event.preventDefault();
        mouseX = event.touches[0].pageX - windowHalfX;
        mouseY = event.touches[0].pageY - windowHalfY;
    }
};

const onWindowResize = () => {
    if (size != null) {
        windowHalfX = threeModel.clientWidth / 2;
        windowHalfY = threeModel.clientHeight / 2;
        camera.aspect = threeModel.clientWidth / threeModel.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(threeModel.clientWidth, threeModel.clientHeight);
    }
};

threeModel.addEventListener("mousemove", onDocumentMouseMove, false);
threeModel.addEventListener("touchstart", onDocumentTouchStart, false);
threeModel.addEventListener("touchmove", onDocumentTouchMove, false);
window.addEventListener("resize", onWindowResize, false);