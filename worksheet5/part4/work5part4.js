var gl;
var clearColor = vec4(0, 0, 0, 1.0);
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
    var ext = gl.getExtension('OES_element_index_uint');
    if (!ext) {console.log('Warning: Unable to use an extension');}

    gl.clearColor(...clearColor);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(gl.program);

    //bruger gl.DEPTH_BUFFER_BIT
    gl.enable(gl.DEPTH_TEST);

    gl.enable(gl.CULL_FACE);
    //gl.frontFace(gl.CW);


    //opretter dynamisk felter

    gl.program.vertexPosition = [];
    gl.program.vertexNormal = [];
    gl.program.vertexColor = [];
    gl.vBuffer = null;
    gl.nBuffer = null;
    gl.cBuffer = null;
    gl.model = null;

    document.getElementById("pause").addEventListener("click", function () {
        play = !play; tick();

    })
    document.getElementById("emitRange").addEventListener("input", function (event) {
        var i = (event.target.value / 100);
        lightEmission = vec4(i, i, i, 1.0);
        gl.uniform4fv(gl.getUniformLocation(gl.program, "Light_Emis"), flatten(lightEmission));
        render();
    })

    document.getElementById("dRange").addEventListener("input", function (event) {
        Kd = (event.target.value / 100);
        gl.uniform1f(gl.getUniformLocation(gl.program, "Kd"), Kd);
        render();
    })
    document.getElementById("aRange").addEventListener("input", function (event) {
        Ka = (event.target.value / 100);
        gl.uniform1f(gl.getUniformLocation(gl.program, "Ka"), Ka);
        render();
    })
    document.getElementById("sRange").addEventListener("input", function (event) {
        Ks = (event.target.value / 100);
        gl.uniform1f(gl.getUniformLocation(gl.program, "Ks"), Ks);
        render();
    })
    document.getElementById("shiny").addEventListener("input", function (event) {
        s = event.target.value;
        gl.uniform1f(gl.getUniformLocation(gl.program, "s"), s);
        render();
    })
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
    Vvalues = lookAt(vec3(0.0, 0.0, 1.5), vec3(0.0, 0.0, -1.0), vec3(0.0, 1.0, 0.0));
    gl.uniformMatrix4fv(Vmatrix, false, flatten(Vvalues));

    var Pmatrix = gl.getUniformLocation(gl.program, "P");
    var Pvalues;
    Pvalues = mat4();
    Pvalues = perspective(45.0, 1.0, 0.1, 100.0)
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

    s = 50.0;
    gl.uniform1f(gl.getUniformLocation(gl.program, "s"), s);
    // le
    var lightPositionValue = vec4(0.2, 0.2, 0.2, 1.0);
    gl.uniform4fv(gl.getUniformLocation(gl.program, "Light_Position"), flatten(lightPositionValue));

    lightEmission = vec4(1.0, 1.0, 1.0, 1.0);
    gl.uniform4fv(gl.getUniformLocation(gl.program, "Light_Emis"), flatten(lightEmission));

    // something is wrong here
    // var N = inverse(transpose(mult(Vvalues, Mvalues )));
    // gl.uniformMatrix4fv(gl.getUniformLocation(gl.program, "N"), false, flatten(N));

    //___________________________Buffer__________________________________

    gl.model = initModel(gl, "../../model/dragon/dragon.obj",1);
    
    var r = 4;
    var a = 0;

    tick();
    function tick() {
        a += 0.5;
        //roterer modellen i stedet for kameraet, så der er stationært spotlys på den
        Mvalues = rotateY(a);
        //Vvalues = lookAt(vec3(r * Math.sin(a), 0, r * Math.cos(a)),vec3(0, 0, 0),vec3(0, 1, 0));
        gl.uniformMatrix4fv(Mmatrix, false, flatten(Mvalues));
        //gl.uniformMatrix4fv(Vmatrix, false, flatten(Vvalues));
        render();
        if (play) {
            requestAnimFrame(tick);
        }

    }

    function render() {
        if (!g_drawingInfo && g_objDoc && g_objDoc.isMTLComplete) {
            g_drawingInfo = onReadComplete(gl, g_objDoc);
        }
        if(!g_drawingInfo){  return}

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.drawElements(gl.TRIANGLES, g_drawingInfo.indices.length, gl.UNSIGNED_INT, 0)
    }
}
function initModel(gl, obj_filename, scale) {
    console.log("loading...");
    gl.program.vertexPosition = gl.getAttribLocation(gl.program, "a_Position");
    gl.program.vertexNormal = gl.getAttribLocation(gl.program, "a_Normal");
    gl.program.vertexColor = gl.getAttribLocation(gl.program, "a_Color");

    var model = initVertexBuffers(gl);

    readOBJFile(obj_filename, scale, true);

    return model;
}


function initVertexBuffers(gl) {
    var o = new Object();
    o.vertexBuffer = createEmptyArrayBuffer(gl, gl.program.vertexPosition, 3, gl.FLOAT);
    o.normalBuffer = createEmptyArrayBuffer(gl, gl.program.vertexNormal, 3, gl.FLOAT);
    //o.colorBuffer = createEmptyArrayBuffer(gl, gl.program.vertexColor, 4, gl.FLOAT);
    o.indexBuffer = gl.createBuffer();

    return o;
}

function createEmptyArrayBuffer(gl, a_attribute, num, type) {
    var buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);
    gl.enableVertexAttribArray(a_attribute);
    return buffer;
}

function readOBJFile(fileName, scale, reverse) {
    var request = new XMLHttpRequest();
    request.onreadystatechange = function () {
        if (request.readyState === 4 && request.status !== 404) {
            onReadOBJFile(request.responseText, fileName,  scale, reverse);
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
function onReadComplete(gl, g_objDoc) {
    
    // Acquire the vertex coordinates and colors from OBJ file  
    var drawingInfo = g_objDoc.getDrawingInfo();
    // Write date into the buffer object  
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.model.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.vertices, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.model.normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.normals, gl.STATIC_DRAW);
    //gl.bindBuffer(gl.ARRAY_BUFFER, gl.model.colorBuffer);
    //gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.colors, gl.STATIC_DRAW);
    // Write the indices to the buffer object  
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.model.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, drawingInfo.indices, gl.STATIC_DRAW);
    console.log("done!");
    return drawingInfo;
}
