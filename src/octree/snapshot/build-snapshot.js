/* global vec, buildRepo, strokesToData */

import { renderSnapshot } from './snapshot';

export function build(hash) {
  const { repo, strokes } = buildRepo(hash);
  // strokes has: { part, pos }

  // +x is character left
  // +z is character back
  // const boundsMin = vec(-3.51, -1.1, -3.51);
  // const boundsMax = vec(3.51, 6, 3.51);

  const boundsMin = vec(-3.51, -1.1, -3.51);
  const boundsMax = vec(3.51, 6, 3.51);

  // serialize stroke list for texture
  const strokesData = strokes.map((s) => ({
    strokes: strokesToData(s.part),
    bounds: s.bounds,
    pos: s.pos,
    maxDepth: s.maxDepth,
  }));

  const displaySizeFactor = 1;
  const size = { width: 350, height: 350 };
  const scene = { size, repo, strokesData, boundsMin, boundsMax };

  const canvas = document.createElement('canvas');
  document.body.appendChild(canvas);
  const gl = canvas.getContext('webgl2', {
    antialias: false,
    depth: false,
    scissor: false,
  });
  canvas.width = scene.size.width;
  canvas.height = scene.size.height;
  canvas.style.width = `${scene.size.width * displaySizeFactor}px`;
  canvas.style.height = `${scene.size.height * displaySizeFactor}px`;
  const renderer = { canvas, gl };
  window.gl = gl;

  renderSnapshot(renderer, scene);
}
