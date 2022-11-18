/* global vec */

import * as raymarchOctree from './raymarch-octree/build-raymarch-octree.js';
import { selectionFromHash, selToSelString, indexesOfMinRepo } from '../theming';

const getQueryVariable = (variable) => {
  let query = w.location.search.substring(1);
  let vars = query.split('&');
  for (let i = 0; i < vars.length; i++) {
    let pair = vars[i].split('=');
    if (decodeURIComponent(pair[0]) == variable) {
      return decodeURIComponent(pair[1]);
    }
  }
};

let w = window;

let current = null;
let next = null;
let state = null;
let isBuilding = false;
let saveFrame = false;

let downloadCallback = false;
let downloadNumber = 'notdefined';

const renderSelected = async () => {
  isBuilding = true;

  if (next) {
    cleanUpCurrent();
    await waitAFrame();
    current = next;
    next = null;
    await waitAFrame();
  }

  const { camera, voxelSize, hash, modelDepth } = current;
  const bounds = {
    min: vec(-3.51, -1.1, -3.51),
    max: vec(3.51, 8, 3.51),
  };
  state = await raymarchOctree.build(hash, camera, voxelSize, bounds, afterRender, modelDepth);

  isBuilding = false;
};
window.renderSelected = renderSelected;

const passImageUp = (data) => {
  const message = {
    name: 'v-image',
    image: data,
  };
  parent.postMessage(message, '*');
};

// const downloadImageAs = (data) => {
//   let { imageData, imageName } = data;
//   var link = document.createElement('a');
//   link.download = imageName;
//   link.href = imageData;
//   document.body.appendChild(link);
//   link.click();
//   document.body.removeChild(link);
// };

// const makeRandomHash = () => {
//   const hashInput = Date.now();
//   const desiredHashArray = [];
//   const hashAsNumber = parseInt(hashInput, 16);

//   for (const name in w.repo.models) {
//     const models = w.repo.models[name].filter((m) => !!m);
//     const modulo = hashAsNumber % models.length;
//     const sel = models[modulo];
//     desiredHashArray.push(`${name}:the:${sel.the.index}`);
//   }

//   return desiredHashArray.join('-');
// };

// const setFirstModel = () => {
//   const desiredHashArray = [];

//   for (const name in w.repo.models) {
//     const models = w.repo.models[name].filter((m) => !!m);
//     const sel = models[0];
//     desiredHashArray.push(`${name}:the:${sel.the.index}`);
//   }

//   return desiredHashArray.join('-');
// };

const cleanUpCurrent = () => {
  state.stop();

  let canvases = document.querySelectorAll('canvas');
  // console.log('w.addEventListener ~ canvases', canvases.length);
  canvases.forEach((e) => e.remove());
  canvases = null;

  state = null;
};

async function waitAFrame() {
  return new Promise((r) => setTimeout(r, 0));
}

function afterRender(gl) {
  if (next && !isBuilding) {
    renderSelected();
  } else if (saveFrame) {
    saveFrame = false;
    const downloadPrefix = `image-${current.hash.replaceAll(':the:', '_').replaceAll(':', '_')}`;
    const data = {
      name: `${downloadPrefix}-c${current.camera}.png`,
      download: downloadCallback,
      downloadNumber: downloadNumber,
      data: gl.canvas.toDataURL(),
    };
    passImageUp(data);
  }
}

const genSelString = (seed) => {
  const repoIndex = indexesOfMinRepo(w.repo.models);
  console.log('genSelString ~ repoIndex', repoIndex);
  const { allSel } = selectionFromHash(seed, repoIndex);
  return selToSelString(allSel);
};

function setNext(params) {
  const replacement = { ...current, ...(next || {}), ...params };
  if (
    replacement.camera === current.camera &&
    replacement.voxelSize === current.voxelSize &&
    replacement.hash === current.hash &&
    replacement.models === current.models
  )
    return;

  next = replacement;
}

w.addEventListener('message', async (event) => {
  switch (event.data.name) {
    case 'e-models':
      setNext({ models: event.data.models });
      break;

    case 'e-image':
      downloadNumber = 'notdefined';
      downloadCallback = false;
      saveFrame = true;
      break;

    case 'e-down':
      // console.log('w.addEventListener ~ event.data', event.data);
      downloadNumber = event.data.number;
      downloadCallback = true;
      saveFrame = true;
      break;

    case 'e-seed':
      w.seed = event.data.seed;
      setNext({ hash: genSelString(event.data.seed) });
      break;

    // return data using in render
    case 'e-data': {
      const repoIndex = indexesOfMinRepo(w.repo.models);
      const message = {
        name: 'v-data',
        models: w.models,
        seed: w.seed,
        repoIndex: indexesOfMinRepo(w.repo.models),
        sel: selectionFromHash(w.seed, repoIndex),
        camera: current.camera,
        voxelSize: current.voxelSize,
      };
      parent.postMessage(message, '*');
      break;
    }

    // set seleceted and seed
    case 'e-sel': {
      w.seed = event.data.seed;

      const selArry = [];
      for (const name in event.data.selected) {
        selArry.push(`${name}:the:${event.data.selected[name]}`);
      }
      for (const name in event.data.themeFor) {
        selArry.push(`theme:${name}:${event.data.themeFor[name]}`);
      }
      selArry.push(`sky:${event.data.sky}`);

      setNext({ hash: selArry.join('-') });
      break;
    }

    // set camera location
    case 'e-loc': {
      current.camera = 7;
      state?.setCamera(current.camera);
      window.locX = event.data.locX;
      window.locY = event.data.locY;
      window.locZ = event.data.locZ;

      break;
    }

    // set camera number
    case 'e-cam':
      current.camera = event.data.camera;
      state?.setCamera(current.camera);
      break;

    // set voxel depth
    case 'e-voxel':
      setNext({ voxelSize: event.data.voxelSize });
      break;
  }
});

// render once on load using passed in query
const seedUsed = getQueryVariable('seed') || w.seed;

current = {
  camera: parseInt(getQueryVariable('cam')) || 7,
  voxelSize: parseInt(getQueryVariable('vox')) || 6,
  hash: genSelString(seedUsed),
  models: w.models,
  modelDepth: parseInt(getQueryVariable('mod')) || 10, // 10 is more than we have rn
};

console.log('Viewer Seed', seedUsed);
console.log('Viewer Camera', current.camera);

let removeImage = () => {
  var previewImage = document.getElementById('preview');
  previewImage.parentNode.removeChild(previewImage);
};

let clickToShow = () => {
  removeImage();
  window.renderSelected();
};
window.clickToShow = clickToShow;
