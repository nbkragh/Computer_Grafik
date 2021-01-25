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

    var vertices = [ vec2(0.0, 0.0), vec2(1.0, 0.0), vec2(1.0, 1.0)];
    var vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);
    
    var vertexPosition = gl.getAttribLocation(program, "a_Position");
    gl.vertexAttribPointer(vertexPosition, 2, gl.FLOAT, false, 0, 0);  
    gl.enableVertexAttribArray(vertexPosition)

    // opretter colors data
    var colors = [ vec3(1.0, 0.0, 0.0), vec3(0.0, 1.0, 0.0), vec3(0.0, 0.0, 1.0) ];
    
    //opretter en buffer til colors
    var colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);


    var vertexColors = gl.getAttribLocation(program, "a_Color");
    gl.vertexAttribPointer(vertexColors, 3 , gl.FLOAT, false, 0,0);
    gl.enableVertexAttribArray(vertexColors);

    //Lader vertexes definere en trekant 
    gl.drawArrays(gl.TRIANGLES, 0, vertices.length);
}