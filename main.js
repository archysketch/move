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
   LIGHTING (BRIGHT)
===================== */
scene.add(new THREE.AmbientLight(0xffffff, 0.9))

const sun = new THREE.DirectionalLight(0xffffff, 2.4)
sun.position.set(300, 400, 200)
scene.add(sun)

const fill = new THREE.DirectionalLight(0xffffff, 0.9)
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
   CLOUD DATA
===================== */
const clouds = []
let cityCenter = new THREE.Vector3()

/* =====================
   CITY + CLOUD PREP
===================== */
loader.load('./city.glb', gltf => {
  const city = gltf.scene
  scene.add(city)

  const box = new THREE.Box3().setFromObject(city)
  const size = new THREE.Vector3()
  box.getSize(size)
  box.getCenter(cityCenter)

  const thresholdY = box.min.y + size.y * 0.6

  city.traverse(obj => {
    if (!obj.isObject3D) return

    const wp = new THREE.Vector3()
    obj.getWorldPosition(wp)

    if (wp.y > thresholdY) {
      const dx = wp.x - cityCenter.x
      const dz = wp.z - cityCenter.z

      clouds.push({
        obj,
        radius: Math.sqrt(dx * dx + dz * dz),
        angle: Math.atan2(dz, dx),
        height: wp.y,                 // 🔒 SABİT Y
        speed: 0.015 + Math.random() * 0.015
      })
    }
  })

  console.log('☁️ Cloud orbit count:', clouds.length)
})

/* =====================
   CAR CONFIG
===================== */
const carConfig = {
  position: new THREE.Vector3(55, 0.25, 55),
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

  // ☁️ CLOUD ORBIT — XZ ONLY, Y FIXED
  clouds.forEach(c => {
    c.angle += c.speed * dt

    c.obj.position.set(
      cityCenter.x + Math.cos(c.angle) * c.radius,
      c.height, // 🔒 yükseklik değişmez
      cityCenter.z + Math.sin(c.angle) * c.radius
    )
  })

  // 🚗 CAR MOVE
  if (car) car.translateZ(carConfig.speed)

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
