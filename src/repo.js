let w = window;

let decodeNorm = (str) => {
  const ENCODING = '0123456789+-.,;/';
  const B64CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+=';

  const bytes = str.split('').map((c) => B64CHARS.indexOf(c));
  const out = [];
  let bits = 0;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const byte1 = bytes[Math.floor(bits / 6)];
    if (bits % 6 === 0) {
      out.push(byte1 & 0b1111);
    } else if (bits % 6 === 2) {
      out.push((byte1 & 0b111100) >> 2);
    } else {
      const byte2 = bytes[Math.floor((bits + 4) / 6)];
      out.push(((byte1 & 0b110000) >> 4) + ((byte2 & 0b11) << 2));
    }
    bits += 4;
    if (Math.floor((bits + 2) / 6) >= bytes.length) break;
  }

  return out.map((n) => ENCODING[n]).join('');
};

// these map from norm -> compressed -> norm form
const SIDES = [
  //'left', 'right',
  'the',
];
const PARTS = [
  'arm',
  'leg',
  'mouth',
  'eyes',
  'body',
  'ground',
  'glasses',
  'tat',
  'shoes',
  'mustache',
  'headtop',
  'hand',
  'floor',
  'neck',
  'hat',
  'shirt',
];
const MODES = ['add', 'sub', 'int', 'rep'];

///////////////////////////////////////////////////////////////////////////////
// Parsers helpers
///////////////////////////////////////////////////////////////////////////////

let inputSubstring = (input) => {
  return input.string.substring(input.index);
};

let parseBoolean = (input) => {
  const bool = inputSubstring(input)[0] === '+';
  input.index += 1;
  return bool;
};

let parseNumber = (input) => {
  const str = inputSubstring(input);
  let chars = str.match(/^[+-][\d.]*/);
  if (chars) {
    chars = chars[0];
    if (chars.length === 1) {
      if (chars[0] === '+') {
        input.index += 1;
        return 0;
      } else {
        console.error('error parsing number', { input });
      }
    } else {
      input.index += chars.length;
      return parseFloat(chars);
    }
  } else {
    console.error('error parsing number', { input });
  }
};

const PRIMITIVES = [
  'attach',
  'cube',
  'cylinder',
  'bezier',
  'joint',
  'sphere',
  'triangle',
  'polygon',
];

let parsePrimitive = (input) => {
  return PRIMITIVES[parseNumber(input)];
};

let parseNumbers = (input, count) => {
  const numbers = [];
  for (let i = 0; i < count; i++) {
    numbers.push(parseNumber(input));
  }
  return numbers;
};

///////////////////////////////////////////////////////////////////////////////
// Parse Stroke and Materials
///////////////////////////////////////////////////////////////////////////////

const FIELD_NAMES = [
  'blend',
  'shell',
  'hole',
  'bevel',
  'round',
  'cone',
  'lineWidth',
  'vertexPosition',
  'torus',
  'mirrorX',
  'material',
  'blink',
  'star',
  'vertexCount',
  'offsX',
];

const FIELDS = {
  cube: 'bshbrc__tmm___o',
  cylinder: 'bsh_rc__tmm___o',
  bezier: 'bsh_rclvtmm___o',
  joint: 'bs___c__tmm___o',
  sphere: 'bs_______mmb__o',
  triangle: 'bshbrc_vtmm___o',
  polygon: 'bshbrc____m_sn_',
};

const FIELD_TYPES = 'nnnnnnnnbbnbnnn';

let parseStroke = (partName, input) => {
  const primitive = parsePrimitive(input);
  let stroke = { primitive };

  FIELD_NAMES.forEach((field, i) => {
    stroke[field] = FIELD_TYPES[i] === 'n' ? 0 : false;
  });

  if (primitive === 'attach') {
    stroke = {
      ...stroke,
      partName,
      attach: {
        part: PARTS[parseNumber(input)],
        side: SIDES[parseNumber(input)],
      },
      position: parseNumbers(input, 3),
      rotation: [0, 0, 0],
      size: [1, 1, 1],
      blend: parseNumber(input),
      material: 0,
    };
  } else {
    stroke = {
      ...stroke,
      partName,
      mode: MODES[parseNumber(input)],
      position: parseNumbers(input, 3),
      rotation: parseNumbers(input, 3),
      size: parseNumbers(input, 3),
    };

    FIELD_NAMES.forEach((fieldName, i) => {
      if (FIELDS[primitive][i] !== '_') {
        stroke[fieldName] = (FIELD_TYPES[i] === 'n' ? parseNumber : parseBoolean)(input);
      }
    });

    if (stroke.material < 0) {
      stroke.material = -stroke.material + 10000;
    }

    // stroke material of 0 is actually the default material
    // so every material is incremeted by 1
    stroke.material += 1;
  }
  return stroke;
};

let parseLayers = (partName, str) => {
  return str.split(',').map((sLayer) => {
    const input = { string: sLayer, index: 0 };
    const subparts = [];
    while (input.index < input.string.length) {
      subparts.push(parseStroke(partName, input));
    }
    return { subparts };
  });
};

function parseModels(_string) {
  const parts = {};
  _string.split(';').forEach((string) => {
    const input = { string, index: 0 };
    const part = PARTS[parseNumber(input)]; //parseInt(input.string[input.index++])];
    const side = SIDES[parseNumber(input)]; //parseInt(input.string[input.index++])];
    const index = parseNumber(input);
    const bounds = [
      [parseNumber(input), parseNumber(input), parseNumber(input)],
      [parseNumber(input), parseNumber(input), parseNumber(input)],
    ];
    // console.log('parsing', { part, side, index });
    const layers = parseLayers(part, input.string.substring(input.index));
    parts[part] = parts[part] || [];
    parts[part][index] = parts[part][index] || {};
    parts[part][index][side] = {
      part,
      side,
      index,
      layers,
      bounds,
    };
  });
  return parts;
}

function parseMaterials(string) {
  const input = { string, index: 0 };
  const mats = [];
  while (input.index < input.string.length) {
    mats.push({
      roughness: parseNumber(input),
      metalness: parseNumber(input),
    });
  }
  return mats;
}

function parsePalettes(_string) {
  return _string.split(';').map((string) => {
    const input = { string, index: 0 };
    const pal = [];
    while (input.index < input.string.length) {
      pal.push([parseNumber(input), parseNumber(input), parseNumber(input)]);
    }
    return pal;
  });
}

function parseRepo(min) {
  const repo = decodeNorm(min);
  // console.log({ repostr: repo });
  const [_models, _mats, _hardcoded, _randomized] = repo.split('/');
  return {
    models: parseModels(_models),
    mats: parseMaterials(_mats),
    hardcoded: parsePalettes(_hardcoded)[0],
    randomized: parsePalettes(_randomized),
  };
}

// let allModelIndex = {};
// for (let modelname in repo.models) {
//   console.log('part', modelname);
//   allModelIndex[modelname] = repo.models[modelname]
//     .map((model) => {
//       if (model) {
//         return model.the.index;
//       } else {
//         return null;
//       }
//     })
//     .filter((n) => n);
// }
// console.log('allModelIndex', JSON.stringify(allModelIndex));

let repo;
let partsParsed;

const setupRepoModels = () => {
  repo = w.models ? parseRepo(w.models) : {};
  w.repo = repo;
  partsParsed = repo.models;
};

setupRepoModels();

///////////////////////////////////////////////////////////////////////////////
// Decode Norm, Parse Layers, Build Norm
///////////////////////////////////////////////////////////////////////////////

// each part has layers
// each layer has subparts or strokes (they are the same thing)
// an object that is show (cube on sphere)

// layer can be a bunch of objects or a single object (or stroke)
// if layer name has a special "attach" in name, it is a attach point
// the kind of attach point, is the other word in the name

// the bull has a attach point called "attach-eye" or similar.
// attach layer has 1 stoke which is position of attach point

// we merge them together, there is an attach layer here. it is hat
// pick select hat part and place it here, slice it on over list of layers

// find object
// transform layers/strokes of object (hat)
// splice into overall list

function invXformPoint(p) {
  const xlate = [0, 0, 256 - 150];
  p = p.map((x, i) => x - xlate[i]);
  // const m = [1, 0, 0, 0, 0, -1, 0, 1, 0];
  // p = [
  //   m[0] * p[0] + m[3] * p[1] + m[6] * p[2],
  //   m[1] * p[0] + m[4] * p[1] + m[7] * p[2],
  //   m[2] * p[0] + m[5] * p[1] + m[8] * p[2],
  // ];
  p = [p[0], p[2], -p[1]];
  p = p.map((x) => x / 150);
  return p;
}

function extendBounds(bounds, other) {
  return [
    [
      Math.min(bounds[0][0], other[0][0]),
      Math.min(bounds[0][1], other[0][1]),
      Math.min(bounds[0][2], other[0][2]),
    ],
    [
      Math.max(bounds[1][0], other[1][0]),
      Math.max(bounds[1][1], other[1][1]),
      Math.max(bounds[1][2], other[1][2]),
    ],
  ];
}

let addPosition = (a, b) => {
  return a.map((x, i) => x + b[i]);
};

const startPoint = 'floor';

let buildNorm = (selected, useSeparate) => {
  setupRepoModels(); // reset layers each time for random reset

  if (!selected[`${startPoint}:the`]) return;

  const base = partsParsed[startPoint][selected[`${startPoint}:the`]].the;
  const parts = [
    {
      part: base,
      pos: invXformPoint([0, 0, 0]),
      _pos: [0, 0, 0],
      maxDepth: 0,
    },
  ];

  // list of laers and materails
  // each layer has list of subparts
  // console.log('buildNorm ~ body', body);

  // interate through possible things to attach from selected list
  PARTS_LIST.forEach(({ part, side, separate, maxDepth }) => {
    const key = `${part}:${side}`;

    // model is one of the selected ones
    if (selected[key]) {
      let found = false;
      for (let i = 0; i < parts.length; i++) {
        // get model data
        const thePart = partsParsed[part][selected[key]][side];

        const base = parts[i].part;

        // find attach point index on body model
        let layerIndex = 0;
        let strokeIndex = 0;
        layerloop: for (; layerIndex < base.layers.length; layerIndex++) {
          const layer = base.layers[layerIndex];
          for (strokeIndex = 0; strokeIndex < layer.subparts.length; strokeIndex++) {
            const stroke = layer.subparts[strokeIndex];
            if (stroke.primitive === 'attach' && stroke.attach.part === part) {
              break layerloop;
            }
          }
        }

        if (layerIndex < base.layers.length) {
          found = true;
          const relPos = base.layers[layerIndex].subparts[strokeIndex].position;

          if (useSeparate && separate) {
            const basePos = parts[i]._pos;
            const relPos_ = relPos.map((x, i) => x + basePos[i]);
            // console.log({
            //   part,
            //   basePos: basePos.map((x) => x.toFixed(1)).join(','),
            //   relPos: relPos.map((x) => x.toFixed(1)).join(','),
            //   relPos_: relPos_.map((x) => x.toFixed(1)).join(','),
            //   pos: invXformPoint(relPos_)
            //     .map((x) => x.toFixed(1))
            //     .join(','),
            // });
            parts.push({
              part: thePart,
              pos: invXformPoint(relPos_),
              _pos: relPos_,
              maxDepth,
            });
          } else {
            const newLayers = thePart.layers.map((layer) => {
              return {
                layer: {
                  ...layer,
                },
                subparts: layer.subparts.map((subpart) => ({
                  ...subpart,
                  position: addPosition(subpart.position, relPos),
                })),
              };
            });

            base.layers.splice(layerIndex, 0, ...newLayers);
            const xformedRelPos = invXformPoint(relPos);
            base.bounds = extendBounds(base.bounds, [
              addPosition(thePart.bounds[0], xformedRelPos),
              addPosition(thePart.bounds[1], xformedRelPos),
            ]);
          }
        }
      }
      if (!found) {
        console.error('buildNorm: attach point not found', part, side);
      }
    }
  });

  return parts;
};

///////////////////////////////////////////////////////////////////////////////
// Build Selected Parts
///////////////////////////////////////////////////////////////////////////////

const PARTS_LIST = [
  { part: 'shoes', side: 'the', index: 0, coreModels: true },
  { part: 'body', side: 'the', index: 3, separate: true, maxDepth: 0, coreModels: true },
  { part: 'glasses', side: 'the', index: 0, separate: false, maxDepth: 0, coreModels: true },
  { part: 'ground', side: 'the', index: 0, separate: false, maxDepth: 0, coreModels: true },
  { part: 'hand', side: 'the', index: 0 },
  { part: 'headtop', side: 'the', index: 0 },
  { part: 'neck', side: 'the', index: 0 },
  { part: 'shirt', side: 'the', index: 0 },
];

let buildSelectedLongVersion = (hash, coreModels) => {
  const sel = {};
  let list = [];
  if (coreModels == true) {
    list = [
      {
        part: startPoint,
        side: 'the',
        ci: 0,
      },
      ...PARTS_LIST,
    ];
  } else {
    list = [
      {
        part: startPoint,
        side: 'the',
        ci: 0,
      },
      ...PARTS_LIST.filter((x) => {
        return x.coreModels == true;
      }),
    ];
  }

  const hashParts = hash.split('-');

  list.forEach(({ part, side }) => {
    // get the index we chose for this piece from the hash string
    const hashPart = hashParts.find((str) => str.startsWith(`${part}:${side}:`));
    if (!hashPart) return;
    const [, , _index] = hashPart.split(':');
    const index = parseInt(_index);

    const key = `${part}:${side}`;
    const _part = partsParsed[part];
    if (_part) {
      const hashIndex = index;
      const partSide = _part[hashIndex][side];
      if (partSide) {
        const partIndex = partSide.index;
        sel[key] = partIndex;
      }
    }
  });

  return sel;
};

///////////////////////////////////////////////////////////////////////////////
// Build Shader
///////////////////////////////////////////////////////////////////////////////

function strokesFromNorm(norm) {
  return {
    part: norm.part.layers
      .filter((layer) => layer.subparts.length > 0)
      .map((layer, layerIndex) => {
        return {
          layerIndex,
          op: layer.subparts[0].mode,
          blend: layer.subparts[0].blend,
          strokes: layer.subparts,
        };
      }),
    bounds: norm.part.bounds,
    pos: norm.pos,
    maxDepth: norm.maxDepth,
  };
}

export function strokesToData(layers) {
  const data = new Float32Array(1000000);
  const stride = 8 * 4;
  let count = 0;
  let index = 1;

  layers.forEach((layer) => {
    layer.strokes.forEach((stroke, strokeIndex) => {
      const offs = index * stride;
      data[offs + 0] = PRIMITIVES.indexOf(stroke.primitive); //a.x
      data[offs + 1] = MODES.indexOf(stroke.mode); //a.y
      data[offs + 2] = stroke.position[0]; //a.z
      data[offs + 3] = stroke.position[1]; //a.w
      data[offs + 4] = stroke.position[2]; //b.x
      // const rotated = isRotated(stroke.rotation)
      // data[offs + 5] = rotated ? 1 : 0
      // if (rotated) {
      // }

      data[offs + 5] = stroke.rotation[0]; //b.y
      data[offs + 6] = stroke.rotation[1]; //b.z
      data[offs + 7] = stroke.rotation[2]; //b.w
      data[offs + 8] = stroke.size[0]; //c.x
      data[offs + 9] = stroke.size[1]; //c.y
      data[offs + 10] = stroke.size[2]; //c.z
      // 14
      FIELD_NAMES.forEach((fieldName, fieldIndex) => {
        data[offs + 11 + fieldIndex] =
          FIELD_TYPES[fieldIndex] === 'n' ? stroke[fieldName] : stroke[fieldName] ? 1 : 0;
      });
      // 11 + 14 = 25 / 4 = 6.25 => 7

      // const mat = invertMatrix(rotationMatrixFromEulers(stroke.rotation));
      // data[offs + 11]
      const isLastStroke = strokeIndex === layer.strokes.length - 1;
      if (isLastStroke) {
        data[offs + 11 + 15] = 1;
        data[offs + 11 + 16] = MODES.indexOf(layer.strokes[0].mode);
        data[offs + 11 + 17] = layer.strokes[0].blend;
      }

      count += 1;
      index += 1;
    });
  });

  data[0] = count;
  // console.log({ count, index: index * stride });
  return data;
}

///

export function buildRepo(inputHash, useSeparate = true, coreModels = true) {
  // console.log('!!! input', inputHash);
  const normBuilt = buildNorm(buildSelectedLongVersion(inputHash, coreModels), useSeparate);
  const strokes = normBuilt.map((n) => strokesFromNorm(n));
  return { repo, strokes };
}

w.setupRepoModels = setupRepoModels;
w.buildRepo = buildRepo;
w.strokesToData = strokesToData;
