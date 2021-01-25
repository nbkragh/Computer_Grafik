var clearColor = vec4(0.3921, 0.5843, 0.9294, 1.0);
var drawColor = vec4(1.0, 1.0, 1.0, 1.0);
var bufferIndex = 0;
var num_of_points_to_render = 0;
var max_num_vertices = 1024;
window.onload = function () {
    var canvas = document.getElementById("c");
    var gl = canvas.getContext("webgl")
    if (!gl) {
        console.log("no gl : " + gl)
    }
    
    gl.clearColor(...clearColor);
    gl.clear(gl.COLOR_BUFFER_BIT);

    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    //-----------------------------------------------

    document.getElementById("clearButton").addEventListener("click", function(event){
        gl.clearColor(...clearColor);
        newBuffer(gl);
        render(gl,num_of_points_to_render);
    })
    //-----------------------------------------------
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, max_num_vertices * (sizeof['vec2']+sizeof['vec4']), gl.STATIC_DRAW);
    
    newBuffer(gl);

    var clipClick;
    var rect = canvas.getBoundingClientRect();

    canvas.addEventListener("click", function (event) {
        
        clipClick = vec2(
             ((event.clientX - rect.left) * 2) / canvas.width - 1,
             ((canvas.height - event.clientY + rect.top) * 2) / canvas.height -1
             );
        gl.bufferSubData(gl.ARRAY_BUFFER, (sizeof['vec2']+sizeof['vec4'] )* bufferIndex, flatten(clipClick));
        gl.bufferSubData(gl.ARRAY_BUFFER, ((sizeof['vec2']+sizeof['vec4'] )* bufferIndex)+sizeof['vec2'], flatten(drawColor));
        num_of_points_to_render = Math.max(num_of_points_to_render, ++bufferIndex);
        
        bufferIndex %= max_num_vertices;
        render(gl,num_of_points_to_render);
    });
    
    var vertexPosition = gl.getAttribLocation(program, "a_Position");
    gl.vertexAttribPointer(vertexPosition, 2, gl.FLOAT, false, 24, 0);
    gl.enableVertexAttribArray(vertexPosition);
    var vertexColor = gl.getAttribLocation(program, "a_Color");
    gl.vertexAttribPointer(vertexColor, 4, gl.FLOAT, false, 24, 8);
    gl.enableVertexAttribArray(vertexColor);
    
}


function render(gl, numPoints) {
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.POINTS, 0, numPoints);
};

function newBuffer(gl){
    // gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    // gl.bufferData(gl.ARRAY_BUFFER, max_num_vertices * sizeof['vec2'], gl.STATIC_DRAW);
    
    bufferIndex = 0;
    num_of_points_to_render = 0;
}

function changeClearColor(value){
    switch (value) {
        case "0":
            clearColor = vec4(0.0, 0.0, 0.0, 1.0);
            break;
        case "1":
            clearColor = vec4(1, 0.0, 0.0, 1.0);
            break;
        case "2":
            clearColor = vec4(0.0, 0.0, 1.0, 1.0);
            break;
        case "3":
            clearColor = vec4(0.0, 1.0, 1.0, 1.0);
            break;
        case "4":
            clearColor = vec4(0.3, 0.1, 0.0, 1.0);
            break;
        case "5":
            clearColor = vec4(1.0, 1.0, 1.0, 1.0);
            break;
        default:
            clearColor = vec4(0.3921, 0.5843, 0.9294, 1.0);
            break;
    }

}

function changeDrawColor(value){
    switch (value) {
        case "0":
            drawColor = vec4(0.0, 0.0, 0.0, 1.0);
            break;
        case "1":
            drawColor = vec4(1, 0.0, 0.0, 1.0);
            break;
        case "2":
            drawColor = vec4(0.0, 0.0, 1.0, 1.0);
            break;
        case "3":
            drawColor = vec4(0.0, 1.0, 1.0, 1.0);
            break;
        case "4":
            drawColor = vec4(0.3, 0.1, 0.0, 1.0);
            break;
        case "5":
            drawColor = vec4(1.0, 1.0, 1.0, 1.0);
            break;
        default:
            drawColor = vec4(0.3921, 0.5843, 0.9294, 1.0);
            break;
    }

}