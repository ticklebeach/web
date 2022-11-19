let fs = require('fs');
var gulp = require('gulp');
const path = require('path');
const { series, watch } = require('gulp');
const glsl = require('gulp-glsl');
// var webpack = require('gulp-webpack');
const print = require('gulp-print').default;
// const keccak256 = require('keccak256');
// const BigNumber = require('bignumber.js');

// const { selectionFromHash } = require('./src/theming.js');

/*
  each shader 'src' is minified to a 'generated' file.
  then marked block comments are added back in and the result is put into a 'processed' file.
  then this 'processed' file is embedded in the template using the 'templateKey'.
*/
const shaders = [
  {
    name: 'octreeVertex',
    src: 'shaders/octree-vertex.glsl',
  },
  {
    name: 'raymarcherFragment',
    src: 'raymarch-octree/raymarcher-fragment.glsl',
  },
  // {
  //   name: 'marchingCubesVertex',
  //   src: 'polys-mc/marching-cubes-vertex.glsl',
  // },
  // {
  //   name: 'polysVertex',
  //   src: 'polys-mc/polys-vertex.glsl',
  // },
  // {
  //   name: 'polysFragment',
  //   src: 'polys-mc/polys-fragment.glsl',
  // },
  // {
  //   name: 'gridVertex',
  //   src: 'splats/grid-vertex.glsl',
  // },
  // {
  //   name: 'subgridVertex',
  //   src: 'splats/subgrid-vertex.glsl',
  // },
  // {
  //   name: 'splatPrepassVertex',
  //   src: 'splats/splat-prepass-vertex.glsl',
  // },
  // {
  //   name: 'splatPrepassFragment',
  //   src: 'splats/splat-prepass-fragment.glsl',
  // },
  // {
  //   name: 'splatNormalizationVertex',
  //   src: 'splats/splat-normalization-vertex.glsl',
  // },
  // {
  //   name: 'splatNormalizationFragment',
  //   src: 'splats/splat-normalization-fragment.glsl',
  // },
];

function srcPath(shader) {
  return `./src/octree/${shader.src}`;
}

function generatedPath(shader) {
  return `./generated/octree/${shader.src}`;
}

function processedPath(shader) {
  return `./generated/octree/processed/${shader.src}`;
}

let minifyShaders = () => {
  console.log('minify');
  return gulp
    .src('./src/octree/**/*.glsl')
    .pipe(
      print(function (file) {
        return 'Found file ' + file;
      })
    )
    .pipe(glsl({ format: 'raw', ext: '.glsl' }))
    .pipe(gulp.dest('./generated/octree'));
};

function replaceBlockComments(shader) {
  let src = fs.readFileSync(srcPath(shader), 'utf8');
  let generated;
  try {
    generated = fs.readFileSync(generatedPath(shader), 'utf8');
  } catch (e) {
    return;
  }

  // replace marked block comments
  const matches = [
    ...src.matchAll(/\/\* ([^\r?\n]+)\s*\r?\n([^]*?)\*\/\r?\n/gm),
  ];
  matches.forEach((match) => {
    generated = generated.replace(`uniform int ${match[1]};`, match[2]);
  });

  const processed = processedPath(shader);
  fs.mkdirSync(path.dirname(processed), { recursive: true });
  fs.writeFileSync(processed, generated);
}

function processShader(shader) {
  return function processGlsl(cb) {
    replaceBlockComments(shader);
    cb();
  };
}

let insertGlsl = (cb) => {
  let loadTemplate = fs.readFileSync(
    './src/octree/glslloader.js.TEMPLATE',
    'utf8'
  );

  const all = {};

  shaders.forEach((shader) => {
    const contents = fs.readFileSync(processedPath(shader), 'utf8');
    if (shader.templateKey) {
      loadTemplate = loadTemplate.replace(
        `{{${shader.templateKey}}}`,
        contents
      );
    } else {
      all[shader.name] = contents;
    }
  });

  loadTemplate = loadTemplate.replace('{{ALL_SHADERS}}', JSON.stringify(all));

  fs.writeFileSync('./src/octree/glslloader.js', loadTemplate);

  cb();
};

const processFns = shaders.map((shader) => processShader(shader));
const updateShaderTemplate = series(...processFns, insertGlsl);

let packModelData = () => {
  return gulp
    .src('src/modeldata.js')
    .pipe(webpack())
    .pipe(gulp.dest('public/'));
};

// const everything = series(
//   minifyShaders, // take fractional glsl files and minify them
//   updateShaderTemplate,
//   packModelData // pack the models files
// );

// exports.default = everything;
// exports.minifyShaders = minifyShaders;
// exports.packModelData = packModelData;

let clearHtml = () => {
  fs.mkdirSync('prod/html', { recursive: true });
  fs.readdirSync('prod/html').forEach((file) => {
    fs.unlinkSync(`prod/html/${file}`);
  });
};

let clearHtmlDest = () => {
  console.log('not implemented yet in public repo');
  // const dest = '../ticklenft/html';
  // fs.mkdirSync(dest, { recursive: true });
  // fs.readdirSync(dest).forEach((file) => {
  //   fs.unlinkSync(`${dest}/${file}`);
  // });
};

const maxSize = 24000;

let logic = (cb) => {
  clearHtmlDest();
  clearHtml();

  let index = fs.readFileSync('prod/index.html', 'utf8');
  let split = index.split('</script>');
  let back = split.map((s, i) => {
    if (i == split.length - 1) {
      return s;
    }

    return s + '</script>';
  });

  let i = 0;
  for (let s of back) {
    fs.writeFileSync(`prod/html/index.${i}.html`, s);
    i++;
  }

  // files too big
  const htmlFile = 1;
  let modelFiles = fs.readFileSync(`prod/html/index.${htmlFile}.html`, 'utf8');

  // split models in to chunks the size of maxSize and write them to even/index.1.html
  let location = 0;
  i = 0;
  while (location < modelFiles.length) {
    let part = modelFiles.slice(location, location + maxSize);
    fs.writeFileSync(`prod/html/index.${htmlFile}.${i}.html`, part);
    location += maxSize;
    i++;
  }

  // delete this file prod/html/index.1.html
  fs.unlinkSync(`prod/html/index.${htmlFile}.html`);

  // files too small
  // const smallFiles = [2, 3];
  let file2 = fs.readFileSync(`prod/html/index.2.html`, 'utf8');
  let file3 = fs.readFileSync(`prod/html/index.3.html`, 'utf8');
  let newFile = file2 + file3;
  fs.writeFileSync(`prod/html/index.2-3.html`, newFile);
  fs.unlinkSync(`prod/html/index.2.html`);
  fs.unlinkSync(`prod/html/index.3.html`);

  cb();
};

// let even = (cb) => {
//   clearHtmlDest();
//   clearHtml();
//   let index = fs.readFileSync('prod/index.html', 'utf8');

//   // split index in to chunks the size of maxSize and write them to html/index.1.html
//   let location = 0;
//   let i = 0;
//   while (location < index.length) {
//     let part = index.slice(location, location + maxSize);
//     fs.writeFileSync(`prod/html/index.${i}.html`, part);
//     location += maxSize;
//     i++;
//   }

//   cb();
// };

// const REVEAL_NUMBER = 25;
// const TOTAL_AMOUNT = 10001;

// const secretString = 'i want to hold your hand';

// const makePreviews = (cb) => {
//   // yarn run webpack --config webpack.oct.click.js
//   let indexHtml = fs.readFileSync(`prod/click.html`, 'utf8');
//   const seed =
//     '42582326515852401476552633600533149901123906319053889057041875860767557842394';

//   const path = `public/animation/`;
//   fs.mkdirSync(path, { recursive: true });

//   for (let i = 0; i <= REVEAL_NUMBER; i++) {
//     let hash = keccak256(`${i}${secretString}`).toString('hex');
//     console.log('seedhex', hash);

//     // console.log('seedhex', seedHex);
//     let seedBn = new BigNumber('0x' + hash); //From an hexadecimal string
//     console.log('seed', i, seedBn.toFixed());

//     const imageUrl = '/preview/' + i.toString() + '.png';
//     const newHtml = indexHtml
//       .replace(seed, seedBn.toFixed())
//       .replace('/preview/0.png', imageUrl);
//     fs.writeFileSync(`${path}${i}.html`, newHtml);
//   }

//   cb();
// };

// const makeGalleries = (cb) => {
//   // yarn run webpack --config webpack.oct.click.js
//   let indexHtml = fs.readFileSync(`prod/click.html`, 'utf8');
//   const seed =
//     '42582326515852401476552633600533149901123906319053889057041875860767557842394';

//   const path = `public/gallery/`;
//   fs.mkdirSync(path, { recursive: true });

//   for (let i = 0; i < REVEAL_NUMBER; i++) {
//     let hash = keccak256(`${i}${secretString}`).toString('hex');
//     console.log('seedhex', hash);

//     // console.log('seedhex', seedHex);
//     let seedBn = new BigNumber('0x' + hash); //From an hexadecimal string
//     console.log('seed', i, seedBn.toFixed());

//     const imageUrl = '/preview/' + i.toString() + '.png';
//     const newHtml = indexHtml
//       .replace(seed, seedBn.toFixed())
//       .replace('/preview/0.png', imageUrl);
//     fs.writeFileSync(`${path}${i}.html`, newHtml);
//   }

//   cb();
// };

// const makeUnrevealed = (cb) => {
//   // yarn run webpack --config webpack.oct.click.js
//   let indexHtml = fs.readFileSync(`prod/unrevealed.html`, 'utf8');
//   const seed =
//     '42582326515852401476552633600533149901123906319053889057041875860767557842394';

//   const path = `public/animation/`;
//   fs.mkdirSync(path, { recursive: true });

//   const secretString = 'i want to hold your hand';

//   for (let i = REVEAL_NUMBER; i <= TOTAL_AMOUNT; i++) {
//     let hash = keccak256(`${i}${secretString}`).toString('hex');
//     console.log('seedhex', hash);

//     // console.log('seedhex', seedHex);
//     let seedBn = new BigNumber('0x' + hash); //From an hexadecimal string
//     console.log('seed', i, seedBn.toFixed());

//     const imageUrl = '/preview/' + i.toString() + '.png';
//     const newHtml = indexHtml
//       .replace(seed, seedBn.toFixed())
//       .replace('/samples/0.png', imageUrl);
//     fs.writeFileSync(`${path}${i}.html`, newHtml);
//   }

//   cb();
// };

// const repoIndexes = JSON.parse(
//   '{"body":[1,2,3,4,5,6,7,9,10],"floor":[1,3,4,11,14,16],"glasses":[1,2,3,4,6,7,10],"shirt":[1,2,3,6,8],"ground":[1,2,3,6,7,9,10,11,12,15],"hand":[1,3,4,5,7,8],"headtop":[1,4,9,10,11,12,14],"neck":[1,2,3,10],"shoes":[1,2,3,4]}'
// );

// let genTraits = (cb) => {
//   console.log('genTraits ~ repoIndexes', repoIndexes);
//   for (let i = 0; i < 1; i++) {
//     let hash = keccak256(`${i}${secretString}`).toString('hex');
//     let seedBn = new BigNumber('0x' + hash); //From an hexadecimal string
//     console.log('seed', i, seedBn.toFixed());

//     const { sel, themeFor, sky } = selectionFromHash(seedBn, repoIndexes);
//     console.log('---->', sel, themeFor, sky);
//   }

//   cb();
// };

exports.logic = logic;
// exports.even = even;
// exports.makeUnrevealed = makeUnrevealed;

// exports.makePreviews = makePreviews;
// exports.makeGalleries = makeGalleries;

// exports.genTraits = genTraits;

exports.watch = () => {
  shaders.forEach((shader, index) => {
    watch(processedPath(shader), insertGlsl);
    watch(generatedPath(shader), processFns[index]);
    watch(srcPath(shader), processFns[index]);
  });

  watch(
    './src/octree/**/*.glsl',
    { ignoreInitial: false },
    series(minifyShaders, updateShaderTemplate)
  );

  watch('./src/octree/glslloader.js.TEMPLATE', insertGlsl);

  watch('./src/octree/oct.js', packModelData);
};
