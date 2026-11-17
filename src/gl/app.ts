import { projects, type Project } from "@/lib/content";
import { store } from "@/lib/store";
import * as S from "./shaders";

type GL = WebGL2RenderingContext;
type Prog = {
  p: WebGLProgram;
  u: (name: string) => WebGLUniformLocation | null;
  ready: () => boolean;
  check: () => void;
};
type RGB = [number, number, number];

const BG: RGB = [0x06 / 255, 0x08 / 255, 0x0c / 255];
const GRID = 24;
let introPlayed = false;

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

function hexToRgb(hex: string): RGB {
  const n = parseInt(hex.replace("#", ""), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

/**
 * Starts compiling and linking without waiting for the result. Asking for the
 * status straight away would block the main thread until the GPU driver
 * finishes; with KHR_parallel_shader_compile we can poll `ready()` instead.
 */
function program(gl: GL, par: KHR_parallel_shader_compile | null, vs: string, fs: string): Prog {
  const make = (type: number, src: string) => {
    const sh = gl.createShader(type)!;
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    return sh;
  };
  const p = gl.createProgram()!;
  const shaders = [make(gl.VERTEX_SHADER, vs), make(gl.FRAGMENT_SHADER, fs)];
  shaders.forEach((s) => gl.attachShader(p, s));
  gl.bindAttribLocation(p, 0, "p");
  gl.linkProgram(p);
  const cache = new Map<string, WebGLUniformLocation | null>();
  return {
    p,
    u: (name) => {
      if (!cache.has(name)) cache.set(name, gl.getUniformLocation(p, name));
      return cache.get(name)!;
    },
    ready: () => !par || gl.getProgramParameter(p, par.COMPLETION_STATUS_KHR),
    check: () => {
      if (gl.getProgramParameter(p, gl.LINK_STATUS)) return;
      const logs = shaders.map((s) => gl.getShaderInfoLog(s)).join("\n");
      throw new Error(`${gl.getProgramInfoLog(p)}\n${logs}`);
    },
  };
}

function texture(gl: GL): WebGLTexture {
  const t = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, t);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return t;
}

function upload(gl: GL, t: WebGLTexture, src: TexImageSource) {
  gl.bindTexture(gl.TEXTURE_2D, t);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
}

/** GPU ripple simulation: two half-float textures, ping-ponged. */
class RippleSim {
  private tex: WebGLTexture[] = [];
  private fbo: WebGLFramebuffer[] = [];
  private cur = 0;

  constructor(
    private gl: GL,
    private progs: { upd: Prog; drop: Prog },
    private draw: () => void,
    readonly w: number,
    readonly h: number,
  ) {
    for (let i = 0; i < 2; i++) {
      const t = texture(gl);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, w, h, 0, gl.RGBA, gl.HALF_FLOAT, null);
      const f = gl.createFramebuffer()!;
      gl.bindFramebuffer(gl.FRAMEBUFFER, f);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      this.tex.push(t);
      this.fbo.push(f);
    }
  }

  private pass(prog: Prog, set: () => void) {
    const gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo[1 - this.cur]);
    gl.viewport(0, 0, this.w, this.h);
    gl.disable(gl.BLEND);
    gl.useProgram(prog.p);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.tex[this.cur]);
    gl.uniform1i(prog.u("s"), 0);
    set();
    this.draw();
    this.cur = 1 - this.cur;
  }

  step() {
    const { gl, progs } = this;
    this.pass(progs.upd, () => gl.uniform2f(progs.upd.u("d"), 1 / this.w, 1 / this.h));
  }

  /** x, y in 0..1 (y down); r in heights; k = strength */
  drop(x: number, y: number, r: number, k: number) {
    const { gl, progs } = this;
    this.pass(progs.drop, () => {
      gl.uniform2f(progs.drop.u("c"), x, y);
      gl.uniform1f(progs.drop.u("r"), r);
      gl.uniform1f(progs.drop.u("k"), k);
      gl.uniform1f(progs.drop.u("asp"), this.w / this.h);
    });
  }

  get texture() {
    return this.tex[this.cur];
  }

  dispose() {
    this.tex.forEach((t) => this.gl.deleteTexture(t));
    this.fbo.forEach((f) => this.gl.deleteFramebuffer(f));
  }
}

type Water = {
  el: HTMLElement;
  /** Size at scan time; an unchanged section keeps its water across re-scans */
  cw: number;
  ch: number;
  sim: RippleSim;
  nameTex: WebGLTexture;
  fadeTop: number;
  fadeBottom: number;
  tint: RGB | null;
  blob: boolean;
  bx: number;
  by: number;
  lx: number;
  ly: number;
  px: number;
  py: number;
  pin: boolean;
  nameAlpha: number;
  fall: [number, number, number];
  intro: { start: number; tx: number; ty: number } | null;
  nextIdle: number;
  /** Things floating on this water (the bottle); they send out small ripples */
  buoys: HTMLElement[];
  nextBuoy: number;
};

type Plane = {
  el: HTMLElement;
  revealEl: HTMLElement | null;
  project: Project;
  phone: boolean;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  tex: WebGLTexture;
  video: HTMLVideoElement | null;
  hover: number;
  mx: number;
  my: number;
  radius: number;
  phase: number;
  drawn: boolean;
};

type Portrait = {
  el: HTMLElement;
  revealEl: HTMLElement | null;
  sim: RippleSim;
  tex: WebGLTexture;
  radius: number;
  px: number;
  py: number;
  pin: boolean;
  nextIdle: number;
};

function rr(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  c.beginPath();
  if (c.roundRect) c.roundRect(x, y, w, h, r);
  else c.rect(x, y, w, h);
  c.fill();
}

/** Stand-in for a screen recording: a generic page in the project's colour, slowly scrolling. */
function drawMock(c: CanvasRenderingContext2D, W: number, H: number, p: Project, off: number, phone: boolean) {
  const ink = "#e8ecf2";
  c.fillStyle = "#0b0f15";
  c.fillRect(0, 0, W, H);
  const g = c.createRadialGradient(0, 0, 0, 0, 0, W * 0.9);
  g.addColorStop(0, p.color + "40");
  g.addColorStop(1, p.color + "00");
  c.fillStyle = g;
  c.fillRect(0, 0, W, H);

  if (phone) {
    c.save();
    c.beginPath();
    c.rect(0, 96, W, H - 96 - 54);
    c.clip();
    c.translate(0, 96 - off * 0.8);
    for (let i = 0; i < 9; i++) {
      c.fillStyle = "rgba(255,255,255,.07)";
      rr(c, 16, 16 + i * 104, W - 32, 90, 14);
      c.fillStyle = p.color;
      rr(c, 30, 32 + i * 104, 58, 58, 10);
      c.fillStyle = "rgba(232,236,242,.8)";
      rr(c, 102, 40 + i * 104, 130, 12, 6);
      c.fillStyle = "rgba(232,236,242,.3)";
      rr(c, 102, 64 + i * 104, 90, 10, 5);
    }
    c.restore();
    c.fillStyle = p.color;
    c.fillRect(0, 0, W, 96);
    c.fillStyle = "#fff";
    c.font = "700 24px system-ui, sans-serif";
    c.fillText(p.title, 18, 66);
    c.fillStyle = "#11161d";
    c.fillRect(0, H - 54, W, 54);
    for (let i = 0; i < 4; i++) {
      c.fillStyle = i === 0 ? p.color : "rgba(255,255,255,.25)";
      c.beginPath();
      c.arc(W / 8 + (i * W) / 4, H - 27, 8, 0, 7);
      c.fill();
    }
    return;
  }

  c.save();
  c.beginPath();
  c.rect(0, 34, W, H - 34);
  c.clip();
  c.translate(0, 34 - off);
  c.fillStyle = ink;
  c.font = "700 18px system-ui, sans-serif";
  c.fillText(p.title, 28, 38);
  c.fillStyle = "rgba(232,236,242,.35)";
  for (let i = 0; i < 3; i++) rr(c, 420 + i * 66, 28, 46, 10, 5);
  c.fillStyle = ink;
  c.font = "800 46px system-ui, sans-serif";
  c.fillText(p.title, 28, 132);
  c.fillStyle = "rgba(232,236,242,.45)";
  rr(c, 28, 156, 300, 11, 5);
  rr(c, 28, 178, 230, 11, 5);
  c.fillStyle = p.color;
  rr(c, 28, 208, 132, 40, 10);
  c.globalAlpha = 0.85;
  rr(c, 408, 78, 204, 170, 16);
  c.globalAlpha = 1;
  for (let i = 0; i < 3; i++) {
    c.fillStyle = "rgba(255,255,255,.07)";
    rr(c, 28 + i * 198, 292, 186, 128, 12);
    c.fillStyle = p.color;
    rr(c, 44 + i * 198, 308, 44, 44, 9);
    c.fillStyle = "rgba(232,236,242,.45)";
    rr(c, 44 + i * 198, 370, 124, 9, 4);
    rr(c, 44 + i * 198, 390, 88, 9, 4);
  }
  c.fillStyle = "rgba(232,236,242,.85)";
  rr(c, 28, 468, 260, 18, 6);
  for (let i = 0; i < 4; i++) {
    c.fillStyle = "rgba(255,255,255,.07)";
    rr(c, 28 + (i % 2) * 296, 508 + Math.floor(i / 2) * 110, 286, 96, 12);
    c.fillStyle = p.color;
    rr(c, 44 + (i % 2) * 296, 526 + Math.floor(i / 2) * 110, 28, 28, 7);
  }
  c.fillStyle = p.color;
  rr(c, 28, 748, 584, 104, 16);
  c.fillStyle = "#fff";
  rr(c, 56, 790, 240, 18, 6);
  c.restore();

  c.fillStyle = "#131820";
  c.fillRect(0, 0, W, 34);
  c.fillStyle = "rgba(255,255,255,.22)";
  for (let i = 0; i < 3; i++) {
    c.beginPath();
    c.arc(18 + i * 16, 17, 4.5, 0, 7);
    c.fill();
  }
  c.fillStyle = "rgba(255,255,255,.08)";
  rr(c, 190, 8, 260, 18, 9);
  c.fillStyle = "rgba(232,236,242,.55)";
  c.font = "11px system-ui, sans-serif";
  c.textAlign = "center";
  c.fillText(p.title.toLowerCase(), 320, 21);
  c.textAlign = "left";
}

/**
 * One WebGL2 context for the whole site. HTML elements mark where each effect
 * goes (data-gl / data-gl-plane); every frame the canvas reads their rects and
 * draws water, project screens and the portrait in those places.
 */
export class GLApp {
  private gl: GL;
  private progs: Record<"upd" | "drop" | "backdrop" | "water" | "screen" | "portrait", Prog>;
  private indexCount = 0;
  private w = 1;
  private h = 1;
  private t0 = performance.now();
  private vel = 0;
  private frameNo = 0;
  private waters: Water[] = [];
  private planes: Plane[] = [];
  private portrait: Portrait | null = null;
  private click: { x: number; y: number } | null = null;
  private blank: WebGLTexture;
  private resizeTimer = 0;

  constructor(private canvas: HTMLCanvasElement) {
    const gl = canvas.getContext("webgl2", { antialias: true, alpha: false, powerPreference: "high-performance" });
    if (!gl || !gl.getExtension("EXT_color_buffer_float")) throw new Error("WebGL2 float targets unavailable");
    gl.getExtension("OES_texture_float_linear");
    const par = gl.getExtension("KHR_parallel_shader_compile");
    this.gl = gl;

    this.progs = {
      upd: program(gl, par, S.SIM_VS, S.SIM_UPDATE_FS),
      drop: program(gl, par, S.SIM_VS, S.SIM_DROP_FS),
      backdrop: program(gl, par, S.PLANE_VS, S.BACKDROP_FS),
      water: program(gl, par, S.PLANE_VS, S.WATER_FS),
      screen: program(gl, par, S.PLANE_VS, S.SCREEN_FS),
      portrait: program(gl, par, S.PLANE_VS, S.PORTRAIT_FS),
    };

    // One grid mesh, shared by every pass
    const verts: number[] = [];
    const idx: number[] = [];
    for (let y = 0; y <= GRID; y++) for (let x = 0; x <= GRID; x++) verts.push(x / GRID, y / GRID);
    for (let y = 0; y < GRID; y++)
      for (let x = 0; x < GRID; x++) {
        const a = y * (GRID + 1) + x;
        idx.push(a, a + 1, a + GRID + 1, a + 1, a + GRID + 2, a + GRID + 1);
      }
    gl.bindVertexArray(gl.createVertexArray());
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(idx), gl.STATIC_DRAW);
    this.indexCount = idx.length;

    this.blank = texture(gl);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4));
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    this.resize();
    window.addEventListener("resize", this.onResize);
    window.addEventListener("pointerdown", this.onDown, { passive: true });
  }

  /** Called once, after the first frame has been drawn */
  onFirstFrame: (() => void) | null = null;

  /** Resolves when every shader has compiled; rejects if one failed. Polls once per frame. */
  whenReady(): Promise<void> {
    const progs = Object.values(this.progs);
    return new Promise((resolve, reject) => {
      const poll = () => {
        if (!progs.every((p) => p.ready())) return void requestAnimationFrame(poll);
        try {
          progs.forEach((p) => p.check());
          resolve();
        } catch (err) {
          reject(err);
        }
      };
      poll();
    });
  }

  private drawMesh = () => {
    this.gl.drawElements(this.gl.TRIANGLES, this.indexCount, this.gl.UNSIGNED_SHORT, 0);
  };

  private onDown = (e: PointerEvent) => {
    this.click = { x: e.clientX, y: e.clientY };
  };

  private onResize = () => {
    window.clearTimeout(this.resizeTimer);
    this.resizeTimer = window.setTimeout(() => {
      this.resize();
      this.scan();
    }, 160);
  };

  private resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    this.w = this.canvas.clientWidth || window.innerWidth;
    this.h = this.canvas.clientHeight || window.innerHeight;
    this.canvas.width = Math.round(this.w * dpr);
    this.canvas.height = Math.round(this.h * dpr);
  }

  private newSim(w: number, h: number) {
    return new RippleSim(this.gl, this.progs, this.drawMesh, w, h);
  }

  /** Draws the heading inside a water section into a texture, so the water can refract it. */
  private textTexture(el: HTMLElement, textEl: HTMLElement | null): WebGLTexture {
    const gl = this.gl;
    if (!textEl) return this.blank;
    const r = el.getBoundingClientRect();
    const tr = textEl.getBoundingClientRect();
    const scale = Math.min(2048 / r.width, 1.5);
    const c = document.createElement("canvas");
    c.width = Math.max(2, Math.round(r.width * scale));
    c.height = Math.max(2, Math.round(r.height * scale));
    const x = c.getContext("2d")!;
    const cs = getComputedStyle(textEl);
    let text = (textEl.textContent ?? "").trim();
    if (cs.textTransform === "uppercase") text = text.toUpperCase();
    const fs = parseFloat(cs.fontSize) * scale;
    x.font = `${cs.fontWeight} ${fs}px ${cs.fontFamily}`;
    const ls = parseFloat(cs.letterSpacing);
    if (!Number.isNaN(ls) && "letterSpacing" in x) x.letterSpacing = `${ls * scale}px`;
    x.textAlign = "center";
    x.textBaseline = "middle";
    x.fillStyle = "#fff";
    x.fillText(text, (tr.left - r.left + tr.width / 2) * scale, (tr.top - r.top + tr.height / 2) * scale + fs * 0.03);
    const t = texture(gl);
    upload(gl, t, c);
    return t;
  }

  /** Re-reads the DOM. Call after fonts load, on resize and after navigation. */
  scan() {
    const gl = this.gl;
    const now = (performance.now() - this.t0) / 1000;

    const oldWaters = this.waters;
    this.planes.forEach((p) => {
      gl.deleteTexture(p.tex);
      p.video?.pause();
    });
    if (this.portrait) {
      this.portrait.sim.dispose();
      gl.deleteTexture(this.portrait.tex);
    }

    this.waters = [...document.querySelectorAll<HTMLElement>('[data-gl="water"]')].map((el) => {
      const r = el.getBoundingClientRect();
      const cw = Math.round(r.width);
      const ch = Math.round(r.height);
      const keep = oldWaters.find((o) => o.el === el && o.cw === cw && o.ch === ch);
      if (keep) return keep;
      const textEl = el.querySelector<HTMLElement>("[data-gl-text]");
      const sim = this.newSim(320, clamp(Math.round((320 * r.height) / Math.max(r.width, 1)), 96, 640));
      const tr = textEl?.getBoundingClientRect();
      const tx = tr ? (tr.left - r.left + tr.width / 2) / r.width : 0.5;
      const ty = tr ? (tr.top - r.top + tr.height / 2) / r.height : 0.5;
      const wide = r.width > r.height;
      const w: Water = {
        el,
        cw,
        ch,
        sim,
        nameTex: this.textTexture(el, textEl),
        fadeTop: el.dataset.fade === "top" ? 1 : 0,
        fadeBottom: el.dataset.fade === "bottom" ? 1 : 0,
        tint: el.dataset.tint ? hexToRgb(el.dataset.tint) : null,
        blob: "blob" in el.dataset,
        bx: wide ? 0.715 : 0.7,
        by: wide ? 0.36 : 0.39,
        lx: 0.7,
        ly: 0.25,
        px: 0,
        py: 0,
        pin: false,
        nameAlpha: 1,
        fall: [0, 0, 0],
        intro: null,
        nextIdle: now + 2,
        buoys: [...el.querySelectorAll<HTMLElement>("[data-gl-buoy]")],
        nextBuoy: now + 1,
      };
      if ("intro" in el.dataset && !introPlayed) {
        introPlayed = true;
        let first = true;
        try {
          first = !sessionStorage.getItem("flow-intro");
          sessionStorage.setItem("flow-intro", "1");
        } catch {}
        // The HTML name is already on screen, so the drop lands on it rather than revealing it
        if (first) w.intro = { start: now + 0.15, tx, ty };
        else sim.drop(tx, ty, 0.1, 0.1);
      } else if (textEl) sim.drop(tx, ty, 0.08, 0.06);
      return w;
    });
    for (const o of oldWaters) {
      if (this.waters.includes(o)) continue;
      o.sim.dispose();
      if (o.nameTex !== this.blank) gl.deleteTexture(o.nameTex);
    }

    this.planes = [...document.querySelectorAll<HTMLElement>("[data-gl-plane]")].flatMap((el, i) => {
      const project = projects.find((p) => p.id === el.dataset.glPlane);
      if (!project) return [];
      const phone = el.dataset.variant === "phone";
      const canvas = document.createElement("canvas");
      canvas.width = phone ? 300 : 640;
      canvas.height = phone ? 634 : 400;
      const src = phone ? project.videoPhone : project.video;
      let video: HTMLVideoElement | null = null;
      if (src) {
        video = document.createElement("video");
        video.src = src;
        video.muted = true;
        video.loop = true;
        video.playsInline = true;
        video.preload = "metadata";
      }
      // Drawn and uploaded the first time the screen comes into view, not here
      const tex = texture(gl);
      const ctx = canvas.getContext("2d")!;
      return [
        {
          el,
          revealEl: el.closest<HTMLElement>("[data-reveal]"),
          project,
          phone,
          canvas,
          ctx,
          tex,
          video,
          hover: 0,
          mx: 0.5,
          my: 0.5,
          radius: parseFloat(getComputedStyle(el).borderTopLeftRadius) || 12,
          phase: i * 1.7,
          drawn: false,
        },
      ];
    });

    const pe = document.querySelector<HTMLElement>('[data-gl="portrait"]');
    this.portrait = null;
    if (pe) {
      const c = document.createElement("canvas");
      c.width = 512;
      c.height = 640;
      const x = c.getContext("2d")!;
      const g = x.createRadialGradient(256, 420, 0, 256, 420, 520);
      g.addColorStop(0, "#0a2f5c");
      g.addColorStop(0.55, "#04162e");
      g.addColorStop(1, "#06080c");
      x.fillStyle = g;
      x.fillRect(0, 0, 512, 640);
      x.fillStyle = "rgba(255,255,255,.2)";
      x.font = `700 190px ${getComputedStyle(pe).fontFamily}`;
      x.textAlign = "center";
      x.textBaseline = "middle";
      x.fillText(pe.dataset.initials ?? "", 256, 330);
      const tex = texture(gl);
      upload(gl, tex, c);
      if (pe.dataset.photo) {
        const img = new Image();
        img.onload = () => {
          // cover-fit the photo into the 4:5 texture
          const s = Math.max(512 / img.width, 640 / img.height);
          x.drawImage(img, (512 - img.width * s) / 2, (640 - img.height * s) / 2, img.width * s, img.height * s);
          upload(gl, tex, c);
        };
        img.src = pe.dataset.photo;
      }
      this.portrait = {
        el: pe,
        revealEl: pe.closest<HTMLElement>("[data-reveal]"),
        sim: this.newSim(128, 160),
        tex,
        radius: parseFloat(getComputedStyle(pe).borderTopLeftRadius) || 12,
        px: 0,
        py: 0,
        pin: false,
        nextIdle: now + 1,
      };
    }
  }

  private quad(prog: Prog, x: number, y: number, w: number, h: number, bend = 0, tilt: RGB = [0, 0, 0], lift = 0) {
    const gl = this.gl;
    gl.uniform4f(prog.u("rect"), x, y, w, h);
    gl.uniform2f(prog.u("res"), this.w, this.h);
    gl.uniform1f(prog.u("bend"), bend);
    gl.uniform3f(prog.u("tilt"), tilt[0], tilt[1], tilt[2]);
    gl.uniform1f(prog.u("lift"), lift);
    this.drawMesh();
  }

  private static opacityOf(el: HTMLElement | null) {
    if (!el) return 1;
    const o = parseFloat(el.style.opacity);
    return Number.isNaN(o) ? 1 : o;
  }

  /** Runs on GSAP's ticker, in the same frame as Lenis and ScrollTrigger. */
  frame = () => {
    const gl = this.gl;
    if (gl.isContextLost()) return;
    const { w: W, h: H } = this;
    const t = (performance.now() - this.t0) / 1000;
    const c = store.cursor;
    const click = this.click;
    this.click = null;
    this.frameNo++;
    this.vel += (clamp(store.velocity / 45, -1, 1) - this.vel) * 0.12;

    // ---------- simulations ----------
    const live: { w: Water; r: DOMRect }[] = [];
    for (const w of this.waters) {
      const r = w.el.getBoundingClientRect();
      if (r.bottom <= 0 || r.top >= H || r.width < 2) continue;
      live.push({ w, r });
      const asp = r.width / r.height;
      const lx = (c.x - r.left) / r.width;
      const ly = (c.y - r.top) / r.height;
      const inside = c.active && lx > 0 && lx < 1 && ly > 0 && ly < 1;

      if (w.intro) {
        // A drop falls onto the heading and rings out through the name
        const k = (t - w.intro.start) / 0.6;
        if (k >= 1) {
          w.sim.drop(w.intro.tx, w.intro.ty, 0.13, 0.2);
          w.fall = [0, 0, 0];
          w.intro = null;
        } else if (k > 0) w.fall = [w.intro.tx, -0.05 + (w.intro.ty + 0.05) * k * k, 1];
      }

      if (inside && w.pin) {
        const sp = Math.hypot((lx - w.px) * asp, ly - w.py);
        if (sp > 0.0006) w.sim.drop(lx, ly, 0.02, Math.min(0.02, sp * 0.5));
      }
      if (click) {
        const cx = (click.x - r.left) / r.width;
        const cy = (click.y - r.top) / r.height;
        if (cx > 0 && cx < 1 && cy > 0 && cy < 1) w.sim.drop(cx, cy, 0.05, 0.05);
      }
      if (t > w.nextIdle) {
        w.sim.drop(Math.random(), Math.random(), 0.03, 0.028);
        w.nextIdle = t + 1.6 + Math.random() * 2.4;
      }
      if (w.buoys.length && t > w.nextBuoy) {
        for (const b of w.buoys) {
          const br = b.getBoundingClientRect();
          w.sim.drop((br.left + br.width / 2 - r.left) / r.width, (br.top + br.height * 0.5 - r.top) / r.height, 0.035, 0.018);
        }
        w.nextBuoy = t + 1.2;
      }
      w.px = lx;
      w.py = ly;
      w.pin = inside;
      w.lx += ((inside ? lx : 0.7) - w.lx) * 0.06;
      w.ly += ((inside ? ly - 0.22 : 0.25) - w.ly) * 0.06;

      if (w.blob) {
        // The glass drop drifts, and slides away from the cursor
        const wide = asp > 1;
        let tx = (wide ? 0.715 : 0.7) + Math.sin(t * 0.4) * 0.012;
        let ty = (wide ? 0.36 : 0.39) + Math.cos(t * 0.33) * 0.016;
        if (inside) {
          const dx = (tx - lx) * asp;
          const dy = ty - ly;
          const dist = Math.hypot(dx, dy);
          if (dist < 0.3) {
            const push = (1 - dist / 0.3) * 0.075;
            tx += (dx / (dist || 1)) * push / asp;
            ty += (dy / (dist || 1)) * push;
          }
        }
        w.bx += (tx - w.bx) * 0.05;
        w.by += (ty - w.by) * 0.05;
      }
      w.sim.step();
      w.sim.step();
    }

    const po = this.portrait;
    let pr: DOMRect | null = null;
    if (po) {
      const r = po.el.getBoundingClientRect();
      if (r.bottom > 0 && r.top < H && r.width > 2) {
        pr = r;
        const lx = (c.x - r.left) / r.width;
        const ly = (c.y - r.top) / r.height;
        const inside = c.active && lx > 0 && lx < 1 && ly > 0 && ly < 1;
        if (inside && po.pin) {
          const sp = Math.hypot((lx - po.px) * 0.8, ly - po.py);
          if (sp > 0.001) po.sim.drop(lx, ly, 0.05, Math.min(0.03, sp * 0.6));
        }
        if (click && inside) po.sim.drop(lx, ly, 0.1, 0.06);
        if (t > po.nextIdle) {
          po.sim.drop(Math.random(), Math.random(), 0.06, 0.02);
          po.nextIdle = t + 2.5 + Math.random() * 3;
        }
        po.px = lx;
        po.py = ly;
        po.pin = inside;
        po.sim.step();
        po.sim.step();
      }
    }

    // ---------- draw ----------
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.disable(gl.BLEND);

    const bd = this.progs.backdrop;
    gl.useProgram(bd.p);
    gl.uniform3f(bd.u("bg"), ...BG);
    gl.uniform1f(bd.u("t"), t);
    gl.uniform1f(bd.u("asp"), W / H);
    gl.uniform1f(bd.u("scroll"), (store.scroll / H) * 0.3);
    this.quad(bd, 0, 0, W, H);

    const wp = this.progs.water;
    gl.useProgram(wp.p);
    for (const { w, r } of live) {
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, w.sim.texture);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, w.nameTex);
      gl.uniform1i(wp.u("s"), 0);
      gl.uniform1i(wp.u("nm"), 1);
      gl.uniform2f(wp.u("d"), 1 / w.sim.w, 1 / w.sim.h);
      gl.uniform2f(wp.u("light"), w.lx, w.ly);
      gl.uniform2f(wp.u("fade"), w.fadeTop, w.fadeBottom);
      gl.uniform3f(wp.u("bg"), ...BG);
      gl.uniform3f(wp.u("tint"), ...(w.tint ?? [0, 0, 0]));
      gl.uniform1f(wp.u("tintAmt"), w.tint ? 0.8 : 0);
      gl.uniform3f(wp.u("fall"), ...w.fall);
      gl.uniform4f(wp.u("blob"), w.bx, w.by, r.width > r.height ? 0.1 : 0.046, w.blob ? 1 : 0);
      gl.uniform1f(wp.u("t"), t);
      gl.uniform1f(wp.u("asp"), r.width / r.height);
      gl.uniform1f(wp.u("K"), w.sim.w * 0.35);
      gl.uniform1f(wp.u("nameAlpha"), w.nameAlpha);
      this.quad(wp, r.left, r.top, r.width, r.height);
    }

    gl.enable(gl.BLEND);

    if (po && pr) {
      const pp = this.progs.portrait;
      const a = GLApp.opacityOf(po.revealEl);
      gl.useProgram(pp.p);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, po.sim.texture);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, po.tex);
      gl.uniform1i(pp.u("s"), 0);
      gl.uniform1i(pp.u("tex"), 1);
      gl.uniform2f(pp.u("d"), 1 / po.sim.w, 1 / po.sim.h);
      gl.uniform2f(pp.u("size"), pr.width, pr.height);
      gl.uniform1f(pp.u("t"), t);
      gl.uniform1f(pp.u("K"), po.sim.w * 0.5);
      gl.uniform1f(pp.u("alpha"), a);
      gl.uniform1f(pp.u("radius"), po.radius);
      this.quad(pp, pr.left, pr.top, pr.width, pr.height);
    }

    const sp = this.progs.screen;
    gl.useProgram(sp.p);
    gl.activeTexture(gl.TEXTURE0);
    gl.uniform1i(sp.u("tex"), 0);
    for (const pl of this.planes) {
      const r = pl.el.getBoundingClientRect();
      if (r.bottom < -120 || r.top > H + 120 || r.width < 2) {
        if (pl.video && !pl.video.paused) pl.video.pause();
        continue;
      }
      const reveal = GLApp.opacityOf(pl.revealEl);
      const lx = (c.x - r.left) / r.width;
      const ly = (c.y - r.top) / r.height;
      const inside = c.active && lx > 0 && lx < 1 && ly > 0 && ly < 1;
      pl.hover += ((inside ? 1 : 0) - pl.hover) * 0.1;
      if (inside) {
        pl.mx += (lx - pl.mx) * 0.15;
        pl.my += (ly - pl.my) * 0.15;
      }

      gl.bindTexture(gl.TEXTURE_2D, pl.tex);
      if (pl.video) {
        if (pl.video.paused) pl.video.play().catch(() => {});
        if (pl.video.readyState >= 2) upload(gl, pl.tex, pl.video);
      } else if (!pl.drawn || this.frameNo % 2 === 0) {
        pl.drawn = true;
        const off = (0.5 - 0.5 * Math.cos(t * 0.22 + pl.phase)) * 470;
        drawMock(pl.ctx, pl.canvas.width, pl.canvas.height, pl.project, off, pl.phone);
        upload(gl, pl.tex, pl.canvas);
      }

      gl.uniform2f(sp.u("size"), r.width, r.height);
      gl.uniform2f(sp.u("mouse"), pl.mx, pl.my);
      gl.uniform1f(sp.u("t"), t + pl.phase);
      gl.uniform1f(sp.u("alpha"), Math.min(1, reveal * 2.5));
      gl.uniform1f(sp.u("vel"), this.vel);
      gl.uniform1f(sp.u("hover"), pl.hover);
      gl.uniform1f(sp.u("radius"), pl.radius);
      gl.uniform1f(sp.u("reveal"), reveal);
      this.quad(
        sp,
        r.left,
        r.top,
        r.width,
        r.height,
        this.vel * r.width * 0.05,
        [(pl.mx - 0.5) * 2, (pl.my - 0.5) * 2, pl.hover],
        (1 - reveal) * r.height * 0.1,
      );
    }

    if (this.onFirstFrame) {
      const cb = this.onFirstFrame;
      this.onFirstFrame = null;
      cb();
    }
  };

  destroy() {
    window.clearTimeout(this.resizeTimer);
    window.removeEventListener("resize", this.onResize);
    window.removeEventListener("pointerdown", this.onDown);
    this.planes.forEach((p) => p.video?.pause());
    // The context is left alive on purpose: React re-runs effects in dev, and a
    // canvas hands back the same (lost) context if it was killed here.
  }
}
