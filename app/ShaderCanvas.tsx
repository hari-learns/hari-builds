"use client";

import { useEffect, useRef } from "react";

type Props = { colors: [string, string, string, string]; hover: boolean; pointer: { x: number; y: number }; paused?: boolean };

const VERT = `attribute vec2 p; void main(){ gl_Position = vec4(p, 0., 1.); }`;
const FRAG = `
precision mediump float;
uniform vec2 r; uniform float t; uniform vec2 m; uniform float hov;
uniform vec3 c0, c1, c2, c3;
float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float n(vec2 p){
  vec2 i = floor(p), f = fract(p); f = f*f*(3. - 2.*f);
  return mix(mix(h(i), h(i + vec2(1,0)), f.x), mix(h(i + vec2(0,1)), h(i + vec2(1,1)), f.x), f.y);
}
float fbm(vec2 p){ float v = 0., a = .5; for(int i = 0; i < 4; i++){ v += a * n(p); p = p*2. + 7.; a *= .5; } return v; }
void main(){
  vec2 uv = gl_FragCoord.xy / r;
  float asp = r.x / r.y;
  vec2 p = vec2(uv.x * asp, uv.y);
  p.x += p.y * .35;                                  // slant the streaks
  float tt = t * .06;
  float sway = fbm(vec2(p.x * 1.1, tt)) * 1.4;       // slow sideways drift
  float x = p.x * 5. + sway * 2.;
  float a = fbm(vec2(x, p.y * .5 - tt * 1.5));       // tall, thin streaks
  float b = fbm(vec2(x * 1.9 + 3., p.y * .35 + tt));
  float k = smoothstep(.22, .95, a * .65 + b * .55);
  k *= smoothstep(0., 1., uv.y * .9 + .2);
  float d = distance(uv * vec2(asp, 1.), m * vec2(asp, 1.));
  k += exp(-d*d*8.) * hov * .35;                     // light follows the pointer
  vec3 col = mix(c0, c1, smoothstep(0., .45, k));
  col = mix(col, c2, smoothstep(.35, .8, k));
  col = mix(col, c3, smoothstep(.72, 1.05, k));
  col += (h(gl_FragCoord.xy + fract(t) * 91.) - .5) * .07;   // film grain
  gl_FragColor = vec4(col, 1.);
}`;

const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);

export function ShaderCanvas({ colors, hover, pointer, paused = false }: Props) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const live = useRef({ hover, pointer, hov: 0, phase: 4, last: 0, colors, paused });
  live.current.hover = hover;
  live.current.pointer = pointer;
  live.current.colors = colors;
  live.current.paused = paused;

  useEffect(() => {
    const cv = canvas.current;
    const gl = cv?.getContext("webgl", { antialias: false, alpha: false, powerPreference: "low-power" });
    if (!cv || !gl) return;

    const sh = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const u = (n: string) => gl.getUniformLocation(prog, n);
    const uR = u("r"), uT = u("t"), uM = u("m"), uH = u("hov");
    const uC = [0, 1, 2, 3].map((i) => u(`c${i}`));

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let visible = true, raf = 0;

    const draw = () => {
      const L = live.current;
      L.colors.forEach((c, i) => gl.uniform3fv(uC[i], rgb(c)));
      gl.uniform2f(uR, cv.width, cv.height);
      gl.uniform1f(uT, L.phase);
      gl.uniform2f(uM, L.pointer.x, 1 - L.pointer.y);
      gl.uniform1f(uH, reduce ? 0 : L.hov);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    // Resizing clears the canvas, so repaint in the same callback to avoid a blank frame (the flicker on open/close).
    const size = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.25);
      const w = Math.max(2, Math.round(cv.clientWidth * dpr)), h = Math.max(2, Math.round(cv.clientHeight * dpr));
      if (w === cv.width && h === cv.height) return;
      cv.width = w;
      cv.height = h;
      gl.viewport(0, 0, w, h);
      draw();
    };
    size();
    const ro = new ResizeObserver(size);
    ro.observe(cv);

    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0 });
    io.observe(cv);

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const L = live.current;
      const dt = Math.min((now - L.last) / 1000, 0.1);
      L.last = now;
      // Dimmed books hold their last frame while another book is open, which keeps the open video smooth.
      if (!visible || document.hidden || L.paused) return;
      // Advance phase on the CPU so speed changes never cause a jump.
      if (!reduce) L.phase += dt * (1 + L.hov * 0.3);
      L.hov += ((L.hover ? 1 : 0) - L.hov) * 0.05;
      draw();
    };
    raf = requestAnimationFrame(frame);

    return () => { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); };
  }, []);

  return (
    <canvas
      ref={canvas}
      className="shader"
      aria-hidden
      style={{ background: `linear-gradient(135deg, ${colors[0]}, ${colors[2]})` }}
    />
  );
}
