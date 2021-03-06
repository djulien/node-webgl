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
  eval(fs.readFileSync(__dirname+ '/gazebo.js','utf8'));
}

document.setTitle("Render to texture");
requestAnimationFrame = document.requestAnimationFrame;

var angle = 0;
var gl = GL.create();
var mesh = GL.Mesh.load(gazebo);
var plane = GL.Mesh.plane({ coords: true });
var texture = GL.Texture.fromURL(__dirname+'/'+'texture.png');
var overlay = new GL.Texture(256, 256);
var meshShader = new GL.Shader('\
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
var planeShader = new GL.Shader('\
  varying vec2 coord;\
  void main() {\
    coord = gl_TexCoord.xy;\
    gl_Position = gl_ModelViewProjectionMatrix * gl_Vertex;\
  }\
', '\
  uniform sampler2D texture;\
  uniform sampler2D overlay;\
  varying vec2 coord;\
  void main() {\
    gl_FragColor = (texture2D(overlay, coord) + texture2D(texture, coord)) / 2.0;\
  }\
');

gl.onupdate = function(seconds) {
  angle += 45 * seconds;
};

gl.ondraw = function() {
  gl.loadIdentity();
  gl.translate(0, 0, -5);
  gl.rotate(30, 1, 0, 0);
  gl.rotate(angle, 0, 1, 0);

  overlay.drawTo(function() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.pushMatrix();
    gl.scale(0.01, 0.01, 0.01);
    meshShader.draw(mesh);
    gl.popMatrix();
  });

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  texture.bind(0);
  overlay.bind(1);
  planeShader.uniforms({
    texture: 0,
    overlay: 1
  }).draw(plane);
  texture.unbind(0);
  overlay.unbind(1);
};

gl.fullscreen();
gl.animate();
gl.enable(gl.DEPTH_TEST);
