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
var play = true;
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

    //_____________________________________Action_______________
    document.getElementById("pause").addEventListener("click", function () {
        play = !play; tick();

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
    Vvalues = lookAt(vec3(0.0, 0.0, 58.0), vec3(0.0, 0.0, -1.0), vec3(0.0, 1.0, 0.0));
    gl.uniformMatrix4fv(Vmatrix, false, flatten(Vvalues));

    var Pmatrix = gl.getUniformLocation(gl.program, "P");
    var Pvalues;
    Pvalues = mat4();
    Pvalues = perspective(2.0, 1.0, 0.1, 100.0)
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
    var lightPositionValue = vec4(5.0, 1.0, -58.0, 1.0);
    gl.uniform4fv(gl.getUniformLocation(gl.program, "Light_Position"), flatten(lightPositionValue));

    lightEmission = vec4(1.0, 1.0, 1.0, 1.0);
    gl.uniform4fv(gl.getUniformLocation(gl.program, "Light_Emis"), flatten(lightEmission));

    // something is wrong here
    // var N = inverse(transpose(mult(Vvalues, Mvalues )));
    // gl.uniformMatrix4fv(gl.getUniformLocation(gl.program, "N"), false, flatten(N));

    //___________________________Buffing_________________________________

    //----------------------Texture--------------------
    initSphere(gl, numSubdivs);



    var image = document.createElement('img');
    image.crossorigin = 'anonymous';
    image.src = '../../img/earth.jpg';
    image.onload = function () {
        var texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER,gl.NEAREST );
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.uniform1i(gl.getUniformLocation(gl.program, "texMap"), 0);
    };

    //----------------------Vertices--------------------
    var vertexPosition = gl.getAttribLocation(gl.program, "a_Position");
    vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.vertexAttribPointer(vertexPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vertexPosition);

    gl.bufferData(gl.ARRAY_BUFFER, flatten(sphereVertices), gl.STATIC_DRAW);
    //___________________________Render_________________________________

    var r = 4;
    var a = 0;
    tick();
    function tick() {
        a += 0.4;
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

}
function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, sphereVertices.length);
}

function magFilterLevel(value) {
    value = parseInt(value);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, (gl.NEAREST + value));
    render();
}

function minFilterLevel(value) {
    value = parseInt(value);
    if (value < 2) {
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, (gl.NEAREST + value));
    } else {
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, (gl.NEAREST_MIPMAP_NEAREST + (value - 2)));
    }

    render();
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
    normalsArray.push(...a, 0.0);
    normalsArray.push(...b, 0.0);
    normalsArray.push(...c, 0.0);
    s.push(a);
    s.push(b);
    s.push(c);
}