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


// this fragment shader prelude gets added to all fragment shader code 
// before  compiling. It essentially contains a selection of functions 
// required by  multiple fragment shaders, e.g. the code for screen-door-
// transparency, selection highlighting etc.
PRELUDE_FS : '\n\
precision ${PRECISION} float;\n\
uniform bool screenDoorTransparency;\n\
vec4 handleAlpha(vec4 inColor) {\n\
  if (screenDoorTransparency) {\n\
    ivec2 pxCoord = ivec2(gl_FragCoord.xy);\n\
    ivec2 mod = pxCoord - (pxCoord/2) * 2;\n\
    if (inColor.a < 0.99 &&\n\
        (inColor.a < 0.01 || mod.x != 0 || mod.y != 0)) { discard; }\n\
    return vec4(inColor.rgb, 1.0);\n\
  } else {\n\
    if (inColor.a == 0.0) { discard; }\n\
    return inColor;\n\
  } \n\
} \n\
\n\
int intMod(int x, int y) { \n\
  int z = x/y;\n\
  return x-y*z;\n\
}\n\
\n\
uniform vec4 selectionColor;\n\
\n\
vec3 handleSelect(vec3 inColor, float vertSelect) { \n\
  return mix(inColor, selectionColor.rgb, \n\
             step(0.5, vertSelect) * selectionColor.a); \n\
} \n\
\n\
uniform bool fog;\n\
uniform float fogNear;\n\
uniform float fogFar;\n\
uniform vec3 fogColor;\n\
vec3 handleFog(vec3 inColor) {\n\
  if (fog) {\n\
    float depth = gl_FragCoord.z / gl_FragCoord.w;\n\
    float fogFactor = smoothstep(fogNear, fogFar, depth);\n\
    return mix(inColor, fogColor, fogFactor);\n\
  } else {\n\
    return inColor;\n\
  }\n\
}',

// line fragment shader, essentially uses the vertColor and adds some fog.
LINES_FS : '\n\
varying vec4 vertColor;\n\
varying vec3 vertNormal;\n\
\n\
void main(void) {\n\
  gl_FragColor = handleAlpha(vertColor);\n\
  gl_FragColor.rgb = handleFog(gl_FragColor.rgb);\n\
}',

SELECT_LINES_FS : '\n\
precision ${PRECISION} float;\n\
\n\
varying float vertSelect;\n\
varying vec3 vertNormal;\n\
uniform float fogNear;\n\
uniform float fogFar;\n\
uniform vec3 fogColor;\n\
uniform bool fog;\n\
uniform vec4 selectionColor;\n\
\n\
void main(void) {\n\
  gl_FragColor = mix(vec4(0.0, 0.0, 0.0, 0.0), \n\
                     vec4(selectionColor.rgb, 1.0), vertSelect);\n\
  gl_FragColor.a = step(0.5, vertSelect);\n\
  if (gl_FragColor.a == 0.0) { discard; }\n\
  float depth = gl_FragCoord.z / gl_FragCoord.w;\n\
  if (fog) {\n\
    float fog_factor = smoothstep(fogNear, fogFar, depth);\n\
    gl_FragColor = mix(gl_FragColor, vec4(fogColor, gl_FragColor.w),\n\
                        fog_factor);\n\
  }\n\
}',
// hemilight vertex shader
SELECT_LINES_VS : '\n\
attribute vec3 attrPos;\n\
attribute float attrSelect;\n\
\n\
uniform mat4 projectionMat;\n\
uniform mat4 modelviewMat;\n\
uniform float pointSize;\n\
varying float vertSelect;\n\
void main(void) {\n\
  gl_Position = projectionMat * modelviewMat * vec4(attrPos, 1.0);\n\
  gl_Position.z += gl_Position.w * 0.000001; \n\
  float distToCamera = vec4(modelviewMat * vec4(attrPos, 1.0)).z;\n\
  gl_PointSize = pointSize * 200.0 / abs(distToCamera); \n\
  vertSelect = attrSelect;\n\
}',
 
SELECT_VS : '\n\
precision ${PRECISION} float;\n\
uniform mat4 projectionMat;\n\
uniform mat4 modelviewMat;\n\
uniform float pointSize;\n\
attribute vec3 attrPos;\n\
attribute float attrObjId;\n\
attribute vec4 attrColor;\n\
\n\
varying float objId;\n\
varying float objAlpha;\n\
\n\
void main(void) {\n\
  gl_Position = projectionMat * modelviewMat * vec4(attrPos, 1.0);\n\
  float distToCamera = vec4(modelviewMat * vec4(attrPos, 1.0)).z;\n\
  gl_PointSize = pointSize * 200.0 / abs(distToCamera); \n\
  objId = attrObjId;\n\
  objAlpha = attrColor.a;\n\
}',

SELECT_FS : '\n\
precision ${PRECISION} float;\n\
\n\
varying float objId;\n\
varying float objAlpha;\n\
uniform int symId;\n\
\n\
int intMod(int x, int y) { \n\
  int z = x/y;\n\
  return x-y*z;\n\
}\n\
void main(void) {\n\
  if (objAlpha == 0.0) { discard; }\n\
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
varying vec4 vertColor;\n\
varying vec3 vertNormal;\n\
varying float vertSelect;\n\
\n\
void main(void) {\n\
  float dp = dot(vertNormal, vec3(0.0, 0.0, 1.0));\n\
  float hemi = min(1.0, max(0.0, dp)*0.6+0.5);\n\
  gl_FragColor = vec4(vertColor.rgb*hemi, vertColor.a);\n\
  gl_FragColor.rgb = handleFog(handleSelect(gl_FragColor.rgb, vertSelect));\n\
  gl_FragColor = handleAlpha(gl_FragColor);\n\
}',
// phong fragment shader
PHONG_FS : '\n\
varying vec4 vertColor;\n\
varying vec3 vertNormal;\n\
varying vec3 vertPos;\n\
uniform float zoom;\n\
varying float vertSelect;\n\
\n\
void main(void) {\n\
  vec3 eyePos = vec3(0.0, 0.0, zoom);\n\
  float dp = dot(vertNormal, normalize(eyePos - vertPos));\n\
  float hemi = min(1.0, max(0.3, dp)+0.2);\n\
  //hemi *= vertColor.a;\n\
  vec3 rgbColor = vertColor.rgb * hemi; \n\
  //gl_FragDepthEXT = gl_FragCoord.z;\n\
  rgbColor += min(vertColor.rgb, 0.8) * pow(max(0.0, dp), 18.0);\n\
  rgbColor = handleSelect(rgbColor, vertSelect);\n\
  gl_FragColor = vec4(clamp(rgbColor, 0.0, 1.0), vertColor.a);\n\
  gl_FragColor.rgb = handleFog(gl_FragColor.rgb);\n\
  gl_FragColor = handleAlpha(gl_FragColor);\n\
}',

// hemilight vertex shader
HEMILIGHT_VS : '\n\
attribute vec3 attrPos;\n\
attribute vec4 attrColor;\n\
attribute vec3 attrNormal;\n\
attribute float attrSelect;\n\
\n\
uniform mat4 projectionMat;\n\
uniform mat4 modelviewMat;\n\
varying vec4 vertColor;\n\
varying vec3 vertNormal;\n\
varying vec3 vertPos;\n\
varying float vertSelect;\n\
void main(void) {\n\
  vertPos = (modelviewMat * vec4(attrPos, 1.0)).xyz;\n\
  gl_Position = projectionMat * modelviewMat * vec4(attrPos, 1.0);\n\
  vec4 n = (modelviewMat * vec4(attrNormal, 0.0));\n\
  vertNormal = n.xyz;\n\
  vertColor = attrColor;\n\
  vertSelect = attrSelect;\n\
}',

// outline shader. mixes outlineColor with fogColor
OUTLINE_FS : '\n\
varying float vertAlpha;\n\
varying float vertSelect;\n\
\n\
uniform vec3 outlineColor;\n\
\n\
void main() {\n\
  gl_FragColor = vec4(mix(outlineColor, selectionColor.rgb, \n\
                          step(0.5, vertSelect)), \n\
                      vertAlpha);\n\
  gl_FragColor.rgb = handleFog(gl_FragColor.rgb);\n\
  gl_FragColor = handleAlpha(gl_FragColor);\n\
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
uniform vec2 relativePixelSize;\n\
uniform float outlineWidth;\n\
\n\
void main(void) {\n\
  gl_Position = projectionMat * modelviewMat * vec4(attrPos, 1.0);\n\
  vec4 normal = modelviewMat * vec4(attrNormal, 0.0);\n\
  vertAlpha = attrColor.a;\n\
  vertSelect = attrSelect;\n\
  vec2 expansion = relativePixelSize * \n\
       (outlineWidth + 2.0 * step(0.5, attrSelect));\n\
  vec2 offset = normal.xy * expansion;\n\
  gl_Position.xy += gl_Position.w * offset;\n\
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

// spherical billboard fragment shader
SPHERES_FS : '\n\
#extension GL_EXT_frag_depth : enable\n\
\n\
varying vec2 vertTex;\n\
varying vec4 vertCenter;\n\
varying vec4 vertColor;\n\
varying float vertSelect;\n\
varying float radius;\n\
uniform mat4 projectionMat;\n\
uniform vec3 outlineColor;\n\
varying float border;\n\
uniform bool outlineEnabled;\n\
\n\
void main(void) {\n\
  float zz = dot(vertTex, vertTex);\n\
  if (zz > 1.0)\n\
    discard;\n\
  vec3 normal = vec3(vertTex.x, vertTex.y, sqrt(1.0-zz));\n\
  vec3 pos = vertCenter.xyz + normal * radius;\n\
  float dp = normal.z;\n\
  float hemi = sqrt(min(1.0, max(0.3, dp) + 0.2));\n\
  vec4 projected = projectionMat * vec4(pos, 1.0);\n\
  float depth = projected.z / projected.w;\n\
  gl_FragDepthEXT = (depth + 1.0) * 0.5;\n\
  vec3 rgbColor = vertColor.rgb * hemi; \n\
  rgbColor += min(vertColor.rgb, 0.8) * pow(max(0.0, dp), 18.0);\n\
  if (outlineEnabled) { \n\
    rgbColor = mix(rgbColor * hemi, outlineColor, step(border, sqrt(zz)));\n\
  } else { \n\
    rgbColor *= hemi; \n\
  } \n\
  rgbColor = handleSelect(rgbColor, vertSelect);\n\
  vec4 fogged = vec4(handleFog(rgbColor), vertColor.a);\n\
  gl_FragColor = handleAlpha(fogged);\n\
}',

SPHERES_VS : '\n\
precision ${PRECISION} float;\n\
attribute vec3 attrPos;\n\
attribute vec4 attrColor;\n\
attribute vec3 attrNormal;\n\
attribute float attrSelect;\n\
uniform vec2 relativePixelSize;\n\
uniform float outlineWidth;\n\
varying float radius;\n\
\n\
uniform mat4 projectionMat;\n\
uniform mat4 modelviewMat;\n\
uniform mat4 rotationMat;\n\
varying vec4 vertColor;\n\
varying vec2 vertTex;\n\
varying float border;\n\
varying vec4 vertCenter;\n\
varying float vertSelect;\n\
void main() {\n\
  vec3 d = vec3(attrNormal.xy * attrNormal.z, 0.0);\n\
  vec4 rotated = vec4(d, 0.0)*rotationMat;\n\
  gl_Position = projectionMat * modelviewMat * \n\
                (vec4(attrPos, 1.0)+rotated);\n\
  vertTex = attrNormal.xy;\n\
  vertColor = attrColor;\n\
  vertSelect = attrSelect;\n\
  vertCenter = modelviewMat* vec4(attrPos, 1.0);\n\
  float dist = length((projectionMat * vertCenter).xy - gl_Position.xy);\n\
  float dd = dist / gl_Position.w;\n\
  border = 1.0 - outlineWidth * 1.4 * length(relativePixelSize)/dd;\n\
  radius = attrNormal.z;\n\
}',

// spherical billboard fragment shader
SELECT_SPHERES_FS : '\n\
#extension GL_EXT_frag_depth : enable\n\
\n\
varying vec2 vertTex;\n\
varying vec4 vertCenter;\n\
varying vec4 vertColor;\n\
uniform mat4 projectionMat;\n\
varying float objId;\n\
varying float radius;\n\
uniform int symId;\n\
\n\
void main(void) {\n\
  float zz = dot(vertTex, vertTex);\n\
  if (zz > 1.0)\n\
    discard;\n\
  vec3 normal = vec3(vertTex.x, vertTex.y, sqrt(1.0-zz));\n\
  vec3 pos = vertCenter.xyz + normal * radius;\n\
  vec4 projected = projectionMat * vec4(pos, 1.0);\n\
  float depth = projected.z / projected.w;\n\
  gl_FragDepthEXT = (depth + 1.0) * 0.5;\n\
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
}',

SELECT_SPHERES_VS : '\n\
precision ${PRECISION} float;\n\
attribute vec3 attrPos;\n\
attribute vec4 attrColor;\n\
attribute vec3 attrNormal;\n\
attribute float attrObjId;\n\
varying float radius;\n\
\n\
uniform mat4 projectionMat;\n\
uniform mat4 modelviewMat;\n\
uniform mat4 rotationMat;\n\
varying vec2 vertTex;\n\
varying vec4 vertCenter;\n\
varying float objId;\n\
void main() {\n\
  vec3 d = vec3(attrNormal.xy * attrNormal.z, 0.0);\n\
  vec4 rotated = vec4(d, 0.0)*rotationMat;\n\
  //vec4 rotated = vec4(d, 0.0);\n\
  gl_Position = projectionMat * modelviewMat * \n\
                (vec4(attrPos, 1.0)+rotated);\n\
  vertTex = attrNormal.xy;\n\
  vertCenter = modelviewMat* vec4(attrPos, 1.0);\n\
  radius = attrNormal.z;\n\
  objId = attrObjId;\n\
}'

});

