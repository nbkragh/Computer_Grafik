window.onload = function () {
    var canvas = document.getElementById("c");

    gl = canvas.getContext("webgl", { preserveDrawingBuffer: true });
    if (!gl) {
        console.log("no gl : " + gl)
    }
    gl.getExtension("WEBGL_color_buffer_float");
    if (!gl.getExtension('OES_texture_float')) {
        console.log('Warning: Unable to use an extension, some functionality may not work as intended');
    }
    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.pos_program = initShaders(gl, "vertex-shader", "pos-fragment-shader");
    gl.vol_program = initShaders(gl, "vertex-shader", "vol-fragment-shader");

    //bruger gl.DEPTH_BUFFER_BIT
    gl.enable(gl.DEPTH_TEST);

    gl.enable(gl.CULL_FACE);
    //gl.frontFace(gl.CW);
    gl.activeTexture(gl.TEXTURE1);
    load_raw_to_gl_vtex(gl, "Teddybear.raw", new RGrid(128, 128, 64));

    var cube = initVertexBuffers(gl);
    var depthBoxFbo = initFramebufferObject(gl, 512, 512, 0);
    var sphereBackFbo = initFramebufferObject(gl, 512, 512, 2);
    var sphereFrontFbo = initFramebufferObject(gl, 512, 512, 3);

    var radius = 0.3;
    var sphereVertices = [];
    console.log(sphereVertices)
    var sphereBuffer = gl.createBuffer();
    sphereBuffer.num = 4;
    sphereBuffer.type = gl.FLOAT;

    /// MVP///////////////////////////////////////////////////////////////////////////////

    var Mvalues = mat4(  // skal kun bruges af Sphere, som i første omgang placeres uden for cube
        [0.5, 0, 0, 2],
        [0, 0.01, 0, 2],
        [0, 0, 0.01, 2],
        [0, 0, 0, 1])

    var eye = vec3([0.5, -2.2, 0.5]);
    var at = vec3([0.5, 0.5, 0.5]);
    var up = vec3([0.0, 0.0, -1.0]);
    var Vvalues = mat4();
    var Pvalues = perspective(30, canvas.width / canvas.height, 1, 100);

    // Initialize trackball//////////////////////////////////////////////////////////////////

    var z_dir = vec3(eye[0] - at[0], eye[1] - at[1], eye[2] - at[2]);
    var eye_dist = Math.sqrt(z_dir[0] * z_dir[0] + z_dir[1] * z_dir[1] + z_dir[2] * z_dir[2]);
    var eye_dist_pan = vec3(eye_dist, 0, 0);
    var qrot = new Quaternion();
    var qinc = new Quaternion();
    qrot = qrot.make_rot_vec2vec(vec3(0, 0, 1), normalize(z_dir));
    var qrot_inv = new Quaternion(qrot);
    qrot_inv.invert();
    up = qrot_inv.apply(up);

    initEventHandlers(canvas, qrot, qinc, eye_dist_pan);

    // SETUP SHADER PROGRAMMER //////////////////////////////////////////////////////////////////////////////
    gl.useProgram(gl.pos_program);
    gl.pos_program.a_Position = gl.getAttribLocation(gl.pos_program, 'a_Position');
    gl.pos_program.M = gl.getUniformLocation(gl.pos_program, "M")
    gl.pos_program.V = gl.getUniformLocation(gl.pos_program, "V")
    gl.pos_program.P = gl.getUniformLocation(gl.pos_program, "P")

    gl.uniformMatrix4fv(gl.pos_program.M, false, flatten(mat4()));
    gl.uniformMatrix4fv(gl.pos_program.P, false, flatten(Pvalues));


    gl.useProgram(gl.vol_program);
    gl.vol_program.M = gl.getUniformLocation(gl.vol_program, "M")
    gl.vol_program.V = gl.getUniformLocation(gl.vol_program, "V")
    gl.vol_program.P = gl.getUniformLocation(gl.vol_program, "P")
    gl.uniformMatrix4fv(gl.vol_program.M, false, flatten(mat4()));
    gl.uniformMatrix4fv(gl.vol_program.P, false, flatten(Pvalues));

    gl.vol_program.a_Position = gl.getAttribLocation(gl.vol_program, 'a_Position');

    gl.vol_program.samplerPos = gl.getUniformLocation(gl.vol_program, 'samplerPos');
    gl.vol_program.samplerVol = gl.getUniformLocation(gl.vol_program, 'samplerVol');
    gl.vol_program.samplerSphereBack = gl.getUniformLocation(gl.vol_program, 'samplerSphereBack');
    gl.vol_program.samplerSphereFront = gl.getUniformLocation(gl.vol_program, 'samplerSphereFront');
    gl.vol_program.userPlane = gl.getUniformLocation(gl.vol_program, 'userPlane');
    gl.vol_program.stepLength = gl.getUniformLocation(gl.vol_program, 'stepLength');

    gl.uniform1f(gl.getUniformLocation(gl.vol_program, 'switchPicking'), 0.0);

    gl.uniform1i(gl.vol_program.samplerPos, 0); //depth box texture
    gl.uniform1i(gl.vol_program.samplerVol, 1); //bamse texture
    gl.uniform1i(gl.vol_program.samplerSphereBack, 2); // sphereback texture
    gl.uniform1i(gl.vol_program.samplerSphereFront, 3); // spherefront texture

    gl.uniform1f(gl.vol_program.stepLength, 0.004);


    /// RENDER ////////////////////////////////////////////////////////////////////////////////////////////////
    tick();
    function tick() {
        var rot_up = qrot.apply(up);
        var right = qrot.apply(vec3(1, 0, 0));
        var centre = vec3(
            at[0] - right[0] * eye_dist_pan[1] - rot_up[0] * eye_dist_pan[2],
            at[1] - right[1] * eye_dist_pan[1] - rot_up[1] * eye_dist_pan[2],
            at[2] - right[2] * eye_dist_pan[1] - rot_up[2] * eye_dist_pan[2]
        );
        var rot_eye = qrot.apply(vec3(0, 0, eye_dist_pan[0]));
        Vvalues = lookAt(
            vec3(rot_eye[0] + centre[0], rot_eye[1] + centre[1], rot_eye[2] + centre[2]),
            vec3(centre[0], centre[1], centre[2]),
            vec3(rot_up[0], rot_up[1], rot_up[2])
        );
        draw()
        requestAnimFrame(tick);
    }


    function draw() {
        /////FRAMEBUFFER
        
        gl.bindFramebuffer(gl.FRAMEBUFFER, depthBoxFbo);
        gl.cullFace(gl.FRONT);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.useProgram(gl.pos_program);

        initAttributeVariable(gl, gl.pos_program.a_Position, cube.vertexBuffer);
        gl.uniformMatrix4fv(gl.pos_program.V, false, flatten(Vvalues));
        gl.uniformMatrix4fv(gl.pos_program.M, false, flatten(mat4()));
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cube.indexBuffer);

        gl.drawElements(gl.TRIANGLES, cube.numIndices, cube.indexBuffer.type, 0);

        ///DRAW SPHERES TO TEXTURE

        // SPHERE BACK
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.GREATER);
        gl.bindFramebuffer(gl.FRAMEBUFFER, sphereBackFbo);
        gl.clearDepth(0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.clearDepth(1);
        gl.cullFace(gl.FRONT);

        initAttributeVariable(gl, gl.pos_program.a_Position, sphereBuffer)
        gl.drawArrays(gl.TRIANGLES, 0, sphereVertices.length );

        // SPHERE FRONT/
        //gl.disable(gl.DEPTH_TEST);
        gl.bindFramebuffer(gl.FRAMEBUFFER, sphereFrontFbo);
        gl.depthFunc(gl.LESS);
        gl.cullFace(gl.BACK);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        initAttributeVariable(gl, gl.pos_program.a_Position, sphereBuffer)
        gl.drawArrays(gl.TRIANGLES, 0, sphereVertices.length );
        
        
        /////DRAW TO CANVAS
        gl.useProgram(gl.vol_program);
        gl.depthFunc(gl.LESS);
        gl.cullFace(gl.BACK);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, depthBoxFbo.texture);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, gl.vtex);
        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, sphereBackFbo.texture);
        gl.activeTexture(gl.TEXTURE3);
        gl.bindTexture(gl.TEXTURE_2D, sphereFrontFbo.texture);

        gl.uniformMatrix4fv(gl.vol_program.V, false, flatten(Vvalues));

        initAttributeVariable(gl, gl.vol_program.a_Position, cube.vertexBuffer);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cube.indexBuffer);

        gl.drawElements(gl.TRIANGLES, cube.numIndices, cube.indexBuffer.type, 0);
    }


    /////// CANVAS CLICK /////////////////////////////////////////////////////////////////
    canvas.addEventListener("mouseup", function (event) {
        if (event.button === 0) {
            gl.useProgram(gl.vol_program);
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            gl.uniform1f(gl.getUniformLocation(gl.vol_program, 'switchPicking'), 1.0);
            var rect = event.target.getBoundingClientRect();
            var x = (event.clientX - rect.left);
            var y = (canvas.height - event.clientY + rect.top);

            draw();

            var colorHit = new Uint8Array(4);
            gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, colorHit);
            gl.uniform1f(gl.getUniformLocation(gl.vol_program, 'switchPicking'), 0.0);

            console.log(colorHit);
            if (colorHit[0] + colorHit[1] + colorHit[2] != 0) {
                sphereVertices = sphereVertices.concat( initSphere(4, radius, vec3(colorHit[0]/255 , colorHit[1]/255 , colorHit[2]/255)));
                gl.bindBuffer(gl.ARRAY_BUFFER, sphereBuffer);
                gl.bufferData(gl.ARRAY_BUFFER, flatten(sphereVertices), gl.STATIC_DRAW);
            }
        }
    })
    // \ f.(\x.(f(x x))\x.(f(x x )))


    // KNAPPER/////////////////////////////////////////////////////////////////////////////////////////////
    document.getElementById("frontView").addEventListener("click", function (event) {
        eye = vec3([0.5, -2.0, 0.5]);
        at = vec3([0.5, 0.5, 0.5]);
        up = vec3([0.0, 0.0, -1.0]);

        // Initialize trackball///////////////

        z_dir = vec3(eye[0] - at[0], eye[1] - at[1], eye[2] - at[2]);
        eye_dist = Math.sqrt(z_dir[0] * z_dir[0] + z_dir[1] * z_dir[1] + z_dir[2] * z_dir[2]);
        eye_dist_pan = vec3(eye_dist, 0, 0);
        qrot = new Quaternion();
        qinc = new Quaternion();
        qrot = qrot.make_rot_vec2vec(vec3(0, 0, 1), normalize(z_dir));
        qrot_inv = new Quaternion(qrot);
        qrot_inv.invert();
        up = qrot_inv.apply(up);

        initEventHandlers(canvas, qrot, qinc, eye_dist_pan);


    })

    document.getElementById("radius").addEventListener("input", function (event) {
        radius = event.target.value / 100;
        Mvalues = mult(
            translate(
                vec3(Mvalues[0][3], Mvalues[1][3], Mvalues[2][3])),
            mult(
                scalem(vec3(radius, radius, radius)),
                mat4()
            )
        );
    })


}

