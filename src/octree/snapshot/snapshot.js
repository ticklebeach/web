/* global vecToArray, vec, mul */

import { fragment } from './fragment_shader.js';

function checkShaderError(gl, shader) {
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.log('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
  }
}

function createProgram(gl, vertex, fragment) {
  const program = gl.createProgram();

  const vs = gl.createShader(gl.VERTEX_SHADER /*35633*/);
  gl.shaderSource(vs, vertex);
  gl.compileShader(vs);
  checkShaderError(gl, vs);
  gl.attachShader(program, vs);

  const fs = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fs, fragment);
  gl.compileShader(fs);
  checkShaderError(gl, fs);
  gl.attachShader(program, fs);

  // const fsrc = gl.getExtension('WEBGL_debug_shaders').getTranslatedShaderSource(fs);
  // console.log(fsrc);

  gl.linkProgram(program);
  return program;
}

function setupScene(gl, canvas, program, scene) {
  const { repo, boundsMin, boundsMax } = scene;

  gl.useProgram(program);

  gl.uniform3fv(gl.getUniformLocation(program, 'uHardcoded'), repo.hardcoded.flat());
  gl.uniform3fv(gl.getUniformLocation(program, 'uRandomized'), repo.randomized[0].flat());
  const materials = repo.mats.map((mat) => [mat.roughness, mat.metalness, 0, 0]).flat();
  gl.uniform4fv(gl.getUniformLocation(program, 'uMaterials'), materials);
  gl.uniform3fv(gl.getUniformLocation(program, 'uBoundsMin'), vecToArray(boundsMin));
  gl.uniform3fv(gl.getUniformLocation(program, 'uBoundsMax'), vecToArray(boundsMax));

  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, 5120, 0, 0, 0);
  gl.bufferData(gl.ARRAY_BUFFER, new Int8Array([-3, 1, 1, -3, 1, 1]), 35044);
  gl.clearColor(1, 0, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);
}

function setupUbo(gl, program, strokesData) {
  // ==== START OF PART A ====

  // Get the index of the Uniform Block from any program
  const blockIndex = gl.getUniformBlockIndex(program, 'Strokes');

  // Get the size of the Uniform Block in bytes
  const blockSize = gl.getActiveUniformBlockParameter(
    program,
    blockIndex,
    gl.UNIFORM_BLOCK_DATA_SIZE,
  );

  // Create Uniform Buffer to store our data
  const uboBuffer = gl.createBuffer();

  // Bind it to tell WebGL we are working on this buffer
  gl.bindBuffer(gl.UNIFORM_BUFFER, uboBuffer);

  // Allocate memory for our buffer equal to the size of our Uniform Block
  // We use dynamic draw because we expect to respecify the contents of the buffer frequently
  gl.bufferData(gl.UNIFORM_BUFFER, blockSize, gl.DYNAMIC_DRAW);

  // Unbind buffer when we're done using it for now
  // Good practice to avoid unintentionally working on it
  gl.bindBuffer(gl.UNIFORM_BUFFER, null);

  // Bind the buffer to a binding point
  // Think of it as storing the buffer into a special UBO ArrayList
  // The second argument is the index you want to store your Uniform Buffer in
  // Let's say you have 2 unique UBO, you'll store the first one in index 0 and the second one in index 1
  gl.bindBufferBase(gl.UNIFORM_BUFFER, 0, uboBuffer);

  // Name of the member variables inside of our Uniform Block
  const uboVariableNames = ['uStrokes'];

  // Get the respective index of the member variables inside our Uniform Block
  const uboVariableIndices = gl.getUniformIndices(program, uboVariableNames);

  // Get the offset of the member variables inside our Uniform Block in bytes
  const uboVariableOffsets = gl.getActiveUniforms(program, uboVariableIndices, gl.UNIFORM_OFFSET);

  // Create an object to map each variable name to its respective index and offset
  const uboVariableInfo = {};

  uboVariableNames.forEach((name, index) => {
    uboVariableInfo[name] = {
      index: uboVariableIndices[index],
      offset: uboVariableOffsets[index],
    };
  });

  // ==== END OF PART A ====

  // ==== START OF PART B ====

  let index;

  // The 3rd argument is the binding point of our Uniform Buffer
  // uniformBlockBinding tells WebGL to
  // link the Uniform Block inside of this program
  // to the Uniform Buffer at index X of our Special UBO ArrayList
  //
  // Remember that we placed our UBO at index 0 of our Special UBO ArrayList in line 213 in Part A

  index = gl.getUniformBlockIndex(program, 'Strokes');
  gl.uniformBlockBinding(program, index, 0);

  // ==== END OF PART B ====

  // ==== START OF PART C ====

  gl.bindBuffer(gl.UNIFORM_BUFFER, uboBuffer);

  // Push some data to our Uniform Buffer

  gl.bufferSubData(
    gl.UNIFORM_BUFFER,
    uboVariableInfo['uStrokes'].offset,
    strokesData.slice(0, 4000 * 4),
    0,
  );

  gl.bindBuffer(gl.UNIFORM_BUFFER, null);

  // ==== END OF PART C ====
}

function renderFrame(gl, _canvas, program, anim) {
  let { iMouse, time, date, timeDelta, iFrame, cameraPos, cameraLookAt, cameraZoom } = anim;

  timeDelta = new Date() / 1e3 - time;
  date = new Date() / 1e3;

  console.log(time, timeDelta);

  gl.uniform1f(gl.getUniformLocation(program, 'iTimeDelta'), timeDelta);
  gl.uniform1f(gl.getUniformLocation(program, 'iTime'), (time += timeDelta));
  gl.uniform1i(gl.getUniformLocation(program, 'iFrame'), iFrame++);
  gl.uniform1f(gl.getUniformLocation(program, 'iDate'), ~~date);
  gl.uniform4f(gl.getUniformLocation(program, 'iMouse'), ...iMouse);
  gl.uniform2f(
    gl.getUniformLocation(program, 'iResolution'),
    gl.drawingBufferWidth,
    gl.drawingBufferHeight,
  );
  //   gl.uniform4f(gl.getUniformLocation(program, 'iLastClick'), ...lastClick, 0);
  gl.uniform2fv(gl.getUniformLocation(program, 'uOffs'), anim.offs);

  gl.uniform3fv(gl.getUniformLocation(program, 'uCameraPos'), cameraPos);
  gl.uniform3fv(gl.getUniformLocation(program, 'uCameraLookAt'), cameraLookAt);
  gl.uniform1f(gl.getUniformLocation(program, 'uCameraZoom'), cameraZoom);

  gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
  gl.drawArrays(6, 0, 3);

  return Object.assign(anim, { time, timeDelta, date, iFrame });
}

function updateCamera(anim) {
  anim.cameraPos = vecToArray(mul(vec(-1.5, 2, -2.5), 1.5));
  anim.cameraLookAt = [0, 1.5, 0];
  anim.cameraZoom = 0.7 * 3;
}

const vertex = `\
#version 300 es
in vec2 position;
out vec2 fragCoord;
void main(){
    gl_Position=vec4(position,0,1);
    fragCoord=position;
}`;

export async function renderSnapshot(renderer, scene) {
  console.time('render');
  const { canvas, gl } = renderer;

  const program = createProgram(gl, vertex, fragment);

  // create the fb texture
  const fbTex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, fbTex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    scene.size.width,
    scene.size.height,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    null,
  );
  // create the fb
  const fbo = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  // attach the fb tex to the fb
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, fbTex, 0);
  // gl.bindTexture(gl.TEXTURE_2D, null);

  setupScene(gl, canvas, program, scene);
  console.timeLog('render');

  setupUbo(gl, program, scene.strokesData);

  let anim = {
    iMouse: [0, 0, 0, 0],
    lastClick: [0, 0, -99],
    time: new Date() / 1e3,
    date: new Date() / 1e3,
    timeDelta: 0,
    iFrame: 0,
    offs: [0, 0],
  };

  updateCamera(anim);

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ZERO);

  await new Promise((r) => setTimeout(r, 100));

  anim.offs = [0, 0];
  anim = renderFrame(gl, canvas, program, anim, scene);
  console.timeLog('render');
  await new Promise((r) => setTimeout(r, 100));

  gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE, gl.DST_ALPHA, gl.ONE);

  anim.offs = [1, 0];
  anim = renderFrame(gl, canvas, program, anim, scene);
  await new Promise((r) => setTimeout(r, 100));

  anim.offs = [0, 1];
  anim = renderFrame(gl, canvas, program, anim, scene);
  await new Promise((r) => setTimeout(r, 100));
  anim.offs = [1, 1];
  anim = renderFrame(gl, canvas, program, anim, scene);
  await new Promise((r) => setTimeout(r, 100));

  gl.bindFramebuffer(gl.READ_FRAMEBUFFER, fbo);
  gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
  gl.blitFramebuffer(
    0,
    0,
    gl.drawingBufferWidth,
    gl.drawingBufferHeight,
    0,
    0,
    gl.drawingBufferWidth,
    gl.drawingBufferHeight,
    gl.COLOR_BUFFER_BIT,
    gl.NEAREST,
  );

  console.timeLog('render');
}
