#version 300 es
precision highp float;

// Inputs from vertex shader
in vec4 v_color;
in float v_candleType;

// Output
out vec4 fragColor;

void main() {
  vec4 color = v_color;
  
  // If partial candle (type 2), apply dashed pattern
  // Note: This is an approximation of "dashed" based on screen coords
  if (v_candleType > 1.5) {
    float pattern = mod(gl_FragCoord.x + gl_FragCoord.y, 8.0);
    if (pattern > 4.0) {
      discard;
    }
    color.a *= 0.7; // Reduce opacity
  }
  
  fragColor = color;
}
