import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/+esm'
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/controls/OrbitControls.js/+esm'
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/GLTFLoader.js/+esm'

/* =====================
   BASIC
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
   LIGHTS
===================== */
scene.add(new THREE.AmbientLight(0xffffff, 0.9))

const sun = new THREE.DirectionalLight(0xffffff, 2.2)
sun.position.set(300, 400, 200)
scene.add(sun)

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
   LOADER
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

  // ORBIT MERKEZİ (LOCAL)
  const box = new THREE.Box3().setFromObject(city)
  box.getCenter(orbitCenter)

  const topY = box.max.y - 20   // üst katman

  city.traverse(obj => {
    if (!obj.isObject3D) return

    // ⚠️ LOCAL position kullanıyoruz
    if (obj.position.y > topY) {
      const dx = obj.position.x - orbitCenter.x
      const dz = obj.position.z - orbitCenter.z

      clouds.push({
        obj,
        baseY: obj.position.y,              // 🔒 SABİT
        radius: Math.sqrt(dx * dx + dz * dz),
        angle: Math.atan2(dz, dx),
        speed: 0.01 + Math.random() * 0.01
      })
    }
  })

  console.log('☁️ Cloud orbit (fixed Y):', clouds.length)
})

/* =====================
   CAR
===================== */
let car
loader.load('./car.glb', gltf => {
  car = gltf.scene
  car.scale.setScalar(0.25)
  car.position.set(55, 0.25, 55)
  car.rotation.y = Math.PI * 1.5
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

  // ☁️ DAİRESEL HAREKET – Y SABİT
  clouds.forEach(c => {
    c.angle += c.speed

    c.obj.position.x = orbitCenter.x + Math.cos(c.angle) * c.radius
    c.obj.position.z = orbitCenter.z + Math.sin(c.angle) * c.radius
    c.obj.position.y = c.baseY      // 🔒 ASLA DEĞİŞMEZ
  })

  if (car) car.translateZ(0.04)

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
