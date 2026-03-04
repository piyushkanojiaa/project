import React, { useRef, useEffect } from 'react';

// Types for component props
interface HeroProps {
    trustBadge?: {
        text: string;
        icons?: string[];
    };
    headline: {
        line1: string;
        line2: string;
    };
    subtitle: string;
    buttons?: {
        primary?: {
            text: string;
            onClick?: () => void;
        };
        secondary?: {
            text: string;
            onClick?: () => void;
        };
    };
    className?: string;
}

// Shader background with WebGL2
const useShaderBackground = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameRef = useRef<number>();

    useEffect(() => {
        if (!canvasRef.current) return;

        const canvas = canvasRef.current;
        const gl = canvas.getContext('webgl2');
        if (!gl) return;

        const dpr = Math.max(1, 0.5 * window.devicePixelRatio);
        canvas.width = window.innerWidth * dpr;
        canvas.height = window.innerHeight * dpr;

        const vertexShaderSource = `#version 300 es
      precision highp float;
      in vec4 position;
      void main() { gl_Position = position; }
    `;

        const fragmentShaderSource = `#version 300 es
      precision highp float;
      out vec4 O;
      uniform vec2 resolution;
      uniform float time;
      
      float rnd(vec2 p) {
        p = fract(p * vec2(12.9898, 78.233));
        p += dot(p, p + 34.56);
        return fract(p.x * p.y);
      }
      
      float noise(vec2 p) {
        vec2 i = floor(p), f = fract(p), u = f * f * (3.0 - 2.0 * f);
        return mix(
          mix(rnd(i), rnd(i + vec2(1, 0)), u.x),
          mix(rnd(i + vec2(0, 1)), rnd(i + vec2(1, 1)), u.x),
          u.y
        );
      }
      
      float fbm(vec2 p) {
        float t = 0.0, a = 1.0;
        mat2 m = mat2(1.0, -0.5, 0.2, 1.2);
        for (int i = 0; i < 5; i++) {
          t += a * noise(p);
          p = m * p * 2.0;
          a *= 0.5;
        }
        return t;
      }
      
      float clouds(vec2 p) {
        float d = 1.0, t = 0.0;
        for (float i = 0.0; i < 3.0; i++) {
          float a = d * fbm(i * 10.0 + p.x * 0.2 + 0.2 * (1.0 + i) * p.y + d + i * i + p);
          t = mix(t, d, a);
          d = a;
          p *= 2.0 / (i + 1.0);
        }
        return t;
      }
      
      void main() {
        vec2 uv = (gl_FragCoord.xy - 0.5 * resolution) / min(resolution.x, resolution.y);
        vec2 st = uv * vec2(2, 1);
        vec3 col = vec3(0);
        float bg = clouds(vec2(st.x + time * 0.5, -st.y));
        uv *= 1.0 - 0.3 * (sin(time * 0.2) * 0.5 + 0.5);
        
        for (float i = 1.0; i < 12.0; i++) {
          uv += 0.1 * cos(i * vec2(0.1 + 0.01 * i, 0.8) + i * i + time * 0.5 + 0.1 * uv.x);
          vec2 p = uv;
          float d = length(p);
          col += 0.00125 / d * (cos(sin(i) * vec3(1, 2, 3)) + 1.0);
          float b = noise(i + p + bg * 1.731);
          col += 0.002 * b / length(max(p, vec2(b * p.x * 0.02, p.y)));
          col = mix(col, vec3(bg * 0.25, bg * 0.137, bg * 0.05), d);
        }
        O = vec4(col, 1);
      }
    `;

        const compileShader = (type: number, source: string) => {
            const shader = gl.createShader(type)!;
            gl.shaderSource(shader, source);
            gl.compileShader(shader);
            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                console.error('Shader compilation error:', gl.getShaderInfoLog(shader));
            }
            return shader;
        };

        const vertexShader = compileShader(gl.VERTEX_SHADER, vertexShaderSource);
        const fragmentShader = compileShader(gl.FRAGMENT_SHADER, fragmentShaderSource);

        const program = gl.createProgram()!;
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);

        const vertices = new Float32Array([-1, 1, -1, -1, 1, 1, 1, -1]);
        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

        const position = gl.getAttribLocation(program, 'position');
        gl.enableVertexAttribArray(position);
        gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

        const resolutionLocation = gl.getUniformLocation(program, 'resolution');
        const timeLocation = gl.getUniformLocation(program, 'time');

        const render = (now: number) => {
            gl.viewport(0, 0, canvas.width, canvas.height);
            gl.clearColor(0, 0, 0, 1);
            gl.clear(gl.COLOR_BUFFER_BIT);
            gl.useProgram(program);
            gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
            gl.uniform1f(timeLocation, now * 0.001);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
            animationFrameRef.current = requestAnimationFrame(render);
        };

        const handleResize = () => {
            canvas.width = window.innerWidth * dpr;
            canvas.height = window.innerHeight * dpr;
        };

        window.addEventListener('resize', handleResize);
        render(0);

        return () => {
            window.removeEventListener('resize', handleResize);
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, []);

    return canvasRef;
};

const AnimatedShaderHero: React.FC<HeroProps> = ({
    trustBadge,
    headline,
    subtitle,
    buttons,
    className = ""
}) => {
    const canvasRef = useShaderBackground();

    return (
        <div className={`relative w-full h-screen overflow-hidden bg-black ${className}`}>
            <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full"
                style={{ background: 'black' }}
            />

            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-white px-4">
                {trustBadge && (
                    <div className="mb-8 opacity-0 animate-[fadeInDown_0.8s_ease-out_forwards]">
                        <div className="flex items-center gap-2 px-6 py-3 bg-blue-500/10 backdrop-blur-md border border-blue-400/30 rounded-full text-sm">
                            {trustBadge.icons && trustBadge.icons.map((icon, i) => (
                                <span key={i} className="text-blue-300">{icon}</span>
                            ))}
                            <span className="text-blue-100 font-semibold">{trustBadge.text}</span>
                        </div>
                    </div>
                )}

                <div className="text-center space-y-6 max-w-5xl">
                    <div className="space-y-2">
                        <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold bg-gradient-to-r from-blue-300 via-purple-300 to-pink-300 bg-clip-text text-transparent opacity-0 animate-[fadeInUp_0.8s_ease-out_0.2s_forwards]">
                            {headline.line1}
                        </h1>
                        <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold bg-gradient-to-r from-purple-300 via-pink-300 to-blue-300 bg-clip-text text-transparent opacity-0 animate-[fadeInUp_0.8s_ease-out_0.4s_forwards]">
                            {headline.line2}
                        </h1>
                    </div>

                    <p className="text-lg md:text-xl lg:text-2xl text-slate-200 font-light leading-relaxed max-w-3xl mx-auto opacity-0 animate-[fadeInUp_0.8s_ease-out_0.6s_forwards]">
                        {subtitle}
                    </p>

                    {buttons && (
                        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10 opacity-0 animate-[fadeInUp_0.8s_ease-out_0.8s_forwards]">
                            {buttons.primary && (
                                <button
                                    onClick={buttons.primary.onClick}
                                    className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-full font-semibold text-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/50"
                                >
                                    {buttons.primary.text}
                                </button>
                            )}
                            {buttons.secondary && (
                                <button
                                    onClick={buttons.secondary.onClick}
                                    className="px-8 py-4 bg-white/10 hover:bg-white/20 border-2 border-white/30 hover:border-white/50 rounded-full font-semibold text-lg transition-all duration-300 hover:scale-105 backdrop-blur-sm"
                                >
                                    {buttons.secondary.text}
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AnimatedShaderHero;
