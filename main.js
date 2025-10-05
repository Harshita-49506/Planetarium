import * as THREE from 'https://cdn.skypack.dev/three@0.128.0';
import { OrbitControls } from 'https://cdn.skypack.dev/three@0.128.0/examples/jsm/controls/OrbitControls.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 5000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// control and light
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
const pointLight = new THREE.PointLight(0xFFFFFF, 2, 0);
pointLight.castShadow = true;
scene.add(pointLight);
const ambientLight = new THREE.AmbientLight(0x444444);
scene.add(ambientLight);

// UI
let simulationSpeed = 1;
let lockedTarget = null;
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const clickableObjects = [];

const infoModal = document.getElementById('info-modal');
const modalTitle = document.getElementById('modal-title');
const modalDescription = document.getElementById('modal-description');
const closeBtn = document.querySelector('.close-btn');
const speedSlider = document.getElementById('speed-slider');
const unlockBtn = document.getElementById('unlock-btn');

// planet description
const descriptions = {
    "Sun": `The star at the center of our Solar System.<ul>
        <li><b>Type:</b> G2V Yellow Dwarf Star</li>
        <li><b>Age:</b> ~4.6 billion years old</li>
        <li><b>Size:</b> 109 times Earth's diameter</li>
        <li><b>Composition:</b> ~73% hydrogen, ~25% helium</li>
        <li><b>Core Temperature:</b> 15 million °C</li>
    </ul>`,
    "Mercury": `The smallest and innermost planet.<ul>
        <li><b>Type:</b> Terrestrial Planet</li>
        <li><b>Surface:</b> Rocky and heavily cratered, similar to the Moon.</li>
        <li><b>Atmosphere:</b> Extremely thin (an exosphere).</li>
        <li><b>Temperature:</b> Ranges from -173°C to 427°C.</li>
        <li><b>Year:</b> 88 Earth days</li>
        <li><b>Day:</b> 59 Earth days</li>
    </ul>`,
    "Venus": `A terrestrial planet often called Earth's 'hellish twin.'<ul>
        <li><b>Type:</b> Terrestrial Planet</li>
        <li><b>Surface:</b> Volcanic plains and mountains.</li>
        <li><b>Atmosphere:</b> Dense CO₂ with sulfuric acid clouds.</li>
        <li><b>Temperature:</b> Hottest planet at ~465°C.</li>
        <li><b>Year:</b> 225 Earth days</li>
        <li><b>Day:</b> 243 Earth days (retrograde)</li>
    </ul>`,
    "Earth": `Our home, and the only known planet with life.<ul>
        <li><b>Type:</b> Terrestrial Planet</li>
        <li><b>Surface:</b> 71% covered by liquid water oceans.</li>
        <li><b>Atmosphere:</b> 78% nitrogen, 21% oxygen.</li>
        <li><b>Temperature:</b> Average of ~15°C.</li>
        <li><b>Year:</b> 365.25 days</li>
        <li><b>Day:</b> 24 hours</li>
    </ul>`,
    "Mars": `The 'Red Planet,' a target for future exploration.<ul>
        <li><b>Type:</b> Terrestrial Planet</li>
        <li><b>Surface:</b> Dusty, iron-rich soil with volcanoes and canyons.</li>
        <li><b>Atmosphere:</b> Thin carbon dioxide.</li>
        <li><b>Temperature:</b> Ranges from -125°C to 20°C.</li>
        <li><b>Year:</b> 687 Earth days</li>
        <li><b>Day:</b> 24.6 hours</li>
    </ul>`,
    "Jupiter": `The largest planet in our solar system.<ul>
        <li><b>Type:</b> Gas Giant</li>
        <li><b>Surface:</b> No solid surface; composed of swirling clouds.</li>
        <li><b>Atmosphere:</b> Primarily hydrogen and helium.</li>
        <li><b>Feature:</b> The Great Red Spot is a storm larger than Earth.</li>
        <li><b>Year:</b> 11.9 Earth years</li>
        <li><b>Day:</b> ~10 hours</li>
    </ul>`,
    "Saturn": `The famous ringed gas giant.<ul>
        <li><b>Type:</b> Gas Giant</li>
        <li><b>Rings:</b> Made of countless particles of ice and rock.</li>
        <li><b>Atmosphere:</b> Primarily hydrogen and helium.</li>
        <li><b>Temperature:</b> ~-178°C.</li>
        <li><b>Year:</b> 29.5 Earth years</li>
        <li><b>Day:</b> ~10.7 hours</li>
    </ul>`,
    "Uranus": `The ice giant that spins on its side.<ul>
        <li><b>Type:</b> Ice Giant</li>
        <li><b>Atmosphere:</b> Hydrogen, helium, and methane (which gives its blue color).</li>
        <li><b>Tilt:</b> Has an extreme axial tilt of ~98°.</li>
        <li><b>Temperature:</b> Coldest planet at ~-224°C.</li>
        <li><b>Year:</b> 84 Earth years</li>
        <li><b>Day:</b> ~17 hours</li>
    </ul>`,
    "Neptune": `The farthest and windiest planet.<ul>
        <li><b>Type:</b> Ice Giant</li>
        <li><b>Weather:</b> Strongest winds in the solar system.</li>
        <li><b>Atmosphere:</b> Hydrogen, helium, and methane.</li>
        <li><b>Temperature:</b> ~-218°C.</li>
        <li><b>Year:</b> 165 Earth years</li>
        <li><b>Day:</b> ~16 hours</li>
    </ul>`,
    "Moon": `Earth's only natural satellite.<ul><li><b>Type:</b> Natural Satellite</li><li><b>Surface:</b> Rocky and cratered.</li><li><b>Cosmic Role:</b> Stabilizes Earth's axial tilt and drives tides.</li></ul>`,
    "Asteroid Belt": `A region of space between Mars and Jupiter.<ul><li><b>Composition:</b> Millions of asteroids made of rock and metal.</li><li><b>Total Mass:</b> About 4% of the Moon's mass.</li></ul>`,
    "Ceres": `A dwarf planet and the largest object in the asteroid belt.<ul><li><b>Type:</b> Dwarf Planet</li><li><b>Composition:</b> Rocky body that may contain a large amount of water ice.</li></ul>`,
};

// background
const textureLoader = new THREE.TextureLoader();
const starfieldGeo = new THREE.SphereGeometry(1000, 60, 40);
starfieldGeo.scale(-1, 1, 1);
const starfieldMat = new THREE.MeshBasicMaterial({ map: textureLoader.load('textures/stars.jpg') });
const starfield = new THREE.Mesh(starfieldGeo, starfieldMat);
scene.add(starfield);

// helps
function createOrbit(radius) {
    const orbitGeo = new THREE.RingGeometry(radius - 0.1, radius + 0.1, 128);
    const orbitMat = new THREE.MeshBasicMaterial({ color: 0x444444, side: THREE.DoubleSide });
    const orbit = new THREE.Mesh(orbitGeo, orbitMat);
    orbit.rotation.x = -0.5 * Math.PI;
    scene.add(orbit);
}

function createPlanet({ name, size, texture, position, ring, tilt = 0 }) {
    const geo = new THREE.SphereGeometry(size, 30, 30);
    const mat = new THREE.MeshStandardMaterial({ map: textureLoader.load(texture) });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.rotation.z = tilt;
    const obj = new THREE.Object3D();
    obj.add(mesh);
    if (ring) {
        const ringGeo = new THREE.RingGeometry(ring.innerRadius, ring.outerRadius, 64);
        const ringMat = new THREE.MeshBasicMaterial({ map: textureLoader.load(ring.texture), side: THREE.DoubleSide, transparent: true, opacity: 0.8 });
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        mesh.add(ringMesh);
        ringMesh.rotation.x = -0.5 * Math.PI;
    }
    scene.add(obj);
    const startAngle = Math.random() * Math.PI * 2;
    mesh.position.x = position * Math.cos(startAngle);
    mesh.position.z = position * Math.sin(startAngle);
    createOrbit(position);
    clickableObjects.push(mesh);
    return { mesh, obj };
}

// instantiating object
const sun = new THREE.Mesh(new THREE.SphereGeometry(16, 30, 30), new THREE.MeshBasicMaterial({ map: textureLoader.load('textures/sun.jpg') }));
sun.name = "Sun";
scene.add(sun);
clickableObjects.push(sun);

const mercury = createPlanet({ name: "Mercury", size: 3.2, texture: 'textures/mercury.jpg', position: 28 });
const venus = createPlanet({ name: "Venus", size: 5.8, texture: 'textures/venus.jpg', position: 44 });
const earth = createPlanet({ name: "Earth", size: 6, texture: 'textures/earth.jpg', position: 62 });
const mars = createPlanet({ name: "Mars", size: 4, texture: 'textures/mars.jpg', position: 78 });
const ceres = createPlanet({ name: "Ceres", size: 1.5, texture: 'textures/ceres.jpg', position: 95 });
const vesta = createPlanet({ name: "Vesta", size: 1.3, texture: 'textures/vesta.jpg', position: 95 });
const jupiter = createPlanet({ name: "Jupiter", size: 12, texture: 'textures/jupiter.jpg', position: 120 });
const saturn = createPlanet({ name: "Saturn", size: 10, texture: 'textures/saturn.jpg', position: 160, ring: { innerRadius: 12, outerRadius: 20, texture: 'textures/saturn_ring.png' }, tilt: 0.3 });
const uranus = createPlanet({ name: "Uranus", size: 7, texture: 'textures/uranus.jpg', position: 190, ring: { innerRadius: 9, outerRadius: 14, texture: 'textures/uranus_ring.png' }, tilt: 1.7 });
const neptune = createPlanet({ name: "Neptune", size: 7, texture: 'textures/neptune.jpg', position: 220 });
const pluto = createPlanet({ name: "Pluto", size: 2.8, texture: 'textures/pluto.jpg', position: 250 });

const moon = new THREE.Mesh(new THREE.SphereGeometry(1.6, 30, 30), new THREE.MeshStandardMaterial({ map: textureLoader.load('textures/moon.jpg') }));
moon.name = "Moon";
moon.castShadow = true;
moon.receiveShadow = true;
const moonObj = new THREE.Object3D();
moonObj.add(moon);
earth.mesh.add(moonObj);
moon.position.x = 10;
clickableObjects.push(moon);

const asteroidBeltPivot = new THREE.Object3D();
scene.add(asteroidBeltPivot);
const asteroidGeo = new THREE.DodecahedronGeometry(0.3, 0);
const asteroidMat = new THREE.MeshStandardMaterial({ color: 0x888888 });
for (let i = 0; i < 1500; i++) { const asteroid = new THREE.Mesh(asteroidGeo, asteroidMat); const radius = 100 + Math.random() * 8; const theta = Math.random() * 2 * Math.PI; const y = (Math.random() - 0.5) * 5; asteroid.position.set(radius * Math.cos(theta), y, radius * Math.sin(theta)); asteroid.rotation.set(Math.random(), Math.random(), Math.random()); asteroid.castShadow = true; asteroid.receiveShadow = true; asteroidBeltPivot.add(asteroid); }

const clickableBeltGeo = new THREE.RingGeometry(98, 110, 64);
const clickableBeltMat = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, visible: false });
const clickableBelt = new THREE.Mesh(clickableBeltGeo, clickableBeltMat);
clickableBelt.name = "Asteroid Belt";
clickableBelt.rotation.x = -0.5 * Math.PI;
scene.add(clickableBelt);
clickableObjects.push(clickableBelt);

camera.position.set(0, 150, 300);
controls.update();

// events
speedSlider.addEventListener('input', (e) => { simulationSpeed = parseFloat(e.target.value); });
closeBtn.addEventListener('click', () => { infoModal.style.display = 'none'; });
unlockBtn.addEventListener('click', () => {
    lockedTarget = null;
    unlockBtn.style.display = 'none';
    gsap.to(controls.target, { duration: 1, x: 0, y: 0, z: 0 });
});
window.addEventListener('click', (event) => {
    if (event.target.id === 'speed-slider') return;
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(clickableObjects, true);

    if (intersects.length > 0) {
        let targetObject = intersects[0].object; let objectName = targetObject.name;
        lockedTarget = targetObject;
        const targetPosition = new THREE.Vector3();
        targetObject.getWorldPosition(targetPosition);
        const radius = targetObject.geometry ? targetObject.geometry.boundingSphere.radius : 10;
        const cameraOffset = (objectName === "Sun") ? radius * 2.5 : radius * 4;
        const offsetPosition = new THREE.Vector3(targetPosition.x + cameraOffset, targetPosition.y + (cameraOffset / 2), targetPosition.z + cameraOffset);

        gsap.to(camera.position, { duration: 1.5, x: offsetPosition.x, y: offsetPosition.y, z: offsetPosition.z, ease: "power2.inOut" });
        gsap.to(controls.target, { duration: 1.5, x: targetPosition.x, y: targetPosition.y, z: targetPosition.z, ease: "power2.inOut",
            onComplete: () => {
                unlockBtn.style.display = 'block';
                const description = descriptions[objectName];
                if (description) { 
                    modalTitle.textContent = objectName; 
                    // CHANGE: Use .innerHTML to render bullet points
                    modalDescription.innerHTML = description; 
                    infoModal.style.display = 'block'; 
                }
            }
        });
    }
});

// animation
function animate() {
    requestAnimationFrame(animate);
    const speed = simulationSpeed * 0.02;
    sun.rotateY(0.004 * speed);
    mercury.mesh.rotateY(0.004 * speed);
    venus.mesh.rotateY(-0.002 * speed);
    earth.mesh.rotateY(0.02 * speed);
    mars.mesh.rotateY(0.018 * speed);
    ceres.mesh.rotateY(0.01 * speed);
    vesta.mesh.rotateY(0.012 * speed);
    jupiter.mesh.rotateY(0.04 * speed);
    saturn.mesh.rotateY(0.038 * speed);
    uranus.mesh.rotateY(0.03 * speed);
    neptune.mesh.rotateY(0.032 * speed);
    pluto.mesh.rotateY(0.008 * speed);
    moon.rotateY(0.05 * speed);
    mercury.obj.rotateY(0.4 * speed);
    venus.obj.rotateY(0.15 * speed);
    earth.obj.rotateY(0.1 * speed);
    mars.obj.rotateY(0.08 * speed);
    ceres.obj.rotateY(0.07 * speed);
    vesta.obj.rotateY(0.07 * speed);
    jupiter.obj.rotateY(0.02 * speed);
    saturn.obj.rotateY(0.009 * speed);
    uranus.obj.rotateY(0.004 * speed);
    neptune.obj.rotateY(0.001 * speed);
    pluto.obj.rotateY(0.0007 * speed);
    moonObj.rotateY(1.2 * speed);
    asteroidBeltPivot.rotateY(0.005 * speed);
    if (lockedTarget && lockedTarget.name !== "Asteroid Belt") {
        const targetPosition = new THREE.Vector3();
        lockedTarget.getWorldPosition(targetPosition);
        controls.target.copy(targetPosition);
    }
    controls.update();
    renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});