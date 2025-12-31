import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/+esm'
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/controls/OrbitControls.js/+esm'
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/GLTFLoader.js/+esm'

/* =====================
   BASIC SETUP
===================== */
document.body.style.margin = '0'
document.body.style.overflow = 'hidden'

const scene = new THREE.Scene()
scene.background = new THREE.Color(0xbfe9ff)

const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 3000)
camera.position.set(120, 120, 120)

const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(innerWidth, innerHeight)
renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
document.body.appendChild(renderer.domElement)

/* =====================
   LIGHTS
===================== */
scene.add(new THREE.AmbientLight(0xffffff, 0.9))

const sun = new THREE.DirectionalLight(0xffffff, 0.8)
sun.position.set(200, 300, 200)
scene.add(sun)

/* =====================
   CONTROLS
===================== */
const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true
controls.dampingFactor = 0.08
controls.target.set(0, 0, 0)

/* =====================
   LOADERS
===================== */
const loader = new GLTFLoader()

/* =====================
   CITY + CLOUDS
===================== */
const clouds = []

loader.load('./city.glb', gltf => {
  const city = gltf.scene
  scene.add(city)

city.traverse(obj => {
  if (!obj.isMesh) return

  const y = obj.position.y
  const mat = obj.material

  const isHigh = y > 30          // şehir üstü
  const isLight =
    mat &&
    mat.color &&
    mat.color.r > 0.8 &&
    mat.color.g > 0.8 &&
    mat.color.b > 0.8

  if (isHigh && isLight) {
    clouds.push(obj)
  }
})

console.log('☁️ Auto-detected clouds:', clouds.length)

/* =====================
   CAR CONFIG (OYNA BURAYLA)
===================== */
const carConfig = {
  position: new THREE.Vector3(-30, 1.0, -20),
  scale: 0.3,
  speed: 0.1,        // ileri geri hız
  rotationY: Math.PI // yön
}

let car

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

  /* ☁️ CLOUD ROTATION */
  clouds.forEach((cloud, i) => {
    cloud.rotation.y += 0.1 * dt   // hız burada
  })

  /* 🚗 CAR MOVE */
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
