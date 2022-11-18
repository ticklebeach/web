/* global setupRepoModels, buildRepo, strokesToData */

import * as octree from './octree';
import { runScene } from './raymarcher';
import { allParts, themesMin, skyThemes } from '../../theming';

let w = window;

export async function build(hash, cameraChoice, voxelSize, sceneBounds, afterRender, modelDepth) {
  setupRepoModels();

  const repo = w.repo;

  const fullRender = modelDepth > 4;
  const { strokes } = buildRepo(hash, false, fullRender);

  const partMaterialsCount = {};
  for (let partName of allParts) {
    partMaterialsCount[partName] = {};
  }

  for (let layer of strokes[0].part) {
    for (let strokeIndex = 0; strokeIndex < layer.strokes.length; strokeIndex++) {
      const stroke = layer.strokes[strokeIndex];
      if (stroke.primitive !== 'attach' && stroke.mode !== 'sub') {
        if (partMaterialsCount[stroke.partName][stroke.material] === undefined) {
          partMaterialsCount[stroke.partName][stroke.material] = 0;
        }
        partMaterialsCount[stroke.partName][stroke.material] += 1;
      }
    }
  }

  const partMaterialsTrueOrder = {};
  for (let partName of allParts) {
    partMaterialsTrueOrder[partName] = Object.entries(partMaterialsCount[partName]);
    partMaterialsTrueOrder[partName] = partMaterialsTrueOrder[partName].sort((a, b) => b[1] - a[1]);
    partMaterialsTrueOrder[partName] = partMaterialsTrueOrder[partName].map(([material, i]) => {
      return [parseInt(material, 10), i];
    });
  }

  const normalHash = {};
  const themeHash = {};
  let skySel = 0;
  hash.split('-').map((key) => {
    const s = key.split(':');
    if (key.indexOf('theme') !== -1) {
      themeHash[s[1]] = parseInt(s[2]);
    } else if (key.indexOf('sky') !== -1) {
      skySel = parseInt(s[1]);
    } else {
      normalHash[s[0]] = parseInt(s[2]);
    }
  });

  const topSkyColor = skyThemes[skySel][1];
  const bottomSkyColor = skyThemes[skySel][0];

  // changes colors for themes deterministically
  const strokesThemed = strokes[0].part.map((part) => {
    const partName = part.strokes[0].partName;

    // get default stroke color for theme
    let partColorSource = partMaterialsTrueOrder[partName].map(([material]) => {
      return material;
    });
    // .map(([material]) => {
    //   return parseInt(material, 10);
    // });
    const materialsCount = partColorSource.length;

    // decided not to do clever things for complex models
    // use explicit colors for complex models
    let customColorKey = false;
    let sourceIndexes = [];
    if (partName === 'ground') {
      if (normalHash['ground'] === 2) {
        sourceIndexes = [3, 1, 2];
        customColorKey = true;
      } else if (normalHash['ground'] === 6) {
        sourceIndexes = [1, 2, 3];
        customColorKey = true;
      } else if (normalHash['ground'] === 7) {
        sourceIndexes = [0, 1, 3];
        customColorKey = true;
      } else if (normalHash['ground'] === 9) {
        sourceIndexes = [3, 4, 5];
        customColorKey = true;
      } else if (normalHash['ground'] === 10) {
        sourceIndexes = [1, 2, 3];
        customColorKey = true;
      } else if (normalHash['ground'] === 12) {
        sourceIndexes = [1, 2, 3];
        customColorKey = true;
      } else if (normalHash['ground'] === 15) {
        sourceIndexes = [0, 1, 3];
        customColorKey = true;
      }
    } else if (partName === 'hand') {
      switch (normalHash['hand']) {
        case 1:
          sourceIndexes = [3, 1, 2];
          customColorKey = true;
          break;
        case 4:
          sourceIndexes = [0, 1];
          customColorKey = true;
          break;
        case 5:
          sourceIndexes = [0, 1];
          customColorKey = true;
          break;
        case 8:
          sourceIndexes = [4, 5];
          customColorKey = true;
          break;
        // hand not themed
      }
    } else if (partName === 'floor') {
      switch (normalHash['floor']) {
        case 1:
          sourceIndexes = [1, 3];
          customColorKey = true;
          break;
        // floor not themed
      }
    }

    if (customColorKey) {
      partColorSource = sourceIndexes.map((index) => {
        return partMaterialsTrueOrder[partName][index][0];
      });
    }

    part.strokes = part.strokes.map((stroke) => {
      const themeNumber = themeHash[partName];
      if (themeNumber === undefined) {
        return stroke;
      }

      const themeMaterials = themesMin[themeNumber] || [];

      if (materialsCount <= themeMaterials.length || customColorKey) {
        if (partColorSource[0] == stroke.material) {
          stroke.material = themeMaterials[0];
        } else if (partColorSource[1] == stroke.material) {
          stroke.material = themeMaterials[1];
        } else if (partColorSource[2] == stroke.material) {
          stroke.material = themeMaterials[2];
        }
        //  else {
        //   const a = partColorSource.indexOf(stroke.material);
        //   if (a > -1) {
        //     console.log('part.strokes=part.strokes.map ~ a', a);
        //     stroke.material = themeMaterials[a % 3];
        //   }
        // }
      }

      return stroke;
    });

    return part;
  });

  const materialsUsed = [];
  strokesThemed.forEach((part) => {
    part.strokes.map((stroke) => {
      materialsUsed.push(stroke.material);
    });
  });

  const uniqueMaterialsUsed = [...new Set(materialsUsed)].sort((a, b) => a - b);
  const materialTranslation = {};
  let i = 0;
  for (let material of uniqueMaterialsUsed) {
    materialTranslation[material] = i;
    i++;
  }

  const hardcodedColors = repo.hardcoded;
  const randomColors = repo.randomized[0];

  const minColors = [];
  for (let i = 0; i < uniqueMaterialsUsed.length; i++) {
    const sourceMaterial = uniqueMaterialsUsed[i];
    if (sourceMaterial < 10000) {
      const color = hardcodedColors[(sourceMaterial - 1) / 10];
      minColors.push(color);
    } else {
      const color = randomColors[(sourceMaterial - 10000 - 1) / 10];
      minColors.push(color);
    }
  }

  // there is one missing color. need to remind myself how chris does special values
  minColors[0] = hardcodedColors[0];

  const strokesMinColors = strokesThemed.map((part) => {
    part.strokes = part.strokes.map((stroke) => {
      stroke.material = materialTranslation[stroke.material.toString()] * 10 + 1;
      return stroke;
    });
    return part;
  });

  // prepares for shader
  const strokesData = strokesToData(strokesMinColors);

  const canvas = document.createElement('canvas');
  document.body.appendChild(canvas);

  const gl = canvas.getContext('webgl2', {
    antialias: false,
    depth: false,
    scissor: false,
  });

  // use strokes to generate a octree of all the voxel data
  const context = {};
  const treeData = await octree.build(
    gl,
    strokesData,
    sceneBounds.min,
    sceneBounds.max,
    voxelSize,
    context,
  );

  // run the display shader
  const pixelScale = 1;
  const { main, setCamera, stop } = runScene(
    gl,
    canvas,
    pixelScale,
    repo,
    treeData,
    strokesData,
    sceneBounds.min,
    sceneBounds.max,
    cameraChoice,
    afterRender,
    minColors,
    topSkyColor,
    bottomSkyColor,
  );

  main();

  return { setCamera, stop, canvas, gl };
}
