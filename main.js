import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/+esm'
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/controls/OrbitControls.js/+esm'
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/GLTFLoader.js/+esm'

/* =====================
   BASIC SETUP
===================== */
document.body.style.margin = '0'
document.body.style.overflow = 'hidden'

const scene = new THREE.Scene()
scene.background = new THREE.Color(0x151515)

const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 5000)
camera.position.set(180, 160, 180)

const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(innerWidth, innerHeight)
renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
renderer.outputColorSpace = THREE.SRGBColorSpace
document.body.appendChild(renderer.domElement)

/* =====================
   LIGHTING (BRIGHT MODEL)
===================== */
scene.add(new THREE.AmbientLight(0xffffff, 0.9))

const sun = new THREE.DirectionalLight(0xffffff, 2.2)
sun.position.set(300, 400, 200)
scene.add(sun)

const fill = new THREE.DirectionalLight(0xffffff, 0.8)
fill.position.set(-200, 150, -200)
scene.add(fill)

/* =====================
   CONTROLS
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
   CLOUD ORBIT DATA
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

    // world Y ile tespit
    const wp = new THREE.Vector3()
    obj.getWorldPosition(wp)
    if (wp.y < minCloudY) return

    // SADECE BULUT: düşük vertex sayısı
    const geo = obj.geometry
    if (!geo?.attributes?.position) return
    if (geo.attributes.position.count > 2000) return

    // local orbit datası
    const dx = obj.position.x - orbitCenter.x
    const dz = obj.position.z - orbitCenter.z

    clouds.push({
      obj,
      baseY: obj.position.y,                // 🔒 yükseklik sabit
      radius: Math.sqrt(dx * dx + dz * dz),
      angle: Math.atan2(dz, dx),
      speed: 0.08 + Math.random() * 0.05    // RAD / SANİYE (yavaş)
    })
  })

  console.log('☁️ Clouds:', clouds.length)
})

/* =====================
   CAR CONFIG (BURAYLA OYNA)
===================== */
const carConfig = {
  scale: 0.42,                                // 🔍 boyut
  startPosition: new THREE.Vector3(20, 0.20, 40), // 📍 başlangıç
  rotationY: Math.PI * 1.5,                  // 🔄 yön
  speed: 0.06,                               // 🚗 hız
  lifeTime: 10                               // ⏱️ saniye
}

let car = null
let carTimer = 0

function spawnCar() {
  loader.load('./car.glb', gltf => {
    car = gltf.scene
    car.scale.setScalar(carConfig.scale)
    car.position.copy(carConfig.startPosition)
    car.rotation.y = carConfig.rotationY
    scene.add(car)
    carTimer = 0
  })
}

// ilk araba
spawnCar()

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

  // ☁️ CLOUD ORBIT — DAİRESEL, Y SABİT
  clouds.forEach(c => {
    c.angle += c.speed * dt
    c.obj.position.x = orbitCenter.x + Math.cos(c.angle) * c.radius
    c.obj.position.z = orbitCenter.z + Math.sin(c.angle) * c.radius
    c.obj.position.y = c.baseY
  })

  // 🚗 CAR LOOP
  if (car) {
    car.translateZ(carConfig.speed)
    carTimer += dt

    if (carTimer > carConfig.lifeTime) {
      scene.remove(car)
      car = null
      spawnCar()
    }
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
