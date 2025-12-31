import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/+esm'
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/controls/OrbitControls.js/+esm'
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/GLTFLoader.js/+esm'

/* =====================
   ENV
===================== */
const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)

/* =====================
   BASIC CSS
===================== */
document.body.style.margin = '0'
document.body.style.overflow = 'hidden'

const style = document.createElement('style')
style.innerHTML = `
.pin-layer{position:fixed;inset:0;pointer-events:none;z-index:10;display:none}
.pin{position:absolute;width:24px;height:24px;border-radius:50%;background:#fff;color:#111;font-size:11px;font-weight:bold;display:flex;align-items:center;justify-content:center;transform:translate(-50%,-50%);pointer-events:auto;cursor:pointer}
.tooltip{position:absolute;background:#fff;color:#111;padding:4px 8px;font-size:11px;border-radius:2px;white-space:nowrap;transform:translate(16px,-50%);display:none}
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
   THREE
===================== */
const scene = new THREE.Scene()
scene.background = new THREE.Color(0x151515)

const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 5000)

const renderer = new THREE.WebGLRenderer({ antialias: !isMobile })
renderer.setSize(innerWidth, innerHeight)
renderer.setPixelRatio(isMobile ? 1 : Math.min(devicePixelRatio, 2))
renderer.outputColorSpace = THREE.SRGBColorSpace
document.body.appendChild(renderer.domElement)

/* =====================
   LIGHT
===================== */
scene.add(new THREE.AmbientLight(0xffffff, 0.9))
const sun = new THREE.DirectionalLight(0xffffff, 1.8)
sun.position.set(300, 400, 200)
scene.add(sun)

/* =====================
   CONTROLS
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
   LOAD
===================== */
const loader = new GLTFLoader()
const clouds = []
const orbitCenter = new THREE.Vector3()

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
    if (!obj.geometry?.attributes?.position) return
    if (obj.geometry.attributes.position.count > 2000) return

    const dx = obj.position.x - orbitCenter.x
    const dz = obj.position.z - orbitCenter.z

    clouds.push({
      obj,
      baseY: obj.position.y,
      radius: Math.sqrt(dx * dx + dz * dz),
      angle: Math.atan2(dz, dx),
      speed: isMobile ? 0.06 : 0.08
    })
  })
})

/* =====================
   PINS
===================== */
const pins = [
  { id: 1, pos: new THREE.Vector3(10, 15, 0), text: 'Merkez Bina', cam: { r: 180, a: Math.PI * 1.2, y: 160 } },
  { id: 2, pos: new THREE.Vector3(-20, 12, 15), text: 'Sosyal Alan', cam: { r: 180, a: Math.PI * 0.6, y: 160 } },
  { id: 3, pos: new THREE.Vector3(15, 10, -20), text: 'Yeşil Bölge', cam: { r: 180, a: Math.PI * 1.8, y: 160 } }
]

pins.forEach(p => {
  const el = document.createElement('div')
  el.className = 'pin'
  el.innerText = p.id
  pinLayer.appendChild(el)
  p.el = el
  el.onclick = () => focusPin(p)
})

function updatePins() {
  pins.forEach(p => {
    const v = p.pos.clone().project(camera)
    p.el.style.left = `${(v.x * 0.5 + 0.5) * innerWidth}px`
    p.el.style.top = `${(-v.y * 0.5 + 0.5) * innerHeight}px`
  })
}

/* =====================
   CAMERA FOCUS (FIXED)
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
    r: camera.position.distanceTo(orbitCenter),
    a: Math.atan2(camera.position.z - orbitCenter.z, camera.position.x - orbitCenter.x),
    y: camera.position.y
  }

  camTo = p.cam

  let delta = camTo.a - camFrom.a
  delta = Math.atan2(Math.sin(delta), Math.cos(delta))
  camTo = { ...camTo, a: camFrom.a + delta }

  focusT = 0
}

/* =====================
   INTRO
===================== */
const clock = new THREE.Clock()
let introT = 0
const introDuration = isMobile ? 2.5 : 4
const introFrom = isMobile ? { r: 360, a: Math.PI * 1.1, y: 180 } : { r: 650, a: Math.PI * 0.25, y: 320 }
const introTo = { r: 180, a: Math.PI * 1.25, y: 160 }

/* =====================
   LOOP
===================== */
function animate() {
  requestAnimationFrame(animate)
  const dt = clock.getDelta()

  // INTRO
  if (introT < 1) {
    introT += dt / introDuration
    const t = THREE.MathUtils.smoothstep(introT, 0, 1)

    camera.position.set(
      orbitCenter.x + Math.cos(THREE.MathUtils.lerp(introFrom.a, introTo.a, t)) * THREE.MathUtils.lerp(introFrom.r, introTo.r, t),
      THREE.MathUtils.lerp(introFrom.y, introTo.y, t),
      orbitCenter.z + Math.sin(THREE.MathUtils.lerp(introFrom.a, introTo.a, t)) * THREE.MathUtils.lerp(introFrom.r, introTo.r, t)
    )

    camera.lookAt(orbitCenter)
    renderer.render(scene, camera)
    return
  }

  if (!controls.enabled) {
    controls.target.copy(orbitCenter)
    controls.enabled = true
    pinLayer.style.display = 'block'
    updatePins()
  }

  // CLOUDS
  clouds.forEach(c => {
    c.angle += c.speed * dt
    c.obj.position.set(
      orbitCenter.x + Math.cos(c.angle) * c.radius,
      c.baseY,
      orbitCenter.z + Math.sin(c.angle) * c.radius
    )
  })

  // PIN FOCUS MOVE (FIXED)
  if (focusT < 1) {
    focusT += dt * 1.2
    const t = THREE.MathUtils.smoothstep(focusT, 0, 1)

    camera.position.set(
      orbitCenter.x + Math.cos(THREE.MathUtils.lerp(camFrom.a, camTo.a, t)) * THREE.MathUtils.lerp(camFrom.r, camTo.r, t),
      THREE.MathUtils.lerp(camFrom.y, camTo.y, t),
      orbitCenter.z + Math.sin(THREE.MathUtils.lerp(camFrom.a, camTo.a, t)) * THREE.MathUtils.lerp(camFrom.r, camTo.r, t)
    )

    camera.lookAt(THREE.MathUtils.lerpVectors(new THREE.Vector3(), p?.pos ?? orbitCenter, t))
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
