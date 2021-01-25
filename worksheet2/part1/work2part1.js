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

    //pre-allokerer en buffer for at undgå 
    //at skulle genallokerer bufferer efterhånden som de bliver fyldt op
    var max_num_vertices = 1024;
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, max_num_vertices * sizeof['vec2'], gl.STATIC_DRAW);

    //koordinaterne på canvas oversat fra hvor der klikkes på skærmen
    var clipClick;

    /*Index i den pre-allokerede buffer hvor klik-koordinat data skal gemmes,
    kan bruges til at overskriver/redigerer tidligere indsat data*/
    var bufferIndex = 0;
    var num_of_points_to_render = 0;
    var rect = canvas.getBoundingClientRect();
    canvas.addEventListener("click", function (event) {
        
        clipClick = vec2(
             ((event.clientX - rect.left) * 2) / canvas.width - 1,
             ((canvas.height - event.clientY + rect.top) * 2) / canvas.height -1
             );
        //overskriver/redigerer data fra bufferIndex af i den pre-allokerede buffer
        gl.bufferSubData(gl.ARRAY_BUFFER, sizeof['vec2'] * bufferIndex, flatten(clipClick));

        num_of_points_to_render = Math.max(num_of_points_to_render, ++bufferIndex);
        //"resetter" bufferIndex hvis den overskrider max_num_vertices
        bufferIndex %= max_num_vertices;
        render(gl,num_of_points_to_render)
    });

    var vertexPosition = gl.getAttribLocation(program, "a_Position");
    gl.vertexAttribPointer(vertexPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vertexPosition);
    // function tick() {
    //     render(gl, num_of_points_to_render);
    //     requestAnimFrame(tick);

    // }
    // tick();
}
function render(gl, numPoints) {
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.POINTS, 0, numPoints);
};
