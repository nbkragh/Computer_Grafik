window.onload = function () {
    var gl;
    var play = true;
    var movingLight = true;
    var Cam1 = false;
    var g_objDoc = null;      // Info parsed from OBJ 
    var g_drawingInfo = null; // Info for drawing the 3D model with WebGL
    var shadowBuffer;
    var groundVertices;
    var clearColor;
    var Mvalues;
    var Vvalues;
    var Pvalues;
    var lightVvalues;
    var lightPvalues;

    init()


    initModel(gl, "../../model/teapot.obj", 1);
    initGroundVertexBuffer();
    initGroundTextures();



    ///////////////////////////////////////////////////////
    //diffuse reflection coefficient 
    gl.useProgram(gl.object_program);
    Kd = 0.5;
    gl.uniform1f(gl.getUniformLocation(gl.object_program, "Kd"), Kd);

    //ambient
    Ka = 0.5;
    gl.uniform1f(gl.getUniformLocation(gl.object_program, "Ka"), Ka);

    //highlight
    Ks = 0.5;
    gl.uniform1f(gl.getUniformLocation(gl.object_program, "Ks"), Ks);

    s = 50.0;
    gl.uniform1f(gl.getUniformLocation(gl.object_program, "s"), s);
    // le
    var lightPositionValue;

    // gl.uniform4fv(gl.getUniformLocation(gl.object_program, "Light_Position"), flatten(lightPositionValue));

    lightEmission = vec4(1, 1.0, 1.0, 1.0);
    gl.uniform4fv(gl.getUniformLocation(gl.object_program, "Light_Emis"), flatten(lightEmission));

    ///////////////////////////////////////////////////////
    var teaPotPos = vec3(0.0, -1, -3.0);
    var r = 2;
    var a = 0.00;
    var b = 0.00;

    var fbo = initFramebufferObject(gl, 512, 512);
    console.log(fbo)
    tick();
    function tick() {
        if (play) {
            a += 0.02;
        }
        Mvalues = mat4();
        Mvalues = mult(Mvalues, translate(vec3(teaPotPos[0], -1 * Math.cos(a), teaPotPos[2])));
        Mvalues = mult(Mvalues, scalem(vec3(0.25, 0.25, 0.25)));

        if (movingLight) {
            b += 0.025;
        }
        lightPositionValue = vec4((r * Math.sin(b)), 2.5, -3 + (-r * Math.cos(b)), 1);
        Vvalues = lookAt(vec3(0.0, 1.0, 0.0), vec3(0.0, 1.0, -1.0), vec3(0.0, 1.0, 0.0));
        Pvalues = perspective(90.0, 1.0, 0.1, 50.0)


        eye = vec3(lightPositionValue[0], lightPositionValue[1], lightPositionValue[2]);
        lightVvalues = lookAt(eye, vec3(0.0, -1, -3), vec3(0.0, 1.0, 0.0));
        lightPvalues = perspective(86.0, 1.0, 0.1, 50.0);

        if (Cam1) {
            Vvalues = lightVvalues;
            Pvalues = lightPvalues;
        }

        render()
        requestAnimFrame(tick);
    }

    function render() {
        if (!g_drawingInfo && g_objDoc && g_objDoc.isMTLComplete) {
            g_drawingInfo = onReadComplete(gl, g_objDoc);

        }
        if (!g_drawingInfo) { return }


        // RENDER to FBO ////////////////////////////////////
        gl.useProgram(gl.shadow_program);
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.viewport(0, 0, fbo.width, fbo.height);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, fbo.texture);

        initAttributeVariable(gl, gl.getAttribLocation(gl.shadow_program, "a_Position"), gl.object_program.teapotVertexBuffer);


        gl.uniformMatrix4fv(gl.getUniformLocation(gl.shadow_program, "M"), false, flatten(Mvalues));
        gl.uniformMatrix4fv(gl.getUniformLocation(gl.shadow_program, "V"), false, flatten(lightVvalues));
        gl.uniformMatrix4fv(gl.getUniformLocation(gl.shadow_program, "P"), false, flatten(lightPvalues));

        gl.drawElements(gl.TRIANGLE_STRIP, g_drawingInfo.indices.length, gl.UNSIGNED_SHORT, 0)


        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        ///////////////////////////// RENDER OBJECTS ////////////////////////////////////

        gl.useProgram(gl.object_program);


        gl.bindTexture(gl.TEXTURE_2D, fbo.texture);

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.viewport(0, 0, canvas.width, canvas.height);

        gl.uniformMatrix4fv(gl.getUniformLocation(gl.object_program, "M"), false, flatten(mat4()));
        gl.uniformMatrix4fv(gl.getUniformLocation(gl.object_program, "V"), false, flatten(Vvalues));
        gl.uniformMatrix4fv(gl.getUniformLocation(gl.object_program, "P"), false, flatten(Pvalues));
        lightVPvalues = mult(lightPvalues, lightVvalues);
        gl.uniformMatrix4fv(gl.getUniformLocation(gl.object_program, "lightVP"), false, flatten(lightVPvalues));

        // RENDER GROUND ////////////////////////////////////
        initAttributeVariable(gl, gl.object_program.vertexPosition, gl.object_program.groundVertexBuffer);
        initAttributeVariable(gl, gl.object_program.groundTextureCoords, gl.object_program.coorBuffer);
        gl.uniform1f(gl.getUniformLocation(gl.object_program, "drawTeapot"), 0.0);

        gl.uniform1i(gl.getUniformLocation(gl.object_program, "texMap0"), 0);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, groundVertices.length);

        // TEAPOT //////////////////////////////////////////////////
        initAttributeVariable(gl, gl.object_program.vertexPosition, gl.object_program.teapotVertexBuffer);
        initAttributeVariable(gl, gl.object_program.vertexNormal, gl.object_program.normalBuffer);
        gl.uniform4fv(gl.getUniformLocation(gl.object_program, "Light_Position"), flatten(lightPositionValue));

        gl.uniformMatrix4fv(gl.getUniformLocation(gl.object_program, "M"), false, flatten(Mvalues));
        gl.uniform1f(gl.getUniformLocation(gl.object_program, "drawTeapot"), 1.0);
        gl.drawElements(gl.TRIANGLES, g_drawingInfo.indices.length, gl.UNSIGNED_SHORT, 0)
    }

    function initAttributeVariable(gl, a_attribute, buffer) {
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.vertexAttribPointer(a_attribute, buffer.num, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_attribute);
    }

    function initFramebufferObject(gl, width, height) {
        var framebuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
        var renderbuffer = gl.createRenderbuffer();
        gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);
        var shadowMap = gl.createTexture();
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, shadowMap);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        framebuffer.texture = shadowMap;
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, shadowMap, 0);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderbuffer);
        var status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
        if (status !== gl.FRAMEBUFFER_COMPLETE) {
            console.log('Framebuffer object is incomplete: ' + status.toString());
        }
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.bindRenderbuffer(gl.RENDERBUFFER, null);
        framebuffer.width = width;
        framebuffer.height = height;
        return framebuffer;
    }

    ////////////////////////////////////////////////////INIT////////////////////////////////////////////////////////////////////

    ////////////////////////////MODEL/////////////////////////////////////
    function initModel(gl, obj_filename, scale) {
        gl.object_program.vertexPosition = gl.getAttribLocation(gl.object_program, "a_Position");
        gl.object_program.vertexNormal = gl.getAttribLocation(gl.object_program, "a_Normal");

        gl.object_program.teapotVertexBuffer = gl.createBuffer();
        gl.object_program.teapotVertexBuffer.num = 3
        gl.object_program.normalBuffer = gl.createBuffer();
        gl.object_program.normalBuffer.num = 3
        gl.object_program.indexBuffer = gl.createBuffer();

        readOBJFile(obj_filename, scale, true);

        function readOBJFile(fileName, scale, reverse) {
            var request = new XMLHttpRequest();
            request.onreadystatechange = function () {
                if (request.readyState === 4 && request.status !== 404) {
                    onReadOBJFile(request.responseText, fileName, scale, reverse);
                }
            }
            request.open('GET', fileName, true);

            request.send();
        }
        function onReadOBJFile(fileString, fileName, scale, reverse) {
            var objDoc = new OBJDoc(fileName);
            var result = objDoc.parse(fileString, scale, reverse);
            if (!result) {
                g_objDoc = null; g_drawingInfo = null;
                console.log("OBJ file parsing error.");
                return;
            }
            g_objDoc = objDoc;
        }
    }
    function onReadComplete(gl, g_objDoc) {

        var drawingInfo = g_objDoc.getDrawingInfo();
        gl.bindBuffer(gl.ARRAY_BUFFER, gl.object_program.teapotVertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.vertices, gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, gl.object_program.normalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.normals, gl.STATIC_DRAW);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.object_program.indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, drawingInfo.indices, gl.STATIC_DRAW);

        return drawingInfo;
    }

    ////////////////////////////GROUND/////////////////////////////////////
    function initGroundTextures() {
        gl.useProgram(gl.object_program);
        //opretter en texture fra billedet xamp23.png
        var image = document.createElement('img');
        image.crossorigin = 'anonymous';
        image.src = '../../img/xamp23.png';
        image.onload = function () {
            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
            gl.generateMipmap(gl.TEXTURE_2D);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.uniform1i(gl.getUniformLocation(gl.object_program, "texMap1"), 1);
        };
    }
    function initGroundVertexBuffer() {
        gl.useProgram(gl.object_program);

        groundVertices = [vec3(-2.0, -1.0, -1.0), vec3(2.0, -1.0, -1.0), vec3(-2.0, -1.0, -5.0), vec3(2.0, -1.0, -5.0)];
        gl.object_program.groundVertexBuffer = gl.createBuffer();
        gl.object_program.groundVertexBuffer.num = 3;
        gl.bindBuffer(gl.ARRAY_BUFFER, gl.object_program.groundVertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(groundVertices), gl.STATIC_DRAW);

        //mapper texturekoordinaterne til vertices
        var textureCoordsMapping = [vec2(0, 0), vec2(0, 1), vec2(1, 1), vec2(1, 0)];
        //var textureCoordsMapping = [vec2(-300, 300), vec2(-300, -300), vec2(300, -300), vec2(300, 300)];
        gl.object_program.coorBuffer = gl.createBuffer();
        gl.object_program.coorBuffer.num = 2;

        gl.object_program.groundTextureCoords = gl.getAttribLocation(gl.object_program, "textureCoords");

        gl.bindBuffer(gl.ARRAY_BUFFER, gl.object_program.coorBuffer)

        // gl.vertexAttribPointer(textureCoords, 2, gl.FLOAT, false, 0, 0);
        // gl.enableVertexAttribArray(textureCoords);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(textureCoordsMapping), gl.STATIC_DRAW);

        //gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(textureCoordsMapping));
        //gl.bufferSubData(gl.ARRAY_BUFFER, sizeof['vec2']*(textureCoordsMapping), flatten(g_drawingInfo.vertices));


    }

    ////////////////////////////FIELDS/////////////////////////////////////
    function init() {
        gl;
        canvas = document.getElementById("c");
        gl = canvas.getContext("webgl", { preserveDrawingBuffer: true, alpha: false });
        if (!gl) {
            console.log("no gl : " + gl)
        }
        gl.object_program = initShaders(gl, "object-vertex-shader", "object-fragment-shader");
        gl.shadow_program = initShaders(gl, "shadow-vertex-shader", "shadow-fragment-shader");


        Mvalues = mat4();
        Vvalues = mat4();
        Pvalues = mat4();



        clearColor = vec4(1.0, 1.0, 1.0, 1.0)
        gl.clearColor(...clearColor);

        //bruger gl.DEPTH_BUFFER_BIT
        gl.enable(gl.DEPTH_TEST);

        gl.disable(gl.CULL_FACE);
        gl.frontFace(gl.CW);
        document.getElementById("pauseTeapot").addEventListener("click", function () {
            play = !play;
        })
        document.getElementById("pauseLight").addEventListener("click", function () {
            movingLight = !movingLight;
        })
        document.getElementById("changeCam").addEventListener("click", function () {
            Cam1 = !Cam1;
        })

    }
}