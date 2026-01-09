#version 300 es
layout(location = 0) in vec2 a_position;

uniform mat4 u_projection;
uniform mat4 u_view;
uniform vec2 u_scale_offset; // x = candleWidth (or stride), y = gap (optional)

void main() {
    // a_position.x is the index (0, 1, 2...)
    // a_position.y is the price value
    
    // Convert index to world X
    // Assuming spread logic matches candlestick: x = index * 7 (stride) roughly
    // Ideally we pass stride as uniform
    float worldX = a_position.x * 7.0 + 3.5; // +3.5 to center in candle slot

    gl_Position = u_projection * u_view * vec4(worldX, a_position.y, 0.0, 1.0);
}
