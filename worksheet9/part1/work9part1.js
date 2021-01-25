window.onload = function () {
    var gl;
    var play = true;
    var movingLight = true;
    var Cam1 = true;
    var g_objDoc = null;      // Info parsed from OBJ 
    var g_drawingInfo = null; // Info for drawing the 3D model with WebGL
    var shadowBuffer;
    var groundVertices;
    var clearColor;
    var Mvalues;
    var Vvalues;
    var Pvalues;

    init()


    initModel(gl, "../../model/teapot.obj", 1);
    initGroundVertexBuffer();
    initGroundTextures();



    ///////////////////////////////////////////////////////
    //diffuse reflection coefficient 
    gl.useProgram(gl.teapot_program);
    Kd = 0.5;
    gl.uniform1f(gl.getUniformLocation(gl.teapot_program, "Kd"), Kd);

    //ambient
    Ka = 0.5;
    gl.uniform1f(gl.getUniformLocation(gl.teapot_program, "Ka"), Ka);

    //highlight
    Ks = 0.5;
    gl.uniform1f(gl.getUniformLocation(gl.teapot_program, "Ks"), Ks);

    s = 50.0;
    gl.uniform1f(gl.getUniformLocation(gl.teapot_program, "s"), s);
    // le
    var lightPositionValue;

    // gl.uniform4fv(gl.getUniformLocation(gl.teapot_program, "Light_Position"), flatten(lightPositionValue));

    lightEmission = vec4(1, 1.0, 1.0, 1.0);
    gl.uniform4fv(gl.getUniformLocation(gl.teapot_program, "Light_Emis"), flatten(lightEmission));

    ///////////////////////////////////////////////////////
    var teaPotPos = vec3(0.0, -1, -3.0);
    var r = 2;
    var a = 0.00;
    var b = 0.00;
    Pvalues = perspective(90.0, 1.0, 0.1, 50.0)

    tick();
    function tick() {
        if (play) {
            a += 0.02;
            Mvalues = mat4();
            Mvalues = mult(Mvalues, translate(vec3(teaPotPos[0], -1 * Math.cos(a), teaPotPos[2])));
            Mvalues = mult(Mvalues, scalem(vec3(0.25, 0.25, 0.25)));
        }

        if (movingLight) {
            b += 0.025;
            lightPositionValue = vec4((r * Math.sin(b)), 2, -3 + (-r * Math.cos(b)), 1);
        }



        if (!Cam1) {
            eye = vec3(lightPositionValue[0], lightPositionValue[1], lightPositionValue[2]);
            Vvalues = lookAt(eye, vec3(0.0, -1, -3), vec3(0.0, 1.0, 0.0));
        } else {
            Vvalues = lookAt(vec3(0.0, 1.0, 0.0), vec3(0.0, 1.0, -1.0), vec3(0.0, 1.0, 0.0));
        }

        render()
        requestAnimFrame(tick);

    }

    function render() {
        if (!g_drawingInfo && g_objDoc && g_objDoc.isMTLComplete) {
            g_drawingInfo = onReadComplete(gl, g_objDoc);

        }
        if (!g_drawingInfo) { return }

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // RENDER GROUND ////////////////////////////////////
        gl.useProgram(gl.ground_program);


        initAttributeVariable(gl, gl.ground_program.vertexPosition, gl.ground_program.vBuffer);
        initAttributeVariable(gl, gl.ground_program.textureCoords, gl.ground_program.coorBuffer);

        //Mvalues = mat4();
        gl.uniform1f(gl.getUniformLocation(gl.ground_program, "doShadow"), 0.0);
        gl.uniformMatrix4fv(gl.getUniformLocation(gl.ground_program, "M"), false, flatten(mat4()));
        gl.uniformMatrix4fv(gl.getUniformLocation(gl.ground_program, "V"), false, flatten(Vvalues));
        gl.uniformMatrix4fv(gl.getUniformLocation(gl.ground_program, "P"), false, flatten(Pvalues));
        gl.uniform1i(gl.getUniformLocation(gl.ground_program, "texMap"), 0);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, groundVertices.length);


        // RENDER SHADOWS ////////////////////////////////////

        gl.depthFunc(gl.GREATER);
        gl.uniform1f(gl.getUniformLocation(gl.ground_program, "doShadow"), 1.0);
        shadowProjection = mat4(1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, -1.0 / (lightPositionValue[1] + 1.0001), 0, 0);

        let shadowMvalues = mult(translate(vec3(-lightPositionValue[0], -lightPositionValue[1], -lightPositionValue[2])), Mvalues);
        shadowMvalues = mult(shadowProjection, shadowMvalues);
        shadowMvalues = mult(translate(vec3(lightPositionValue[0], lightPositionValue[1], lightPositionValue[2])), shadowMvalues);


        gl.uniformMatrix4fv(gl.getUniformLocation(gl.ground_program, "M"), false, flatten(shadowMvalues));

        initAttributeVariable(gl, gl.ground_program.vertexPosition, shadowBuffer);
        gl.drawElements(gl.TRIANGLES, g_drawingInfo.indices.length, gl.UNSIGNED_SHORT, 0)

        gl.depthFunc(gl.LESS);

        // RENDER TEAPOT ////////////////////////////////////
        gl.useProgram(gl.teapot_program);

        initAttributeVariable(gl, gl.teapot_program.vertexPosition, gl.teapot_program.vertexBuffer);
        initAttributeVariable(gl, gl.teapot_program.vertexNormal, gl.teapot_program.normalBuffer);
        gl.uniform4fv(gl.getUniformLocation(gl.teapot_program, "Light_Position"), flatten(lightPositionValue));
        gl.uniformMatrix4fv(gl.getUniformLocation(gl.teapot_program, "M"), false, flatten(Mvalues));

        gl.uniformMatrix4fv(gl.getUniformLocation(gl.teapot_program, "V"), false, flatten(Vvalues));

        gl.uniformMatrix4fv(gl.getUniformLocation(gl.teapot_program, "P"), false, flatten(Pvalues));

        gl.drawElements(gl.TRIANGLES, g_drawingInfo.indices.length, gl.UNSIGNED_SHORT, 0)


    }

    function initAttributeVariable(gl, a_attribute, buffer) {
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.vertexAttribPointer(a_attribute, buffer.num, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_attribute);
    }


    ////////////////////////////////////////////////////INIT////////////////////////////////////////////////////////////////////

    ////////////////////////////MODEL/////////////////////////////////////
    function initModel(gl, obj_filename, scale) {
        gl.teapot_program.vertexPosition = gl.getAttribLocation(gl.teapot_program, "a_Position");
        gl.teapot_program.vertexNormal = gl.getAttribLocation(gl.teapot_program, "a_Normal");

        gl.teapot_program.vertexBuffer = gl.createBuffer();
        gl.teapot_program.vertexBuffer.num = 3
        gl.teapot_program.normalBuffer = gl.createBuffer();
        gl.teapot_program.normalBuffer.num = 3
        gl.teapot_program.indexBuffer = gl.createBuffer();

        shadowBuffer = gl.createBuffer();
        shadowBuffer.num = 3;

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
        gl.bindBuffer(gl.ARRAY_BUFFER, gl.teapot_program.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.vertices, gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, gl.teapot_program.normalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.normals, gl.STATIC_DRAW);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.teapot_program.indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, drawingInfo.indices, gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, shadowBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.vertices, gl.STATIC_DRAW);

        return drawingInfo;
    }

    ////////////////////////////GROUND/////////////////////////////////////
    function initGroundTextures() {
        gl.useProgram(gl.ground_program);
        //opretter en texture fra billedet xamp23.png
        var image = document.createElement('img');
        image.crossorigin = 'anonymous';
        image.src = '../../img/xamp23.png';
        image.onload = function () {
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
            gl.generateMipmap(gl.TEXTURE_2D);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            //gl.uniform1i(gl.getUniformLocation(gl.ground_program, "texMap"), 0);
        };
    }
    function initGroundVertexBuffer() {
        gl.useProgram(gl.ground_program);
        gl.ground_program.vertexPosition = gl.getAttribLocation(gl.ground_program, "a_Position");
        gl.ground_program.vBuffer = gl.createBuffer();
        gl.ground_program.vBuffer.num = 3;
        gl.bindBuffer(gl.ARRAY_BUFFER, gl.ground_program.vBuffer);
        // gl.vertexAttribPointer(vertexPosition, 3, gl.FLOAT, false, 0, 0);
        // gl.enableVertexAttribArray(vertexPosition);

        groundVertices = [vec3(-2.0, -1.0, -1.0), vec3(2.0, -1.0, -1.0), vec3(-2.0, -1.0, -5.0), vec3(2.0, -1.0, -5.0)];
        gl.bufferData(gl.ARRAY_BUFFER, flatten(groundVertices), gl.STATIC_DRAW);
        //mapper texturekoordinaterne til vertices
        var textureCoordsMapping = [vec2(0, 0), vec2(0, 1), vec2(1, 1), vec2(1, 0)];
        gl.ground_program.coorBuffer = gl.createBuffer();
        gl.ground_program.coorBuffer.num = 2;
        gl.ground_program.textureCoords = gl.getAttribLocation(gl.ground_program, "textureCoords");

        gl.bindBuffer(gl.ARRAY_BUFFER, gl.ground_program.coorBuffer)

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
        gl.ground_program = initShaders(gl, "ground-vertex-shader", "ground-fragment-shader");
        gl.teapot_program = initShaders(gl, "teapot-vertex-shader", "teapot-fragment-shader");
        gl.teapot_program.vertexPosition = [];
        gl.teapot_program.vertexNormal = [];
        gl.teapot_program.vertexColor = [];
        gl.teapot_program_model = null;

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