export function textureFromPixelArray(gl, dataArray, width, height) {
  var texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, width, height, 0, gl.RGBA, gl.FLOAT, dataArray);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return texture;
}

export function copyArrayToTexture(gl, array, texture, size) {
  const height = size ? Math.ceil(size / 2048) : 2048;
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, 2048, height, gl.RGBA, gl.FLOAT, array);
  gl.bindTexture(gl.TEXTURE_2D, null);
}

export function copyBufferToTexture(gl, buffer, texture, offset, size) {
  const height = size ? Math.ceil(size / 2048) : 2048;
  gl.bindBuffer(gl.PIXEL_UNPACK_BUFFER, buffer);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, 2048, height, gl.RGBA, gl.FLOAT, offset);
  gl.bindTexture(gl.TEXTURE_2D, null);
  gl.bindBuffer(gl.PIXEL_UNPACK_BUFFER, null);
}

function checkShaderError(gl, shader) {
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.log('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
  }
}

function checkLinkError(gl, program) {
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(program));
  }
}

export function createProgram(gl, vertex, fragment, beforeLinkFn) {
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

  if (beforeLinkFn) {
    beforeLinkFn(program);
  }

  gl.linkProgram(program);
  checkLinkError(gl, program);
  return program;
}

export function setUniforms(gl, program, uniforms) {
  uniforms.forEach(([name, type, value]) => {
    // if (show) {
    //   console.log({ name, type, value });
    // }
    gl[`uniform${type}`](gl.getUniformLocation(program, name), value);
  });
}

export function setupFullscreenTriangle(gl) {
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, 5120, 0, 0, 0);
  gl.bufferData(gl.ARRAY_BUFFER, new Int8Array([-3, 1, 1, -3, 1, 1]), 35044);
}

export function drawFullscreenTriangle(gl) {
  gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
  gl.drawArrays(6, 0, 3);
}

export function makeBuffer(gl, size, data) {
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, size, gl.DYNAMIC_DRAW);
  if (data) {
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, Float32Array.from(data));
  }
  return buf;
}

export function setupIndexVao(gl, program, buffer, attributeName) {
  const loc = gl.getAttribLocation(program, attributeName);

  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);

  // const buffer = makeBufferAndSetAttribute(gl, nodeIndexData, nodeIndexLoc);

  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(
    loc,
    1, // size (num components)
    gl.FLOAT, // type of data in buffer
    false, // normalize
    0, // stride (0 = auto)
    0, // offset
  );

  return vao;
}

export function readBuffer(gl, buffer, results, offset = 0, size = 0) {
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.getBufferSubData(
    gl.ARRAY_BUFFER,
    offset, // byte offset into GPU buffer,
    results,
    0,
    size,
  );
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  return results;
}

export async function fence(gl) {
  return new Promise(function (resolve) {
    var sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush(); // Ensure the fence is submitted.
    function check() {
      var status = gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (status == gl.SIGNALED) {
        gl.deleteSync(sync);
        resolve();
      } else {
        setTimeout(check, 0);
      }
    }
    setTimeout(check, 0);
  });
}

export function setupUbo(gl, program, paramName, varName, data) {
  // ==== START OF PART A ====

  // Get the index of the Uniform Block from any program
  const blockIndex = gl.getUniformBlockIndex(program, paramName);

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
  const uboVariableNames = [varName];

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

  index = gl.getUniformBlockIndex(program, paramName);
  gl.uniformBlockBinding(program, index, 0);

  // ==== END OF PART B ====

  // ==== START OF PART C ====

  gl.bindBuffer(gl.UNIFORM_BUFFER, uboBuffer);

  // Push some data to our Uniform Buffer

  gl.bufferSubData(gl.UNIFORM_BUFFER, uboVariableInfo[varName].offset, data, 0);

  gl.bindBuffer(gl.UNIFORM_BUFFER, null);

  // ==== END OF PART C ====
}
