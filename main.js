import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/+esm'
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/controls/OrbitControls.js/+esm'
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/GLTFLoader.js/+esm'

/* =====================
   GLOBAL CSS
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

/* =====================
   SCENE
===================== */
const scene = new THREE.Scene()
scene.background = new THREE.Color(0x151515)

/* =====================
   CAMERA
===================== */
const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 3000)

/* =====================
   RENDERER
===================== */
const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(innerWidth, innerHeight)
renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
document.body.appendChild(renderer.domElement)

/* =====================
   LIGHT
===================== */
scene.add(new THREE.AmbientLight(0xffffff, 0.9))
const dir = new THREE.DirectionalLight(0xffffff, 0.6)
dir.position.set(200, 300, 200)
scene.add(dir)

/* =====================
   CONTROLS (LOCAL BİREBİR)
===================== */
const controls = new OrbitControls(camera, renderer.domElement)
controls.enabled = false
controls.target.set(0, 0, 0)

controls.mouseButtons = {
  LEFT: THREE.MOUSE.ROTATE,
  MIDDLE: THREE.MOUSE.PAN,
  RIGHT: THREE.MOUSE.DOLLY
}

controls.enableDamping = true
controls.dampingFactor = 0.08

controls.enableZoom = true
controls.zoomSpeed = 0.6

controls.enablePan = true
controls.panSpeed = 0.6

controls.minDistance = 40
controls.maxDistance = 800

/* =====================
   MODEL
===================== */
new GLTFLoader().load('./lowpoly.glb', gltf => {
  scene.add(gltf.scene)
})

/* =====================
   INTRO ANIMATION
===================== */
let introFrame = 0
const introDuration = 160
const introStart = { r: 520, a: Math.PI * 0.75, h: 260 }
const introEnd   = { r: 60,  a: Math.PI * 1.15, h: 40 }

/* =====================
   PIN DATA
===================== */
const pins = [
  { id: 1, pos: new THREE.Vector3(10, 15, 0),  text: 'Merkez Bina', cam:{ r:80, a:Math.PI*1.25, h:55 }},
  { id: 2, pos: new THREE.Vector3(-20, 10, 15), text: 'Sosyal Alan', cam:{ r:80, a:Math.PI*1.25, h:55 }},
  { id: 3, pos: new THREE.Vector3(15, 8, -20),  text: 'Yeşil Bölge', cam:{ r:80, a:Math.PI*0.25, h:55 }}
]

/* =====================
   PIN STATE
===================== */
let activePin = null
let focusT = 1

let camFrom = { r:0, a:0, h:0, target:new THREE.Vector3() }
let camTo   = { r:0, a:0, h:0, target:new THREE.Vector3() }

/* =====================
   PIN ELEMENTS
===================== */
pins.forEach(p => {
  const el = document.createElement('div')
  el.className = 'pin'
  el.innerText = p.id
  pinLayer.appendChild(el)
  p.el = el

  el.onclick = () => {
    activePin = p
    tooltip.innerText = p.text
    tooltip.style.display = 'block'

    camFrom.r = camera.position.distanceTo(controls.target)
    camFrom.a = Math.atan2(
      camera.position.z - controls.target.z,
      camera.position.x - controls.target.x
    )
    camFrom.h = camera.position.y
    camFrom.target.copy(controls.target)

    camTo.r = p.cam.r
    camTo.a = p.cam.a
    camTo.h = p.cam.h
    camTo.target.copy(p.pos)

    let delta = camTo.a - camFrom.a
    delta = Math.atan2(Math.sin(delta), Math.cos(delta))
    camTo.a = camFrom.a + delta

    focusT = 0

    clearTimeout(tooltip._t)
    tooltip._t = setTimeout(() => {
      tooltip.style.display = 'none'
      activePin = null
    }, 5000)
  }
})

/* =====================
   RESIZE
===================== */
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(innerWidth, innerHeight)
})

/* =====================
   LOOP
===================== */
function animate() {
  requestAnimationFrame(animate)

  // INTRO
  if (introFrame < introDuration) {
    const t = THREE.MathUtils.smoothstep(introFrame / introDuration, 0, 1)
    const r = THREE.MathUtils.lerp(introStart.r, introEnd.r, t)
    const a = THREE.MathUtils.lerp(introStart.a, introEnd.a, t)
    const h = THREE.MathUtils.lerp(introStart.h, introEnd.h, t)

    camera.position.set(Math.cos(a) * r, h, Math.sin(a) * r)
    camera.lookAt(0, 0, 0)
    introFrame++
  } else {
    controls.enabled = true
  }

  // PIN FOCUS
  if (focusT < 1) {
    focusT += 0.015
    const t = THREE.MathUtils.smoothstep(focusT, 0, 1)

    const r = THREE.MathUtils.lerp(camFrom.r, camTo.r, t)
    const a = THREE.MathUtils.lerp(camFrom.a, camTo.a, t)
    const h = THREE.MathUtils.lerp(camFrom.h, camTo.h, t)

    controls.target.lerpVectors(camFrom.target, camTo.target, t)

    camera.position.set(
      controls.target.x + Math.cos(a) * r,
      h,
      controls.target.z + Math.sin(a) * r
    )
  }

  controls.update()

  // PIN PROJECTION
  pins.forEach(p => {
    const v = p.pos.clone().project(camera)
    const x = (v.x * 0.5 + 0.5) * innerWidth
    const y = (-v.y * 0.5 + 0.5) * innerHeight

    p.el.style.left = `${x}px`
    p.el.style.top = `${y}px`

    if (activePin === p) {
      tooltip.style.left = `${x}px`
      tooltip.style.top = `${y}px`
    }
  })

  renderer.render(scene, camera)
}

animate()
