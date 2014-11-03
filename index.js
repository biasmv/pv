var glMatrix = require('./src/gl-matrix.js');

window.vec3 = glMatrix.vec3;
window.vec4 = glMatrix.vec4;
window.mat3 = glMatrix.mat3;
window.mat4 = glMatrix.mat4;
window.quat = glMatrix.quat;

var core = require('./src/core.js');
window.derive = core.derive;
window.copy = core.copy;

var geo = require('./src/geom.js');
window.geom = geo;
var tracer = require('./src/trace.js');
window.BackboneTrace = tracer.backboneTrace;
var sym = require('./src/symmetry.js');
window.Assembly = sym.Assembly;
window.SymGenerator = sym.SymGenerator;
var mol = require('./src/mol.js');
window.mol = mol.mol;
var io = require('./src/io.js');
window.io = io.io;

var vertAssoc = require('./src/vert-assoc.js');
window.AtomVertexAssoc = vertAssoc.AtomVertexAssoc;
window.TraceVertexAssoc = vertAssoc.TraceVertexAssoc;

var bufferAlloc = require('./src/buffer-allocators.js');
window.PoolAllocator = bufferAlloc.PoolAllocator;

var VertexArrayBase = require('./src/vertex-array-base.js');
window.VertexArrayBase = VertexArrayBase.VertexArrayBase; 

var IndexedVertexArray = require('./src/indexed-vertex-array.js');
window.IndexedVertexArray =  IndexedVertexArray.IndexedVertexArray;

var VertexArray = require('./src/vertex-array.js');
window.VertexArray = VertexArray.VertexArray; 

var chain  = require('./src/chain-data.js');
window.MeshChainData = chain.MeshChainData;
window.LineChainData = chain.LineChainData;

var geom = require('./src/geom-builders.js');
window.TubeProfile = geom.TubeProfile;
window.ProtoSphere = geom.ProtoSphere;
window.ProtoCylinder = geom.ProtoCylinder;


var scene = require('./src/scene.js');
window.UniqueObjectIdPool = scene.UniqueObjectIdPool;
window.MeshGeom = scene.MeshGeom;
window.LineGeom = scene.LineGeom;
window.Range = scene.Range;

var render = require('./src/render.js');
window.render = render;

var shade = require('./src/shade.js');
window.rgb = shade.rgb;
window.forceRGB= shade.forceRGB;
window.color = shade.color;
window.interpolateColor = shade.interpolateColor;

var cam = require('./src/cam.js');
window.Cam = cam.Cam;
var shaders = require('./src/shaders.js');
window.shaders = shaders.shaders;

var FrameBuffer = require('./src/framebuffer.js');
window.FrameBuffer = FrameBuffer.FrameBuffer;

var slab = require('./src/slab.js');
window.AutoSlab = slab.AutoSlab;

require('./src/animation.js');

var pv = require('./src/viewer.js');
module.exports = pv;
