// The 3D layer of the hub: its icons rebuilt as glass objects that float over
// the cards they belong to, plus a few silver pieces. (The sparkle and the
// planet on the page are rendered images, placed in the DOM.)
//
// The look is "dispersed glass": every object is a saturated core sealed in a
// thick shell of clear glass. The shell really refracts the core — three.js
// renders the opaque parts first and the glass samples that picture, bent,
// and split into colours at the edges (dispersion).
//
// What the shell cannot refract is the page itself: the canvas is transparent
// and the gradient behind it is not part of the scene. Where nothing of the
// scene lies behind the glass, the material falls back to what glass does at
// its surface: clear face-on, denser and brighter towards the edges, opaque in
// a highlight. See `glassMaterial`.
//
// Objects are placed by the page: any element with `data-float="<id>"` inside
// the hub is an anchor, and the object with that id hangs at its centre, at
// its size. The layout therefore stays in CSS, at every breakpoint.
//
// This module is loaded on its own (see ../floating-icons.tsx); three.js is
// never part of the first paint.

import {
  ACESFilmicToneMapping,
  BufferAttribute,
  type BufferGeometry,
  Color,
  CylinderGeometry,
  DirectionalLight,
  ExtrudeGeometry,
  Group,
  HemisphereLight,
  Mesh,
  MeshPhysicalMaterial,
  PerspectiveCamera,
  PMREMGenerator,
  Quaternion,
  Scene,
  Shape,
  SphereGeometry,
  SRGBColorSpace,
  TorusGeometry,
  Vector3,
  WebGLRenderer,
} from "three"
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js"
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js"

/* ------------------------------- Geometry -------------------------------- */

// Objects are modelled on the 24-unit grid of the 2D icons they come from,
// centred on the origin, y up, facing +z.

const UP = new Vector3(0, 1, 0)
type Point = readonly [x: number, y: number]

function roundedRect(w: number, h: number, r: number, cx = 0, cy = 0) {
  const x = cx - w / 2
  const y = cy - h / 2
  const shape = new Shape()
  shape.moveTo(x + r, y)
  shape.lineTo(x + w - r, y)
  shape.quadraticCurveTo(x + w, y, x + w, y + r)
  shape.lineTo(x + w, y + h - r)
  shape.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  shape.lineTo(x + r, y + h)
  shape.quadraticCurveTo(x, y + h, x, y + h - r)
  shape.lineTo(x, y + r)
  shape.quadraticCurveTo(x, y, x + r, y)
  return shape
}

function polygon(points: Point[]) {
  const shape = new Shape()
  points.forEach(([x, y], i) => (i ? shape.lineTo(x, y) : shape.moveTo(x, y)))
  shape.closePath()
  return shape
}

function disc(radius: number) {
  const shape = new Shape()
  shape.absarc(0, 0, radius, 0, Math.PI * 2, false)
  return shape
}

/** A till receipt: a tall slip whose lower edge is torn into teeth. */
function receipt(w: number, h: number, teeth: number) {
  const left = -w / 2
  const top = h / 2
  const bottom = -h / 2
  const points: Point[] = [
    [left, top],
    [-left, top],
    [-left, bottom + 1.6],
  ]
  for (let i = 0; i < teeth * 2; i++) {
    const x = -left - ((i + 1) * w) / (teeth * 2)
    points.push([x, i % 2 ? bottom + 1.6 : bottom])
  }
  return polygon(points)
}

interface Solid {
  shell: BufferGeometry
  core: BufferGeometry
}

/**
 * A flat shape given thickness. The core is the same shape pulled in towards
 * its centre, so the shapes used here must be visible from their centre
 * (every one above is).
 */
function plate(shape: Shape, depth: number, bevel: number, centre: Point = [0, 0], z = 0): Solid {
  const build = (d: number, b: number, shrink: number) => {
    const geometry = new ExtrudeGeometry(shape, {
      depth: d,
      bevelEnabled: true,
      bevelThickness: b,
      bevelSize: b,
      bevelSegments: 5,
      curveSegments: 20,
    })
    geometry.translate(-centre[0], -centre[1], -d / 2)
    if (shrink !== 1) geometry.scale(shrink, shrink, 1)
    geometry.translate(centre[0], centre[1], z)
    geometry.computeVertexNormals()
    return geometry
  }
  return { shell: build(depth, bevel, 1), core: build(depth * 0.42, bevel * 0.7, 0.8) }
}

/** A round rod along a path: a cylinder per segment, a sphere per joint. */
function rodGeometry(points: Point[], radius: number, z = 0): BufferGeometry {
  const joint = new SphereGeometry(radius, 14, 10)
  const parts: BufferGeometry[] = []
  let previous: Vector3 | null = null
  for (const [x, y] of points) {
    const point = new Vector3(x, y, z)
    parts.push(joint.clone().translate(point.x, point.y, point.z))
    if (previous) {
      const along = point.clone().sub(previous)
      const segment = new CylinderGeometry(radius, radius, along.length(), 14, 1, true)
      segment.applyQuaternion(new Quaternion().setFromUnitVectors(UP, along.normalize()))
      const middle = previous.clone().add(point).multiplyScalar(0.5)
      segment.translate(middle.x, middle.y, middle.z)
      parts.push(segment)
    }
    previous = point
  }
  const merged = mergeGeometries(parts, false)
  joint.dispose()
  for (const part of parts) part.dispose()
  return merged
}

function rod(points: Point[], radius: number, z = 0): Solid {
  return { shell: rodGeometry(points, radius, z), core: rodGeometry(points, radius * 0.52, z) }
}

/**
 * Paint a geometry with a diagonal gradient across the whole object, so the
 * cores of a many-part object read as one body of colour.
 */
function paint(geometry: BufferGeometry, stops: readonly [Color, Color, Color]) {
  const position = geometry.getAttribute("position")
  const colors = new Float32Array(position.count * 3)
  const mixed = new Color()
  for (let i = 0; i < position.count; i++) {
    const t = Math.min(1, Math.max(0, (position.getX(i) * 0.55 + position.getY(i) * 0.83 + 14) / 28))
    if (t < 0.5) mixed.lerpColors(stops[0], stops[1], t * 2)
    else mixed.lerpColors(stops[1], stops[2], (t - 0.5) * 2)
    colors.set([mixed.r, mixed.g, mixed.b], i * 3)
  }
  geometry.setAttribute("color", new BufferAttribute(colors, 3))
  return geometry
}

/* -------------------------------- Objects -------------------------------- */

export type FloatId =
  | "rejestry-vat"
  | "ksiegowania"
  | "majatek"
  | "kontrole"
  | "okres"
  | "ring"
  | "pearl-a"

interface Blueprint {
  /** Glass with a core. */
  solids?: Solid[]
  /** Glass with nothing inside: a lens. */
  clear?: BufferGeometry[]
  silver?: BufferGeometry[]
  /** Small opaque white details. */
  frost?: BufferGeometry[]
}

const BLUEPRINTS: Record<FloatId, () => Blueprint> = {
  // Receipt: a glass slip, three silver lines of text on its face.
  "rejestry-vat": () => {
    const face = 1.7 + 1.1
    return {
      solids: [plate(receipt(15.5, 21, 5), 3.4, 1.1)],
      silver: [
        rodGeometry([[-4, 5], [4, 5]], 0.78, face),
        rodGeometry([[-4, 1.2], [4.8, 1.2]], 0.78, face),
        rodGeometry([[-4, -2.6], [1.4, -2.6]], 0.78, face),
      ],
    }
  },
  // Bank: glass pediment and plinth, silver columns between them.
  ksiegowania: () => ({
    solids: [
      plate(polygon([[-11.5, 4.2], [0, 11], [11.5, 4.2]]), 4, 1, [0, 6.4]),
      plate(roundedRect(22, 3, 1.2, 0, -9), 4.4, 0.9, [0, -9]),
    ],
    silver: [-7.2, -2.4, 2.4, 7.2].map((x) => rodGeometry([[x, -5.4], [x, 1.6]], 1.35)),
  }),
  // Archive box: a lid over a body, a silver handle on the front.
  majatek: () => ({
    solids: [
      plate(roundedRect(21.5, 5.6, 1.6, 0, 6.6), 5.4, 1, [0, 6.6]),
      plate(roundedRect(17.5, 11.6, 2.2, 0, -3.6), 4.2, 1, [0, -3.6]),
    ],
    silver: [rodGeometry([[-2.8, -1.2], [2.8, -1.2]], 0.85, 2.1 + 1 + 0.2)],
  }),
  // Check: a glass tick on a lens, held in a silver ring.
  kontrole: () => ({
    solids: [rod([[-4.8, 0.2], [-1.4, -3.6], [5.4, 4.4]], 2, 1.2)],
    clear: [plate(disc(9.2), 1.2, 0.6).shell],
    silver: [new TorusGeometry(10.5, 1.2, 18, 64)],
  }),
  // Calendar: a glass block, silver binding, frosted days.
  okres: () => {
    const face = 1.8 + 1.1
    return {
      solids: [plate(roundedRect(19.5, 18, 3.4, 0, -1), 3.6, 1.1, [0, -1])],
      silver: [
        rodGeometry([[-4.8, 6.4], [-4.8, 10.4]], 0.95, 0.4),
        rodGeometry([[4.8, 6.4], [4.8, 10.4]], 0.95, 0.4),
        rodGeometry([[-6.4, 3.4], [6.4, 3.4]], 0.5, face),
      ],
      frost: [-4.8, 0, 4.8].flatMap((x) =>
        [-0.6, -4.8].map((y) => new SphereGeometry(0.95, 12, 8).translate(x, y, face)),
      ),
    }
  },
  ring: () => ({ silver: [new TorusGeometry(8.6, 2.6, 22, 72)] }),
  "pearl-a": () => ({ silver: [new SphereGeometry(11, 32, 20)] }),
}

const ORDER = Object.keys(BLUEPRINTS) as FloatId[]

/** The gradient every core takes: deep indigo into the lavender of the backdrop. */
const CORE = [new Color(0x10059a), new Color(0x2c1ad2), new Color(0x6b55f4)] as const

/* --------------------------------- Glass --------------------------------- */

interface GlassLook {
  /** Colour and density of the glass where only the page is behind it. */
  tint: number
  body: number
  /** The colour the edges take, and how strongly. */
  rim: number
  rimStrength: number
  /** How much opacity the edges gain over the body. */
  edge: number
}

function glassMaterial() {
  const uniforms = {
    uRim: { value: new Color() },
    uTint: { value: new Color() },
    uRimStrength: { value: 1 },
    uEdge: { value: 0.5 },
    uBody: { value: 0.1 },
  }
  const material = new MeshPhysicalMaterial({
    color: 0xffffff,
    transparent: true,
    transmission: 1,
    thickness: 5,
    ior: 1.5,
    dispersion: 7,
    roughness: 0.03,
    metalness: 0,
    // Kept low: the film belongs on the edges, and must not veil the core.
    iridescence: 0.4,
    iridescenceIOR: 1.3,
    iridescenceThicknessRange: [140, 520],
    // The room is mirrored only faintly: a full reflection of its bright
    // panels would white out a whole face and hide the core behind it.
    specularIntensity: 0.8,
    envMapIntensity: 0.6,
  })
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms)
    shader.fragmentShader =
      "uniform vec3 uRim;\nuniform vec3 uTint;\nuniform float uRimStrength;\nuniform float uEdge;\nuniform float uBody;\n" +
      shader.fragmentShader.replace(
        "#include <opaque_fragment>",
        `
        float glassFresnel = pow( 1.0 - saturate( abs( dot( normalize( normal ), normalize( vViewPosition ) ) ) ), 2.4 );
        float glassGlint = saturate( dot( totalSpecular, vec3( 0.34 ) ) );
        // On a transparent canvas three.js clears what the glass refracts to
        // half-alpha white. Alpha above that means the scene (a core, a silver
        // part) is behind this fragment; at that level it is only the page.
        #ifdef USE_TRANSMISSION
          float glassBehind = saturate( ( material.transmissionAlpha - 0.5 ) * 2.0 );
        #else
          float glassBehind = 0.0;
        #endif
        vec3 glassRim = uRim * glassFresnel * uRimStrength;
        outgoingLight += glassRim * glassBehind;
        #include <opaque_fragment>
        // Over the page: no milky fill, only what the surface itself shows.
        vec3 glassSurface = totalSpecular + glassRim + uTint * uBody;
        float glassAlpha = saturate( uBody + glassFresnel * uEdge + smoothstep( 0.3, 1.0, glassGlint ) * 0.85 );
        gl_FragColor = mix( vec4( glassSurface, glassAlpha ), vec4( gl_FragColor.rgb, 1.0 ), glassBehind );
        `,
      )
  }
  const apply = (look: GlassLook) => {
    uniforms.uTint.value.set(look.tint)
    uniforms.uBody.value = look.body
    uniforms.uRim.value.set(look.rim)
    uniforms.uRimStrength.value = look.rimStrength
    uniforms.uEdge.value = look.edge
  }
  return { material, apply }
}

/* --------------------------------- Look ---------------------------------- */

interface Look {
  glass: GlassLook
  /** How much the cores glow on their own, apart from the light they catch. */
  glow: number
  silver: number
  key: number
  keyStrength: number
  side: number
  sideStrength: number
  sky: number
  ground: number
  ambient: number
  environment: number
}

const LOOKS: Record<"light" | "dark", Look> = {
  // On the pale silk clear glass would vanish, so its edges darken to indigo,
  // the way glass does against light.
  light: {
    glass: { tint: 0x6554ec, body: 0.1, rim: 0x4632dc, rimStrength: 0.42, edge: 0.5 },
    glow: 0.42,
    silver: 0xe9ecf6,
    key: 0xffffff,
    keyStrength: 1.9,
    side: 0xa096ff,
    sideStrength: 1.2,
    sky: 0xffffff,
    ground: 0xcfc8ff,
    ambient: 1.1,
    environment: 1.15,
  },
  // On the midnight silk glass is drawn by its light: lavender edges, white
  // reflections, and the core glowing through.
  dark: {
    glass: { tint: 0xa096ff, body: 0.07, rim: 0xd8d2ff, rimStrength: 0.95, edge: 0.6 },
    glow: 0.55,
    silver: 0xdfe3f2,
    key: 0xf3f1ff,
    keyStrength: 2.0,
    side: 0x7c6cff,
    sideStrength: 2.2,
    sky: 0xa096ff,
    ground: 0x06061c,
    ambient: 0.85,
    environment: 1.0,
  },
}

/* --------------------------------- Scene --------------------------------- */

interface Floater {
  id: FloatId
  group: Group
  phase: number
  /** resting tilt, radians */
  tilt: { x: number; y: number }
  /** centre in px from the canvas's top-left corner, and diameter in px */
  spot: { x: number; y: number; size: number } | null
  born: number
  spin: number
  spinTarget: number
  boost: number
  boostTarget: number
}

export interface FloatingIcons {
  /** The control that owns this object is under the pointer (or none is). */
  hover(id: string | null): void
  dispose(): void
}

const easeOutBack = (t: number) => 1 + 2.4 * (t - 1) ** 3 + 1.4 * (t - 1) ** 2

export function mountFloatingIcons(
  canvas: HTMLCanvasElement,
  /** The element the anchors live in. */
  root: HTMLElement,
  { reducedMotion, onReady }: { reducedMotion: boolean; onReady: () => void },
): FloatingIcons {
  const renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true })
  // Refraction renders the scene a second time into a multisampled buffer the
  // size of the canvas, so the canvas is kept modest: a capped pixel ratio
  // here, and no taller than its lowest object (see `fit`).
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75))
  renderer.setClearColor(0x000000, 0)
  renderer.toneMapping = ACESFilmicToneMapping
  renderer.outputColorSpace = SRGBColorSpace

  const scene = new Scene()
  const pmrem = new PMREMGenerator(renderer)
  const environment = pmrem.fromScene(new RoomEnvironment(), 0.04)
  scene.environment = environment.texture
  // The room has a large bright panel on the wall behind the camera, which is
  // exactly what every front face would mirror. Turned around, the faces see
  // a dim wall and stay clear; edges and rods still find the lights.
  scene.environmentRotation.y = Math.PI

  const camera = new PerspectiveCamera(26, 1, 10, 9000)
  const key = new DirectionalLight(0xffffff, 2)
  const side = new DirectionalLight(0xffffff, 1)
  const ambient = new HemisphereLight(0xffffff, 0xffffff, 1)
  // Both lights are steep enough that no flat face can mirror them into the
  // camera at any tilt the objects reach (a mirrored light whites out a whole
  // face). Bevels and rods still catch them, which is where glass should shine.
  key.position.set(-0.3, 1, 0.35).multiplyScalar(1000)
  side.position.set(1, 0, 0.1).multiplyScalar(1000)
  scene.add(key, side, ambient)

  const glass = glassMaterial()
  // The core is what gives an object its colour, so it stays saturated: little
  // of the bright room is mirrored in it, and it carries some light of its own.
  const core = new MeshPhysicalMaterial({
    vertexColors: true,
    roughness: 0.3,
    clearcoat: 0.45,
    clearcoatRoughness: 0.2,
    envMapIntensity: 0.55,
    emissive: 0x2412c4,
  })
  const silver = new MeshPhysicalMaterial({ metalness: 1, roughness: 0.14, envMapIntensity: 1.5 })
  const frost = new MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.4, emissive: 0xffffff, emissiveIntensity: 0.35 })
  const materials = [glass.material, core, silver, frost]
  const geometries: BufferGeometry[] = []

  const add = (group: Group, parts: BufferGeometry[] | undefined, material: MeshPhysicalMaterial) => {
    if (!parts?.length) return
    // Extrusions come without an index and primitives with one; merging needs
    // them alike, so everything is flattened first.
    const flat = parts.map((part) => {
      if (!part.index) return part
      const plain = part.toNonIndexed()
      part.dispose()
      return plain
    })
    const merged = flat.length === 1 ? flat[0] : mergeGeometries(flat, false)
    if (flat.length > 1) for (const part of flat) part.dispose()
    geometries.push(merged)
    group.add(new Mesh(merged, material))
  }

  const floaters: Floater[] = ORDER.map((id, i) => {
    const blueprint = BLUEPRINTS[id]()
    const group = new Group()
    add(
      group,
      blueprint.solids?.map((s) => paint(s.core, CORE)),
      core,
    )
    add(group, blueprint.silver, silver)
    add(group, blueprint.frost, frost)
    add(group, [...(blueprint.solids?.map((s) => s.shell) ?? []), ...(blueprint.clear ?? [])], glass.material)
    group.visible = false
    scene.add(group)
    return {
      id,
      group,
      phase: i * 1.7 + 0.4,
      tilt: { x: -0.14, y: 0 },
      spot: null,
      born: i * 0.07,
      spin: 0,
      spinTarget: 0,
      boost: 1,
      boostTarget: 1,
    }
  })

  /* ---- theme ---- */

  const applyLook = () => {
    const look = LOOKS[document.documentElement.dataset.theme === "dark" ? "dark" : "light"]
    glass.apply(look.glass)
    core.emissiveIntensity = look.glow
    silver.color.set(look.silver)
    key.color.set(look.key)
    key.intensity = look.keyStrength
    side.color.set(look.side)
    side.intensity = look.sideStrength
    ambient.color.set(look.sky)
    ambient.groundColor.set(look.ground)
    ambient.intensity = look.ambient
    scene.environmentIntensity = look.environment
  }
  applyLook()
  const themeWatch = new MutationObserver(() => {
    applyLook()
    if (reducedMotion) draw(0)
  })
  themeWatch.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] })

  /* ---- size and anchors ---- */

  let width = 0
  let height = 0

  const resize = () => {
    const box = canvas.getBoundingClientRect()
    if (box.width < 1 || box.height < 1) return
    width = box.width
    height = box.height
    renderer.setSize(width, height, false)
    camera.aspect = width / height
    // One world unit is one CSS pixel at the plane of the page.
    camera.position.z = height / 2 / Math.tan((camera.fov * Math.PI) / 360)
    camera.updateProjectionMatrix()
    measure()
    if (reducedMotion) draw(0)
  }

  /** Read where the page wants each object, and keep the canvas just tall enough. */
  function measure() {
    const origin = canvas.getBoundingClientRect()
    const anchors = new Map<string, DOMRect>()
    let lowest = 0
    for (const el of root.querySelectorAll<HTMLElement>("[data-float]")) {
      const box = el.getBoundingClientRect()
      if (box.width > 0) {
        anchors.set(el.dataset.float!, box)
        lowest = Math.max(lowest, box.bottom - origin.top)
      }
    }
    fit(lowest)
    for (const f of floaters) {
      const box = anchors.get(f.id)
      if (!box) {
        f.spot = null
        f.group.visible = false
        continue
      }
      f.spot = {
        x: box.left + box.width / 2 - origin.left,
        y: box.top + box.height / 2 - origin.top,
        size: box.width,
      }
      f.group.visible = true
      // Each object turns its face a little towards the middle of the page.
      f.tilt.y = f.spot.x < width / 2 ? 0.34 : -0.34
    }
  }

  /** The canvas ends a little below its lowest object; the observer picks the change up. */
  function fit(lowest: number) {
    const frame = canvas.parentElement
    if (!frame || lowest <= 0) return
    const wanted = Math.ceil(lowest + 72)
    if (Math.abs(wanted - height) > 16) frame.style.height = `${wanted}px`
  }

  const sizeWatch = new ResizeObserver(resize)
  sizeWatch.observe(canvas)

  /* ---- pointer ---- */

  const pointer = { x: 0, y: 0, tx: 0, ty: 0 }
  const onPointer = (e: PointerEvent) => {
    pointer.tx = (e.clientX / window.innerWidth) * 2 - 1
    pointer.ty = (e.clientY / window.innerHeight) * 2 - 1
  }
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches
  if (fine && !reducedMotion) window.addEventListener("pointermove", onPointer, { passive: true })

  /* ---- frame ---- */

  let started = 0
  let last = 0
  let frame = 0
  let frames = 0
  let visible = true
  let ready = false

  function draw(now: number) {
    const t = started ? (now - started) / 1000 : 0
    const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016)
    last = now
    // Cards load, accordions open: follow the anchors a few times a second.
    if (frames++ % 12 === 0) measure()
    const follow = 1 - Math.exp(-dt * 4)
    pointer.x += (pointer.tx - pointer.x) * follow
    pointer.y += (pointer.ty - pointer.y) * follow

    for (const f of floaters) {
      if (!f.spot) continue
      const { spot, group } = f
      // Small pieces drift more freely than the icons that mark a card.
      const loose = spot.size < 50 ? 1.6 : 1
      const grown = reducedMotion ? 1 : easeOutBack(Math.min(1, Math.max(0, (t - f.born) / 0.75)))
      f.spin += (f.spinTarget - f.spin) * (1 - Math.exp(-dt * 5))
      f.boost += (f.boostTarget - f.boost) * (1 - Math.exp(-dt * 9))
      const lift = f.boost + Math.min(0.12, Math.abs(f.spinTarget - f.spin) * 0.05)

      group.position.set(
        spot.x - width / 2 + Math.cos(t * 0.45 + f.phase) * 3 * loose - pointer.x * 7 * loose,
        height / 2 - spot.y + Math.sin(t * 0.62 + f.phase) * 5 * loose + pointer.y * 5 * loose,
        0,
      )
      group.rotation.set(
        f.tilt.x + Math.sin(t * 0.5 + f.phase) * 0.14 + pointer.y * 0.18,
        f.tilt.y + Math.sin(t * 0.38 + f.phase * 1.7) * 0.24 + pointer.x * 0.24 + f.spin,
        Math.sin(t * 0.3 + f.phase) * 0.08,
      )
      group.scale.setScalar((spot.size / 26) * Math.max(0.0001, grown) * lift)
    }

    renderer.render(scene, camera)
    if (!ready) {
      ready = true
      onReady()
    }
  }

  const loop = (now: number) => {
    if (!started) started = now
    draw(now)
    frame = visible && !document.hidden ? requestAnimationFrame(loop) : 0
  }
  const wake = () => {
    if (reducedMotion || frame || !visible || document.hidden) return
    last = 0
    frame = requestAnimationFrame(loop)
  }
  // Nothing is drawn while the layer is scrolled away or the tab is in the background.
  const viewWatch = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting
    wake()
  })
  viewWatch.observe(canvas)
  document.addEventListener("visibilitychange", wake)

  resize()
  if (reducedMotion) {
    // No loop: draw once now, and again when the page's data has settled the layout.
    draw(0)
    window.setTimeout(() => {
      measure()
      draw(0)
    }, 1200)
  } else wake()

  return {
    hover(id) {
      if (reducedMotion) return
      for (const f of floaters) {
        const on = f.id === id
        f.boostTarget = on ? 1.12 : 1
        // One full turn per visit; ignore re-entry while it is still turning.
        if (on && Math.abs(f.spinTarget - f.spin) < 0.4) f.spinTarget += Math.PI * 2
      }
    },
    dispose() {
      cancelAnimationFrame(frame)
      window.removeEventListener("pointermove", onPointer)
      document.removeEventListener("visibilitychange", wake)
      themeWatch.disconnect()
      sizeWatch.disconnect()
      viewWatch.disconnect()
      for (const g of geometries) g.dispose()
      for (const m of materials) m.dispose()
      environment.dispose()
      pmrem.dispose()
      renderer.dispose()
    },
  }
}
