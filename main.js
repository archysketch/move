import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/+esm'
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/controls/OrbitControls.js/+esm'
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/GLTFLoader.js/+esm'

/* =====================
   BASIC
===================== */
document.body.style.margin = '0'
document.body.style.overflow = 'hidden'

const scene = new THREE.Scene()
scene.background = new THREE.Color(0xbfe9ff)

const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 5000)
camera.position.set(180, 160, 180)

const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(innerWidth, innerHeight)
renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
document.body.appendChild(renderer.domElement)

/* =====================
   LIGHT
===================== */
scene.add(new THREE.AmbientLight(0xffffff, 0.9))
const sun = new THREE.DirectionalLight(0xffffff, 1)
sun.position.set(300, 400, 200)
scene.add(sun)

/* =====================
   CONTROLS (PAN FIX)
===================== */
const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true
controls.dampingFactor = 0.08
controls.target.set(0, 40, 0)

controls.mouseButtons = {
  LEFT: THREE.MOUSE.ROTATE,
  MIDDLE: THREE.MOUSE.PAN,
  RIGHT: THREE.MOUSE.DOLLY
}

/* =====================
   LOADERS
===================== */
const loader = new GLTFLoader()

/* =====================
   CLOUDS (SAFE & CORRECT)
===================== */
const clouds = []

loader.load('./city.glb', gltf => {
  const city = gltf.scene
  scene.add(city)

  const box = new THREE.Box3().setFromObject(city)
  const size = new THREE.Vector3()
  box.getSize(size)

  // ÜST %40 → bulutları tam kapsar
  const thresholdY = box.min.y + size.y * 0.6

  city.traverse(obj => {
    if (!obj.isObject3D) return

    const wp = new THREE.Vector3()
    obj.getWorldPosition(wp)

    if (wp.y > thresholdY) {
      clouds.push(obj)
    }
  })

  console.log('☁️ Clouds detected:', clouds.length)
})

/* =====================
   CAR CONFIG
===================== */
const carConfig = {
  position: new THREE.Vector3(60, 0.25, 60),
  scale: 0.25,
  speed: 0.04,
  rotationY: Math.PI * 1.5
}

let car = null

loader.load('./car.glb', gltf => {
  car = gltf.scene
  car.scale.setScalar(carConfig.scale)
  car.position.copy(carConfig.position)
  car.rotation.y = carConfig.rotationY
  scene.add(car)
})

/* =====================
   CLOCK
===================== */
const clock = new THREE.Clock()

/* =====================
   ANIMATE
===================== */
function animate() {
  requestAnimationFrame(animate)

  const dt = clock.getDelta()

  // ☁️ CLOUD ROTATION (NO POSITION BREAK)
  clouds.forEach(c => {
    c.rotation.y += 0.15 * dt
  })

  // 🚗 CAR MOVE
  if (car) {
    car.translateZ(carConfig.speed)
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
})
