/*------------------------------------------------------------------------------------*/

const V_pt_shader = `
    attribute vec4 a_pos;
    void main(){
        gl_Position = a_pos;
        gl_PointSize = 10.0;
    }
`
const F_pt_shader = `
    void main(){
        gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
    }
`

/*------------------------------------------------------------------------------------*/

const V_line_shader = `
    precision highp float;
    attribute vec2 a_pos;
    uniform mat4 u_matrix;

    varying vec2 v_pos;
    varying vec2 v_ori_pos;
    void main(){
        vec2 pos = 2.0 * a_pos - 1.0;
        gl_Position = u_matrix * vec4(pos, 0.0, 1.0);

        v_pos = vec2(gl_Position) * 0.5 + 0.5;
        v_ori_pos = pos;
    }
`
const F_line_shader = `
    precision highp float;
    uniform sampler2D u_sampler_screen;
    uniform float u_width;
    uniform float u_height;
    uniform float u_lineLen;
    uniform float u_r;
    uniform float u_threshold;

    varying vec2 v_pos;
    varying vec2 v_ori_pos;

    float K(float t){
        float v = 1.0;
        vec2 p = vec2(-u_lineLen / 2.0 + v * t, 0.0);
        vec2 q = vec2(v_ori_pos[0] * u_width / 2.0, v_ori_pos[1] * u_height / 2.0);
        float dis = distance(p, q);
        if (dis < u_r) {
            return exp(-4.0 * (dis / u_r) * (dis / u_r)) - dis / u_r * exp(-4.0);
        }else{
            return 0.0;
        }
    }
    void main(){
        float kernel_factor = u_threshold * 20.0 / u_r;
        float v = 1.0;
        float timeSum = u_lineLen / v;
        float N = 100.0;
        float deltaTime = timeSum / N;
        float C = 0.0;
        for (int i = 0; i < 100; i++) {
            float j = float(i);
            C += deltaTime * K(j * deltaTime) / 6.0 + 4.0 * K(j * deltaTime + deltaTime / 2.0) + K((j + 1.0) * deltaTime); 
        }
        C *= 0.001 * kernel_factor;
        vec4 screen_color = texture2D(u_sampler_screen, v_pos);
        float screen_level = 1.0 - screen_color[0];
        C += screen_level;
        float grey_level = 1.0 - C;
        grey_level = max(grey_level, 0.0);

        gl_FragColor = vec4(grey_level * vec3(1.0, 1.0, 1.0), 1.0);
    }  
`

/*------------------------------------------------------------------------------------*/

const V_draw_shader = `
    precision highp float;
    attribute vec2 a_pos;
    varying vec2 v_pos;
    void main(){
        gl_Position = vec4(2.0 * a_pos - 1.0, 0.0, 1.0);
        v_pos = a_pos;
    }
`

const F_draw_shader = `
    precision highp float;
    uniform sampler2D u_sampler;
    varying vec2 v_pos;
    void main(){
        gl_FragColor = texture2D(u_sampler, v_pos);
    }
`

/*------------------------------------------------------------------------------------*/

const V_color_shader = `
    precision highp float;
    attribute vec2 a_pos;
    varying vec2 v_pos;
    void main() {
        gl_Position = vec4(2.0 * a_pos - 1.0, 0.0, 1.0);
        v_pos = a_pos;
    }
`

const F_color_shader = `
    precision highp float;
    uniform sampler2D u_sampler;
    varying vec2 v_pos;

    float gradient(float min, float max, float level){
        level = level > 1.0 ? 1.0 : level;
        return ((max - min) * level + min);
    }

    float log_gradient(float min, float max, float level){
        float scale = 1.0;
        float log_min = exp(scale * min);
        float log_max = exp(scale * max);
        float log_result = gradient(log_min, log_max, level);
        return log(log_result) / scale;
    }

    float scale(float min, float max, float level) {
        float floors = 5.0;
        int currentFloor = int(100.0 * level) / int(100.0 / floors);
        return min + (max - min) * float(currentFloor) / floors;
    }

    void main() {
        vec4 color = texture2D(u_sampler, v_pos);
        float density = 1.0 - color[0];
        if(density == 0.0){
            gl_FragColor = color;
        }else {
            float r, g, b;
            r = scale(0.94, 0.91, density);
            g = scale(0.94, 0.0, density);
            b = scale(0.44, 0.09, density);
            gl_FragColor = vec4(r, g, b, 1.0);
        }
    }

`

/*------------------------------------------------------------------------------------*/

const V_normal_shader = `
    precision highp float;
    attribute vec2 a_pos;
    uniform float u_width;
    uniform float u_height;
    varying vec2 v_pos;
    varying vec2 v_offset;
    void main() {
        gl_Position = vec4(2.0 * a_pos - 1.0, 0.0, 1.0);
        v_pos = a_pos;
        v_offset = vec2(1.0 / u_width, 1.0 / u_height);
    }
`

const F_normal_shader = `
    precision highp float;
    uniform sampler2D u_sampler;
    varying vec2 v_pos;
    varying vec2 v_offset;
    float get_density(sampler2D tex, vec2 tex_pos) {
        vec4 color = texture2D(tex, tex_pos);
        return 1.0 - color[0];
    }
    void main() {
        float S = get_density(u_sampler, vec2(v_pos[0] + v_offset[0], v_pos[1])) - get_density(u_sampler, vec2(v_pos[0] - v_offset[0], v_pos[1]));
        float T = get_density(u_sampler, vec2(v_pos[0], v_pos[1] + v_offset[1])) - get_density(u_sampler, vec2(v_pos[0], v_pos[1] - v_offset[1]));
        vec3 normal = cross(vec3(1.0, 0.0, S), vec3(0.0, 1.0, T));
        normal = normal * 0.5 + 0.5;
        gl_FragColor = vec4(normal, 1.0);
    }
`
/*------------------------------------------------------------------------------------*/
const V_kernel_shader = `
    precision highp float;
    attribute vec2 a_pos;
    varying vec2 v_pos;
    void main(){
        gl_Position = vec4(2.0 * a_pos - 1.0, 0.0, 1.0);
        v_pos = a_pos;
    }
`

const F_kernel_shader = `
    precision highp float;
    uniform sampler2D u_sampler_screen1;
    uniform sampler2D u_sampler_screen2;
    varying vec2 v_pos;
    void main(){
        float level1 = 1.0 - texture2D(u_sampler_screen1, v_pos)[0];
        float level2 = 1.0 - texture2D(u_sampler_screen2, v_pos)[0];
        float level = level1 + level2;
        level = 1.0 - level;
        gl_FragColor = vec4(level * vec3(1.0, 1.0, 1.0), 1.0);
    }
`

/*------------------------------------------------------------------------------------*/

const V_result_shader = `
    precision highp float;
    attribute vec2 a_pos;
    varying vec2 v_pos;
    void main() {
        gl_Position = vec4(2.0 * a_pos - 1.0, 0.0, 1.0);
        v_pos = a_pos;
    }
`

const F_result_shader = `
    precision highp float;
    uniform sampler2D u_sampler_screen;
    uniform sampler2D u_sampler_color;
    uniform sampler2D u_sampler_normal;
    uniform float u_ambientFactor;
    uniform vec3 u_lightDirection;
    varying vec2 v_pos;
    void main() {
        vec4 color = texture2D(u_sampler_color, v_pos);
        vec3 normal = normalize(texture2D(u_sampler_normal, v_pos).rgb * 2.0 - 1.0);
        vec3 eyePos = normalize(vec3(0.0, 0.0, 1.0));
        vec3 lightDirection = normalize(u_lightDirection);
        float height = 1.0 - texture2D(u_sampler_screen, v_pos)[0];

        float cos = max(dot(lightDirection, normal), 0.0);
        vec3 diffuse = vec3(1.0, 1.0, 1.0) * vec3(color) * cos;
        vec3 ambient = vec3(1.0, 1.0, 1.0) * u_ambientFactor;

        vec3 light = diffuse + ambient;
        if(color[0] == 1.0){
            gl_FragColor = color;
        }else{
            gl_FragColor = vec4(light, 1.0);
        }
    }
`

/*------------------------------------------------------------------------------------*/
