import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/+esm'
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/controls/OrbitControls.js/+esm'
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/GLTFLoader.js/+esm'

/* =====================
   BASIC SETUP
===================== */
document.body.style.margin = 0
document.body.style.overflow = 'hidden'

const scene = new THREE.Scene()
scene.background = new THREE.Color(0x151515)

const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 3000)

const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(innerWidth, innerHeight)
renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
renderer.outputColorSpace = THREE.SRGBColorSpace
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1.25
document.body.appendChild(renderer.domElement)

/* =====================
   LIGHT
===================== */
scene.add(new THREE.AmbientLight(0xffffff, 0.7))

const sun = new THREE.DirectionalLight(0xffffff, 2)
sun.position.set(200, 300, 200)
scene.add(sun)

/* =====================
   CONTROLS (REFERANS)
===================== */
const controls = new OrbitControls(camera, renderer.domElement)
controls.enabled = false
controls.enableDamping = true
controls.dampingFactor = 0.08
controls.enablePan = true
controls.enableZoom = true
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
   CITY (AUTO SCALE)
===================== */
let cityRadius = 50
let city = null

loader.load('./cartooncity.glb', gltf => {
  city = gltf.scene
  scene.add(city)

  // 🔥 AUTO SCALE CITY
  const box = new THREE.Box3().setFromObject(city)
  const size = new THREE.Vector3()
  box.getSize(size)

  const maxDim = Math.max(size.x, size.z)
  const targetSize = 120        // << SAHNENİN İSTEDİĞİ BOYUT
  const scale = targetSize / maxDim

  city.scale.setScalar(scale)

  // yeniden hesapla
  const box2 = new THREE.Box3().setFromObject(city)
  const size2 = new THREE.Vector3()
  box2.getSize(size2)
  cityRadius = Math.max(size2.x, size2.z) * 0.5
})

/* =====================
   CLOUD (SINGLE)
===================== */
let cloud = null
let cloudAngle = Math.random() * Math.PI * 2

loader.load('./clouds_cartoon.glb', gltf => {
  cloud = gltf.scene

  // 🔥 cloud kendi başına normalize
  const box = new THREE.Box3().setFromObject(cloud)
  const size = new THREE.Vector3()
  box.getSize(size)

  const maxDim = Math.max(size.x, size.y, size.z)
  const scale = (cityRadius * 0.35) / maxDim
  cloud.scale.setScalar(scale)

  scene.add(cloud)
})

/* =====================
   INTRO CAMERA
===================== */
let introFrame = 0
const introDuration = 160

function animate() {
  requestAnimationFrame(animate)

  // INTRO
  if (introFrame < introDuration) {
    const t = THREE.MathUtils.smoothstep(introFrame / introDuration, 0, 1)
    const r = THREE.MathUtils.lerp(cityRadius * 4, cityRadius * 1.4, t)
    const a = THREE.MathUtils.lerp(Math.PI * 0.8, Math.PI * 1.15, t)
    const h = THREE.MathUtils.lerp(cityRadius * 2.2, cityRadius * 0.9, t)

    camera.position.set(
      Math.cos(a) * r,
      h,
      Math.sin(a) * r
    )
    camera.lookAt(0, 0, 0)

    introFrame++
  } else {
    controls.enabled = true
  }

  // ☁️ CLOUD ORBIT
  if (cloud) {
    cloudAngle += 0.00035   // YAVAŞ
    cloud.position.set(
      Math.cos(cloudAngle) * cityRadius * 0.75,
      cityRadius * 0.9,
      Math.sin(cloudAngle) * cityRadius * 0.75
    )
    cloud.rotation.y += 0.0004
  }

  controls.update()
  renderer.render(scene, camera)
}

animate()

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(innerWidth, innerHeight)
})
