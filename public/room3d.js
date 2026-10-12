import * as THREE from "/vendor/three.module.js";
import { GLTFLoader } from "/vendor/loaders/GLTFLoader.js";

const canvas = document.querySelector("#room-3d");
const canvasContainer = document.querySelector("#canvas-container");
const roomElement = document.querySelector("#room");
const entrance = document.querySelector("#entrance");
const viewportTracker = document.querySelector("#viewport-height-tracker");

if (canvas && canvasContainer && roomElement && entrance && viewportTracker) {
  try {
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.shadowMap.enabled = false;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x120906);
    scene.fog = new THREE.FogExp2(0x120906, 0.032);
    const camera = new THREE.PerspectiveCamera(52, 1, 0.1, 60);
    const warmWood = new THREE.MeshStandardMaterial({ color: 0x6a3218, roughness: 0.52, metalness: 0.02 });
    const darkWood = new THREE.MeshStandardMaterial({ color: 0x2c1208, roughness: 0.66 });
    const shelfWood = new THREE.MeshStandardMaterial({ color: 0x8f4924, roughness: 0.46 });
    const brass = new THREE.MeshStandardMaterial({ color: 0xc4873d, roughness: 0.36, metalness: 0.55 });
    const ivory = new THREE.MeshStandardMaterial({ color: 0xe7d0ae, roughness: 0.75 });
    const glow = new THREE.MeshStandardMaterial({ color: 0xffb45d, emissive: 0xe76b1c, emissiveIntensity: 2.1 });
    const cdColors = [0x221713,0x6c2420,0xddd0bb,0x283341,0x8d6d35,0x2e5a4b,0x4b2935];

    // Base illumination must remain visible even if a spotlight is outside the
    // camera frustum. This prevents the "black void" when the camera turns.
    const ambientLight = new THREE.AmbientLight(0xffd5a0, 2.8);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffc57d, 4.5);
    directionalLight.position.set(2, 9, 6);
    directionalLight.target.position.set(0, 1.8, 0);
    scene.add(directionalLight, directionalLight.target);
    scene.add(new THREE.HemisphereLight(0xffdda9, 0x150804, 1.45));
    const centreLight = new THREE.PointLight(0xffb45b, 220, 24, 2);
    centreLight.position.set(0, 6.5, 0); scene.add(centreLight);
    [-7, 7].forEach(x => { const light = new THREE.PointLight(0xff923e, 95, 15, 2); light.position.set(x, 4.7, 2); scene.add(light); });

    const floor = new THREE.Mesh(new THREE.CylinderGeometry(10.5, 10.5, .24, 64), warmWood);
    floor.position.y = -.15; scene.add(floor);
    const rug = new THREE.Mesh(new THREE.CylinderGeometry(3.3, 3.3, .05, 48), new THREE.MeshStandardMaterial({ color: 0xb18e6b, roughness: 1 }));
    rug.position.y = .02; scene.add(rug);

    function box(width, height, depth, material, x, y, z) {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
      mesh.position.set(x, y, z); return mesh;
    }

    function labelTexture(label) {
      const c = document.createElement("canvas"); c.width = 1024; c.height = 180;
      const ctx = c.getContext("2d");
      ctx.fillStyle = "#3b190a"; ctx.fillRect(0, 0, c.width, c.height);
      ctx.strokeStyle = "#d4a15d"; ctx.lineWidth = 10; ctx.strokeRect(14, 14, c.width - 28, c.height - 28);
      ctx.fillStyle = "#f4d6a4"; ctx.font = "600 54px Georgia"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(label, c.width / 2, c.height / 2 + 3);
      const texture = new THREE.CanvasTexture(c); texture.colorSpace = THREE.SRGBColorSpace;
      return new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true }));
    }

    function shelfWall(angle, label, featureColor) {
      const group = new THREE.Group();
      group.rotation.y = angle;
      // Rotation changes the orientation of a Group, not its world position.
      // Place each wall on the matching side of the room as well, otherwise
      // three camera stops would look into empty darkness.
      group.position.set(-9.1 * Math.sin(angle), 4, -9.1 * Math.cos(angle));
      group.add(box(10.8, 8.2, .34, darkWood, 0, 0, 0));
      for (let row = 0; row < 6; row++) {
        const y = -3.55 + row * 1.2;
        group.add(box(10.6, .14, .62, shelfWood, 0, y, .4));
        group.add(box(10.25, .045, .1, glow, 0, y + .21, .73));
        for (let col = 0; col < 25; col++) {
          const seed = ((row * 29 + col * 11 + Math.round(angle * 10)) % cdColors.length + cdColors.length) % cdColors.length;
          const h = .48 + ((row + col) % 4) * .055;
          group.add(box(.25, h, .16, new THREE.MeshStandardMaterial({ color: cdColors[seed], roughness: .58 }), -4.82 + col * .4, y + .4 + h / 2, .7));
        }
      }
      const plaque = labelTexture(label); plaque.position.set(0, -.58, .84); plaque.scale.set(3.2, .56, 1); group.add(plaque);
      const stand = new THREE.Group(); stand.position.set(0, -2.05, .92);
      stand.add(box(1.9, .15, .8, shelfWood, 0, 0, 0));
      stand.add(box(1.35, 1.65, .12, new THREE.MeshStandardMaterial({ color: featureColor, roughness:.45, metalness:.08 }), 0, .88, -.22));
      const ring = new THREE.Mesh(new THREE.TorusGeometry(.36, .07, 12, 32), brass); ring.position.set(0, .88, -.13); stand.add(ring);
      group.add(stand);
      scene.add(group);
    }

    shelfWall(0, "ROCK & POP", 0x8a2d1e);
    shelfWall(Math.PI / 2, "CLASSICAL", 0x30415a);
    shelfWall(Math.PI, "JAZZ & BLUES", 0x2f6175);
    shelfWall(-Math.PI / 2, "DÉCOUVERTES", 0x72522d);

    const chair = new THREE.Group();
    chair.add(new THREE.Mesh(new THREE.SphereGeometry(1.65, 32, 20), ivory)); chair.children[0].scale.set(1, .52, 1);
    chair.children[0].position.set(0, .85, .25);
    chair.add(new THREE.Mesh(new THREE.SphereGeometry(1.5, 32, 20), ivory)); chair.children[1].scale.set(1, .78, .58); chair.children[1].position.set(0, 1.65, .55);
    chair.rotation.y = -.22; scene.add(chair);

    const stops = [
      { camera: new THREE.Vector3(0, 3.6, 3.3), target: new THREE.Vector3(0, 3.0, -8.9) },
      { camera: new THREE.Vector3(-5.8, 3.55, 5.8), target: new THREE.Vector3(-8.9, 3.0, 0) },
      { camera: new THREE.Vector3(0, 3.55, 1.6), target: new THREE.Vector3(0, 3.0, 8.9) },
      { camera: new THREE.Vector3(5.8, 3.55, 5.8), target: new THREE.Vector3(8.9, 3.0, 0) }
    ];

    // One continuous camera path plus a separate look-at path.  Keeping these
    // separate lets the camera travel around the chair while facing each shelf.
    const openingCamera = new THREE.Vector3(0, 4.55, 14.4);
    const openingTarget = new THREE.Vector3(0, 2.6, -1.4);
    const closingCamera = new THREE.Vector3(0, 4.45, 13.5);
    const closingTarget = new THREE.Vector3(0, 2.8, 0);
    const cameraCurve = new THREE.CatmullRomCurve3([openingCamera, ...stops.map(stop => stop.camera), closingCamera], false, "centripetal", 0.5);
    const targetCurve = new THREE.CatmullRomCurve3([openingTarget, ...stops.map(stop => stop.target), closingTarget], false, "centripetal", 0.5);
    const samples = Array.from({ length: 601 }, (_, index) => {
      const t = index / 600;
      return { t, point: cameraCurve.getPoint(t) };
    });
    const stopProgress = stops.map(stop => samples.reduce((best, sample) => sample.point.distanceToSquared(stop.camera) < best.distance ? { t: sample.t, distance: sample.point.distanceToSquared(stop.camera) } : best, { t:0, distance:Infinity }).t);
    let activeStop = -1;

    // The scroll position is the timeline. Do not add a per-frame lerp here:
    // it makes the camera lag a visitor's finger and prevents exact shelf stops.
    function fallbackProgress() {
      const bounds = viewportTracker.getBoundingClientRect();
      return THREE.MathUtils.clamp((window.innerHeight - bounds.top) / Math.max(1, viewportTracker.offsetHeight), 0, 1);
    }

    function applyJourney(progress = fallbackProgress()) {
      progress = THREE.MathUtils.clamp(progress, 0, 1);
      camera.position.copy(cameraCurve.getPoint(progress));
      camera.lookAt(targetCurve.getPoint(progress));
      roomElement.dataset.cameraProgress = progress.toFixed(3);
      let nextStop = -1; let nearest = 0.095;
      stopProgress.forEach((stopAt, index) => {
        const distance = Math.abs(progress - stopAt);
        if (distance < nearest) { nearest = distance; nextStop = index; }
      });
      if (nextStop !== activeStop) {
        activeStop = nextStop;
        roomElement.dataset.scene = nextStop >= 0 ? String(nextStop) : "";
        if (nextStop >= 0) window.dispatchEvent(new CustomEvent("maison:room-stop", { detail:{ index:nextStop } }));
      }
      renderer.render(scene, camera);
    }
    function resize() {
      const { width, height } = canvasContainer.getBoundingClientRect();
      if (width < 2 || height < 2) return;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      applyJourney();
    }
    window.addEventListener("resize", resize, { passive:true });

    // The GLB is optional during the procedural-room phase. When an asset URL
    // is supplied, these logs make it unambiguous whether loading succeeded,
    // failed, or the resulting coordinates are outside the camera's view.
    const modelUrl = canvas.dataset.modelUrl?.trim();
    const gltfLoader = new GLTFLoader();
    if (modelUrl) {
      console.info("[Maison Sillon 3D] Fetching GLB model", { modelUrl });
      gltfLoader.load(
        modelUrl,
        (gltf) => {
          const roomModel = gltf.scene;
          scene.add(roomModel);
          const bounds = new THREE.Box3().setFromObject(roomModel);
          const centre = bounds.getCenter(new THREE.Vector3());
          const size = bounds.getSize(new THREE.Vector3());
          console.info("[Maison Sillon 3D] GLB loaded", {
            modelUrl,
            children: roomModel.children.length,
            centre: centre.toArray(),
            size: size.toArray(),
            camera: camera.position.toArray()
          });
          applyJourney();
        },
        (event) => {
          if (event.total) console.info("[Maison Sillon 3D] GLB progress", { modelUrl, loaded: event.loaded, total: event.total });
        },
        (error) => console.error("[Maison Sillon 3D] GLB failed to load", { modelUrl, error })
      );
    } else {
      console.info("[Maison Sillon 3D] No GLB URL configured; using the procedural room.");
    }

    async function connectScrollTrigger() {
      try {
        const [{ gsap }, { ScrollTrigger }] = await Promise.all([
          import("https://cdn.jsdelivr.net/npm/gsap@3.12.7/+esm"),
          import("https://cdn.jsdelivr.net/npm/gsap@3.12.7/ScrollTrigger.js/+esm")
        ]);
        gsap.registerPlugin(ScrollTrigger);
        ScrollTrigger.create({
          trigger: viewportTracker,
          start: "top bottom",
          end: "bottom bottom",
          scrub: true,
          invalidateOnRefresh: true,
          onUpdate: (self) => applyJourney(self.progress)
        });
        console.info("[Maison Sillon 3D] ScrollTrigger connected to #viewport-height-tracker");
        ScrollTrigger.refresh();
      } catch (error) {
        console.warn("[Maison Sillon 3D] ScrollTrigger unavailable; using native scroll fallback.", error);
        window.addEventListener("scroll", () => applyJourney(), { passive:true });
      }
    }

    new ResizeObserver(resize).observe(roomElement);
    requestAnimationFrame(() => {
      resize();
      applyJourney();
      roomElement.classList.add("room3d-ready");
      renderer.render(scene, camera);
    });
    viewportTracker.style.height = `${stops.length * 90}vh`;
    connectScrollTrigger();
    window.__maisonSillon3D = { renderer, camera, applyJourney, roomElement, viewportTracker, stopProgress, gltfLoader };
  } catch (error) {
    console.warn("Maison Sillon 3D fallback", error);
    roomElement.classList.add("webgl-unavailable");
  }
}
