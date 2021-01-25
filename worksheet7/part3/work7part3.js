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
    //Vvalues = lookAt(vec3(0.0, 0.0, 0.0), vec3(0.0, 0.0, -1.0), vec3(0.0, 1.0, 0.0));
    gl.uniformMatrix4fv(Vmatrix, false, flatten(Vvalues));

    var Pmatrix = gl.getUniformLocation(gl.program, "P");
    var Pvalues;
    Pvalues = mat4();
    Pvalues = perspective(90.0, 1.0, 0.1, 100.0)
    gl.uniformMatrix4fv(Pmatrix, false, flatten(Pvalues));


    var Mtexmatrix = gl.getUniformLocation(gl.program, "Mtex");
    var Mtexvalues;
    Mtexvalues = mat4();
    gl.uniformMatrix4fv(Mtexmatrix, false, flatten(Mtexvalues));
    //__________________________LIGHTING___________________________________

    //----------------------Texture--------------------
    initSphere(gl, numSubdivs);
    var g_tex_ready = 0;
    initTexture();
    function initTexture() {
        var cubemap = ['../../img/cm_left.png',     // POSITIVE_X       
            '../../img/cm_right.png',   // NEGATIVE_X       
            '../../img/cm_top.png',     // POSITIVE_Y       
            '../../img/cm_bottom.png',  // NEGATIVE_Y       
            '../../img/cm_back.png',    // POSITIVE_Z       
            '../../img/cm_front.png'    // NEGATIVE_Z
        ];
        var texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
        gl.uniform1i(gl.getUniformLocation(gl.program, "texMap"), 0);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);


        for (let i = 0; i < 6; i++) {
            var image = document.createElement('img');
            image.crossorigin = 'anonymous';
            image.textarget = gl.TEXTURE_CUBE_MAP_POSITIVE_X + i;
            image.onload = function (event) {
                var image = event.target;
                gl.texImage2D(image.textarget, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
                g_tex_ready++;
            }
            image.src = cubemap[i];
        }


    };
    //___________________________Buffing_________________________________
    var backgroundQuad = [
        vec4(1.0,1,0.999, 1.0),
        vec4(-1.0,1,0.999, 1.0),
        vec4(1.0,-1,0.999, 1.0),
        vec4(-1.0,-1,0.999, 1.0)
    ]

    //----------------------Vertices--------------------
    // var eye = vec3(0.0, 0.0, 5.0);
    // gl.uniform3fv(gl.getUniformLocation(gl.program, "eye"), flatten(eye));
    var doReflect = gl.getUniformLocation(gl.program, "doReflect")
     

    var vertexPosition = gl.getAttribLocation(gl.program, "a_Position");
    vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.vertexAttribPointer(vertexPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vertexPosition);
    gl.bufferData(gl.ARRAY_BUFFER, 4*4*(sphereVertices.length+backgroundQuad.length), gl.STATIC_DRAW);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(sphereVertices));
    gl.bufferSubData(gl.ARRAY_BUFFER, 4*4*sphereVertices.length, flatten(backgroundQuad));
    //___________________________Render_________________________________

    var r = 2;
    var a = 0;
    tick();
    function tick() {
        a += 0.01;
        //roterer modellen i stedet for kameraet, så der er stationært spotlys på den
        //Mvalues = rotateY(a);
        eye = vec3(-r * Math.sin(a), 0, -r * Math.cos(a));
        //gl.uniformMatrix4fv(Mmatrix, false, flatten(Mvalues));
        //gl.uniformMatrix4fv(Vmatrix, false, flatten(Vvalues));
        render();
        if (play) {
            requestAnimFrame(tick);
        }
    }

    function render() {
        if (g_tex_ready > 5) {
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            gl.bufferData(gl.ARRAY_BUFFER, flatten(sphereVertices), gl.STATIC_DRAW);

            // tegn sphere
            gl.uniform1f (doReflect,   1.0);
            gl.uniformMatrix4fv(Mmatrix, false, flatten(mat4()));
            Vvalues = lookAt(eye, vec3(0.0, 0.0, 0.0), vec3(0.0, 1.0, 0.0));
            gl.uniform3fv(gl.getUniformLocation(gl.program, "eye"), flatten(eye));
            gl.uniformMatrix4fv(Vmatrix, false, flatten(Vvalues));
            gl.uniformMatrix4fv(Pmatrix, false, flatten(Pvalues));

            gl.uniformMatrix4fv(Mtexmatrix, false, flatten(mat4()));
            
            gl.drawArrays(gl.TRIANGLES, 0, sphereVertices.length);
            
            //tegn baggrund
            gl.uniform1f (doReflect,   0.0);
            gl.uniformMatrix4fv(Mmatrix, false, flatten(mat4()));
            gl.uniformMatrix4fv(Vmatrix, false, flatten(mat4()));
            gl.uniformMatrix4fv(Pmatrix, false, flatten(mat4()));
            
            var Vinverse = inverse(Vvalues);
            
            var MatrixMagic = mat4(
                Vinverse[0][0],Vinverse[0][1],Vinverse[0][2],0.0,
                Vinverse[1][0],Vinverse[1][1],Vinverse[1][2],0.0,
                Vinverse[2][0],Vinverse[2][1],Vinverse[2][2],0.0,
                0.0,0.0,0.0,0.0
            )
            
            Mtexvalues = mult(MatrixMagic, inverse(Pvalues));
            
            gl.uniformMatrix4fv(Mtexmatrix, false, flatten(Mtexvalues));
            gl.drawArrays(gl.TRIANGLE_STRIP, sphereVertices.length, 4*4);
        }
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
    normalsArray.push(...a, 0.0);
    normalsArray.push(...b, 0.0);
    normalsArray.push(...c, 0.0);
    s.push(a);
    s.push(b);
    s.push(c);
}