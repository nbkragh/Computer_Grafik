var gl;
var clearColor = vec4(0.3921, 0.5843, 0.9294, 1.0);
var sphereVertices;
var numSubdivs = 5;
var normalsArray;
var play = true;
var lightEmission = vec4(1.0, 1.0, 1.0, 1.0);
var Kd = 1.0;
var Ka = 0.5;
var Ks = 1.0;
var s = 500.0;
var vertexPosition;
var g_objDoc = null;      // Info parsed from OBJ 
var g_drawingInfo = null; // Info for drawing the 3D model with WebGL
window.onload = function () {

    var canvas = document.getElementById("c");
    gl = canvas.getContext("webgl", { preserveDrawingBuffer: true });
    if (!gl) {
        console.log("no gl : " + gl)
    }

    gl.clearColor(...clearColor);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(gl.program);

    //bruger gl.DEPTH_BUFFER_BIT
    gl.enable(gl.DEPTH_TEST);

    gl.enable(gl.CULL_FACE);
    //gl.frontFace(gl.CW);


    //----------------------Texture--------------------
    var texSize = 64;
    var numRows = numCols = 8;
    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    var myTexels = new Uint8Array(4 * texSize * texSize); // 4 for RGBA image, texSize is the resolution
    for (var i = 0; i < texSize; ++i) {
        for (var j = 0; j < texSize; ++j) {
            var patchx = Math.floor(i / (texSize / numRows));
            var patchy = Math.floor(j / (texSize / numCols));
            var c = (patchx % 2 !== patchy % 2 ? 255 : 0);
            var idx = 4 * (i * texSize + j);
            myTexels[idx] = myTexels[idx + 1] = myTexels[idx + 2] = c;
            myTexels[idx + 3] = 255;
        }
    }
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texSize, texSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, myTexels);



    var quadVertices = [
        vec3(-4.0, -1.0, -1.0), 
        vec3(4.0, -1.0, -1.0), 
        vec3(4.0, -1.0, -21.0),
        vec3(-4.0, -1.0, -21.0)
        ];
        
    vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    var vertexPosition = gl.getAttribLocation(gl.program, "a_Position");
    gl.vertexAttribPointer(vertexPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vertexPosition);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(quadVertices), gl.STATIC_DRAW);


    var text = [vec2(-1.5, 0), vec2(2.5, 0), vec2(2.5, 10), vec2(-1.5, 10)];
    var textBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, textBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(text), gl.STATIC_DRAW);
    var vTexCoord = gl.getAttribLocation(gl.program, "vTexCoord");
    gl.vertexAttribPointer(vTexCoord, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vTexCoord);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

    gl.uniform1i(gl.getUniformLocation(gl.program, "texMap"), 0);
    
    //gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);     
    //gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT); 
    //------------------------P V M-----------------------
    var Mmatrix = gl.getUniformLocation(gl.program, "M");
    var Mvalues
    Mvalues = mat4();
    //Mvalues = translate(vec3(0.5,0.5,0.5));
    //Mvalues = mult(Mvalues, scalem(vec3(0.5, 0.5, 0.5)));
    gl.uniformMatrix4fv(Mmatrix, false, flatten(Mvalues));

    var Vmatrix = gl.getUniformLocation(gl.program, "V");
    var Vvalues;
    Vvalues = mat4();
    Vvalues = lookAt(vec3(0.0, 0.0, 0.0), vec3(0.0, 0.0, -1.0), vec3(0.0, 1.0, 0.0));
    gl.uniformMatrix4fv(Vmatrix, false, flatten(Vvalues));

    var Pmatrix = gl.getUniformLocation(gl.program, "P");
    var Pvalues;
    Pvalues = mat4();
    Pvalues = perspective(90.0, 1.0, 0.1, 50.0)
    gl.uniformMatrix4fv(Pmatrix, false, flatten(Pvalues));

    //__________________________LIGHTING___________________________________

    //diffuse reflection coefficient 
    Kd = 0.5;
    gl.uniform1f(gl.getUniformLocation(gl.program, "Kd"), Kd);

    //ambient
    Ka = 0.5;
    gl.uniform1f(gl.getUniformLocation(gl.program, "Ka"), Ka);

    //highlight
    Ks = 0.5;
    gl.uniform1f(gl.getUniformLocation(gl.program, "Ks"), Ks);

    // le
    var lightPositionValue = vec4(0.5, 0.5, 0.5, 1.0);
    gl.uniform4fv(gl.getUniformLocation(gl.program, "Light_Position"), flatten(lightPositionValue));

    lightEmission = vec4(0.5, .5, 0.5, 1.0);
    gl.uniform4fv(gl.getUniformLocation(gl.program, "Light_Emis"), flatten(lightEmission));

    // something is wrong here
    // var N = inverse(transpose(mult(Vvalues, Mvalues )));
    // gl.uniformMatrix4fv(gl.getUniformLocation(gl.program, "N"), false, flatten(N));

    //___________________________Buffer__________________________________

    tick();
    function tick() {
        //a += 0.5;
        //roterer modellen i stedet for kameraet, så der er stationært spotlys på den
        //Mvalues = rotateY(a);
        //Vvalues = lookAt(vec3(r * Math.sin(a), 0, r * Math.cos(a)),vec3(0, 0, 0),vec3(0, 1, 0));
        //gl.uniformMatrix4fv(Mmatrix, false, flatten(Mvalues));
        //gl.uniformMatrix4fv(Vmatrix, false, flatten(Vvalues));
        render();
        if (play) {
            requestAnimFrame(tick);
        }
    }

    function render() {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
    }
}