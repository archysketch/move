import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/+esm'
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/controls/OrbitControls.js/+esm'
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/GLTFLoader.js/+esm'

/* =====================
   GLOBAL CSS (PINS)
===================== */
document.body.style.margin = '0'
document.body.style.overflow = 'hidden'

const style = document.createElement('style')
style.innerHTML = `
.pin-layer {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 10;
  display: none;
}
.pin {
  position: absolute;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #fff;
  color: #111;
  font-size: 11px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  transform: translate(-50%, -50%);
  pointer-events: auto;
  cursor: pointer;
}
.tooltip {
  position: absolute;
  background: #fff;
  color: #111;
  padding: 4px 8px;
  font-size: 11px;
  border-radius: 2px;
  white-space: nowrap;
  transform: translate(16px, -50%);
  display: none;
}
`
document.head.appendChild(style)

/* =====================
   PIN HTML
===================== */
const pinLayer = document.createElement('div')
pinLayer.className = 'pin-layer'
document.body.appendChild(pinLayer)

const tooltip = document.createElement('div')
tooltip.className = 'tooltip'
pinLayer.appendChild(tooltip)

let activePin = null
let isCameraAnimating = false

/* =====================
   THREE SETUP
===================== */
const scene = new THREE.Scene()
scene.background = new THREE.Color(0x151515)

const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 5000)

const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(innerWidth, innerHeight)
renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
renderer.outputColorSpace = THREE.SRGBColorSpace
document.body.appendChild(renderer.domElement)

/* =====================
   LIGHTING
===================== */
scene.add(new THREE.AmbientLight(0xffffff, 0.9))
const sun = new THREE.DirectionalLight(0xffffff, 2)
sun.position.set(300, 400, 200)
scene.add(sun)

/* =====================
   CONTROLS (PAN FIX)
===================== */
const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true
controls.dampingFactor = 0.08
controls.screenSpacePanning = true
controls.mouseButtons = {
  LEFT: THREE.MOUSE.ROTATE,
  MIDDLE: THREE.MOUSE.PAN,
  RIGHT: THREE.MOUSE.DOLLY
}
controls.enabled = false

/* =====================
   LOADERS
===================== */
const loader = new GLTFLoader()

/* =====================
   CLOUD DATA
===================== */
const clouds = []
let orbitCenter = new THREE.Vector3()

/* =====================
   CITY + CLOUD SETUP
===================== */
loader.load('./city.glb', gltf => {
  const city = gltf.scene
  scene.add(city)

  const box = new THREE.Box3().setFromObject(city)
  box.getCenter(orbitCenter)

  const minCloudY = box.max.y - 30

  city.traverse(obj => {
    if (!obj.isMesh) return

    const wp = new THREE.Vector3()
    obj.getWorldPosition(wp)
    if (wp.y < minCloudY) return

    const geo = obj.geometry
    if (!geo?.attributes?.position) return
    if (geo.attributes.position.count > 2000) return

    const dx = obj.position.x - orbitCenter.x
    const dz = obj.position.z - orbitCenter.z

    clouds.push({
      obj,
      baseY: obj.position.y,
      radius: Math.sqrt(dx * dx + dz * dz),
      angle: Math.atan2(dz, dx),
      speed: 0.04 + Math.random() * 0.03
    })
  })
})

/* =====================
   PINS + CAMERA TARGETS
===================== */
const pins = [
  { id: 1, pos: new THREE.Vector3(10, 15, 0), text: 'Merkez Bina', cam: { r: 90, a: Math.PI * 1.2, y: 55 } },
  { id: 2, pos: new THREE.Vector3(-20, 12, 15), text: 'Sosyal Alan', cam: { r: 90, a: Math.PI * 0.6, y: 55 } },
  { id: 3, pos: new THREE.Vector3(15, 10, -20), text: 'Yeşil Bölge', cam: { r: 90, a: Math.PI * 1.8, y: 55 } }
]

pins.forEach(p => {
  const el = document.createElement('div')
  el.className = 'pin'
  el.innerText = p.id
  pinLayer.appendChild(el)
  p.el = el
  el.onclick = () => focusPin(p)
})

/* =====================
   PIN PROJECTION (STABLE)
===================== */
function updatePins() {
  pins.forEach(p => {
    const v = p.pos.clone().project(camera)
    p.el.style.left = `${(v.x * 0.5 + 0.5) * innerWidth}px`
    p.el.style.top = `${(-v.y * 0.5 + 0.5) * innerHeight}px`
  })

  if (activePin) {
    const v = activePin.pos.clone().project(camera)
    tooltip.style.left = `${(v.x * 0.5 + 0.5) * innerWidth}px`
    tooltip.style.top = `${(-v.y * 0.5 + 0.5) * innerHeight}px`
  }
}

controls.addEventListener('change', () => {
  if (!isCameraAnimating) updatePins()
})

/* =====================
   CAMERA FOCUS (NO JITTER)
===================== */
let focusT = 1
let camFrom = {}
let camTo = {}

function focusPin(p) {
  isCameraAnimating = true
  activePin = p
  tooltip.innerText = p.text
  tooltip.style.display = 'block'

  camFrom = {
    r: camera.position.distanceTo(controls.target),
    a: Math.atan2(camera.position.z - controls.target.z, camera.position.x - controls.target.x),
    y: camera.position.y,
    target: controls.target.clone()
  }

  camTo = {
    r: p.cam.r,
    a: p.cam.a,
    y: p.cam.y,
    target: p.pos.clone()
  }

  let delta = camTo.a - camFrom.a
  delta = Math.atan2(Math.sin(delta), Math.cos(delta))
  camTo.a = camFrom.a + delta

  focusT = 0
}

/* =====================
   INTRO
===================== */
const clock = new THREE.Clock()
let introT = 0
const introDuration = 4

const introFrom = { r: 650, a: Math.PI * 0.25, y: 320 }
const introTo   = { r: 180, a: Math.PI * 1.25, y: 160 }

/* =====================
   ANIMATE
===================== */
function animate() {
  requestAnimationFrame(animate)
  const dt = clock.getDelta()

  // INTRO
  if (introT < 1) {
    isCameraAnimating = true
    introT += dt / introDuration
    const t = THREE.MathUtils.smoothstep(introT, 0, 1)

    camera.position.set(
      orbitCenter.x + Math.cos(THREE.MathUtils.lerp(introFrom.a, introTo.a, t)) *
        THREE.MathUtils.lerp(introFrom.r, introTo.r, t),
      THREE.MathUtils.lerp(introFrom.y, introTo.y, t),
      orbitCenter.z + Math.sin(THREE.MathUtils.lerp(introFrom.a, introTo.a, t)) *
        THREE.MathUtils.lerp(introFrom.r, introTo.r, t)
    )

    camera.lookAt(orbitCenter)
    renderer.render(scene, camera)
    return
  }

  if (!controls.enabled) {
    controls.target.copy(orbitCenter)
    controls.update()
    controls.enabled = true
    pinLayer.style.display = 'block'
    isCameraAnimating = false
    updatePins()
  }

  // CLOUDS
  clouds.forEach(c => {
    c.angle += c.speed * dt
    c.obj.position.x = orbitCenter.x + Math.cos(c.angle) * c.radius
    c.obj.position.z = orbitCenter.z + Math.sin(c.angle) * c.radius
    c.obj.position.y = c.baseY
  })

  // PIN FOCUS MOVE
  if (focusT < 1) {
    isCameraAnimating = true
    focusT += dt * 1.2
    const t = THREE.MathUtils.smoothstep(focusT, 0, 1)

    controls.target.lerpVectors(camFrom.target, camTo.target, t)

    camera.position.set(
      controls.target.x + Math.cos(THREE.MathUtils.lerp(camFrom.a, camTo.a, t)) *
        THREE.MathUtils.lerp(camFrom.r, camTo.r, t),
      THREE.MathUtils.lerp(camFrom.y, camTo.y, t),
      controls.target.z + Math.sin(THREE.MathUtils.lerp(camFrom.a, camTo.a, t)) *
        THREE.MathUtils.lerp(camFrom.r, camTo.r, t)
    )
  } else if (isCameraAnimating) {
    isCameraAnimating = false
    updatePins()
  }

  controls.update()
  renderer.render(scene, camera)
}

animate()

/* =====================
   RESIZE
===================== */
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(innerWidth, innerHeight)
  updatePins()
})
