var nodejs = (typeof window === 'undefined');
if(nodejs) {
  WebGL = require('../../index');
  Image = WebGL.Image;
  document = WebGL.document();
  alert=console.log;
  window = document;

  //Read and eval library
  var fs=require('fs');
  eval(fs.readFileSync(__dirname+ '/lightgl.js','utf8'));
}

document.setTitle("Scene manipulation");
requestAnimationFrame = document.requestAnimationFrame;

var gl = GL.create();
var angleX = 30;
var angleY = 45;
var mesh = GL.Mesh.cube({ normals: true });
var offset = new GL.Vector();
var shader = new GL.Shader('\
  varying vec3 normal;\
  void main() {\
    normal = gl_Normal;\
    gl_Position = gl_ModelViewProjectionMatrix * gl_Vertex;\
  }\
', '\
  varying vec3 normal;\
  void main() {\
    gl_FragColor = vec4(normal * 0.5 + 0.5, 1.0);\
  }\
');

var result;
var originalOffset;

gl.onmousedown = function(e) {
  var tracer = new GL.Raytracer();
  var ray = tracer.getRayForPixel(e.x, e.y);
  result = GL.Raytracer.hitTestBox(tracer.eye, ray, offset.subtract(1), offset.add(1));
  originalOffset = offset;
};

gl.onmousemove = function(e) {
  if (e.dragging) {
    if (result) {
      var tracer = new GL.Raytracer();
      var ray = tracer.getRayForPixel(e.x, e.y);
      var t = result.hit.subtract(tracer.eye).dot(result.normal) / ray.dot(result.normal);
      var hit = tracer.eye.add(ray.multiply(t));
      offset = originalOffset.add(hit.subtract(result.hit));
    } else {
      angleY += e.deltaX;
      angleX = Math.max(-90, Math.min(90, angleX + e.deltaY));
    }
    gl.ondraw();
  }
};

gl.ondraw = function() {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.loadIdentity();
  gl.translate(0, 0, -10);
  gl.rotate(angleX, 1, 0, 0);
  gl.rotate(angleY, 0, 1, 0);

  // Use push and pop to guard the transform so gl is left in world space when
  // gl.ondraw() ends. This way, when the GL.Raytracer reads the modelview and
  // projection matrices, the rays it generates will be in world space.
  gl.pushMatrix();
  gl.translate(offset.x, offset.y, offset.z);
  shader.draw(mesh);
  gl.popMatrix();
};

gl.fullscreen();
gl.enable(gl.DEPTH_TEST);
gl.animate();
