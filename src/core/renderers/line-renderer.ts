import { WebGLContextManager } from '../webgl/context-manager';
import type { Viewport, Point } from '../renderer/types';
// @ts-ignore
import lineVert from '../../shaders/line.vert.glsl?raw';
// @ts-ignore
import lineFrag from '../../shaders/line.frag.glsl?raw';
import { mat4 } from 'gl-matrix';

export class LineRenderer {
    private program: WebGLProgram;
    private vao: WebGLVertexArrayObject | null = null;
    private buffer: WebGLBuffer | null = null;

    // Uniform Locations
    private uProjection: WebGLUniformLocation | null = null;
    private uView: WebGLUniformLocation | null = null;
    private uColor: WebGLUniformLocation | null = null;

    private gl: WebGL2RenderingContext | WebGLRenderingContext;
    private contextManager: WebGLContextManager;

    constructor(
        gl: WebGL2RenderingContext | WebGLRenderingContext,
        contextManager: WebGLContextManager
    ) {
        this.gl = gl;
        this.contextManager = contextManager;
        this.program = this.contextManager.getOrCreateProgram('line', lineVert, lineFrag);
        this.initLocations();
        this.initBuffers();
    }

    private initLocations() {
        this.uProjection = this.gl.getUniformLocation(this.program, 'u_projection');
        this.uView = this.gl.getUniformLocation(this.program, 'u_view');
        this.uColor = this.gl.getUniformLocation(this.program, 'u_color');
    }

    private initBuffers() {
        if (this.gl instanceof WebGL2RenderingContext) {
            this.vao = this.gl.createVertexArray();
        } else {
            const ext = this.contextManager.getExtensions().vao;
            if (ext) this.vao = ext.createVertexArrayOES();
        }

        this.buffer = this.gl.createBuffer();
    }

    public render(
        points: Point[],
        _viewport: Viewport,
        projMatrix: mat4,
        viewMatrix: mat4,
        color: [number, number, number, number]
    ) {
        if (points.length === 0) return;

        this.gl.useProgram(this.program);

        // Bind VAO
        if (this.gl instanceof WebGL2RenderingContext) {
            this.gl.bindVertexArray(this.vao);
        } else {
            const ext = this.contextManager.getExtensions().vao;
            if (ext) ext.bindVertexArrayOES(this.vao as any);
        }

        // Upload Data
        const vertices = new Float32Array(points.filter(p => p.defined).flatMap(p => [p.x, p.y]));

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, vertices, this.gl.DYNAMIC_DRAW);

        this.gl.enableVertexAttribArray(0);
        this.gl.vertexAttribPointer(0, 2, this.gl.FLOAT, false, 0, 0);

        // Uniforms
        this.gl.uniformMatrix4fv(this.uProjection, false, projMatrix);
        this.gl.uniformMatrix4fv(this.uView, false, viewMatrix);
        this.gl.uniform4fv(this.uColor, color);

        // Draw
        this.gl.drawArrays(this.gl.LINE_STRIP, 0, vertices.length / 2);
    }
}
