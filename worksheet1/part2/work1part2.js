window.onload = function(){
    var canvas = document.getElementById("c");
    var   gl = canvas.getContext("webgl")
    if(!gl){
        console.log("no gl : "+gl)
    }
    
    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    //loader og compiler et shader program
    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    //Sætter 3 vertices
    var vertices = [ vec2(0.0, 0.0), vec2(1.0, 0.0), vec2(1.0, 1.0)];
    //opretter en vertex buffer
    var vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    //indsætter de 3 vertices' data i bufferen
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

    //binder pointer-positioner til vertex shaderens "a_Position"-variabel
    var vertexPosition = gl.getAttribLocation(program, "a_Position");
    gl.vertexAttribPointer(vertexPosition, 2, gl.FLOAT, false, 0, 0);  
    gl.enableVertexAttribArray(vertexPosition)

    gl.drawArrays(gl.POINTS, 0, vertices.length);
}