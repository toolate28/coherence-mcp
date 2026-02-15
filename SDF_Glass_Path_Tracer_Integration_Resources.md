# SDF Glass Path Tracer — Integration Pipeline Resources

## What the Demo Shows

Garrett Bingham (@gjb_ai) posted a Gemini 3 Deep Think demo: a **real-time SDF Glass Path Tracer running fully in-browser**. The scene renders a **glass dodecahedron** on a green pedestal with a checkered floor plane, accumulating ~228 samples progressively. This appears to be AI-generated code (via Gemini's "vibe coding" capability) producing a complete WebGL/WebGPU path tracing pipeline from a natural language prompt.

---

## 1. The Core Technology Stack

### What is an SDF Glass Path Tracer?

Three technologies intersect here:

| Component | What it Does |
|---|---|
| **SDF (Signed Distance Function)** | Defines 3D geometry mathematically — no meshes, no triangles. A function returns the distance from any point to the nearest surface. Negative = inside, positive = outside, zero = on surface. |
| **Path Tracing** | A physically-based rendering algorithm that simulates light transport by casting rays that bounce around the scene, accumulating color per pixel over many samples. |
| **Glass / Dielectric Material** | Implements Fresnel equations for reflection + refraction, with physically correct index of refraction (IOR), absorption, and optionally spectral dispersion. |

### How Ray Marching Works with SDFs

Instead of ray-triangle intersection (traditional ray tracing), SDF scenes use **sphere tracing / ray marching**:

1. Cast a ray from the camera through each pixel
2. At the current point, evaluate the SDF to get the distance to the nearest surface
3. Step forward by that distance (guaranteed safe — won't skip past geometry)
4. Repeat until distance < epsilon (hit) or distance > max (miss)
5. On hit: compute normal via SDF gradient, then bounce the ray (reflect/refract for glass)

---

## 2. Ready-to-Use Frameworks (Integration Starting Points)

### Snelly — WebGL SDF Pathtracer (Most Relevant)
- **Repo**: https://github.com/portsmouth/snelly
- **Live Demo**: https://portsmouth.github.io/snelly/
- **License**: MIT
- **Why it matters**: This is the closest existing open-source project to the demo in the tweet. It does exactly SDF + path tracing + glass materials in WebGL.

**Architecture:**
```
Scene Definition (JS) → GLSL SDF Functions → Ray Marching → Path Tracing → Tone Mapping → Canvas
```

**Three material channels:**
```glsl
float SDF_SURFACE(vec3 X);     // Plastic-like uber material
float SDF_METAL(vec3 X);       // Physically-based metals
float SDF_DIELECTRIC(vec3 X);  // Glass — this is what renders the dodecahedron
```

**Glass presets include**: BK7, K7, F5, LAFN7, LASF35, N-LAK33A, N-FK51A, SF4, SF67, Water, Polycarbonate, Diamond — all with physically accurate IOR from refractiveindex.info.

**To render a glass dodecahedron in Snelly:**
```javascript
// In Scene.prototype.init():
materials.loadDielectric('Glass (BK7)');

// In GLSL — SDF_DIELECTRIC function:
// Use half-space intersection of 12 face planes
// with normals derived from the golden ratio
```

### Retrace.gl — SDF Sculptor + Path Tracer
- **Repo**: https://github.com/stasilo/retrace.gl
- **Tech**: WebGL2/GLSL
- **Key feature**: Declarative JS scene API + BVH acceleration for SDFs + CSG operations
- **Good for**: Generative art pipelines, complex boolean operations on SDF shapes

### THREE.js PathTracing Renderer
- **Repo**: https://github.com/erichlof/THREE.js-PathTracing-Renderer
- **Live Demo**: https://erichlof.github.io/THREE.js-PathTracing-Renderer/
- **Key feature**: Built on Three.js — easier to integrate if you already use Three.js
- **Note**: Supports glass/caustics but less SDF-native than Snelly

### Strahl — WebGPU Path Tracer (Modern Pipeline)
- **Repo**: https://github.com/StuckiSimon/strahl
- **Paper**: https://arxiv.org/html/2407.19977v1
- **Tech**: WebGPU + OpenPBR
- **Key feature**: glTF model loading, physically-based materials via OpenPBR standard
- **Good for**: If you want to go WebGPU (the future) rather than WebGL

---

## 3. SDF Geometry Resources

### Inigo Quilez — The Definitive SDF Reference
- **3D Primitives**: https://iquilezles.org/articles/distfunctions/
- **2D Primitives**: https://iquilezles.org/articles/distfunctions2d/
- Exact SDF formulas for spheres, boxes, tori, capsules, cones, cylinders, and more
- Smooth union/subtraction/intersection operators for combining shapes
- **Dodecahedron approach**: Intersection of 12 half-planes using face normals derived from the golden ratio (φ = (1+√5)/2)

### hg_sdf — Mercury's GLSL SDF Library
- **Site**: https://mercury.sexy/hg_sdf
- Includes Platonic solid SDFs (tetrahedron, cube, octahedron, dodecahedron, icosahedron)
- Domain repetition, folding, and other advanced operators

### SDF Resource Collection
- **Repo**: https://github.com/CedricGuillemet/SDF
- Curated list of papers, Shadertoy links, tutorials, and tools

---

## 4. WebGPU Compute Shader Pipeline (Next-Gen Path)

If you want to build this on WebGPU (recommended for new projects):

### Pipeline Architecture
```
Compute Pass (WGSL shader)          Render Pass (vertex + fragment)
┌─────────────────────────┐         ┌──────────────────────┐
│ • Fire rays per pixel   │         │ • Full-screen quad    │
│ • Ray march SDFs        │  ───►   │ • Read storage buffer │
│ • Path trace bounces    │         │ • Display to canvas   │
│ • Accumulate in buffer  │         └──────────────────────┘
└─────────────────────────┘
```

### Key Resources
- **WebGPU Raytracer**: https://github.com/gnikoloff/webgpu-raytracer — Compute shader path tracer with BVH
- **WebGPU Path Tracer Tutorial**: https://shridhar2602.github.io/WebGPU-Path-Tracer/ — Step-by-step build guide
- **VaultCG Blog Series**: https://www.vaultcg.com/blog/casually-raytracing-in-webgpu-part1/ — BVH on GPU in WGSL
- **WebGPU Fundamentals**: https://webgpufundamentals.org/webgpu/lessons/webgpu-compute-shaders.html — Compute pipeline basics
- **Learn WebGPU (C++)**: https://eliemichel.github.io/LearnWebGPU/basic-compute/compute-pipeline.html

### WebGPU Practical Notes
- **Workgroup size**: 64 is the general recommendation
- **Storage buffers** preferred over storage textures (more flexible for pixel state + RNG)
- **Browser support (2026)**: Chrome stable, Firefox nightly, Safari experimental — maps to D3D12, Metal, Vulkan
- **Compatibility guide**: https://webo360solutions.com/blog/webgpu-browser-support-2026/

---

## 5. Glass Material Implementation Details

### Core Physics
```
When a ray hits a dielectric surface:
1. Compute Fresnel reflectance (Schlick approximation or full equations)
2. Probabilistically choose REFLECT or REFRACT based on Fresnel ratio
3. If refract: apply Snell's law (sin(θ₂) = (n₁/n₂) × sin(θ₁))
4. If total internal reflection (angle too steep): always reflect
5. Inside the material: apply Beer's law absorption (exponential decay by distance)
```

### Key Parameters
- **IOR (Index of Refraction)**: Glass ~1.5, Diamond ~2.42, Water ~1.33
- **Absorption**: Color and mean free path control tinted glass
- **Roughness**: 0 = perfect mirror-like glass, >0 = frosted glass
- **Dispersion**: Different IOR per wavelength → rainbow effects (chromatic aberration)

### GPU SDF Pathtracing Implementation Details
From jbaker.graphics:
- Tile-based CPU-GPU architecture for interactive performance at 4K+
- Single RGBA32F texture stores all state (sample count in alpha)
- Running average: `mix(old, new, 1/count)`
- Russian Roulette optimization for early ray termination
- Thin lens approximation for depth of field

---

## 6. The Gemini 3 Deep Think Angle

### What Happened
Gemini 3 Deep Think (upgraded Feb 12-13, 2026) can generate complete, working applications from natural language prompts. The "vibe coding" capability produced this SDF Glass Path Tracer as a demo of its reasoning + code generation.

### Key Capabilities
- Generates complete rendering pipelines (shaders + JS glue + UI) in a single prompt
- Handles multi-step planning: scene setup, material physics, camera controls, progressive accumulation
- Deep Think mode enables extended reasoning for mathematically complex tasks like path tracing

### Relevant Links
- **Gemini 3 Deep Think announcement**: https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-3-deep-think/
- **DeepMind blog**: https://deepmind.google/blog/accelerating-mathematical-and-scientific-discovery-with-gemini-deep-think/
- **9to5Google coverage**: https://9to5google.com/2026/02/12/gemini-3-deep-think-upgrade/
- **Vibe coding examples**: https://www.aifire.co/p/12-apps-built-with-gemini-3-in-minutes-a-no-code-guide

---

## 7. Tutorials — Learning Path

| Order | Resource | What You Learn |
|---|---|---|
| 1 | [Jamie Wong — Ray Marching & SDFs](https://jamie-wong.com/2016/07/15/ray-marching-signed-distance-functions/) | Fundamentals of SDF ray marching |
| 2 | [Inigo Quilez — Distance Functions](https://iquilezles.org/articles/distfunctions/) | SDF primitive library |
| 3 | [Alan Zucconi — Volumetric SDFs](https://www.alanzucconi.com/2016/07/01/signed-distance-functions/) | Glass/transparent material theory |
| 4 | [Varun Vachhar — Iridescent Crystal](https://varun.ca/ray-march-sdf/) | Glass-like effects with SDFs in GLSL |
| 5 | [ben.land — Raytracing with SDFs](https://ben.land/post/2022/08/15/raycasting-raytracing-sdf/) | Full path tracing + refraction in SDF |
| 6 | [jbaker.graphics — GPU SDF Pathtracing](https://jbaker.graphics/writings/sdf_path.html) | Production GPU pipeline details |
| 7 | [Snelly API Docs](https://github.com/portsmouth/snelly/blob/master/docs/API.md) | Ready-to-use SDF pathtracer integration |
| 8 | [WebGPU Path Tracer Tutorial](https://shridhar2602.github.io/WebGPU-Path-Tracer/) | Modern WebGPU compute pipeline |

---

## 8. Quick-Start Integration Paths

### Path A: Fastest (Fork Snelly)
1. Clone https://github.com/portsmouth/snelly
2. Write dodecahedron SDF in `SDF_DIELECTRIC()`
3. Load glass material: `materials.loadDielectric('Glass (BK7)')`
4. Add checkerboard floor in `SDF_SURFACE()`
5. Done — runs in any browser

### Path B: Modern (WebGPU from scratch)
1. Set up WebGPU device + canvas context
2. Write WGSL compute shader with SDF ray marching
3. Implement path tracing loop with glass material (Fresnel + Snell's law)
4. Create render pass to display accumulated buffer
5. Add progressive sample accumulation

### Path C: AI-Assisted (Gemini/Claude vibe coding)
1. Prompt an AI model with the rendering requirements
2. Iterate on the generated code
3. The tweet demonstrates this exact workflow with Gemini 3 Deep Think

---

*Compiled Feb 13, 2026*
