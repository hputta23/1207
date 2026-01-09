
export class WebGLContextManager {
    private gl: WebGL2RenderingContext | WebGLRenderingContext | null = null;
    private shaderCache = new Map<string, WebGLProgram>();

    public version: '2.0' | '1.0' | 'canvas2d' = '2.0';

    initContext(canvas: HTMLCanvasElement): WebGL2RenderingContext | WebGLRenderingContext {
        // Try WebGL 2.0 first
        this.gl = canvas.getContext('webgl2', {
            alpha: false,
            antialias: false,        // CRITICAL: Disable for determinism
            depth: true,
            stencil: false,
            premultipliedAlpha: false,
            preserveDrawingBuffer: false,
            powerPreference: 'high-performance',
            failIfMajorPerformanceCaveat: false
        });

        if (this.gl) {
            this.version = '2.0';
            this.configureWebGL2(this.gl as WebGL2RenderingContext);
            return this.gl;
        }

        // Fallback to WebGL 1.0
        this.gl = canvas.getContext('webgl', {
            alpha: false,
            antialias: false,
            depth: true,
            stencil: false,
            premultipliedAlpha: false,
            preserveDrawingBuffer: false,
            powerPreference: 'high-performance'
        });

        if (this.gl) {
            this.version = '1.0';
            this.configureWebGL1(this.gl);
            return this.gl;
        }

        throw new Error('WebGL not supported');
    }

    private configureWebGL2(gl: WebGL2RenderingContext): void {
        // Disable dithering for determinism
        gl.disable(gl.DITHER);

        // Enable depth testing
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);

        // Configure blending for transparency
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        // Set viewport
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    }

    private configureWebGL1(gl: WebGLRenderingContext): void {
        gl.disable(gl.DITHER);
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    }

    compileShader(source: string, type: 'vertex' | 'fragment'): WebGLShader {
        if (!this.gl) throw new Error('WebGL not initialized');

        const shader = this.gl.createShader(
            type === 'vertex' ? this.gl.VERTEX_SHADER : this.gl.FRAGMENT_SHADER
        );

        if (!shader) throw new Error('Failed to create shader');

        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);

        // Check compilation status
        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            const error = this.gl.getShaderInfoLog(shader);
            this.gl.deleteShader(shader);
            throw new Error(`Shader compilation failed: ${error}`);
        }

        return shader;
    }

    linkProgram(vertexShader: WebGLShader, fragmentShader: WebGLShader): WebGLProgram {
        if (!this.gl) throw new Error('WebGL not initialized');

        const program = this.gl.createProgram();
        if (!program) throw new Error('Failed to create program');

        this.gl.attachShader(program, vertexShader);
        this.gl.attachShader(program, fragmentShader);
        this.gl.linkProgram(program);

        // Check link status
        if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
            const error = this.gl.getProgramInfoLog(program);
            this.gl.deleteProgram(program);
            throw new Error(`Program linking failed: ${error}`);
        }

        return program;
    }

    getOrCreateProgram(
        name: string,
        vertexSource: string,
        fragmentSource: string
    ): WebGLProgram {
        // Check cache
        const cached = this.shaderCache.get(name);
        if (cached) return cached;

        // Compile and link
        const vertexShader = this.compileShader(vertexSource, 'vertex');
        const fragmentShader = this.compileShader(fragmentSource, 'fragment');
        const program = this.linkProgram(vertexShader, fragmentShader);

        // Cache for future use
        this.shaderCache.set(name, program);

        // Clean up shaders (no longer needed after linking)
        this.gl!.deleteShader(vertexShader);
        this.gl!.deleteShader(fragmentShader);

        return program;
    }
    public getExtensions() {
        if (!this.gl) throw new Error('WebGL not initialized');
        return {
            vao: this.gl.getExtension('OES_vertex_array_object')
        };
    }
}
