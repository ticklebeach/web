/* global vecToArray */

import {
  textureFromPixelArray,
  createProgram,
  setUniforms,
  setupFullscreenTriangle,
  drawFullscreenTriangle,
  copyBufferToTexture,
} from '../gl.js';

import * as camera from '../camera.js';
import * as orbit from '../orbit.js';

let w = window;

export function runScene(
  gl,
  canvas,
  pixelScale,
  repo,
  treeData,
  strokesData,
  boundsMin,
  boundsMax,
  cameraChoice,
  afterRender,
  colors,
  topSkyColor,
  bottomSkyColor,
) {
  const char = canvas;

  // moved this out of the shader so minification works
  // in vec2 uv;

  const vertex = `\
#version 300 es
in vec2 position;
out vec2 fragCoord;
void main(){
  gl_Position=vec4(position,0,1);
  fragCoord=position;
}`;

  let fragment = w.shaders.raymarcherFragment;

  let iFrame = 0;

  const charCanvas = gl;

  let program;
  let iMouse = [0, 0, 0, 0];
  let lastClick = [0, 0, -99, 0];

  let o = 0;
  let f = new Date() / 1e3;
  let d = 0;

  let y = 0;

  let setup;

  camera.setOrbit(orbit.setup());
  camera.setChoice(cameraChoice);

  let keepGoing = true;
  const stop = () => {
    keepGoing = false;
  };

  const main = () => {
    setup = () => {
      program = createProgram(gl, vertex, fragment);
      gl.useProgram(program);

      const { outNodes, resultBuffer, normalBuffer } = treeData;
      let treeTex = textureFromPixelArray(gl, outNodes, 2048, 2048);
      let resultTex = textureFromPixelArray(gl, null, 2048, 2048);
      copyBufferToTexture(gl, resultBuffer, resultTex, 0);
      let normalTex = textureFromPixelArray(gl, null, 2048, 2048);
      copyBufferToTexture(gl, normalBuffer, normalTex, 0);
      let strokesTex = textureFromPixelArray(gl, strokesData, 1024, 16);

      // outNodes.splice(0);
      gl.deleteBuffer(resultBuffer);
      gl.deleteBuffer(normalBuffer);

      const cam = camera.update();

      setUniforms(
        gl,
        program,
        [
          ['uColors', '3fv', colors.flat()],
          [
            'uMaterials',
            '4fv',
            repo.mats.map((mat) => [mat.roughness, mat.metalness, 0, 0]).flat(),
          ],
          ['uBoundsMin', '3fv', vecToArray(boundsMin)],
          ['uBoundsMax', '3fv', vecToArray(boundsMax)],
          ['iTreeTex', '1i', 0],
          ['iStrokesTex', '1i', 1],
          ['uResultTex', '1i', 2],
          ['uNormalTex', '1i', 3],
          ['uCameraPos', '3fv', vecToArray(cam.pos)],
          ['uCameraLookAt', '3fv', vecToArray(cam.lookAt)],
          ['uCameraZoom', '1f', cam.zoom],
          ['uBackgroundColor1', '3fv', topSkyColor],
          ['uBackgroundColor2', '3fv', bottomSkyColor],
        ],
        true,
      );

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, treeTex);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, strokesTex);
      gl.activeTexture(gl.TEXTURE2);
      gl.bindTexture(gl.TEXTURE_2D, resultTex);
      gl.activeTexture(gl.TEXTURE3);
      gl.bindTexture(gl.TEXTURE_2D, normalTex);

      setupFullscreenTriangle(gl);

      charCanvas.clearColor(1, 0, 0, 1);
      charCanvas.clear(charCanvas.COLOR_BUFFER_BIT);
    };

    oninput = setup;
    setup();

    function resize() {
      let height = w.innerHeight;
      let width = w.innerWidth;

      canvas.width = width * pixelScale;
      canvas.height = height * pixelScale;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    }
    w.resize = resize;
    w.addEventListener('resize', resize, false);
    resize();

    const frame = () => {
      d = new Date() / 1e3 - f;
      f = new Date() / 1e3;

      orbit.update();
      const cam = camera.update();

      setUniforms(gl, program, [
        ['iTimeDelta', '1f', d],
        ['iTime', '1f', (o += d)],
        ['iFrame', '1i', iFrame++],
        ['iDate', '1f', ~~f],
        ['iMouse', '4fv', iMouse],
        ['iResolution', '2fv', [gl.drawingBufferWidth, gl.drawingBufferHeight]],
        ['iLastClick', '4fv', lastClick],
        ['uCameraPos', '3fv', vecToArray(cam.pos)],
        ['uCameraLookAt', '3fv', vecToArray(cam.lookAt)],
        ['uCameraZoom', '1f', cam.zoom],
      ]);

      drawFullscreenTriangle(gl);
      afterRender(gl);

      if (keepGoing) {
        requestAnimationFrame(frame);
      }
    };
    frame();

    onmousedown = onmouseup = () => {
      y ^= 1;
    };

    function getMousePos(canvas, evt) {
      var rect = canvas.getBoundingClientRect();
      return { x: evt.clientX - rect.left, y: evt.clientY - rect.top };
    }

    char.onmousemove = function (e) {
      if (y) {
        const pos = getMousePos(char, e);
        (iMouse[0] = pos.x), (iMouse[1] = pos.y);
      }
    };

    char.onclick = function (e) {
      const pos = getMousePos(char, e);
      (iMouse[2] = pos.x), (iMouse[3] = pos.y);
      lastClick[0] = pos.x;
      lastClick[1] = pos.y;
      lastClick[2] = o;
    };
  };

  onload = function () {
    main();
  };

  function setCamera(choice) {
    const duration = 0.5; // seconds
    camera.moveChoice(choice, duration); // lerp to new camera
    // camera.setChoice(choice); // change camera immediately
  }

  return { main, setCamera, stop };
}
