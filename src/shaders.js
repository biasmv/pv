// Copyright (c) 2013-2014 Marco Biasini
// 
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to 
// deal in the Software without restriction, including without limitation the 
// rights to use, copy, modify, merge, publish, distribute, sublicense, and/or 
// sell copies of the Software, and to permit persons to whom the Software is 
// furnished to do so, subject to the following conditions:
// 
// The above copyright notice and this permission notice shall be included in 
// all copies or substantial portions of the Software.
// 
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE 
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING 
// FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER 
// DEALINGS IN THE SOFTWARE.

(function(exports) {

"use strict";

exports.shaders = {};

// line fragment shader, essentially uses the vertColor and adds some fog.
exports.shaders.LINES_FS = '\n\
precision highp float;\n\
\n\
varying vec4 vertColor;\n\
varying vec3 vertNormal;\n\
uniform float fogNear;\n\
uniform float fogFar;\n\
uniform vec3 fogColor;\n\
uniform bool fog;\n\
\n\
void main(void) {\n\
  gl_FragColor = vec4(vertColor);\n\
  if (gl_FragColor.a == 0.0) { discard; }\n\
  float depth = gl_FragCoord.z / gl_FragCoord.w;\n\
  if (fog) {\n\
    float fog_factor = smoothstep(fogNear, fogFar, depth);\n\
    gl_FragColor = mix(gl_FragColor, vec4(fogColor, gl_FragColor.w),\n\
                        fog_factor);\n\
  }\n\
}';

// hemilight fragment shader
exports.shaders.HEMILIGHT_FS = '\n\
precision highp float;\n\
\n\
varying vec4 vertColor;\n\
varying vec3 vertNormal;\n\
uniform float fogNear;\n\
uniform float fogFar;\n\
uniform vec3 fogColor;\n\
uniform bool fog;\n\
\n\
void main(void) {\n\
  float dp = dot(vertNormal, vec3(0.0, 0.0, 1.0));\n\
  float hemi = max(0.0, dp)*0.5+0.5;\n\
  hemi *= vertColor.a;\n\
  gl_FragColor = vec4(vertColor.rgb*hemi, vertColor.a);\n\
  if (gl_FragColor.a == 0.0) { discard; }\n\
  float depth = gl_FragCoord.z / gl_FragCoord.w;\n\
  if (fog) {\n\
    float fog_factor = smoothstep(fogNear, fogFar, depth);\n\
    gl_FragColor = mix(gl_FragColor, vec4(fogColor, gl_FragColor.w),\n\
                        fog_factor);\n\
  }\n\
}';

// hemilight vertex shader
exports.shaders.HEMILIGHT_VS = '\n\
attribute vec3 attrPos;\n\
attribute vec4 attrColor;\n\
attribute vec3 attrNormal;\n\
\n\
uniform mat4 projectionMat;\n\
uniform mat4 modelviewMat;\n\
varying vec4 vertColor;\n\
varying vec3 vertNormal;\n\
void main(void) {\n\
  gl_Position = projectionMat * modelviewMat * vec4(attrPos, 1.0);\n\
  vec4 n = (modelviewMat * vec4(attrNormal, 0.0));\n\
  vertNormal = n.xyz;\n\
  vertColor = attrColor;\n\
}';

// outline shader. mixes outlineColor with fogColor
exports.shaders.OUTLINE_FS = '\n\
precision highp float;\n\
varying float vertAlpha;\n\
\n\
uniform vec3 outlineColor;\n\
uniform float fogNear;\n\
uniform float fogFar;\n\
uniform vec3 fogColor;\n\
uniform bool fog;\n\
\n\
void main() {\n\
  gl_FragColor = vec4(outlineColor, vertAlpha);\n\
  if (gl_FragColor.a == 0.0) { discard; }\n\
  float depth = gl_FragCoord.z / gl_FragCoord.w;\n\
  if (fog) { \n\
    float fog_factor = smoothstep(fogNear, fogFar, depth);\n\
    gl_FragColor = mix(gl_FragColor, vec4(fogColor, vertAlpha),\n\
                        fog_factor);\n\
  }\n\
}';

// outline vertex shader. Expands vertices along the (in-screen) xy
// components of the normals.
exports.shaders.OUTLINE_VS = '\n\
precision highp float;\n\
\n\
attribute vec3 attrPos;\n\
attribute vec3 attrNormal;\n\
attribute vec4 attrColor;\n\
                                                                       \n\
uniform vec3 outlineColor;\n\
uniform mat4 projectionMat;\n\
uniform mat4 modelviewMat;\n\
varying float vertAlpha;\n\
\n\
void main(void) {\n\
  gl_Position = projectionMat * modelviewMat * vec4(attrPos, 1.0);\n\
  vec4 normal = modelviewMat * vec4(attrNormal, 0.0);\n\
  vertAlpha = attrColor.a;\n\
  gl_Position.xy += normal.xy*0.200;\n\
}';

exports.shaders.TEXT_VS = '\n\
precision highp float;\n\
\n\
attribute vec3 attrCenter;\n\
attribute vec2 attrCorner;\n\
uniform mat4 projectionMat;\n\
uniform mat4 modelviewMat;\n\
uniform mat4 rotationMat;\n\
varying vec2 vertTex;\n\
void main() { \n\
  gl_Position = projectionMat* modelviewMat* vec4(attrCenter, 1.0);\n\
  gl_Position.xy += attrCorner*gl_Position.w; \n\
  gl_Position.z -= gl_Position.w*0.0005;\n\
  vertTex = (attrCorner+abs(attrCorner))/(2.0*abs(attrCorner)); \n\
}';

exports.shaders.TEXT_FS = '\n\
precision highp float;\n\
\n\
uniform mat4 projectionMat;\n\
uniform mat4 modelviewMat;\n\
uniform sampler2D sampler;\n\
uniform float xScale;\n\
uniform float yScale;\n\
varying vec2 vertTex;\n\
void main() { \n\
  gl_FragColor = texture2D(sampler, vec2(vertTex.x*xScale, vertTex.y*yScale));\n\
}';

exports.shaders.SELECT_VS = '\n\
precision highp float;\n\
uniform mat4 projectionMat;\n\
uniform mat4 modelviewMat;\n\
attribute vec3 attrPos;\n\
attribute float attrObjId;\n\
\n\
varying float objId;\n\
\n\
void main(void) {\n\
  gl_Position = projectionMat * modelviewMat * vec4(attrPos, 1.0);\n\
  objId = attrObjId;\n\
}';

exports.shaders.SELECT_FS = '\n\
precision highp float;\n\
\n\
varying float objId;\n\
uniform int symId;\n\
\n\
int intMod(int x, int y) { \n\
  int z = x/y;\n\
  return x-y*z;\n\
}\n\
void main(void) {\n\
  // ints are only required to be 7bit...\n\
  int integralObjId = int(objId+0.5);\n\
  int red = intMod(integralObjId, 256);\n\
  integralObjId/=256;\n\
  int green = intMod(integralObjId, 256);\n\
  integralObjId/=256;\n\
  int blue = symId;\n\
  gl_FragColor = vec4(float(red), float(green), float(blue), 255.0)/255.0;\n\
}';
})(this);
