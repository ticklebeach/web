const randomColors = [
  [255, 171, 239], // pink 1
  [255, 105, 202], // pink 2
  [255, 0, 182], // pink 3

  [191, 1, 28], // light maroon
  [173, 5, 20], // mid maroon
  [88, 1, 12], // dark maroon

  [72, 115, 255], // blue
  [134, 198, 231], // light blue
  [26, 45, 89], // dark blue

  [25, 117, 113], // green
  [33, 92, 112], // light green
  [3, 61, 76],

  [243, 7, 19], // red
  [248, 55, 103], // red 3
  [0, 5, 10], // black

  /// SECOND 5

  [246, 235, 218], // beige
  [215, 199, 178], // beige
  [237, 221, 196], // beige

  [255, 218, 77], // golden 1
  [228, 169, 46], // golden 2
  [226, 130, 32], // golden 3

  [125, 54, 175], // purple 1
  [99, 44, 155], // purple 2
  [51, 9, 71], // purple 3

  // orange
  [255, 137, 44],
  [241, 62, 0],
  [253, 130, 23],

  /// halfway

  // white and black
  [242, 242, 242], //whiteish
  [26, 26, 26], // blackish
  [252, 243, 240], //whitish 2

  /// THIRD 5

  // yellow and black
  [242, 203, 4], // yellowish 1
  [242, 183, 7], // yellowish 2
  [26, 26, 26], // blackish 1

  // light pink x2 & blue
  [241, 189, 176], // light pink 1
  [241, 208, 208], // light pink 2
  [6, 136, 219], // light blue

  // yellow and brown
  [242, 203, 4], // yellowish 1
  [64, 49, 40], // brown 1
  [64, 36, 20], // brown 2

  // brown and blue
  [66, 67, 97], // blue 1
  [134, 198, 231], // blue 2
  [89, 15, 8], //brown 1

  // light blue and dark blues
  [228, 235, 242], // light blue 1
  [134, 198, 231], // light blue 2
  [26, 45, 89], // dark blue 1
];

// 1. 4 , 8

let themesMin = [
  [10001, 10011, 10021], // pink (done)
  [10031, 10041, 10051], // maroon (done)
  [10061, 10071, 10081], // blue (done)
  [10091, 10101, 10111], // green (done)
  [10121, 10131, 10141], // red + black (done)
  /// SECOND 5
  [10151, 10161, 10171], // beige (done)
  [10181, 10191, 10201], // golden (done)
  [10211, 10221, 10231], // purple (done)
  [10241, 10251, 10261], // orange (done)
  [10271, 10281, 10291], // white, black, white (done)
  /// THIRD 5
  [10301, 10311, 10321], // yellow and black (done)
  [10331, 10341, 10351], // light pink and blue (done)
  // [10361, 10371, 10381], // yellow and brown
  [10391, 10401, 10411], // brown and blue
  // [10421, 10431, 10441], // light blue and dark blue
];

let skyThemes = [
  // [
  //   [0.697, 0.874, 0.969],
  //   [0.62, 0.786, 0.965],
  // ],
  [
    [0.6, 0.805, 1.0],
    [0.6, 0.805, 1.0],
  ],
  [
    [0.828, 0.848, 0.942],
    [0.828, 0.848, 0.942],
  ],
  [
    [0.614, 0.926, 0.998],
    [0.614, 0.926, 0.998],
  ],
  [
    [0.961, 0.914, 0.976],
    [0.961, 0.914, 0.976],
  ],
  // [
  //   [0.855, 0.931, 0.881],
  //   [0.855, 0.931, 0.881],
  // ],
  // [
  //   [0.872, 0.918, 0.871],
  //   [0.872, 0.918, 0.871],
  // ],
  // [
  //   [0.749, 0.589, 0.611],
  //   [0.749, 0.589, 0.611],
  // ],
];

const allParts = [
  'body',
  'floor',
  'glasses',
  'shirt',
  'ground',
  'hand',
  'headtop',
  'neck',
  'shoes',
];

const themablePartNames = [
  'floor',
  'glasses',
  'ground',
  'hand',
  'headtop',
  'neck',
  'shirt',
  'shoes',
];
const OPTIONAL_MODELS = ['hand', 'glasses', 'ground', 'headtop', 'shirt', 'neck'];

const percentOfSkippedModels = 15;
const percentOfTheme = 80;
const themeMatchPercent = 50;

const indexesOfMinRepo = (minRepo) => {
  let indexes = {};
  for (let name of allParts) {
    indexes[name] = minRepo[name]
      .filter((w) => !!w)
      .map((w) => w.the.index)
      .sort((a, b) => a - b);
  }

  // console.log('Repo Min Index: ', JSON.stringify(indexes));

  return indexes;
};

const indexesOfMaxRepo = (maxRepo) => {
  let indexes = {};

  for (let name in maxRepo) {
    const s = name.split(':');
    if (indexes[s[0]] == undefined) {
      indexes[s[0]] = [];
    }
    // indexes[s[0]] ||= [];
    indexes[s[0]].push(parseInt(s[2]));
    indexes[s[0]] = indexes[s[0]].sort((a, b) => a - b);
  }

  // console.log('Repo Max Index: ', JSON.stringify(indexes));

  return indexes;
};

const selectionFromHash = (hash, repoModels) => {
  const numbers = [];
  const longHash = hash + hash + hash + hash + hash;

  for (let i = 0; i < longHash.length; i += 7) {
    const number = longHash.substr(i, 7);
    numbers.push(parseInt(number, 16));
  }

  const allSel = {};
  const sel = {};
  const themeFor = {};

  // random build of models
  for (let name of allParts) {
    const currentRandomNumber = numbers.pop();
    const models = repoModels[name];
    const modulo = currentRandomNumber % models.length;
    allSel[name] = models[modulo];
    sel[name] = models[modulo];
  }

  const themeMatch = numbers.pop() % themesMin.length;

  for (let name of allParts) {
    // theme choice
    if (themablePartNames.indexOf(name) !== -1) {
      const themeApplication = (numbers.pop() % 10) * 10 + (numbers.pop() % 10);
      // apply a theme 80% of the time
      if (themeApplication < percentOfTheme) {
        if (themeApplication < themeMatchPercent) {
          allSel[`theme:${name}`] = themeMatch;
          themeFor[name] = themeMatch;
        } else {
          const themeUnique = numbers.pop() % themesMin.length;
          allSel[`theme:${name}`] = themeUnique;
          themeFor[name] = themeUnique;
        }
      }
    }

    // remove model 15% of the time
    if (OPTIONAL_MODELS.indexOf(name) !== -1) {
      const optionalModels = (numbers.pop() % 10) * 10 + (numbers.pop() % 10);
      if (optionalModels < percentOfSkippedModels) {
        delete allSel[name];
        delete allSel[`theme:${name}`];
        delete sel[name];
        delete themeFor[name];
      }
    }
  }

  const skyRandom = numbers.pop();
  const sky = skyRandom % skyThemes.length;
  allSel.sky = sky;

  for (const name in allSel) {
    console.log('inside =>', name, allSel[name]);
  }

  return { allSel, sel, themeFor, sky };
};

const selToSelString = (sel) => {
  const selString = [];
  for (const name in sel) {
    if (name.indexOf('theme:') !== -1) {
      selString.push(`${name}:${sel[name]}`);
    } else if (name === 'sky') {
      selString.push(`${name}:${sel[name]}`);
    } else {
      const selIndex = sel[name];
      selString.push(`${name}:the:${selIndex}`);
    }
  }
  return selString.join('-');
};

exports.allParts = allParts;
exports.randomColors = randomColors;

exports.themesMin = themesMin;
exports.skyThemes = skyThemes;

exports.themablePartNames = themablePartNames;
exports.OPTIONAL_MODELS = OPTIONAL_MODELS;

exports.percentOfSkippedModels = percentOfSkippedModels;
exports.percentOfTheme = percentOfTheme;

exports.indexesOfMinRepo = indexesOfMinRepo;
exports.indexesOfMaxRepo = indexesOfMaxRepo;

exports.selectionFromHash = selectionFromHash;
exports.selToSelString = selToSelString;
