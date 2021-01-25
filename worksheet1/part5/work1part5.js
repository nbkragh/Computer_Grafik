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

    var radius = 0.3;
    var vertices = populateCircleVertices([[0,0,1.0,1.0,1.0,1.0]],64,radius,[1.0,1.0,0.5,1.0]);

    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

    var vertexPosition = gl.getAttribLocation(program, "a_Position");
    gl.vertexAttribPointer(vertexPosition, 2, gl.FLOAT, false, 4*6, 0);
    gl.enableVertexAttribArray(vertexPosition);

    var vertexColors = gl.getAttribLocation(program, "a_Color");
    gl.vertexAttribPointer(vertexColors, 4 , gl.FLOAT, false, 4*6, 4*2);
    gl.enableVertexAttribArray(vertexColors);

    var transform = vec4(0.0, 0.0, 0.0, 0.0);
    var transVector = gl.getUniformLocation(program, "transVector");
    var direction = 1;
    function tick() {
        if(0>1-radius-Math.sqrt(transform[0]*transform[0] + transform[1]*transform[1] )){
            direction *= -1;
        }
        transform[1] += direction*0.01;
        gl.uniform4fv(transVector, transform);
        render(gl, vertices.length);
        requestAnimFrame(tick);

    }
    tick();

}
function render(gl, numPoints) {
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLE_FAN, 0, numPoints);
};

function populateCircleVertices(startPos, n,radius, edgeColor) {
    let x;
    let y;
    let angle;
    for (let i = 1; i <= n; i++) {
        angle = (2*Math.PI*i)/n;
        x = radius*Math.cos(angle);
        y = radius*Math.sin(angle);
        startPos.push([x,y,...edgeColor]);
    }
    startPos.push(startPos[1]);
    console.log(startPos);
    return startPos;
}