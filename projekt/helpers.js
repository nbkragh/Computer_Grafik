
function initEventHandlers(canvas, qrot, qinc) {
    var dragging = false;         // Dragging or not
    var lastX = -1, lastY = -1;   // Last position of the mouse

    canvas.oncontextmenu = function (ev) { ev.preventDefault(); };
    canvas.onmousedown = function (ev) {   // Mouse is pressed

        if (ev.button > 0) {
            var x = ev.clientX, y = ev.clientY;
            // Start dragging if a mouse is in <canvas>
            var rect = ev.target.getBoundingClientRect();
            if (rect.left <= x && x < rect.right && rect.top <= y && y < rect.bottom) {
                lastX = x; lastY = y;
                dragging = true;
            }
        }
    };

    canvas.onmouseup = function (ev) {
        if (ev.button > 0) {
            qinc.setIdentity();
            dragging = false;
        }
    };

    canvas.onmousemove = function (ev) {

        var x = ev.clientX, y = ev.clientY;
        if (dragging) {
            var rect = ev.target.getBoundingClientRect();
            var s_x = ((x - rect.left) / rect.width - 0.5) * 2;
            var s_y = (0.5 - (y - rect.top) / rect.height) * 2;
            var s_last_x = ((lastX - rect.left) / rect.width - 0.5) * 2;
            var s_last_y = (0.5 - (lastY - rect.top) / rect.height) * 2;
            var v2 = vec3(s_x, s_y, project_to_sphere(s_x, s_y));
            var v1 = vec3(s_last_x, s_last_y, project_to_sphere(s_last_x, s_last_y));
            qinc = qinc.make_rot_vec2vec(normalize(v1), normalize(v2));
            qrot = qrot.multiply(qinc);
        }
        lastX = x, lastY = y;

    };
    function project_to_sphere(x, y) {
        var r = 2;
        var d = Math.sqrt(x * x + y * y);
        var t = r * Math.sqrt(2);
        var z;
        if (d < r) // Inside sphere
            z = Math.sqrt(r * r - d * d);
        else if (d < t)
            z = 0;
        else       // On hyperbola
            z = t * t / d;
        return z;
    }
}

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
        1.0, 1.0, 1.0, 0.0, 1.0, 1.0, 0.0, 0.0, 1.0, 1.0, 0.0, 1.0,    // v0-v1-v2-v3 front
        1.0, 1.0, 1.0, 1.0, 0.0, 1.0, 1.0, 0.0, 0.0, 1.0, 1.0, 0.0,    // v0-v3-v4-v5 right
        1.0, 1.0, 1.0, 1.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 1.0,    // v0-v5-v6-v1 up
        0.0, 1.0, 1.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 1.0,    // v1-v6-v7-v2 left
        0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 0.0, 0.0, 1.0,    // v7-v4-v3-v2 down
        1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0     // v4-v7-v6-v5 back
    ]);
    var indices = new Uint8Array([       // Indices of the vertices
        0, 1, 2, 0, 2, 3,         // front
        4, 5, 6, 4, 6, 7,         // right
        8, 9, 10, 8, 10, 11,      // up
        12, 13, 14, 12, 14, 15,    // left
        16, 17, 18, 16, 18, 19,    // down
        20, 21, 22, 20, 22, 23     // back
    ]);

    var o = new Object(); // Utilize Object to return multiple buffer objects together

    // Write vertex information to buffer object
    o.vertexBuffer = initArrayBufferForLaterUse(gl, vertices, 3, gl.FLOAT);
    o.indexBuffer = initElementArrayBufferForLaterUse(gl, indices, gl.UNSIGNED_BYTE);
    if (!o.vertexBuffer || !o.indexBuffer) return null;

    o.numIndices = indices.length;

    // Unbind the buffer object
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

    return o;

    function initArrayBufferForLaterUse(gl, data, num, type) {
        var buffer = gl.createBuffer();   // Create a buffer object
        if (!buffer) {
            console.log('Failed to create the buffer object');
            return null;
        }
        // Write date into the buffer object
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

        // Keep the information necessary to assign to the attribute variable later
        buffer.num = num;
        buffer.type = type;

        return buffer;
    }

    function initElementArrayBufferForLaterUse(gl, data, type) {
        var buffer = gl.createBuffer();   // Create a buffer object
        if (!buffer) {
            console.log('Failed to create the buffer object');
            return null;
        }
        // Write date into the buffer object
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data, gl.STATIC_DRAW);

        buffer.type = type;

        return buffer;
    }
}
// Assign the buffer objects and enable the assignment
function initAttributeVariable(gl, a_attribute, buffer) {
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.vertexAttribPointer(a_attribute, buffer.num, buffer.type, false, 0, 0);
    gl.enableVertexAttribArray(a_attribute);
}


function initSphere(numSubdivs, radius, center) {
    sphereVertices = [];
    normalsArray = [];
    tetrahedron(sphereVertices,

        vec4(0.0, 0.0, 1.0, 1),
        vec4(0.0, 0.942809, -0.333333, 1),
        vec4(-0.816497, -0.471405, -0.333333, 1),
        vec4(0.816497, -0.471405, -0.333333, 1),
        numSubdivs);

    function tetrahedron(s, a, b, c, d, n) {
        divideTriangle(s, a, b, c, n);
        divideTriangle(s, d, c, b, n);
        divideTriangle(s, a, d, b, n);
        divideTriangle(s, a, c, d, n);
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

            function triangle(s, a, b, c) {
                normalsArray.push(vec4(a[0], a[1], a[2], 0.0));
                normalsArray.push(vec4(b[0], b[1], b[2], 0.0));
                normalsArray.push(vec4(c[0], c[1], c[2], 0.0));
                s.push(mult(
                    translate(vec3(center[0], center[1], center[2])), 
                    mult(scalem(vec3(radius, radius, radius)), a ) 
                ));
                s.push(mult(
                    translate(vec3(center[0], center[1], center[2])), 
                    mult(scalem(vec3(radius, radius, radius)), b ) 
                ));
                s.push(mult(
                    translate(vec3(center[0], center[1], center[2])), 
                    mult(scalem(vec3(radius, radius, radius)), c ) 
                ));
            }
        }
    }
    return sphereVertices;
}
function initFramebufferObject(gl, width, height, i) {
    var framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    var renderbuffer = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);
    var texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0 + i);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.FLOAT, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    framebuffer.texture = texture;
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderbuffer);
    var status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    if (status !== gl.FRAMEBUFFER_COMPLETE) {
        console.log('Framebuffer object is incomplete: ' + status.toString());
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    framebuffer.width = width;
    framebuffer.height = height;
    return framebuffer;
}