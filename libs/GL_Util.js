/**
 * @author: prozac <516060659@qq.com>
 * @createTime: 2018-4-2
 * @copyRight: UNDEFINED
 * @discription: A set of useful funcs for webGL-based development. Unlike some handy libs
 * like three.js <https://threejs.org/> or phaser <http://www.phaserengine.com/>, webGL's
 * original funcs are quite complicated and unfriendly for newbies.So here i select some
 * commom funcs to form this simple lib.
 * P.S. If possible, following methods need to be packaged into one GLOBAL variable
 * like GL or sth else, i'm just tired of doing so XD
 */

/*------------------------------------------------------------------------------------*/

/**
 * create shader
 * @method createShader
 * @param  {context}    gl    core handle of webGL
 * @param  {string}     type   [gl.VERTEX_SHADER || gl.FRAGMENT_SHADER]
 * @param  {string}     source shader source code
 * @return {shader}
 */
function createShader(gl, type, source) {
    var shader = gl.createShader(type)
    gl.shaderSource(shader, source)

    gl.compileShader(shader)
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        throw new Error(gl.getShaderInfoLog(shader))
    }

    return shader
}

/*------------------------------------------------------------------------------------*/

/**
 * create program
 * @method createProgram
 * @param  {context}     gl             core handle of webGL
 * @param  {string}      vertexSource   code of vertex shader
 * @param  {shader}      fragmentSource code of fragment shader
 * @return {program}                    include a wrapper which is easy to set attribute of a program
 */
function createProgram(gl, vertexSource, fragmentSource) {
    var program = gl.createProgram()

    var vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexSource)
    var fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource)

    gl.attachShader(program, vertexShader)
    gl.attachShader(program, fragmentShader)

    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error(gl.getProgramInfoLog(program))
    }

    var wrapper = { program: program }

    var numAttributes = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES)
    for (var i = 0; i < numAttributes; i++) {
        var attribute = gl.getActiveAttrib(program, i)
        wrapper[attribute.name] = gl.getAttribLocation(program, attribute.name)
    }
    var numUniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS)
    for (var i$1 = 0; i$1 < numUniforms; i$1++) {
        var uniform = gl.getActiveUniform(program, i$1)
        wrapper[uniform.name] = gl.getUniformLocation(program, uniform.name)
    }

    return wrapper
}

/*------------------------------------------------------------------------------------*/

/**
 * create texture
 * @method createTexture
 * @param  {context}            gl     core handle of webGL
 * @param  {string}             filter determine how to fill when zoom in or zoom out texture -> gl.LINERAR || gl.NEAREST
 * @param  {image || array}     data   input data for texture
 * @param  {int}                width  [optional] width of texture for array-type data rather than image-type
 * @param  {int}                height [optional] height of texture for array-type data rather than image-type
 * @return {texture}
 */
function createTexture(gl, filter, data, width, height) {
    var texture = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, texture)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter)
    if (data instanceof Uint8Array) {
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            width,
            height,
            0,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            data
        )
    } else {
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            data
        )
    }
    gl.bindTexture(gl.TEXTURE_2D, null)
    return texture
}

/*------------------------------------------------------------------------------------*/

/**
 * bind texture to target index
 * @method bindTexture
 * @param  {context}    gl      core handle of webGL
 * @param  {texture}    texture target texture
 * @param  {int}        unit    target index of texture
 */
function bindTexture(gl, texture, unit) {
    gl.activeTexture(gl.TEXTURE0 + unit)
    gl.bindTexture(gl.TEXTURE_2D, texture)
}

/*------------------------------------------------------------------------------------*/

/**
 * Bind Attribute
 * @method bindAttribute
 * @param  {context}     gl            core handle of webGL
 * @param  {buffer}      buffer        framebuffer
 * @param  {attribute}   attribute     target attribute
 * @param  {int}         numComponents num of attributes to put in a period
 */
function bindAttribute(gl, buffer, attribute, numComponents) {
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.enableVertexAttribArray(attribute)
    gl.vertexAttribPointer(attribute, numComponents, gl.FLOAT, false, 0, 0)
}

/*------------------------------------------------------------------------------------*/

/**
 * create buffer
 * @method createBuffer
 * @param  {context}     gl   core handle of webGL
 * @param  {array}       data datasets which are to put in the buffer
 * @return {buffer}
 */
function createBuffer(gl, data) {
    var buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW)
    return buffer
}

/*------------------------------------------------------------------------------------*/

/**
 * bind framebuffer to texture
 * @method bindFramebuffer
 * @param  {context}       gl           core handle of webGL
 * @param  {buffer}        framebuffer  buffer plays a role of exchange-box
 * @param  {texture}       texture      output of the buffer
 */
function bindFramebuffer(gl, framebuffer, texture) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer)
    if (texture) {
        gl.framebufferTexture2D(
            gl.FRAMEBUFFER,
            gl.COLOR_ATTACHMENT0,
            gl.TEXTURE_2D,
            texture,
            0
        )
    }
}

/*------------------------------------------------------------------------------------*/

/**
 * fix Retina resolution bug(for its screen resolution is 2 while normal's is 1)
 * @method fixRetina
 * @param  {canvas}  canvas target canvas
 */
function fixRetina(canvas) {
    var pxRatio = Math.max(Math.floor(window.devicePixelRatio) || 1, 2)
    var ratio = pxRatio
    canvas.width = canvas.clientWidth * ratio
    canvas.height = canvas.clientHeight * ratio
}

/*------------------------------------------------------------------------------------*/

/**
 * enable canvas to auto resize when window resize
 * @method enableWindowResize
 * @param  {[type]}           window [description]
 * @return {[type]}                  [description]
 */
function enableWindowResize(window) {
    // to be filled...
}

/*------------------------------------------------------------------------------------*/

/**
 * set GL's some common useful funcs
 * @param {context} gl     core handle of webgl
 */
function setDefaultAssets(gl) {
    gl.framebuffer = gl.createFramebuffer()
    gl.quadBuffer = createBuffer(
        gl,
        new Float32Array([0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1])
    )
    gl.framebuffer.enable = function(outputTexture) {
        if (typeof outputTexture == "undefined") {
            console.log("Please input a texture for the output of framebuffer!")
            return
        }
        bindFramebuffer(gl, gl.framebuffer, outputTexture)
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)
    }
    gl.framebuffer.disable = function() {
        bindFramebuffer(gl, null)
    }
}

/*------------------------------------------------------------------------------------*/

/**
 * create a quad texture(usually screen-type)
 * @param {context} gl     core handle of webgl
 * @param  {int} width      texture's width   [Default: window'width]
 * @param  {int} height     texture's height  [Default: window's height]
 * @return {texture}        the quad texture
 */
function createQuadTexture(gl, width, height) {
    var w = width || gl.canvas.width
    var h = height || gl.canvas.height

    var num = w * h
    var emptyPixels = new Uint8Array(num * 4)
    for (var i = 0; i < num * 4; i++) {
        emptyPixels[i] = 255
    }

    return createTexture(gl, gl.NEAREST, emptyPixels, w, h)
}

/*------------------------------------------------------------------------------------*/

/**
 * get context of webGL(gl)
 * @method getGL
 * @param  {window}     window global variable
 * @param  {dict}       opt    assets of this webGL program
 * eg.{
 *      fixRetina{boolean}:              [default: true],
 *      windowResize{boolean}:           [default: true],
 *      clear{boolean}:                  [default: true],
 *      preserveDrawingBuffer{boolean}:  [default: false],
 * }
 * @return {gl}                core handle of websGL
 */
function getGL(window, opt) {
    var canvas = (window.canvas = document.getElementById("canvas"))
    if (canvas == null) {
        console.log(
            "Warning: please set your webGL-output canvas's Id as 'canvas'!"
        )
        return
    }
    var option = opt || {}
    var fixretina = option.fixRetina || true
    var windowresize = option.windowResize || true
    var clear = option.clear || true
    var preserveDrawingBuffer = option.preserveDrawingBuffer || false

    var gl = (window.gl = canvas.getContext("webgl", {
        preserveDrawingBuffer: preserveDrawingBuffer
    }))
    gl.canvas = canvas
    if (!gl) {
        console.log("Get GL Failed!")
        return
    }
    if (fixretina) {
        fixRetina(canvas)
    }
    if (windowresize) {
        enableWindowResize(window)
    }
    if (clear) {
        clearGL(gl)
    }

    setDefaultAssets(gl, option)
    gl.viewport(0, 0, canvas.width, canvas.height)
    return gl
}

/*------------------------------------------------------------------------------------*/

/**
 * clear GL's buffer with specified color
 * @method clearGL
 * @param  {context} gl core handle of webGL
 * @param  {float} r    color.r [default: 1.0]
 * @param  {float} g    color.g [default: 1.0]
 * @param  {float} b    color.b [default: 1.0]
 * @param  {float} a    color.a [default: 1.0]
 */
function clearGL(gl, r, g, b, a) {
    var R = r || 1.0
    var G = g || 1.0
    var B = b || 1.0
    var A = a || 1.0
    gl.clearColor(R, G, B, A)
    gl.clear(gl.COLOR_BUFFER_BIT)
}

/*------------------------------------------------------------------------------------*/

/**
 * clear a texture with specified color
 * @param  {context} gl         core handle of webGL
 * @param  {texture} texture    target texture
 * @param  {float}   r          color.r [default: 1.0]
 * @param  {float}   g          color.g [default: 1.0]
 * @param  {float}   b          color.b [default: 1.0]
 * @param  {float}   a          color.a [default: 1.0]
 */
function clearTexture(gl, texture, r, g, b, a) {
    var R = r || 1.0
    var G = g || 1.0
    var B = b || 1.0
    var A = a || 1.0
    gl.framebuffer.enable(texture)
    clearGL(gl, r, g, b, a)
    gl.framebuffer.disable()
}

/*------------------------------------------------------------------------------------*/
