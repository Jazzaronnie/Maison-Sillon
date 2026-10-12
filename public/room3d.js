import * as THREE from "/vendor/three.module.js";

const canvas = document.querySelector("#room-3d");
const roomElement = document.querySelector("#room");
const entrance = document.querySelector("#entrance");

if (canvas && roomElement && entrance) {
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
      group.position.set(0, 4, -9.1);
      group.add(box(10.8, 8.2, .34, darkWood, 0, 0, 0));
      for (let row = 0; row < 6; row++) {
        const y = -3.55 + row * 1.2;
        group.add(box(10.6, .14, .62, shelfWood, 0, y, .4));
        group.add(box(10.25, .045, .1, glow, 0, y + .21, .73));
        for (let col = 0; col < 25; col++) {
          const seed = (row * 29 + col * 11 + Math.round(angle * 10)) % cdColors.length;
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

    // These are deliberate camera stops, not four replacement images.  Scrolling
    // moves the *same* camera through the room, then the render loop eases it to
    // the next viewpoint so the turn is plainly visible on touch devices too.
    const stops = [
      // Enter through the centre, then pan left, rear, and right around the sofa.
      { position: new THREE.Vector3(0, 4.35, 14.2), target: new THREE.Vector3(0, 3.0, -7.8) },
      { position: new THREE.Vector3(-5.9, 3.65, 5.9), target: new THREE.Vector3(-8.9, 3.05, 0) },
      { position: new THREE.Vector3(0, 3.65, 1.8), target: new THREE.Vector3(0, 3.05, 8.9) },
      { position: new THREE.Vector3(5.9, 3.65, 5.9), target: new THREE.Vector3(8.9, 3.05, 0) }
    ];
    const cameraPosition = stops[0].position.clone();
    const lookTarget = stops[0].target.clone();
    const desiredPosition = stops[0].position.clone();
    const desiredTarget = stops[0].target.clone();
    function smooth(value) { return value * value * (3 - 2 * value); }
    function applyJourney() {
      // Using the section's live screen position is more dependable than a raw
      // page scroll value when the room is sticky on Safari/iOS.
      const bounds = entrance.getBoundingClientRect();
      const total = Math.max(1, entrance.offsetHeight - window.innerHeight);
      const progress = THREE.MathUtils.clamp((-bounds.top) / total, 0, .9999);
      const scaled = progress * (stops.length - 1); const index = Math.floor(scaled); const local = smooth(scaled - index);
      desiredPosition.lerpVectors(stops[index].position, stops[index + 1].position, local);
      desiredTarget.lerpVectors(stops[index].target, stops[index + 1].target, local);
      roomElement.dataset.scene = String(index);
      roomElement.dataset.cameraProgress = progress.toFixed(3);
    }
    function resize() {
      const { width, height } = roomElement.getBoundingClientRect();
      if (width < 2 || height < 2) return;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }
    window.addEventListener("resize", resize, { passive:true });
    window.addEventListener("scroll", applyJourney, { passive:true });
    new ResizeObserver(resize).observe(roomElement);
    requestAnimationFrame(() => {
      resize();
      applyJourney();
      roomElement.classList.add("room3d-ready");
    });
    function render() {
      // The easing here is what makes a wheel gesture or mobile swipe read as a
      // cinematic move rather than an instant jump between static cameras.
      cameraPosition.lerp(desiredPosition, 0.035);
      lookTarget.lerp(desiredTarget, 0.035);
      camera.position.copy(cameraPosition);
      camera.lookAt(lookTarget);
      renderer.render(scene, camera);
    }
    // setAnimationLoop survives mobile tab throttling better than a manually
    // chained requestAnimationFrame and resumes cleanly when the tab is active.
    renderer.setAnimationLoop(render);
    window.__maisonSillon3D = { renderer, camera, applyJourney, roomElement };
  } catch (error) {
    console.warn("Maison Sillon 3D fallback", error);
    roomElement.classList.add("webgl-unavailable");
  }
}
