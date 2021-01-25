
window.onload = function () {
    var gl;
    var clearColor;
    var play = true;
    var canvas = document.getElementById("c");
    var Mmatrix;
    var Vmatrix;
    var Pmatrix;
    var vBuffer;
    var groundVertices;
    var quad1Vertices;
    var quad2Vertices;
    var lightPoint;
    var lightPointValues;
    var SPMatrix;
    var SPMvalues;
    init();
    initVertexBuffer()
    initTextures();

    var r = 2;
    var a = 0;

    tick();
    function tick() {
        a += 0.04;
        lightPointValues = vec3(r * Math.sin(a), 2, r * Math.cos(a));
        
        //a += 0.4;
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

        Mvalues = mat4();
        gl.uniformMatrix4fv(Mmatrix, false, flatten(Mvalues));

        Vvalues = lookAt(vec3(0.0, 0.0, 0.0), vec3(0.0, 0.0, -1.0), vec3(0.0, 1.0, 0.0));
        gl.uniformMatrix4fv(Vmatrix, false, flatten(Vvalues));

        Pvalues = perspective(90.0, 1.0, 0.1, 50.0)
        gl.uniformMatrix4fv(Pmatrix, false, flatten(Pvalues));

        

        gl.uniform4fv(lightPoint, flatten( lightPointValues));

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.uniform1i(gl.getUniformLocation(gl.program, "texMap"), 0);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, groundVertices.length );
        
        
        gl.uniform1i(gl.getUniformLocation(gl.program, "texMap"), 1);
        gl.drawArrays(gl.TRIANGLE_STRIP, groundVertices.length,  quad1Vertices.length);
        gl.drawArrays(gl.TRIANGLE_STRIP, groundVertices.length+quad1Vertices.length,   quad2Vertices.length);
        
        shadowProjection = mat4(1,0,0,0,
            0,1,0,0,
            0,0,1,0,
            0,-1.0/(lightPointValues[1]+1),0,0); // Shadow projection matrix initially an identity matrix


        Mvalues = mult(Mvalues, translate(lightPointValues[0], lightPointValues[1],lightPointValues[2]));

        
        Mvalues = mult(Mvalues ,shadowProjection);
        Mvalues = mult(Mvalues , translate(-lightPointValues[0],-lightPointValues[1], -lightPointValues[2]));
        gl.uniformMatrix4fv(Mmatrix, false, flatten(Mvalues));
        gl.drawArrays(gl.TRIANGLE_STRIP, groundVertices.length,  quad1Vertices.length);
        gl.drawArrays(gl.TRIANGLE_STRIP, groundVertices.length+quad1Vertices.length,   quad2Vertices.length);
        
    }

    function initTextures() {
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
            gl.uniform1i(gl.getUniformLocation(gl.program, "texMap"), 0);
        };

        //opretter en texture af rød
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 1, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, new Uint8Array([255, 0, 0]))
    };
    function initVertexBuffer() {
        var vertexPosition = gl.getAttribLocation(gl.program, "a_Position");
        vBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
        gl.vertexAttribPointer(vertexPosition, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vertexPosition);

        groundVertices = [vec3(-2.0, -1.0, -1.0), vec3(2.0, -1.0, -1.0),  vec3(-2.0, -1.0, -5.0), vec3(2.0, -1.0, -5.0)];
        quad1Vertices = [vec3(0.25, -0.5, -1.25), vec3(0.75, -0.5, -1.25), vec3(0.25, -0.5, -1.75), vec3(0.75, -0.5, -1.75)];
        quad2Vertices = [vec3(-1.0, -1.0, -2.5), vec3(-1.0, 0.0, -2.5), vec3(-1.0, -1.0, -3.0), vec3(-1.0, 0.0, -3.0)];

        gl.bufferData(gl.ARRAY_BUFFER, sizeof["vec3"] * (groundVertices.length + quad1Vertices.length + quad2Vertices.length), gl.STATIC_DRAW);
        //gl.bufferData(gl.ARRAY_BUFFER, sizeof["vec3"] * (groundVertices.length), gl.STATIC_DRAW);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(groundVertices));
        gl.bufferSubData(gl.ARRAY_BUFFER, sizeof["vec3"] * groundVertices.length, flatten(quad1Vertices));
        gl.bufferSubData(gl.ARRAY_BUFFER, sizeof["vec3"] * (groundVertices.length + quad1Vertices.length), flatten(quad2Vertices));

        //mapper texturekoordinaterne til vertices
        var textureCoordsMapping = [vec2(0, 0),vec2(0, 1),vec2(1, 1),vec2(1, 0),
            vec2(0, 0),vec2(0, 1),vec2(1, 1),vec2(1, 0),
            vec2(0, 0),vec2(0, 1),vec2(1, 1),vec2(1, 0)
        ];

        var textureCoords = gl.getAttribLocation(gl.program, "textureCoords");
        gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())

        gl.vertexAttribPointer(textureCoords, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(textureCoords);
        gl.bufferData(gl.ARRAY_BUFFER, sizeof["vec2"] * (textureCoordsMapping.length), gl.STATIC_DRAW);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(textureCoordsMapping));


        lightPoint = gl.getUniformLocation(gl.program, "lightPoint");

    }

    function init() {

        gl = canvas.getContext("webgl", { preserveDrawingBuffer: true });
        if (!gl) {
            console.log("no gl : " + gl)
        }
        clearColor = vec4(1.0, 1.0, 1.0, 1.0)
        gl.clearColor(...clearColor);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.program = initShaders(gl, "vertex-shader", "fragment-shader");
        gl.useProgram(gl.program);

        //bruger gl.DEPTH_BUFFER_BIT
        gl.enable(gl.DEPTH_TEST);

        gl.disable(gl.CULL_FACE);
        //gl.frontFace(gl.CW);


        Mmatrix = gl.getUniformLocation(gl.program, "M");
        Mvalues = mat4();
        //Mvalues = translate(vec3(0.5,0.5,0.5));
        //Mvalues = mult(Mvalues, scalem(vec3(0.5, 0.5, 0.5)));
        gl.uniformMatrix4fv(Mmatrix, false, flatten(mat4()));

        Vmatrix = gl.getUniformLocation(gl.program, "V");
        Vvalues = mat4();
        Vvalues = lookAt(vec3(0.0, 0.0, 0.0), vec3(0.0, 0.0, -1.0), vec3(0.0, 1.0, 0.0));
        gl.uniformMatrix4fv(Vmatrix, false, flatten(lookAt(vec3(0.0, 0.0, 0.0), vec3(0.0, 0.0, -1.0), vec3(0.0, 1.0, 0.0))));

        Pmatrix = gl.getUniformLocation(gl.program, "P");
        Pvalues = mat4();
        Pvalues = perspective(90.0, 1.0, 0.1, 50.0)
        gl.uniformMatrix4fv(Pmatrix, false, flatten(perspective(90.0, 1.0, 0.1, 50.0)));

        //_____________________________________Action_______________
        document.getElementById("pause").addEventListener("click", function () {
            play = !play; tick();
        })
    }

}