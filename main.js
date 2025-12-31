import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/+esm'
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/controls/OrbitControls.js/+esm'
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/GLTFLoader.js/+esm'

/* =====================
   BASIC
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

const sun = new THREE.DirectionalLight(0xffffff, 2.2)
sun.position.set(200, 300, 200)
scene.add(sun)

/* =====================
   CONTROLS
===================== */
const controls = new OrbitControls(camera, renderer.domElement)
controls.enabled = false
controls.enableDamping = true
controls.dampingFactor = 0.08
controls.mouseButtons = {
  LEFT: THREE.MOUSE.ROTATE,
  MIDDLE: THREE.MOUSE.PAN,
  RIGHT: THREE.MOUSE.DOLLY
}

/* =====================
   PIN UI
===================== */
const style = document.createElement('style')
style.innerHTML = `
.pin-layer{position:fixed;inset:0;pointer-events:none;z-index:10}
.pin{position:absolute;width:24px;height:24px;border-radius:50%;background:#fff;color:#111;font-size:11px;font-weight:bold;display:flex;align-items:center;justify-content:center;transform:translate(-50%,-50%);pointer-events:auto;cursor:pointer}
.tooltip{position:absolute;background:#fff;color:#111;padding:4px 8px;font-size:11px;border-radius:2px;white-space:nowrap;transform:translate(16px,-50%);display:none}
`
document.head.appendChild(style)

const pinLayer = document.createElement('div')
pinLayer.className = 'pin-layer'
document.body.appendChild(pinLayer)

const tooltip = document.createElement('div')
tooltip.className = 'tooltip'
pinLayer.appendChild(tooltip)

/* =====================
   LOADER
===================== */
const loader = new GLTFLoader()

/* =====================
   CITY
===================== */
let cityRadius = 80
let city = null

loader.load('./cartooncity.glb', gltf => {
  city = gltf.scene

  // 🔧 KONTROLLÜ SCALE (bir tık küçük)
  city.scale.setScalar(0.85)

  // 🔧 SAĞA KAYDIR
  city.position.x += 20

  scene.add(city)

  const box = new THREE.Box3().setFromObject(city)
  const size = new THREE.Vector3()
  box.getSize(size)
  cityRadius = Math.max(size.x, size.z) * 0.5
})

/* =====================
   CLOUD
===================== */
let cloud = null
let cloudAngle = Math.random() * Math.PI * 2

loader.load('./clouds_cartoon.glb', gltf => {
  cloud = gltf.scene

  // 🔥 3 KAT BÜYÜT
  cloud.scale.setScalar(3)

  scene.add(cloud)
})

/* =====================
   INTRO
===================== */
let introFrame = 0
const introDuration = 160

/* =====================
   PINS
===================== */
const pins = [
  { id:1, pos:new THREE.Vector3(10,15,0), text:'Merkez Bina', cam:{r:80,a:Math.PI*1.25,h:55}},
  { id:2, pos:new THREE.Vector3(-20,10,15), text:'Sosyal Alan', cam:{r:80,a:Math.PI*1.25,h:55}},
  { id:3, pos:new THREE.Vector3(15,8,-20), text:'Yeşil Bölge', cam:{r:80,a:Math.PI*0.25,h:55}}
]

let activePin = null
let focusT = 1
let camFrom = { r:0,a:0,h:0,target:new THREE.Vector3() }
let camTo   = { r:0,a:0,h:0,target:new THREE.Vector3() }

pins.forEach(p=>{
  const el=document.createElement('div')
  el.className='pin'
  el.innerText=p.id
  pinLayer.appendChild(el)
  p.el=el

  el.onclick=()=>{
    activePin=p
    tooltip.innerText=p.text
    tooltip.style.display='block'

    camFrom.r=camera.position.distanceTo(controls.target)
    camFrom.a=Math.atan2(camera.position.z-controls.target.z,camera.position.x-controls.target.x)
    camFrom.h=camera.position.y
    camFrom.target.copy(controls.target)

    camTo.r=p.cam.r
    camTo.a=p.cam.a
    camTo.h=p.cam.h
    camTo.target.copy(p.pos)

    let d=camTo.a-camFrom.a
    d=Math.atan2(Math.sin(d),Math.cos(d))
    camTo.a=camFrom.a+d

    focusT=0

    clearTimeout(tooltip._t)
    tooltip._t=setTimeout(()=>{
      tooltip.style.display='none'
      activePin=null
    },5000)
  }
})

/* =====================
   LOOP
===================== */
function animate(){
  requestAnimationFrame(animate)

  // INTRO
  if(introFrame<introDuration){
    const t=THREE.MathUtils.smoothstep(introFrame/introDuration,0,1)
    const r=THREE.MathUtils.lerp(cityRadius*3.8,cityRadius*1.6,t)
    const a=THREE.MathUtils.lerp(Math.PI*0.75,Math.PI*1.15,t)
    const h=THREE.MathUtils.lerp(cityRadius*2,cityRadius*0.9,t)

    camera.position.set(Math.cos(a)*r,h,Math.sin(a)*r)
    camera.lookAt(0,0,0)
    introFrame++
  } else {
    controls.enabled=true
  }

  // PIN FOCUS
  if(focusT<1){
    focusT+=0.015
    const t=THREE.MathUtils.smoothstep(focusT,0,1)
    const r=THREE.MathUtils.lerp(camFrom.r,camTo.r,t)
    const a=THREE.MathUtils.lerp(camFrom.a,camTo.a,t)
    const h=THREE.MathUtils.lerp(camFrom.h,camTo.h,t)
    controls.target.lerpVectors(camFrom.target,camTo.target,t)
    camera.position.set(
      controls.target.x+Math.cos(a)*r,
      h,
      controls.target.z+Math.sin(a)*r
    )
  }

  // ☁️ CLOUD (DAHA YAKIN + DAHA ALÇAK)
  if(cloud){
    cloudAngle+=0.0005
    cloud.position.set(
      Math.cos(cloudAngle)*cityRadius*0.6,
      cityRadius*0.35,   // 🔥 4 KAT DAHA ALÇAK
      Math.sin(cloudAngle)*cityRadius*0.6
    )
    cloud.rotation.y+=0.0004
  }

  // PIN PROJECTION
  pins.forEach(p=>{
    const v=p.pos.clone().project(camera)
    const x=(v.x*0.5+0.5)*innerWidth
    const y=(-v.y*0.5+0.5)*innerHeight
    p.el.style.left=`${x}px`
    p.el.style.top=`${y}px`
    if(activePin===p){
      tooltip.style.left=`${x}px`
      tooltip.style.top=`${y}px`
    }
  })

  controls.update()
  renderer.render(scene,camera)
}

animate()

addEventListener('resize',()=>{
  camera.aspect=innerWidth/innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(innerWidth,innerHeight)
})
