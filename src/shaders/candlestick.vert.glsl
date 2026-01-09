#version 300 es
precision highp float;

// Attributes
in vec2 a_position;        // Vertex position
in vec4 a_color;           // Vertex color
in float a_candleType;     // 0=body, 1=wick, 2=partial

// Uniforms
uniform mat4 u_projection;
uniform mat4 u_view;

// Outputs to fragment shader
out vec4 v_color;
out float v_candleType;

void main() {
  gl_Position = u_projection * u_view * vec4(a_position, 0.0, 1.0);
  v_color = a_color;
  v_candleType = a_candleType;
}
