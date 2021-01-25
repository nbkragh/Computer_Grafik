var clearColor = vec4(0.3921, 0.5843, 0.9294, 1.0);
var drawColor = vec4(1.0, 1.0, 1.0, 1.0);
var bufferIndex = 0;
var num_of_points_to_render = 0;
var max_num_vertices = 1024;
var drawmode = 0;
var pointsIndices = Array();
var trianglesIndices = Array();
var circlesIndices = Array();
var peripheryCount = 64;
var pointAndColorDataSize = sizeof['vec2'] + sizeof['vec4'];
var circleDataSize = (pointAndColorDataSize * 2) + (pointAndColorDataSize * peripheryCount);
var circleDataOffset = max_num_vertices * pointAndColorDataSize;
var bufferDataSize = circleDataOffset + (circleDataSize * max_num_vertices);

var gl;
var pointsBuffer;
window.onload = function () {

    var canvas = document.getElementById("c");
    gl = canvas.getContext("webgl", { preserveDrawingBuffer: true });
    if (!gl) {
        console.log("no gl : " + gl)
    }
    //gl.enable(gl.DEPTH_TEST)
    gl.clearColor(...clearColor);
    gl.clear(gl.COLOR_BUFFER_BIT);

    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    //-----------------------------------------------

    pointsBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, pointsBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, bufferDataSize, gl.STATIC_DRAW);

    var vertexPosition = gl.getAttribLocation(program, "a_Position");
    gl.vertexAttribPointer(vertexPosition, 2, gl.FLOAT, false, pointAndColorDataSize, 0);
    gl.enableVertexAttribArray(vertexPosition);

    var vertexColor = gl.getAttribLocation(program, "a_Color");
    gl.vertexAttribPointer(vertexColor, 4, gl.FLOAT, false, pointAndColorDataSize, 8);
    gl.enableVertexAttribArray(vertexColor);

    //-----------------------------------------------

    var clipClick;
    var priorClipClick;
    var triangleCounter = 0;
    var rect = canvas.getBoundingClientRect();
    canvas.addEventListener("click", function (event) {
        priorClipClick = clipClick;
        clipClick = vec2(
            ((event.clientX - rect.left) * 2) / canvas.width - 1,
            ((canvas.height - event.clientY + rect.top) * 2) / canvas.height - 1
        );
        gl.bufferSubData(gl.ARRAY_BUFFER, pointAndColorDataSize * bufferIndex, flatten(clipClick));
        gl.bufferSubData(gl.ARRAY_BUFFER, (pointAndColorDataSize * bufferIndex) + sizeof['vec2'], flatten(drawColor));

        
            pointsIndices.push(bufferIndex);
        if (drawmode == 1) {
            trianglesIndices.push( pointsIndices.pop());
        
        } else if (drawmode == 2) {
            
            circlesIndices.push(bufferIndex);
            if (circlesIndices.length % 2 == 0 && circlesIndices.length > 1) {
                let radius = Math.sqrt(Math.pow(priorClipClick[0] - clipClick[0], 2) + Math.pow(priorClipClick[1] - clipClick[1], 2));

                const circleData = populateCircleVertices(priorClipClick, peripheryCount, radius, drawColor);
                circlesIndices.push();
                gl.bufferSubData(gl.ARRAY_BUFFER, pointAndColorDataSize * (bufferIndex),
                    flatten(circleData)
                );
                pointsIndices.pop();
                pointsIndices.pop();

                for (let i = 0; i < peripheryCount; i++) {
                    circlesIndices.push(++bufferIndex)

                }
            };

        }
        console.log(pointsIndices.length + " points: " + pointsIndices)
        console.log(trianglesIndices.length + " triangles: " + trianglesIndices)
        console.log(circlesIndices.length + " circles:" + circlesIndices)

        num_of_points_to_render = Math.max(num_of_points_to_render, ++bufferIndex);

        bufferIndex %= max_num_vertices;
        render(gl, num_of_points_to_render);
    });

    document.getElementById("clearButton").addEventListener("click", function () {
        gl.clearColor(...clearColor);
        circlesIndices = [];
        trianglesIndices = [];
        pointsIndices = []
        bufferIndex = 0;
        render(gl, num_of_points_to_render);
    })
}

function render(gl) {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    if (pointsIndices.length > 0) {

        for (let index = 0; index < pointsIndices.length; index++) {

            gl.drawArrays(gl.POINTS, pointsIndices[index], 1);
        }
    }
    if (trianglesIndices.length > 0 ) {
        for (let i = 0; i+3 <= trianglesIndices.length; i += 3) {
            gl.drawArrays(gl.TRIANGLES, trianglesIndices[i], 3);
        }
        
        gl.drawArrays(gl.POINTS, trianglesIndices[trianglesIndices.length-(trianglesIndices.length%3)], (trianglesIndices.length%3));
    }
    if (circlesIndices.length > 0) {
        for (let i = 0; i < circlesIndices.length; i += peripheryCount + 2) {

            gl.drawArrays(gl.TRIANGLE_FAN, circlesIndices[i], peripheryCount + 2);

        }
    }
};
function populateCircleVertices(center, n, radius, edgeColor) {
    let x;
    let y;
    let angle;
    var coor = [];
    for (let i = 0; i < n; i++) {
        angle = (2 * Math.PI * i) / n;
        x = (radius * Math.cos(angle)) + center[0];
        y = (radius * Math.sin(angle)) + center[1];
        coor.push(x);
        coor.push(y);
        coor.push(...edgeColor);
    }
    coor.push(coor[0]);
    coor.push(coor[1]);
    coor.push(...edgeColor);
    //console.log(flatten(coor));
    return coor;
}

function changeClearColor(value) {
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
            clearColor = vec4(0.2, 0.8, 0.2, 1.0);
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

function changeDrawColor(value) {
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
            drawColor = vec4(0.2, 0.8, 0.2, 1.0);
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

function changeDrawMode(element) {
    [...document.getElementsByTagName("button")].forEach(element => {
        element.classList.remove("chosen");
    });
    element.classList.add("chosen");
    drawmode = element.value;
    //pointsIndices = [];
    //trianglesIndices = [];
    //render(gl, num_of_points_to_render);

}
