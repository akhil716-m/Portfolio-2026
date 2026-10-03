/* Paper shaders, without React.
   Any element with data-shader="<kind>" (and optional data-shader-params='{"…": …}')
   gets a WebGL shader mounted behind its content. The canvas pauses itself when the
   element is off screen or the tab is hidden; under reduced motion it renders one
   still frame. Vendored from @paper-design/shaders 0.0.81 (Apache-2.0). */
import { ShaderMount } from './vendor/paper-shaders/shader-mount.js';
import { getShaderColorFromString as color } from './vendor/paper-shaders/get-shader-color-from-string.js';
import { getShaderNoiseTexture } from './vendor/paper-shaders/get-shader-noise-texture.js';
import { ShaderFitOptions } from './vendor/paper-shaders/shader-sizing.js';
import { grainGradientFragmentShader, GrainGradientShapes } from './vendor/paper-shaders/shaders/grain-gradient.js';
import { ditheringFragmentShader, DitheringShapes, DitheringTypes } from './vendor/paper-shaders/shaders/dithering.js';
import { dotGridFragmentShader, DotGridShapes } from './vendor/paper-shaders/shaders/dot-grid.js';
import { godRaysFragmentShader } from './vendor/paper-shaders/shaders/god-rays.js';
import { meshGradientFragmentShader } from './vendor/paper-shaders/shaders/mesh-gradient.js';

const sizing = (p, fit) => ({
  u_fit: ShaderFitOptions[p.fit || fit],
  u_scale: p.scale ?? 1,
  u_rotation: p.rotation ?? 0,
  u_offsetX: p.offsetX ?? 0,
  u_offsetY: p.offsetY ?? 0,
  u_originX: 0.5,
  u_originY: 0.5,
  u_worldWidth: 0,
  u_worldHeight: 0,
});

// Each kind: its fragment shader, defaults in the site's palette, and a uniform builder
const KINDS = {
  grain: {
    frag: grainGradientFragmentShader,
    defaults: { colorBack: '#0a0a0a', colors: ['#d4ff5e', '#4d6a17', '#16200b'], softness: 0.7, intensity: 0.3, noise: 0.35, shape: 'corners', speed: 0.25 },
    needsNoise: true,
    uniforms: (p, noise) => ({
      u_colorBack: color(p.colorBack), u_colors: p.colors.map(color), u_colorsCount: p.colors.length,
      u_softness: p.softness, u_intensity: p.intensity, u_noise: p.noise,
      u_shape: GrainGradientShapes[p.shape], u_noiseTexture: noise,
      ...sizing(p, p.shape === 'wave' || p.shape === 'dots' || p.shape === 'truchet' ? 'none' : 'contain'),
    }),
  },
  dither: {
    frag: ditheringFragmentShader,
    defaults: { colorBack: '#0e1408', colorFront: '#b9e04c', shape: 'warp', type: '4x4', size: 2, speed: 0.3 },
    uniforms: p => ({
      u_colorBack: color(p.colorBack), u_colorFront: color(p.colorFront),
      u_shape: DitheringShapes[p.shape], u_type: DitheringTypes[p.type], u_pxSize: p.size,
      ...sizing(p, p.shape === 'sphere' || p.shape === 'ripple' || p.shape === 'swirl' ? 'contain' : 'none'),
    }),
  },
  dots: {
    frag: dotGridFragmentShader,
    defaults: { colorBack: '#0c0c0c', colorFill: '#d4ff5e', colorStroke: '#000000', size: 1.6, gapX: 20, gapY: 20, strokeWidth: 0, sizeRange: 0.6, opacityRange: 0.85, shape: 'circle', speed: 0 },
    uniforms: p => ({
      u_colorBack: color(p.colorBack), u_colorFill: color(p.colorFill), u_colorStroke: color(p.colorStroke),
      u_dotSize: p.size, u_gapX: p.gapX, u_gapY: p.gapY, u_strokeWidth: p.strokeWidth,
      u_sizeRange: p.sizeRange, u_opacityRange: p.opacityRange, u_shape: DotGridShapes[p.shape],
      ...sizing(p, 'none'),
    }),
  },
  rays: {
    frag: godRaysFragmentShader,
    defaults: { colorBack: '#0a0a0a', colorBloom: '#d4ff5e', colors: ['#d4ff5e55', '#a8cc3fcc', '#f4ffd6', '#6f8f22'], density: 0.3, spotty: 0.35, midIntensity: 0.35, midSize: 0.25, intensity: 0.7, bloom: 0.35, offsetY: -0.6, speed: 0.4 },
    needsNoise: true,
    uniforms: (p, noise) => ({
      u_colorBack: color(p.colorBack), u_colorBloom: color(p.colorBloom), u_colors: p.colors.map(color), u_colorsCount: p.colors.length,
      u_density: p.density, u_spotty: p.spotty, u_midIntensity: p.midIntensity, u_midSize: p.midSize,
      u_intensity: p.intensity, u_bloom: p.bloom, u_noiseTexture: noise,
      ...sizing(p, 'contain'),
    }),
  },
  mesh: {
    frag: meshGradientFragmentShader,
    defaults: { colors: ['#e0eaff', '#f75092', '#9f50d3', '#241d9a'], distortion: 0.8, swirl: 0.1, grainMixer: 0, grainOverlay: 0, speed: 0.2 },
    uniforms: p => ({
      u_colors: p.colors.map(color), u_colorsCount: p.colors.length,
      u_distortion: p.distortion, u_swirl: p.swirl, u_grainMixer: p.grainMixer, u_grainOverlay: p.grainOverlay,
      ...sizing(p, 'none'),
    }),
  },
};

const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ShaderMount needs image uniforms fully loaded, so the shared noise texture is decoded once
let noiseReady = null;
const loadNoise = () => noiseReady || (noiseReady = (async () => {
  const img = getShaderNoiseTexture();
  // wait for load, not decode(): decode() can stall while a tab isn't painting
  if (!img.complete) await new Promise((res, rej) => { img.onload = res; img.onerror = rej; });
  return img;
})());

export async function mountShader(el, kind, params = {}) {
  const k = KINDS[kind];
  if (!k) throw new Error(`Unknown shader kind: ${kind}`);
  const p = { ...k.defaults, ...params };
  const noise = k.needsNoise ? await loadNoise() : undefined;
  // a fixed starting frame keeps the composition the same on every visit
  const mount = new ShaderMount(el, k.frag, k.uniforms(p, noise), undefined, still ? 0 : p.speed, p.frame ?? 4000);
  // Paper's canvas styles sit in a cascade layer, so site rules like
  // `.contact > :not(…) { position: relative }` would put it back in the flow
  mount.canvasElement.style.position = 'absolute';
  return mount;
}

document.querySelectorAll('[data-shader]').forEach(el => {
  const params = el.dataset.shaderParams ? JSON.parse(el.dataset.shaderParams) : {};
  // on failure the element's own background stays as the fallback
  mountShader(el, el.dataset.shader, params).catch(err => console.warn('Shader not mounted', el, err));
});
