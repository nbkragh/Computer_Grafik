window.onload = function(){
    var canvas = document.getElementById("c");
    var   gl = canvas.getContext("webgl")
    if(!gl){
        console.log("no gl : "+gl)
    }
    //clear canvas med blå farve
    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
}