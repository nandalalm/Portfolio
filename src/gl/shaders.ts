/**
 * All GLSL for the single shared canvas.
 * Conventions: `p`/`uv` run 0..1 with y DOWN (0 = top), matching DOM rects,
 * so textures uploaded from canvases need no flipping.
 */

const HEAD = `#version 300 es
precision highp float;`;

/** Places a unit grid over a DOM rect (css px), with scroll bend and hover tilt. */
export const PLANE_VS = `#version 300 es
in vec2 p;
uniform vec4 rect;  // x, y, w, h in css px (top-left origin)
uniform vec2 res;   // viewport in css px
uniform float bend; // px, from scroll speed
uniform vec3 tilt;  // cursor x, y (-1..1) and amount
uniform float lift; // px, pushes the plane down while it is still rising
out vec2 uv;
void main(){
  uv = p;
  vec2 q = rect.xy + p * rect.zw;
  vec2 c = rect.xy + rect.zw * .5;
  float s = 1. + tilt.z * ((p.x - .5) * tilt.x + (p.y - .5) * tilt.y) * .1;
  q = c + (q - c) * s;
  q.y += bend * sin(p.x * 3.14159) + lift;
  gl_Position = vec4(q.x / res.x * 2. - 1., 1. - q.y / res.y * 2., 0., 1.);
}`;

/** Fills the bound framebuffer; used by the ripple simulation. */
export const SIM_VS = `#version 300 es
in vec2 p; out vec2 uv;
void main(){ uv = p; gl_Position = vec4(p * 2. - 1., 0., 1.); }`;

/** Wave equation step. R = height, G = velocity. */
export const SIM_UPDATE_FS = `${HEAD}
in vec2 uv; out vec4 o;
uniform sampler2D s; uniform vec2 d;
void main(){
  vec4 i = texture(s, uv);
  float a = ( texture(s, uv - vec2(d.x, 0.)).r + texture(s, uv + vec2(d.x, 0.)).r
            + texture(s, uv - vec2(0., d.y)).r + texture(s, uv + vec2(0., d.y)).r ) * .25;
  i.g += (a - i.r) * 2.;
  i.g *= .993;
  i.r += i.g;
  i.r *= .998;
  o = i;
}`;

export const SIM_DROP_FS = `${HEAD}
in vec2 uv; out vec4 o;
uniform sampler2D s; uniform vec2 c; uniform float r, k, asp;
void main(){
  vec4 i = texture(s, uv);
  vec2 q = uv - c; q.x *= asp;
  float dd = max(0., 1. - length(q) / r);
  dd = .5 - cos(dd * 3.14159) * .5;
  i.r += dd * k;
  o = i;
}`;

const CAUSTIC = `
float caus(vec2 p, float t){
  float v = 0.;
  for (int k = 0; k < 3; k++){
    float fk = float(k);
    vec2 q = p + vec2(sin(p.y * .9 + t * .7 + fk * 2.1), cos(p.x * 1.1 - t * .6 + fk)) * .9;
    float w = abs(sin(q.x) * sin(q.y));
    v += pow(1. - w, 7.);
    p = p * 1.55 + vec2(1.3, -.7);
  }
  return v / 3.;
}`;

/** Page background: near-black with very faint drifting caustic light. */
export const BACKDROP_FS = `${HEAD}
in vec2 uv; out vec4 o;
uniform vec3 bg; uniform float t, asp, scroll;
${CAUSTIC}
void main(){
  vec2 q = vec2(uv.x * asp, uv.y + scroll) * 2.3;
  float c = caus(q, t * .3);
  float m = .55 + .45 * sin(q.x * .35 + t * .05) * sin(q.y * .3 - t * .04);
  o = vec4(bg + c * m * vec3(.09, .26, .58) * .12, 1.);
}`;

/** Deep water for the hero, contact and case-study headers, with the glass drop. */
export const WATER_FS = `${HEAD}
in vec2 uv; out vec4 o;
uniform sampler2D s, nm;
uniform vec2 d, light, fade;     // fade: x = top edge, y = bottom edge (0 or 1)
uniform vec3 bg, tint, fall;     // fall: falling intro drop x, y, strength
uniform vec4 blob;               // glass drop x, y, radius (in heights), on
uniform float t, asp, K, tintAmt, nameAlpha;

vec3 scene(vec2 q){
  vec3 glowCol = mix(vec3(.035, .17, .36), tint * .5, tintAmt);
  float g = exp(-dot((q - vec2(.5, .62)) * vec2(asp * .62, 1.15), (q - vec2(.5, .62)) * vec2(asp * .62, 1.15)) * 2.6);
  vec3 c = vec3(.014, .026, .046) + glowCol * g;
  float name = texture(nm, q).a * nameAlpha;
  return mix(c, mix(vec3(.80, .88, .98), vec3(1.), tintAmt * .5), name * .9);
}

void main(){
  float hl = texture(s, uv - vec2(d.x, 0.)).r, hr = texture(s, uv + vec2(d.x, 0.)).r;
  float hu = texture(s, uv - vec2(0., d.y)).r, hd = texture(s, uv + vec2(0., d.y)).r;
  vec3 n = vec3((hl - hr) * K, (hu - hd) * K, 1.);
  n.xy += vec2(sin(uv.y * 18. + t * .9) + sin(uv.x * 7. - t * .5),
               cos(uv.x * 15. - t * 1.1) + cos(uv.y * 6. + t * .4)) * .010;
  n = normalize(n);
  vec3 V = vec3(0., 0., 1.);

  vec3 col = scene(uv + n.xy * .05);

  float rim = clamp(1. - n.z, 0., 1.);
  float wavy = smoothstep(.0005, .02, rim);
  vec3 L = normalize(vec3((light - uv) * vec2(asp, 1.), .8));
  float spec = pow(max(dot(reflect(-L, n), V), 0.), 60.);
  vec3 L2 = normalize(vec3(.35, -.8, .6));
  float spec2 = pow(max(dot(reflect(-L2, n), V), 0.), 220.);
  vec3 hi = mix(vec3(.6, .8, 1.), vec3(1.), tintAmt * .6);
  col += (spec * .9 * hi + spec2 * 1.4 * vec3(.9, .95, 1.)) * wavy + rim * mix(vec3(.1, .25, .5), tint * .4, tintAmt) * 1.6;

  // Glass drop: a soft morphing lens that magnifies whatever is beneath it
  if (blob.w > .5) {
    vec2 bp = (uv - blob.xy) * vec2(asp, 1.);
    float ang = atan(bp.y, bp.x);
    float R = blob.z * (1. + .05 * sin(3. * ang + t * .9) + .035 * sin(5. * ang - t * 1.3));
    float dd = length(bp) / R;
    if (dd < 1.) {
      float nz = sqrt(1. - dd * dd);
      vec2 dir = bp / max(length(bp), 1e-4);
      vec2 off = -dir * dd * dd * R * .5;
      vec3 lc = scene(uv + off / vec2(asp, 1.) + n.xy * .08) * 1.12 + vec3(.012, .03, .06);
      lc += pow(1. - nz, 2.6) * vec3(.35, .6, 1.) * .5;
      vec2 hp = bp / R - vec2(-.36, -.42);
      lc += smoothstep(.30, 0., length(hp * vec2(1., 1.7))) * .5;
      vec2 gp = bp / R - vec2(.28, .46);
      lc += smoothstep(.55, 0., length(gp)) * vec3(.10, .30, .62) * .4;
      col = mix(col, lc, smoothstep(1., .955, dd));
    } else {
      vec2 sp = (uv - blob.xy - vec2(.010, .028)) * vec2(asp, 1.);
      col *= 1. - .32 * smoothstep(1.4, .85, length(sp) / blob.z);
    }
  }

  // The drop that falls during the intro
  vec2 fp = (uv - fall.xy) * vec2(asp, 1.);
  col += fall.z * smoothstep(.016, .004, length(fp * vec2(1., .5))) * vec3(.8, .9, 1.);

  float vig = smoothstep(1.3, .35, length((uv - .5) * vec2(asp, 1.) * .9));
  col *= mix(.6, 1., vig);
  float f = mix(1., smoothstep(0., .22, uv.y), fade.x) * mix(1., smoothstep(1., .78, uv.y), fade.y);
  o = vec4(mix(bg, col, f), 1.);
}`;

/** A project screen: a thin sheet of liquid with the recording playing inside. */
export const SCREEN_FS = `${HEAD}
in vec2 uv; out vec4 o;
uniform sampler2D tex;
uniform vec2 size, mouse;   // size in css px, mouse in uv
uniform float t, alpha, vel, hover, radius, reveal;
void main(){
  vec2 px = uv * size, hs = size * .5;
  vec2 qd = abs(px - hs) - hs + radius;
  float sd = length(max(qd, 0.)) + min(max(qd.x, qd.y), 0.) - radius;
  float lively = .25 + hover * .9 + abs(vel) * 1.6;
  sd += (sin(px.x * .045 + t * 1.6) + sin(px.y * .05 - t * 1.3)) * .9 * lively;
  float a = 1. - smoothstep(-1., 1., sd);

  vec2 w = vec2(sin(uv.y * 16. + t * 1.4), cos(uv.x * 14. - t * 1.2)) * .0014 * (1. + hover * 1.4);
  vec2 dm = (uv - mouse) * vec2(size.x / size.y, 1.);
  float md = length(dm);
  w += normalize(dm + 1e-4) * sin(md * 34. - t * 5.) * .0035 * hover * smoothstep(.55, 0., md);
  w.y += vel * .018 * sin(uv.x * 3.14159);
  float sp = vel * .006;
  vec2 q = uv + w;
  vec3 c = vec3(texture(tex, q + vec2(0., sp)).r, texture(tex, q).g, texture(tex, q - vec2(0., sp)).b);

  float band = 1. - abs(uv.x + uv.y * .4 - fract(t * .06) * 2.6 + .5) * 3.;
  c += smoothstep(0., 1., band) * .03;
  c += smoothstep(-7., 0., sd) * vec3(.5, .7, 1.) * (.14 + hover * .1);

  // Rises out of the liquid: the top edge emerges first, with a wavy waterline
  float line = reveal * 1.2 - .1 + sin(uv.x * 11. + t * 2.2) * .018 * (1. - reveal);
  a *= 1. - smoothstep(line - .02, line + .02, uv.y);
  c += smoothstep(.06, 0., abs(uv.y - line)) * vec3(.4, .65, 1.) * (1. - reveal) * .8;

  o = vec4(c, a * alpha);
}`;

/** The portrait as a reflection on water; settles to a clear image when still. */
export const PORTRAIT_FS = `${HEAD}
in vec2 uv; out vec4 o;
uniform sampler2D s, tex;
uniform vec2 d, size;
uniform float t, K, alpha, radius;
void main(){
  vec2 px = uv * size, hs = size * .5;
  vec2 qd = abs(px - hs) - hs + radius;
  float sd = length(max(qd, 0.)) + min(max(qd.x, qd.y), 0.) - radius;
  float a = 1. - smoothstep(-1., 1., sd);

  float hl = texture(s, uv - vec2(d.x, 0.)).r, hr = texture(s, uv + vec2(d.x, 0.)).r;
  float hu = texture(s, uv - vec2(0., d.y)).r, hd = texture(s, uv + vec2(0., d.y)).r;
  vec3 n = vec3((hl - hr) * K, (hu - hd) * K, 1.);
  n.xy += vec2(sin(uv.y * 14. + t * .8), cos(uv.x * 12. - t * .9)) * .006;
  n = normalize(n);
  float rim = clamp(1. - n.z, 0., 1.);
  vec3 c = texture(tex, clamp(uv + n.xy * .07, 0., 1.)).rgb;
  vec3 L = normalize(vec3(.3, -.7, .65));
  float spec = pow(max(dot(reflect(-L, n), vec3(0., 0., 1.)), 0.), 120.);
  c += spec * smoothstep(.0005, .02, rim) * vec3(.85, .93, 1.) * 1.2 + rim * vec3(.1, .25, .5) * 1.4;
  c += smoothstep(-6., 0., sd) * vec3(.5, .7, 1.) * .12;
  o = vec4(c, a * alpha);
}`;
