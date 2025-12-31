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

const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 5000)
camera.position.set(180, 160, 180)

const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(innerWidth, innerHeight)
renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
document.body.appendChild(renderer.domElement)

/* =====================
   LIGHTS
===================== */
scene.add(new THREE.AmbientLight(0xffffff, 0.85))

const sun = new THREE.DirectionalLight(0xffffff, 0.9)
sun.position.set(300, 400, 200)
scene.add(sun)

/* =====================
   CONTROLS
===================== */
const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true
controls.dampingFactor = 0.08
controls.target.set(0, 40, 0)

/* =====================
   LOADERS
===================== */
const loader = new GLTFLoader()

/* =====================
   CITY + CLOUDS (SAFE)
===================== */
const clouds = []

loader.load(
  './city.glb',
  gltf => {
    const city = gltf.scene
    city.position.set(0, 0, 0)
    city.scale.setScalar(1)
    scene.add(city)

    city.traverse(obj => {
      if (!obj.isMesh) return

      // BULUT HEURISTIC: yukarıda + açık renk
      const isHigh = obj.getWorldPosition(new THREE.Vector3()).y > 60

      let isLight = false
      if (obj.material && obj.material.color) {
        const c = obj.material.color
        isLight = c.r > 0.7 && c.g > 0.7 && c.b > 0.7
      }

      if (isHigh && isLight) {
        clouds.push(obj)
      }
    })

    console.log('☁️ Clouds detected:', clouds.length)
  },
  undefined,
  err => {
    console.error('❌ City load error', err)
  }
)

/* =====================
   CAR CONFIG (OYNANABİLİR)
===================== */
const carConfig = {
  position: new THREE.Vector3(90, 0.4, 90), // çepere yakın + aşağı
  scale: 0.25,                              // 4 kat küçük
  speed: 0.04,
  rotationY: Math.PI * 1.5
}

let car = null

loader.load(
  './car.glb',
  gltf => {
    car = gltf.scene
    car.scale.setScalar(carConfig.scale)
    car.position.copy(carConfig.position)
    car.rotation.y = carConfig.rotationY
    scene.add(car)
  },
  undefined,
  err => {
    console.error('❌ Car load error', err)
  }
)

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

  // ☁️ CLOUD ROTATION (SAFE)
  clouds.forEach(cloud => {
    cloud.rotation.y += 0.15 * dt
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
