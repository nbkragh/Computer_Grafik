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
window.onload = function () {

    var canvas = document.getElementById("c");
    gl = canvas.getContext("webgl", { preserveDrawingBuffer: true });
    if (!gl) {
        console.log("no gl : " + gl)
    }

    gl.clearColor(...clearColor);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    //bruger gl.DEPTH_BUFFER_BIT
    gl.enable(gl.DEPTH_TEST);

    gl.enable(gl.CULL_FACE);
    //gl.frontFace(gl.CW);



    //opretter dynamisk et field ti len buffer i GL objektet
    gl.vBuffer = null;
    gl.nBuffer = null;
    //------------------------EVENTS-----------------------
    document.getElementById("decrease").addEventListener("click", function () {
        if (numSubdivs > 0) {
            initSphere(gl, --numSubdivs);
            reBuff();
        }
    })
    document.getElementById("increase").addEventListener("click", function () {
        if (numSubdivs < 7) {
            initSphere(gl, ++numSubdivs);
            reBuff();
        }
    })
    document.getElementById("pause").addEventListener("click", function () {
        play = !play; tick();

    })
    document.getElementById("emitRange").addEventListener("input", function (event) {
        var i = (event.target.value / 100);
        lightEmission = vec4(i, i, i, 1.0);
        gl.uniform4fv(gl.getUniformLocation(program, "Light_Emis"), flatten(lightEmission));
        render();
    })

    document.getElementById("dRange").addEventListener("input", function (event) {
        Kd = (event.target.value / 100);
        gl.uniform1f(gl.getUniformLocation(program, "Kd"), Kd);
        render();
    })
    document.getElementById("aRange").addEventListener("input", function (event) {
        Ka = (event.target.value / 100);
        gl.uniform1f(gl.getUniformLocation(program, "Ka"), Ka);
        render();
    })
    document.getElementById("sRange").addEventListener("input", function (event) {
        Ks = (event.target.value / 100);
        gl.uniform1f(gl.getUniformLocation(program, "Ks"), Ks);
        render();
    })
    document.getElementById("shiny").addEventListener("input", function (event) {
        s = event.target.value;
        gl.uniform1f(gl.getUniformLocation(program, "s"), s);
        render();
    })
    //------------------------P V M-----------------------
    var Mmatrix = gl.getUniformLocation(program, "M");
    var Mvalues
    Mvalues = mat4();
    //Mvalues = translate(vec3(0.5,0.5,0.5));
    //Mvalues = mult(Mvalues, scalem(vec3(0.5, 0.5, 0.5)));
    gl.uniformMatrix4fv(Mmatrix, false, flatten(Mvalues));

    var Vmatrix = gl.getUniformLocation(program, "V");
    var Vvalues;
    Vvalues = mat4();
    Vvalues = lookAt(vec3(0.0, 0.0, 1.0), vec3(0.0, 0.0, -1.0), vec3(0.0, 1.0, 0.0));
    gl.uniformMatrix4fv(Vmatrix, false, flatten(Vvalues));

    var Pmatrix = gl.getUniformLocation(program, "P");
    var Pvalues;
    Pvalues = mat4();
    Pvalues = perspective(45.0, 1.0, 0.1, 100.0)
    gl.uniformMatrix4fv(Pmatrix, false, flatten(Pvalues));

    //__________________________LIGHTING___________________________________

    //diffuse reflection coefficient 
    Kd = 1.0;
    gl.uniform1f(gl.getUniformLocation(program, "Kd"), Kd);

    //ambient
    Ka = 0.5;
    gl.uniform1f(gl.getUniformLocation(program, "Ka"), Ka);

    //highlight
    Ks = 0.5;
    gl.uniform1f(gl.getUniformLocation(program, "Ks"), Ks);

    s = 50.0;
    gl.uniform1f(gl.getUniformLocation(program, "s"), s);
    // le
    var lightPositionValue = vec4(0.0, 0.0, -2.0, 1.0);
    gl.uniform4fv(gl.getUniformLocation(program, "Light_Position"), flatten(lightPositionValue));

    lightEmission = vec4(1.0, 1.0, 1.0, 1.0);
    gl.uniform4fv(gl.getUniformLocation(program, "Light_Emis"), flatten(lightEmission));

    // something is wrong here
    var N = inverse(transpose(mult(Vvalues, Mvalues)));
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "N"), false, flatten(N));
    //_____________________________________________________________
    initSphere(gl, numSubdivs);
    var vertexPosition = gl.getAttribLocation(program, "a_Position");
    var vertexNormal = gl.getAttribLocation(program, "a_Normal");
    reBuff();
    function reBuff() {
        gl.deleteBuffer(gl.vBuffer);

        gl.vBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, gl.vBuffer);


        gl.vertexAttribPointer(vertexPosition, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vertexPosition);

        gl.bufferData(gl.ARRAY_BUFFER, flatten(sphereVertices), gl.STATIC_DRAW);

        gl.deleteBuffer(gl.nBuffer);

        gl.nBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, gl.nBuffer);


        gl.vertexAttribPointer(vertexNormal, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vertexNormal);

        gl.bufferData(gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW);

    }
    var r = 4;
    var a = 0;

    tick();
    function tick() {
        a += 0.01;
        Vvalues = lookAt(vec3(r * Math.sin(a), 0, r * Math.cos(a)),
            vec3(0, 0, 0),
            vec3(0, 1, 0));
        gl.uniformMatrix4fv(Vmatrix, false, flatten(Vvalues));
        render();
        if (play) {
            requestAnimFrame(tick);
        }

    }

    function render() {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLES, 0, sphereVertices.length);
    }
}
function initSphere(gl, numSubdivs) {
    sphereVertices = [];
    normalsArray = []
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
    normalsArray.push(vec4(a[0], a[1], a[2], 0.0));
    normalsArray.push(vec4(b[0], b[1], b[2], 0.0));
    normalsArray.push(vec4(c[0], c[1], c[2], 0.0));
    s.push(a);
    s.push(b);
    s.push(c);
}