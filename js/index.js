/*------------------------------------------------------------------------------------

    Program:             line_program      ----->  draw_program
                         (绘制线段至纹理)            （绘制至屏幕上）

    Texture:             screenTexture     ---->   backgroundTexture

------------------------------------------------------------------------------------*/
var gl = getGL(window, { preserveDrawingBuffer: true })
app = new App()
initGUI(app)

function initGUI(app) {
    var opt = { drawPt: false, layer: "final" }
    var gui = new dat.GUI()
    redraw = function() {
        clearGL(gl)
        if (opt.drawPt) {
            app.drawPoints()
        } else {
            app.drawScreen()
        }
    }
    redraw()

    gui.add(app, "r", 0, 100)
        .name("r")
        .onChange(redraw)
    gui.add(app, "useTexture")
        .name("使用纹理")
        .onChange(redraw)
    gui.add(app,"threshold", 1, 10).name("颜色阈值").onChange(redraw)
    gui.add(opt, "layer", {
        默认: "default",
        框架: "frame",
        颜色纹理: "color",
        法向纹理: "normal",
        核密度纹理: "kernel",
        最终结果: "final"
    })
        .name("选择图层")
        .onChange(function() {
            if (opt.layer == "frame") {
                opt.drawPt = true
                app.showClr = false
                app.showShading = false
                app.showResult = false
                app.showKernel = false
            } else if (opt.layer == "default") {
                opt.drawPt = false
                app.showClr = false
                app.showShading = false
                app.showResult = false
                app.showKernel = false
            } else if (opt.layer == "color") {
                opt.drawPt = false
                app.showClr = true
                app.showShading = false
                app.showResult = false
                app.showKernel = false
            } else if (opt.layer == "normal") {
                opt.drawPt = false
                app.showClr = false
                app.showShading = true
                app.showResult = false
                app.showKernel = false
            } else if (opt.layer == "kernel") {
                opt.drawPt = false
                app.showClr = false
                app.showShading = false
                app.showResult = false
                app.showKernel = true
            } else if (opt.layer == "final") {
                opt.drawPt = false
                app.showClr = false
                app.showShading = false
                app.showResult = true
                app.showKernel = false
            }
            redraw()
        })

    var dFolder = gui.addFolder("数据设置")
    dFolder.open()
    dFolder
        .add(app, "rndData")
        .name("采用随机数据")
        .onChange(function() {
            app.readData()
            redraw()
        })
    dFolder
        .add(app, "trackLen", 1, 10)
        .step(1)
        .name("轨迹长度")
        .onChange(function() {
            app.readData()
            redraw()
        })
    dFolder
        .add(app, "trackNum", 1, 100)
        .step(1)
        .name("轨迹条数")
        .onChange(function() {
            app.readData()
            redraw()
        })

    var lFolder = gui.addFolder("光照设置")
    lFolder
        .add(app, "lightDirectionX", -5, 5)
        .name("光源位置X")
        .onChange(redraw)
    lFolder
        .add(app, "lightDirectionY", -5, 5)
        .name("光源位置Y")
        .onChange(redraw)
    lFolder
        .add(app, "lightDirectionZ", 0, 1)
        .name("光源位置Z")
        .onChange(redraw)
    lFolder
        .add(app, "ambientFactor", 0, 1)
        .name("环境光系数")
        .onChange(redraw)
}
