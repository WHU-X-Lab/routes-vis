class Controller {
    constructor(app, zoom, offsetX, offsetY) {
        this.app = app
        this.zoom = zoom
        this.offsetX = offsetX
        this.offsetY = offsetY

        this.scaleFactor = 1.2
        this.startCoord = []
        this.endCoord = []

        this.initEvents()
    }
    transferCoord(coord) {
        return [
            coord[0] * this.zoom + this.offsetX,
            coord[1] * this.zoom + this.offsetY,
        ]
    }

    initEvents() {
        let container = document.getElementById("canvas")
        let vm = this
        container.addEventListener("wheel", function (event) {
            let canvasWidth = gl.canvas.width / 2
            let canvasHeight = gl.canvas.height / 2
            vm.zoom *=
                event.wheelDelta > 0 ? vm.scaleFactor : 1 / vm.scaleFactor

            // vm.offsetX -= (event.offsetX / canvasWidth - 0.5) * vm.zoom
            // vm.offsetY -= (0.5 - event.offsetY / canvasHeight) * vm.zoom

            clearGL(gl)
            vm.app.transferCoord()
            vm.app.drawScreen()
        })
        container.addEventListener("mousedown", function (event) {
            vm.startCoord = [event.clientX, event.clientY]
        })
        container.addEventListener("mouseup", function (event) {
            vm.endCoord = [event.clientX, event.clientY]

            let canvasWidth = gl.canvas.width
            let canvasHeight = gl.canvas.height

            vm.offsetX +=
                (2 * (vm.endCoord[0] - vm.startCoord[0])) / canvasWidth
            vm.offsetY +=
                (2 * (vm.startCoord[1] - vm.endCoord[1])) / canvasHeight
            clearGL(gl)
            vm.app.transferCoord()
            vm.app.drawScreen()
        })
    }
}

var App = function () {
    this.r = 20
    this.trackNum = 5
    this.trackLen = 5
    this.threshold = 1
    this.useTexture = true

    this.rndData = false
    this.showClr = false
    this.showShading = false
    this.showKernel = false
    this.showResult = true

    this.lightDirectionX = 0.6
    this.lightDirectionY = 0.0
    this.lightDirectionZ = 0.5
    this.ambientFactor = 0.1

    this.controller = new Controller(this, 1, 0.97, -0.58)

    this.enableBuffer = gl.framebuffer.enable
    this.disableBuffer = gl.framebuffer.disable
    this.framebuffer = gl.framebuffer
    this.quadBuffer = gl.quadBuffer

    this.initProgram()
    this.initBuffer()
    this.readData()
}
App.prototype.initProgram = function () {
    this.pt_program = createProgram(gl, V_pt_shader, F_pt_shader)
    this.line_program = createProgram(gl, V_line_shader, F_line_shader)
    this.line_program2 = createProgram(gl, V_line_shader, F_line_shader)
    this.draw_program = createProgram(gl, V_draw_shader, F_draw_shader)
    this.color_program = createProgram(gl, V_color_shader, F_color_shader)
    this.shading_program = createProgram(gl, V_normal_shader, F_normal_shader)
    this.kernel_program = createProgram(gl, V_kernel_shader, F_kernel_shader)
    this.result_program = createProgram(gl, V_result_shader, F_result_shader)
}
App.prototype.initBuffer = function () {
    // 两个密度纹理（用两个来实现帧缓冲）
    this.screenTexture = createQuadTexture(gl)
    this.backgroundTexture = createQuadTexture(gl)
    // 两个更细的密度纹理
    this.screenTexture2 = createQuadTexture(gl)
    this.backgroundTexture2 = createQuadTexture(gl)
    // 颜色纹理
    this.colorTexture = createQuadTexture(gl)
    // 阴影纹理
    this.normalTexture = createQuadTexture(gl)
    // 最后绘制到屏幕上的纹理
    this.resultTexture = createQuadTexture(gl)
    // 绑定纹理单元
    bindTexture(gl, this.screenTexture, 0) // <screenTexture>     -> texture0
    bindTexture(gl, this.backgroundTexture, 1) // <backgroundTexture> -> texture1
    bindTexture(gl, this.colorTexture, 2) // <colorTexture>      -> texture2
    bindTexture(gl, this.normalTexture, 3) // <normalTexture>     -> texture3
    bindTexture(gl, this.resultTexture, 4) // <resultTexture>     -> texture4
    bindTexture(gl, this.screenTexture2, 5) // <screenTexture2>     -> texture5
    bindTexture(gl, this.backgroundTexture2, 6) // <backgroundTexture2>     -> texture6
}
App.prototype.initLight = function () {
    this.lightDirection = new Vector3([
        this.lightDirectionX,
        this.lightDirectionY,
        this.lightDirectionZ,
    ])
    this.lightDirection.normalize()
}
App.prototype.readData = function () {
    this.tracks = []
    this.oriTracks = []
    if (this.rndData) {
        var trackNum = this.trackNum
        var trackLen = this.trackLen
        for (var i = 0; i < trackNum; i++) {
            var track = []
            for (var j = 0; j < getRnd(1, trackLen); j++) {
                let coord = [getRnd(-1, 1), getRnd(-1, 1)]
                track.push(coord)
            }
            this.tracks.push(track)
        }
        console.log(this.tracks)
        this.oriTracks = this.tracks
    } else {
        let vm = this
        axios
            .get("./assets/flights.json")
            .then(({ data }) => {
                // for (let i = 0; i < data.data.length; i += 2) {
                //     vm.tracks.push([
                //         [data.data[i].LON / 180, data.data[i].LAT / 90],
                //         [data.data[i + 1].LON / 180, data.data[i + 1].LAT / 90],
                //     ])
                // }
                function getAirportCoord(idx) {
                    return [data.airports[idx][3], data.airports[idx][4]]
                }
                vm.oriTracks = vm.tracks = data.routes
                    .slice(0, 100)
                    .map(function (airline) {
                        return [
                            transCoord(getAirportCoord(airline[1])),
                            transCoord(getAirportCoord(airline[2])),
                        ]
                    })
                // vm.tracks = data.data.map(item => [
                //     item.LON / 180,
                //     item.LAT / 90
                // ])
                // vm.tracks = data.data.geometries.map(geo => [
                //     transCoord(geo.coordinates[0][1]),
                //     transCoord(geo.coordinates[0][2])
                // ])
                vm.transferCoord()
            })
            .catch((err) => console.log(err))

        function transCoord(coord) {
            return [coord[0] / 180, coord[1] / 90]
        }
    }

    function getRnd(min, max) {
        return Math.random() * (max - min) + min
    }
}
App.prototype.transferCoord = function () {
    console.log(this.oriTracks)
    let controller = this.controller
    this.tracks = this.oriTracks.map((track) => {
        return track.map((coord) => {
            return controller.transferCoord(coord)
        })
    })
    let a = 0
}
App.prototype.drawPoints = function () {
    for (var i = 0; i < this.tracks.length; i++) {
        for (var j = 0; j < this.tracks[i].length - 1; j++) {
            this.drawPoint(this.tracks[i][j], this.tracks[i][j + 1])
        }
    }
}
App.prototype.drawPoint = function (pt1, pt2) {
    gl.useProgram(this.pt_program.program)
    var vBuffer = createBuffer(
        gl,
        new Float32Array([pt1[0], pt1[1], pt2[0], pt2[1]])
    )
    bindAttribute(gl, vBuffer, this.pt_program.a_pos, 2)
    gl.drawArrays(gl.LINES, 0, 2)
    gl.drawArrays(gl.POINTS, 0, 2)
}
App.prototype.drawScreen = function () {
    this.drawLines()
    this.initLight()

    if (this.useTexture) {
        /* 将两层密度纹理叠加起来 */
        program = this.kernel_program
        gl.useProgram(program.program)
        bindAttribute(gl, this.quadBuffer, program.a_tex_pos, 2)
        gl.uniform1i(program.u_sampler_screen1, 1) // backgroundTexture
        gl.uniform1i(program.u_sampler_screen2, 5) // screenTexture2

        this.enableBuffer(this.screenTexture)
        gl.drawArrays(gl.TRIANGLES, 0, 6)
        this.disableBuffer()

        /* 将密度图绘制成颜色图  */
        if (this.showClr || this.showResult) {
            program = this.color_program
            gl.useProgram(program.program)
            bindAttribute(gl, this.quadBuffer, program.a_tex_pos, 2)
            gl.uniform1i(program.u_sampler, 0) // texture0 --> screenTexture

            this.enableBuffer(this.colorTexture)
            gl.drawArrays(gl.TRIANGLES, 0, 6)
            this.disableBuffer()
        }

        /* 将密度图绘制成法线图  */
        if (this.showShading || this.showResult) {
            program = this.shading_program
            gl.useProgram(program.program)
            bindAttribute(gl, this.quadBuffer, program.a_tex_pos, 2)
            gl.uniform1f(program.u_width, gl.canvas.width)
            gl.uniform1f(program.u_height, gl.canvas.height)
            gl.uniform1i(program.u_sampler, 0) // texture0 --> screenTexture

            this.enableBuffer(this.normalTexture)
            gl.drawArrays(gl.TRIANGLES, 0, 6)
            this.disableBuffer()
        }

        /* 根据颜色和法线绘制出最终的效果 */
        if (this.showResult) {
            program = this.result_program
            gl.useProgram(program.program)
            bindAttribute(gl, this.quadBuffer, program.a_tex_pos, 2)
            gl.uniform3fv(
                program.u_lightDirection,
                this.lightDirection.elements
            )
            gl.uniform1i(program.u_sampler_screen, 0) // texture0 --> screenTexture
            gl.uniform1i(program.u_sampler_color, 2) // texture2 --> colorTexture
            gl.uniform1i(program.u_sampler_normal, 3) // texture3 --> normalTexture
            gl.uniform1f(program.u_ambientFactor, this.ambientFactor)

            this.enableBuffer(this.resultTexture)
            gl.drawArrays(gl.TRIANGLES, 0, 6)
            this.disableBuffer()
        }

        // 根据配置项决定最终在屏幕上呈现哪项纹理
        var textureIndex = 0 // 0 -> <screenTexture>

        if (this.showClr) {
            textureIndex = 2 // 2 -> <colorTexture>
        }
        if (this.showShading) {
            textureIndex = 3 // 3 -> <normalTexture>
        }
        if (this.showResult) {
            textureIndex = 4 // 4 -> <resultTexture>
        }
        if (this.showKernel) {
            textureIndex = 5 // 5 -> <screenTexture2>
        }
        this.drawTexture(textureIndex)

        // 去除绘制残留
        clearTexture(gl, this.screenTexture)
        clearTexture(gl, this.backgroundTexture)
        clearTexture(gl, this.screenTexture2)
        clearTexture(gl, this.backgroundTexture2)
        clearTexture(gl, this.colorTexture)
    }
}
App.prototype.drawLines = function () {
    for (var i = 0; i < this.tracks.length; i++) {
        for (var j = 0; j < this.tracks[i].length - 1; j++) {
            this.drawLine(this.tracks[i][j], this.tracks[i][j + 1])
        }
    }
}
App.prototype.drawLine = function (pt1, pt2) {
    function toRealCoord(pt) {
        let width = gl.canvas.width
        let height = gl.canvas.height
        return [(pt[0] * width) / 2, (pt[1] * height) / 2]
    }
    function length(vec) {
        return Math.sqrt(vec[0] * vec[0] + vec[1] * vec[1])
    }
    var cWidth = gl.canvas.width
    var cHeight = gl.canvas.height
    var xyScale = cWidth / cHeight // this parameter is for fixing the webGL's coord bug
    var real_pt1 = toRealCoord(pt1)
    var real_pt2 = toRealCoord(pt2)
    var dis_x = real_pt2[0] - real_pt1[0]
    var dis_y = real_pt2[1] - real_pt1[1]
    var dis = length([dis_x, dis_y])
    var angle = (Math.atan(dis_y / dis_x) * 180.0) / 3.1415926
    var width = Math.floor(dis + 2 * this.r)
    var height = Math.floor(2 * this.r)
    var offset = length([pt1[0] - pt2[0], pt1[1] - pt2[1]])
    var scale_x = offset / (dis / width) / 2.0
    var scale_y = (this.r * offset) / dis / 1.0

    // set Transform Matrix (from <Texture> coord to <Screen> coord)
    var mat = new Matrix4()
    mat.setScale(1.0, xyScale, 1.0)
    mat.translate((pt1[0] + pt2[0]) / 2.0, (pt1[1] + pt2[1]) / 2.0, 0.0)
    mat.rotate(angle, 0.0, 0.0, 1.0)
    mat.scale(scale_x, scale_y, 1.0)

    var program = this.line_program
    gl.useProgram(program.program)
    bindAttribute(gl, this.quadBuffer, program.a_pos, 2)
    gl.uniform1f(program.u_width, width)
    gl.uniform1f(program.u_height, height)
    gl.uniformMatrix4fv(program.u_matrix, false, mat.elements)
    gl.uniform1f(program.u_lineLen, dis)
    gl.uniform1f(program.u_r, this.r)
    gl.uniform1i(program.u_sampler_screen, 1)
    gl.uniform1f(program.u_threshold, this.threshold)

    if (this.useTexture) {
        // 启用帧缓冲(这样接下来的的绘制操作都是在temptexture中进行而不是屏幕)
        this.enableBuffer(this.screenTexture)
    }

    // 绘制
    gl.drawArrays(gl.TRIANGLES, 0, 6)

    if (this.useTexture) {
        // 关闭帧缓冲
        this.disableBuffer()

        // 将screenTexture复制给backgroundTexture (js都是浅层复制，只能这么做)
        this.enableBuffer(this.backgroundTexture)
        this.drawTexture(0) // 绘制 0 号纹理
        this.disableBuffer()
    }

    // 绘制另一个更细的线纹理
    program = this.line_program2
    gl.useProgram(program.program)
    bindAttribute(gl, this.quadBuffer, program.a_pos, 2)
    gl.uniform1f(program.u_width, width)
    gl.uniform1f(program.u_height, height)
    gl.uniformMatrix4fv(program.u_matrix, false, mat.elements)
    gl.uniform1f(program.u_lineLen, dis)
    gl.uniform1f(program.u_r, this.r / 5.0)
    gl.uniform1i(program.u_sampler_screen, 6)
    gl.uniform1f(program.u_threshold, this.threshold)

    if (this.useTexture) {
        // 启用帧缓冲(这样接下来的的绘制操作都是在screenTexture2中进行而不是屏幕)
        this.enableBuffer(this.screenTexture2)
    }

    // 绘制
    gl.drawArrays(gl.TRIANGLES, 0, 6)

    if (this.useTexture) {
        // 关闭帧缓冲
        this.disableBuffer()

        // 将screenTexture2复制给backgroundTexture2 (js都是浅层复制，只能这么做)
        this.enableBuffer(this.backgroundTexture2)
        this.drawTexture(5) // 绘制 5 号纹理
        this.disableBuffer()
    }
}
// 将给定纹理绘制到屏幕上（或当前缓冲区内）
App.prototype.drawTexture = function (inputTextureIndex) {
    // console.log("draw texture" + inputTextureIndex)
    var program = this.draw_program
    gl.useProgram(program.program)
    bindAttribute(gl, this.quadBuffer, program.a_tex_pos, 2)
    gl.uniform1i(program.u_sampler, inputTextureIndex)

    gl.drawArrays(gl.TRIANGLES, 0, 6)
}
