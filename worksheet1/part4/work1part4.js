window.onload = function () {
    var canvas = document.getElementById("c");
    var gl = canvas.getContext("webgl")
    if (!gl) {
        console.log("no gl : " + gl)
    }

    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    var vertices = [vec2(0, 0.5), vec2(-0.5, 0), vec2(0.5, 0), vec2(0, -0.5)];
    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

    var vertexPosition = gl.getAttribLocation(program, "a_Position");
    gl.vertexAttribPointer(vertexPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vertexPosition);

    var theta = 0.0;
    var thetaLocation = gl.getUniformLocation(program, "theta");

    function render() {
        setTimeout(function () {
            requestAnimFrame(render);
            gl.clear(gl.COLOR_BUFFER_BIT);
            theta += 0.01;
            gl.uniform1f(thetaLocation, theta);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
            console.log("here")
        }, 20);

    };
    render();


}