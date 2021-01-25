// load_raw.js (c) DTU Compute 2014
// Written by Jeppe Revall Frisvad
// Based on the C++ version in GEL by Andreas Bærentzen

// RGrid object
// Constructor
var RGrid = function (x_dim, y_dim, z_dim) {
  this.x_dim = x_dim;
  this.y_dim = y_dim;
  this.z_dim = z_dim;
  this.xy_dim = x_dim*y_dim;
  this.data = new Uint8Array(x_dim * y_dim * z_dim);
  this.readystate = 0;
}

function load_raw(filename, grid) {
  var request = new XMLHttpRequest();
  request.onreadystatechange = function () {
    grid.readystate = request.readystate;
    if (request.readyState === 4 && request.status !== 404) {
      var arraybuffer = request.response;
      if (arraybuffer) {
        var data = new Uint8Array(arraybuffer);
        grid.data.set(data);
      }
      else {
        console.log("RAW file loading error.");
        return;
      }
    }
  };
  request.open('GET', filename, true); // Create a request to acquire the file
  request.responseType = "arraybuffer";
  request.send();                      // Send the request
}

function load_raw_to_gl_vtex(gl, filename, grid) {
  var request = new XMLHttpRequest();
  request.onreadystatechange = function () {
    grid.readystate = request.readystate;
    if (request.readyState === 4 && request.status !== 404) {
      var arraybuffer = request.response;
      if (arraybuffer) {
        var data = new Uint8Array(arraybuffer);
        grid.data.set(data);
      }
      else {
        console.log("RAW file loading error.");
        return;
      }
      gl.vtex = init_vol_texture(gl, grid);
      if (!gl.vtex) {
        console.log('Failed to create volume texture from raw data.');
        return;
      }
    }
  };
  request.open('GET', filename, true); // Create a request to acquire the file
  request.responseType = "arraybuffer";
  request.send();                      // Send the request
}

function init_vol_texture(gl, grid) {
  var texture = gl.createTexture();
  if (!texture) {
    console.log('Failed to create a texture object');
    return null;
  }
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, grid.x_dim, grid.y_dim * grid.z_dim, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, grid.data);
  gl.bindTexture(gl.TEXTURE_2D, null);
  return texture;
}