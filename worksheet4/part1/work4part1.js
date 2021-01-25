var gl;
var clearColor = vec4(1, 1, 1, 1.0);
var sphereVertices;
var numSubdivs = 0;
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
    gl.disable(gl.CULL_FACE);
    //opretter dynamisk et field til en buffer i GL objektet
    gl.vBuffer = null;

    document.getElementById("decrease").addEventListener("click", function () {
        if (numSubdivs > 0) {
            initSphere(gl, --numSubdivs);
        }
        render();
    })
    document.getElementById("increase").addEventListener("click", function () {
        if (numSubdivs < 8) {
            initSphere(gl, ++numSubdivs);
        }
        render();
    })
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
    Vvalues = lookAt(vec3(0, 0, 5), vec3(0, 0, -1), vec3(0, 1, 0));
    gl.uniformMatrix4fv(Vmatrix, false, flatten(Vvalues));

    var Pmatrix = gl.getUniformLocation(program, "P");
    var Pvalues;
    Pvalues = mat4();
    Pvalues = perspective(45, 1, 0.1, 100)
    gl.uniformMatrix4fv(Pmatrix, false, flatten(Pvalues));

    initSphere(gl, numSubdivs);

    var vertexPosition = gl.getAttribLocation(program, "a_Position");
    render();

    function render() {

        gl.deleteBuffer(gl.vBuffer);
        gl.vBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, gl.vBuffer);
        gl.vertexAttribPointer(vertexPosition, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vertexPosition);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(sphereVertices), gl.STATIC_DRAW);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLES, 0, sphereVertices.length);
    }
}

function initSphere(gl, numSubdivs) {
    sphereVertices = [];
    tetrahedron(sphereVertices,
        vec4(0.0, 0.0, 1.0, 1),
        vec4(0.0, 0.942809, -0.333333, 1),
        vec4(-0.816497, -0.471405, -0.333333, 1),
        vec4(0.816497, -0.471405, -0.333333, 1),
        numSubdivs);
}

function tetrahedron(s, a, b, c, d, n) {
    divideTriangle(s, a, b, c, n);
    divideTriangle(s, d, c, b, n);
    divideTriangle(s, a, d, b, n);
    divideTriangle(s, a, c, d, n);
}
function divideTriangle(s, a, b, c, count) {
    if (count > 0) {
        var ab = normalize(mix(a, b, 0.5), true);
        var ac = normalize(mix(a, c, 0.5), true);
        var bc = normalize(mix(b, c, 0.5), true);
        divideTriangle(s, a, ab, ac, count - 1);
        divideTriangle(s, ab, b, bc, count - 1);
        divideTriangle(s, bc, c, ac, count - 1);
        divideTriangle(s, ab, bc, ac, count - 1);
    }
    else {
        triangle(s, a, b, c);
    }
}
function triangle(s, a, b, c) {
    s.push(a);
    s.push(b);
    s.push(c);
}