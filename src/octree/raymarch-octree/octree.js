/* global vecToArray, sub, div, add */

import {
  textureFromPixelArray,
  createProgram,
  setUniforms,
  copyArrayToTexture,
  makeBuffer,
  readBuffer,
  fence,
  setupIndexVao,
} from '../gl.js';

const bytesPerFloat = 4;
const floatsPerVec4 = 4;

export async function build(
  gl,
  strokesData,
  boundsMin,
  boundsMax,
  maxDepth,
  context,
  doubleMaxDepth = false,
) {
  const vertex = window.shaders.octreeVertex;

  await fence(gl);

  // console.timeLog('octree');

  const fs = `#version 300 es
  precision highp float;
  void main() {
  }
  `;

  const boundsSizeVec = sub(boundsMax, boundsMin);
  const center = add(boundsMin, div(boundsSizeVec, 2));

  // console.log({ boundsMin, boundsMax, boundsSizeVec, center });

  const outNodes = context.outNodes || new Float32Array(20000000);
  outNodes[0] = 1;
  outNodes[1] = 99;
  outNodes[2] = 99;
  outNodes[3] = 99;
  const inNodes = context.inNodes || new Float32Array(20000000);
  inNodes[0] = center.x;
  inNodes[1] = center.y;
  inNodes[2] = center.z;
  inNodes[3] = -1;

  let outTreeIndex = 1;
  let freeOutTreeIndex = outTreeIndex + 8 * 1;

  let depth = 0;
  let inNodeCount = 1;

  const nodeCountMax = 5000000;
  let nodeIndexBuffer = context.nodeIndexBuffer;
  if (!nodeIndexBuffer) {
    const nodeIndexData = new Float32Array(nodeCountMax);
    for (let i = 0; i < nodeCountMax; i++) {
      nodeIndexData[i] = i;
    }
    nodeIndexBuffer = makeBuffer(gl, nodeCountMax * bytesPerFloat, nodeIndexData);
  }

  const program =
    context.program ||
    createProgram(gl, vertex, fs, (program) => {
      gl.transformFeedbackVaryings(
        program,
        ['oNode', 'oResult', 'oCoord', 'oNormal'],
        gl.SEPARATE_ATTRIBS,
      );
    });

  const bufferSize = nodeCountMax * floatsPerVec4 * bytesPerFloat;

  const nodeBuffer = context.nodeBuffer || makeBuffer(gl, bufferSize, [1, 0, 0, 0]);
  const resultBuffer = context.resultBuffer || makeBuffer(gl, bufferSize, [1, 0, 0, 0]);
  const coordBuffer =
    context.coordBuffer || makeBuffer(gl, bufferSize, [...vecToArray(center), 99]);
  const normalBuffer = context.normalBuffer || makeBuffer(gl, bufferSize, [0, 0, 0, 0]);

  const nodeOutBufferData =
    context.nodeOutBufferData || new Float32Array(nodeCountMax * floatsPerVec4);
  const coordOutBufferData =
    context.coordOutBufferData || new Float32Array(nodeCountMax * floatsPerVec4);

  const tf = context.tf || gl.createTransformFeedback();

  const treeTex = context.treeTex || textureFromPixelArray(gl, inNodes, 2048, 2048);
  // if (context.treeTex) {
  //   copyArrayToTexture(gl, inNodes, treeTex);
  // }

  const vao = context.vao || setupIndexVao(gl, program, nodeIndexBuffer, 'iNodeIndex');

  await fence(gl);

  // console.timeLog('octree');

  const strokesTex = context.strokesTex || textureFromPixelArray(gl, strokesData, 2048, 16);
  if (context.strokesTex) {
    copyArrayToTexture(gl, strokesData, strokesTex, (strokesData[0] * 28) / 4);
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  await fence(gl);

  // console.timeLog('octree');

  // above this line is setup
  // ---------------------------------
  // below this line is "render" time

  gl.enable(gl.RASTERIZER_DISCARD);

  gl.useProgram(program);
  gl.bindVertexArray(vao);

  for (depth = 0; depth <= maxDepth; depth += 1) {
    const nodeCount = inNodeCount * 8;

    setUniforms(gl, program, [
      ['uDepth', '1i', depth],
      ['uBoundsSize', '3fv', vecToArray(boundsSizeVec)],
      ['uMaxDepth', '1i', maxDepth],
      ['uDoubleMaxDepth', '1i', doubleMaxDepth ? 1 : 0],
      ['iTime', '1i', 0],
      ['uTreeTex', '1i', 0],
      ['uStrokesTex', '1i', 1],
    ]);

    copyArrayToTexture(gl, inNodes, treeTex, nodeCount);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, treeTex);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, strokesTex);

    gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, tf);

    const bufOffset = outTreeIndex * floatsPerVec4 * bytesPerFloat;
    const bufSize = nodeCount * floatsPerVec4 * bytesPerFloat;
    gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, nodeBuffer);
    gl.bindBufferRange(gl.TRANSFORM_FEEDBACK_BUFFER, 1, resultBuffer, bufOffset, bufSize);
    gl.bindBufferRange(gl.TRANSFORM_FEEDBACK_BUFFER, 2, coordBuffer, bufOffset, bufSize);
    gl.bindBufferRange(gl.TRANSFORM_FEEDBACK_BUFFER, 3, normalBuffer, bufOffset, bufSize);

    gl.beginTransformFeedback(gl.POINTS);
    gl.drawArrays(gl.POINTS, 0, nodeCount);
    gl.endTransformFeedback();
    gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);

    await fence(gl);

    // console.timeLog('octree');

    let currTreeIndex = outTreeIndex;
    let nextNodeCount = 0;
    // let leaves = 0;

    const nodeOut = readBuffer(gl, nodeBuffer, nodeOutBufferData, 0, nodeCount * floatsPerVec4);
    const coordOut = readBuffer(
      gl,
      coordBuffer,
      coordOutBufferData,
      bufOffset,
      nodeCount * floatsPerVec4,
    );

    for (let i = 0; i < nodeCount; i++) {
      const nodeType = nodeOut[i * 4 + 0];
      const coord = [coordOut[i * 4 + 0], coordOut[i * 4 + 1], coordOut[i * 4 + 2]];

      // if (nodeType == 0) {
      //   leaves += 1;
      // }

      outNodes[currTreeIndex * 4 + 0] =
        nodeType > 0.1 // recurse
          ? freeOutTreeIndex
          : nodeType < -0.1 // dead
          ? -1
          : 0; // leaf
      outNodes[currTreeIndex * 4 + 1] = 99;
      outNodes[currTreeIndex * 4 + 2] = 99;
      outNodes[currTreeIndex * 4 + 3] = 99;
      currTreeIndex += 1;

      if (nodeType > 0.1) {
        //   if ((depth < maxDepth && nodeType > 0.1) || (depth === maxDepth && nodeType === 0)) {
        freeOutTreeIndex += 8;
        if (depth < maxDepth) {
          inNodes[nextNodeCount * 4 + 0] = coord[0];
          inNodes[nextNodeCount * 4 + 1] = coord[1];
          inNodes[nextNodeCount * 4 + 2] = coord[2];
          inNodes[nextNodeCount * 4 + 3] = 1;
          nextNodeCount += 1;
        }
      }
    }

    // console.log({
    //   depth,
    //   nextNodeCount,
    //   leaves,
    // });
    // console.log({ nodeOut: nodeOut.slice(0, nodeCount * 4) });
    // console.log({ inNodes: inNodes.slice(0, nextNodeCount * 4) });
    outTreeIndex = currTreeIndex;
    // if (depth < maxDepth) {
    inNodeCount = nextNodeCount;
    // }

    // console.timeLog('octree');
  }

  gl.useProgram(null);
  gl.bindVertexArray(null);

  gl.disable(gl.RASTERIZER_DISCARD);

  Object.assign(context, {
    outNodes,
    inNodes,
    program,
    tf,
    strokesTex,
    treeTex,
    nodeOutBufferData,
    coordOutBufferData,
    nodeBuffer,
    resultBuffer,
    coordBuffer,
    normalBuffer,
    vao,
    nodeIndexBuffer,
  });

  // console.timeLog('octree');

  return { inNodeCount, nodeBuffer, resultBuffer, normalBuffer, coordBuffer, outNodes };
}
