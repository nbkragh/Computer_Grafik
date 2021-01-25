var bufferDataSize
var gl;
var vertexBuffer;
var pointAndColorDataSize = sizeof['vec3'] + sizeof['vec4'];
var clearColor = vec4(0, 0, 0, 1.0);
var points = [];
var colors = []; var cubeFaces = Array(24);
window.onload = function () {

    var canvas = document.getElementById("c");
    gl = canvas.getContext("webgl", { preserveDrawingBuffer: true });
    if (!gl) {
        console.log("no gl : " + gl)
    }

    gl.clearColor(...clearColor);
    gl.clear(gl.COLOR_BUFFER_BIT);

    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

//-----------------------------------------------
    var Mmatrix = gl.getUniformLocation(program, "M");
    var Mvalues
    Mvalues = mat4();
    //Mvalues = translate(vec3(0.5,0.5,0.5));
    //Mvalues = mult(Mvalues, scalem(vec3(0.5, 0.5, 0.5)));
    gl.uniformMatrix4fv(Mmatrix, false, flatten(Mvalues));

    var Vmatrix = gl.getUniformLocation(program, "V");
    var Vvalues;
    Vvalues = mat4();
    Vvalues = lookAt(vec3(0,0,5), vec3(0, 0, -1), vec3(0, 1, 0));
    gl.uniformMatrix4fv(Vmatrix, false, flatten(Vvalues));

    var Pmatrix = gl.getUniformLocation(program, "P");
    var Pvalues;
    Pvalues = mat4();
    Pvalues = perspective(45,1, 0.1, 100)
    gl.uniformMatrix4fv(Pmatrix, false, flatten(Pvalues));

    var cubeVertices = [
        vec3(-0.5, -0.5, 0.5)   // front-bottom-left
        ,vec3(-0.5, 0.5, 0.5)   // front-top-left
        ,vec3(0.5, 0.5, 0.5)    // front-top-right
        ,vec3(0.5, -0.5, 0.5)   // front-bottom-right
        ,vec3(-0.5, -0.5, -0.5) // back-bottom-left
        ,vec3(-0.5, 0.5, -0.5)  // back-top-left
        ,vec3(0.5, 0.5, -0.5)   // back-top-right
        ,vec3(0.5, -0.5, -0.5)  // back-bottom-right
    ]
    var vertexColors = [
        [0.0, 0.0, 1.0, 1.0], // blue
        [1.0, 0.0, 0.0, 1.0], // red
        [1.0, 1.0, 1.0, 1.0], // white
        [0.0, 1.0, 0.0, 1.0], // green
        [0.0, 0.0, 0.0, 1], // black
        [1.0, 0.0, 1.0, 1.0], // magenta
        [1.0, 1.0, 0.0, 1.0], // yellow
        [0.0, 1.0, 1.0, 1.0] // cyan
    ];
    //rækkefølgen som cubeVertices+vertexColors skal indlæses i bufferen
    
    var indices = [
        0,1,0,3,0,4,
        7,6,7,4,7,3,
        2,3,2,1,2,6,
        5,6,5,4,5,1
    ]
    var numVertices = indices.length;

    vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    var vertexPosition = gl.getAttribLocation(program, "a_Position");
    gl.vertexAttribPointer(vertexPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vertexPosition);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(cubeVertices), gl.STATIC_DRAW);

    colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    var vertexColor = gl.getAttribLocation(program, "a_Color");
    gl.vertexAttribPointer(vertexColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vertexColor);


    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertexColors), gl.STATIC_DRAW);

    var indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint8Array(indices), gl.STATIC_DRAW);

    gl.drawElements(gl.LINES, numVertices, gl.UNSIGNED_BYTE, 0);
    

    Mvalues = translate(vec3(1.3,0,0));
    Mvalues = mult(Mvalues, rotateY(65)); 
    gl.uniformMatrix4fv(Mmatrix, false, flatten(Mvalues));
 
    gl.drawElements(gl.LINES, numVertices, gl.UNSIGNED_BYTE, 0);

    Mvalues = translate(vec3(0,-1.24,0));
    Mvalues = mult(Mvalues, rotateY(40)); 
    gl.uniformMatrix4fv(Mmatrix, false, flatten(Mvalues));
 
    gl.drawElements(gl.LINES, numVertices, gl.UNSIGNED_BYTE, 0);
}
