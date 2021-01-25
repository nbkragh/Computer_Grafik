window.onload = function () {

    var canvas = document.getElementById("c");
    gl = canvas.getContext("webgl", { preserveDrawingBuffer: true });
    if (!gl) {
        console.log("no gl : " + gl)
    }

    gl.program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(gl.program);

    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);

    gl.enable(gl.DEPTH_TEST);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    var NumberofbufferIndicies = initVertexBuffers(gl);

    var Mvalues = mat4();
    var Vvalues = lookAt(vec3(3, 3, 7), vec3(0, 0, 0), vec3(0, 1, 0));
    var Pvalues = perspective(30, 1, 1, 100);
    gl.uniformMatrix4fv(gl.getUniformLocation(gl.program, "M"), false, flatten(Mvalues));
    gl.uniformMatrix4fv(gl.getUniformLocation(gl.program, "V"), false, flatten(Vvalues));
    gl.uniformMatrix4fv(gl.getUniformLocation(gl.program, "P"), false, flatten(Pvalues));


    gl.drawElements(gl.TRIANGLES, NumberofbufferIndicies, gl.UNSIGNED_BYTE, 0);



    function initVertexBuffers(gl) {
        // Create a cube
        //    v6----- v5
        //   /|      /|
        //  v1------v0|
        //  | |     | |
        //  | |v7---|-|v4
        //  |/      |/
        //  v2------v3

        var vertices = new Float32Array([   // Vertex coordinates
            1.0, 1.0, 1.0, -1.0, 1.0, 1.0, -1.0, -1.0, 1.0, 1.0, -1.0, 1.0,    // v0-v1-v2-v3 front
            1.0, 1.0, 1.0, 1.0, -1.0, 1.0, 1.0, -1.0, -1.0, 1.0, 1.0, -1.0,    // v0-v3-v4-v5 right
            1.0, 1.0, 1.0, 1.0, 1.0, -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0,    // v0-v5-v6-v1 up
            -1.0, 1.0, 1.0, -1.0, 1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, 1.0,    // v1-v6-v7-v2 left
            -1.0, -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, -1.0, 1.0, -1.0, -1.0, 1.0,    // v7-v4-v3-v2 down
            1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0     // v4-v7-v6-v5 back
        ]);

        var colors = new Float32Array([     // Colors
            0.5, 0.5, 0.0, 0.5, 0.5, 0.0, 0.5, 0.5, 0.0, 0.5, 0.5, 0.0,  // v0-v1-v2-v3 front
            1.0, 0.5, 0.5, 1.0, 0.5, 0.5, 1.0, 0.5, 0.5, 1.0, 0.5, 0.5,  // v0-v3-v4-v5 right
            0.5, 1.0, 0.5, 0.5, 1.0, 0.5, 0.5, 1.0, 0.5, 0.5, 1.0, 0.5,  // v0-v5-v6-v1 up
            0.0, 0.5, 0.5, 0.0, 0.5, 0.5, 0.0, 0.5, 0.5, 0.0, 0.5, 0.5,  // v1-v6-v7-v2 left
            0.5, 0.0, 0.5, 0.5, 0.0, 0.5, 0.5, 0.0, 0.5, 0.5, 0.0, 0.5,  // v7-v4-v3-v2 down
            0.5, 0.5, 1.0, 0.5, 0.5, 1.0, 0.5, 0.5, 1.0, 0.5, 0.5, 1.0,   // v4-v7-v6-v5 back
        ]);

        var indices = new Uint8Array([       // Indices of the vertices
            0, 1, 2, 0, 2, 3,    // front
            4, 5, 6, 4, 6, 7,    // right
            8, 9, 10, 8, 10, 11,    // up
            12, 13, 14, 12, 14, 15,    // left
            16, 17, 18, 16, 18, 19,    // down
            20, 21, 22, 20, 22, 23     // back
        ]);

        // Create a buffer object
        var indexBuffer = gl.createBuffer();
        if (!indexBuffer)
            return -1;

        // Write the vertex coordinates and color to the buffer object
        if (!initArrayBuffer(gl, vertices, 3, gl.FLOAT, 'a_Position'))
            return -1;

        if (!initArrayBuffer(gl, colors, 3, gl.FLOAT, 'a_Color'))
            return -1;

        // Write the indices to the buffer object
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

        return indices.length;
    }

    function initArrayBuffer(gl, data, num, type, attribute) {
        // Create a buffer object
        var buffer = gl.createBuffer();
        if (!buffer) {
            console.log('Failed to create the buffer object');
            return false;
        }
        // Write date into the buffer object
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
        // Assign the buffer object to the attribute variable
        var a_attribute = gl.getAttribLocation(gl.program, attribute);
        if (a_attribute < 0) {
            console.log('Failed to get the storage location of ' + attribute);
            return false;
        }
        gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);
        // Enable the assignment of the buffer object to the attribute variable
        gl.enableVertexAttribArray(a_attribute);

        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        return true;
    }
}

