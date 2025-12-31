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

const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(innerWidth, innerHeight)
renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
renderer.outputColorSpace = THREE.SRGBColorSpace
document.body.appendChild(renderer.domElement)

/* =====================
   LIGHTING
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
      speed: 0.06 + Math.random() * 0.04
    })
  })

  console.log('☁️ Clouds:', clouds.length)
})

/* =====================
   CAR CONFIG (BURAYLA OYNA)
===================== */
const carConfig = {
  scale: 0.25,
  startPosition: new THREE.Vector3(55, 0.25, 55),
  rotationY: Math.PI * 1.5,
  speed: 0.06,
  lifeTime: 10
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

spawnCar()

/* =====================
   INTRO ANIMATION
===================== */
const clock = new THREE.Clock()
let introT = 0
const introDuration = 4 // saniye

const introFrom = {
  r: 650,
  a: Math.PI * 0.25,
  y: 320
}

const introTo = {
  r: 180,
  a: Math.PI * 1.25,
  y: 160
}

/* =====================
   ANIMATE
===================== */
function animate() {
  requestAnimationFrame(animate)
  const dt = clock.getDelta()

  // 🎬 INTRO
  if (introT < 1) {
    introT += dt / introDuration
    const t = THREE.MathUtils.smoothstep(introT, 0, 1)

    const r = THREE.MathUtils.lerp(introFrom.r, introTo.r, t)
    const a = THREE.MathUtils.lerp(introFrom.a, introTo.a, t)
    const y = THREE.MathUtils.lerp(introFrom.y, introTo.y, t)

    camera.position.set(
      orbitCenter.x + Math.cos(a) * r,
      y,
      orbitCenter.z + Math.sin(a) * r
    )

    camera.lookAt(orbitCenter)
    renderer.render(scene, camera)
    return
  } else {
    controls.enabled = true
  }

  // ☁️ CLOUD ORBIT
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
