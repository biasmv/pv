// Copyright (c) 2013-2015 Marco Biasini
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

define({
// NOTE: The shader code below use the placeholder ${PRECISION} variable 
// for the shader precision. This values is replaced before compiling 
// the shader program with highp on iOS and mediump on all other devices. 
// This is required, because the outline shaders do not work well on iOS 
// with mediump, but some android devices do not support highp.

// line fragment shader, essentially uses the vertColor and adds some fog.
LINES_FS : '\n\
precision ${PRECISION} float;\n\
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
}',

// hemilight vertex shader
LINES_VS : '\n\
attribute vec3 attrPos;\n\
attribute vec4 attrColor;\n\
\n\
uniform mat4 projectionMat;\n\
uniform mat4 modelviewMat;\n\
varying vec4 vertColor;\n\
uniform float pointSize;\n\
void main(void) {\n\
  gl_Position = projectionMat * modelviewMat * vec4(attrPos, 1.0);\n\
  float distToCamera = vec4(modelviewMat * vec4(attrPos, 1.0)).z;\n\
  gl_PointSize = pointSize * 200.0 / abs(distToCamera); \n\
  vertColor = attrColor;\n\
}',

// hemilight fragment shader
HEMILIGHT_FS : '\n\
precision ${PRECISION} float;\n\
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
}',
// phong fragment shader
PHONG_FS : '\n\
precision ${PRECISION} float;\n\
\n\
varying vec4 vertColor;\n\
varying vec3 vertNormal;\n\
varying vec3 vertPos;\n\
uniform float fogNear;\n\
uniform float fogFar;\n\
uniform vec3 fogColor;\n\
uniform bool fog;\n\
uniform float zoom;\n\
\n\
void main(void) {\n\
  vec3 eyePos = vec3(0.0, 0.0, zoom);\n\
  float dp = dot(vertNormal, normalize(eyePos - vertPos));\n\
  float hemi = max(0.0, dp)*0.8+0.2;\n\
  hemi *= vertColor.a;\n\
  vec3 rgbColor = vertColor.rgb * hemi; \n\
  rgbColor += min(vertColor.rgb, 0.8) * pow(max(0.0, dp), 16.0);\n\
  //vec3 rgbColor = vertColor.rgb * hemi;\n\
  gl_FragColor = vec4(clamp(rgbColor, 0.0, 1.0), vertColor.a);\n\
  if (gl_FragColor.a == 0.0) { discard; }\n\
  float depth = gl_FragCoord.z / gl_FragCoord.w;\n\
  if (fog) {\n\
    float fog_factor = smoothstep(fogNear, fogFar, depth);\n\
    gl_FragColor = mix(gl_FragColor, vec4(fogColor, gl_FragColor.w),\n\
                        fog_factor);\n\
  }\n\
}',

// hemilight vertex shader
HEMILIGHT_VS : '\n\
attribute vec3 attrPos;\n\
attribute vec4 attrColor;\n\
attribute vec3 attrNormal;\n\
\n\
uniform mat4 projectionMat;\n\
uniform mat4 modelviewMat;\n\
varying vec4 vertColor;\n\
varying vec3 vertNormal;\n\
varying vec3 vertPos;\n\
void main(void) {\n\
  vertPos = (modelviewMat * vec4(attrPos, 1.0)).xyz;\n\
  gl_Position = projectionMat * modelviewMat * vec4(attrPos, 1.0);\n\
  vec4 n = (modelviewMat * vec4(attrNormal, 0.0));\n\
  vertNormal = n.xyz;\n\
  vertColor = attrColor;\n\
}',

// outline shader. mixes outlineColor with fogColor
OUTLINE_FS : '\n\
precision ${PRECISION} float;\n\
varying float vertAlpha;\n\
varying float vertSelect;\n\
\n\
uniform vec3 outlineColor;\n\
uniform float fogNear;\n\
uniform float fogFar;\n\
uniform vec3 fogColor;\n\
uniform bool fog;\n\
\n\
void main() {\n\
  gl_FragColor = vec4(mix(outlineColor, vec3(0.0, 1.0, 0.0), \n\
                          vertSelect), \n\
                      vertAlpha);\n\
  if (gl_FragColor.a == 0.0) { discard; }\n\
  float depth = gl_FragCoord.z / gl_FragCoord.w;\n\
  if (fog) { \n\
    float fog_factor = smoothstep(fogNear, fogFar, depth);\n\
    gl_FragColor = mix(gl_FragColor, vec4(fogColor, vertAlpha),\n\
                       fog_factor);\n\
  }\n\
}',

// outline vertex shader. Expands vertices along the (in-screen) xy
// components of the normals.
OUTLINE_VS : '\n\
precision ${PRECISION} float;\n\
\n\
attribute vec3 attrPos;\n\
attribute vec3 attrNormal;\n\
attribute vec4 attrColor;\n\
attribute float attrSelect;\n\
                                                                       \n\
uniform vec3 outlineColor;\n\
uniform mat4 projectionMat;\n\
uniform mat4 modelviewMat;\n\
varying float vertAlpha;\n\
varying float vertSelect;\n\
\n\
void main(void) {\n\
  gl_Position = projectionMat * modelviewMat * vec4(attrPos, 1.0);\n\
  vec4 normal = modelviewMat * vec4(attrNormal, 0.0);\n\
  vertAlpha = attrColor.a;\n\
  vertSelect = attrSelect;\n\
  gl_Position.xy += gl_Position.w*normal.xy*0.002 * (1.0 + attrSelect);\n\
  gl_Position.z += gl_Position.w*0.0001;\n\
}',

TEXT_VS : '\n\
precision ${PRECISION} float;\n\
\n\
attribute vec3 attrCenter;\n\
attribute vec2 attrCorner;\n\
uniform mat4 projectionMat;\n\
uniform mat4 modelviewMat;\n\
uniform mat4 rotationMat;\n\
varying vec2 vertTex;\n\
uniform float width;\n\
uniform float height;\n\
void main() { \n\
  vec4 pos = modelviewMat* vec4(attrCenter, 1.0);\n\
  pos.z += 4.0;\n\
  gl_Position = projectionMat * pos;\n\
  gl_Position.xy += vec2(width,height)*attrCorner*gl_Position.w; \n\
  vertTex = (attrCorner+abs(attrCorner))/(2.0*abs(attrCorner)); \n\
}',

TEXT_FS : '\n\
precision ${PRECISION} float;\n\
\n\
uniform mat4 projectionMat;\n\
uniform mat4 modelviewMat;\n\
uniform sampler2D sampler;\n\
uniform float xScale;\n\
uniform float yScale;\n\
varying vec2 vertTex;\n\
void main() { \n\
  vec2 texCoord = vec2(vertTex.x*xScale, vertTex.y*yScale);\n\
  gl_FragColor = texture2D(sampler, texCoord);\n\
  if (gl_FragColor.a == 0.0) { discard; }\n\
}',

SELECT_VS : '\n\
precision ${PRECISION} float;\n\
uniform mat4 projectionMat;\n\
uniform mat4 modelviewMat;\n\
uniform float pointSize;\n\
attribute vec3 attrPos;\n\
attribute float attrObjId;\n\
\n\
varying float objId;\n\
\n\
void main(void) {\n\
  gl_Position = projectionMat * modelviewMat * vec4(attrPos, 1.0);\n\
  float distToCamera = vec4(modelviewMat * vec4(attrPos, 1.0)).z;\n\
  gl_PointSize = pointSize * 200.0 / abs(distToCamera); \n\
  objId = attrObjId;\n\
}',

SELECT_FS : '\n\
precision ${PRECISION} float;\n\
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
  int blue = intMod(integralObjId, 256);\n\
  int alpha = symId;\n\
  gl_FragColor = vec4(float(red), float(green), \n\
                      float(blue), float(alpha))/255.0;\n\
}'

});

