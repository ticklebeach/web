export function result(d, m1, m2, b, k) {
  return { d, m1, m2, b, k };
}

export function vec(x, y, z) {
  return { x, y, z };
}

function vecFn(fn) {
  return vec(fn('x'), fn('y'), fn('z'));
}

function isVec(v) {
  // eslint-disable-next-line no-prototype-builtins
  return v.hasOwnProperty('x');
}

function isMat(m) {
  return Array.isArray(m);
}

function abs(v) {
  return vecFn((i) => Math.abs(v[i]));
}

export function sub(a, b) {
  return isVec(b) ? vecFn((i) => a[i] - b[i]) : vecFn((i) => a[i] - b);
}

export function add(a, b) {
  return isVec(b) ? vecFn((i) => a[i] + b[i]) : vecFn((i) => a[i] + b);
}

export function length(v) {
  return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
}

function min(a, b) {
  return isVec(a)
    ? isVec(b)
      ? vecFn((i) => Math.min(a[i], b[i]))
      : vecFn((i) => Math.min(a[i], b))
    : Math.min(a, b);
}

function max(a, b) {
  return isVec(a)
    ? isVec(b)
      ? vecFn((i) => Math.max(a[i], b[i]))
      : vecFn((i) => Math.max(a[i], b))
    : Math.max(a, b);
}

export function sdRoundBox(p, b, r) {
  const q = sub(abs(p), b);
  return length(max(q, 0)) + min(max(q.x, max(q.y, q.z)), 0) - r;
}

export function sdSphere(p, r) {
  return length(p) - r;
}

export function sdUnion(a, b) {
  return a.d < b.d ? a : b;
}

// function opUnion(a, b) {
//   return sdUnion(a, b);
// }

// function opSubtract(a, b) {
//   if (a.d > -b.d) return a;
//   else return result(-b.d, a.m1, a.m2, a.b, 0);
// }

// function opReplace(a, b) {
//   const r = opSmoothUnion(a, b, a.k); // / 2.);
//   return result(b.d, r.m1, r.m2, r.b, r.k);
// }

// function opSmoothSubtraction(a, b, k) {
//   k = typeof k === 'undefined' ? 2.5 : k;
//   const h = Math.max(k - Math.abs(-a.d - b.d), 0.0);
//   const t = Math.max(-a.d, b.d) + (h * h * 0.25) / k;
//   return result(t, b.m1, b.m2, b.b, 0);
// }

export function clamp(x, min, max) {
  return Math.min(max, Math.max(min, x));
}

// const BLEND_SIZE = 3;

// function getBlend(d1, d2, blendSize) {
//   const diff = -Math.abs(d1 - d2);
//   let blend = diff / blendSize;
//   blend = clamp((blend + 1.0) * 0.5, 0, 1);
//   return blend;
// }

// function smin(a, b, k) {
//   const h = Math.max(k - Math.abs(a - b), 0.0);
//   const t = Math.min(a, b) - (h * h * 0.25) / k;
//   return t;
// }

/*
float smin(float a, float b, float k) {
  float h = clamp(0.5 + 0.5*(a-b)/k, 0.0, 1.0);
  return mix(a, b, h) - k*h*(1.0-h);
}
*/

// function lerp(start, end, amt) {
//   return (1 - amt) * start + amt * end;
// }

// function mix(a, b, t) {
//   return lerp(a, b, t);
// }

// function float(x) {
//   return x ? 1 : 0;
// }

// function opSmoothUnion(f1, f2, k) {
//   k = typeof k === 'undefined' ? 0.5 : k;

//   k = k / 2;

//   // Branching a lot :( Needs more work

//   let closest = f1;
//   let furthest = f2;

//   let diff = f1.d > f2.d ? 1 : 0;

//   closest.d = mix(f1.d, f2.d, diff);
//   closest.m1 = mix(f1.m1, f2.m1, diff);
//   closest.m2 = mix(f1.m2, f2.m2, diff);
//   closest.b = mix(f1.b, f2.b, diff);

//   furthest.d = mix(f2.d, f1.d, diff);
//   furthest.m1 = mix(f2.m1, f1.m1, diff);
//   furthest.m2 = mix(f2.m2, f1.m2, diff);
//   furthest.b = mix(f2.b, f1.b, diff);

//   // Dominant materials
//   let mf1 = mix(closest.m2, closest.m1, float(closest.b < 0.5));
//   let mf2 = mix(furthest.m2, furthest.m1, float(furthest.b < 0.5));

//   // New distance
//   let t = smin(f1.d, f2.d, k);

//   // New blend
//   let bnew = getBlend(f1.d, f2.d, k);
//   let b = Math.max(closest.b, bnew);
//   let bhigher = float(b > bnew);

//   let m1 = mix(mf1, closest.m1, bhigher);
//   let m2 = mix(mf2, closest.m2, bhigher);

//   return result(t, m1, m2, b, 0);
// }

export function div(a, b) {
  return vecFn((i) => a[i] / b);
}

// function sdEllipsoid(p, r) {
//   const k0 = length(div(p, r));
//   const k1 = length(div(p, r * r));
//   return (k0 * (k0 - 1.0)) / k1;
// }

export function normalize(v) {
  const l = length(v);
  return Math.abs(l) < 0.00001 ? vec(0, 0, 0) : div(v, l);
}

export function mul(a, b) {
  if (isMat(a)) {
    if (isMat(b)) {
      let a00 = a[0],
        a01 = a[1],
        a02 = a[2];
      let a10 = a[3],
        a11 = a[4],
        a12 = a[5];
      let a20 = a[6],
        a21 = a[7],
        a22 = a[8];

      let b00 = b[0],
        b01 = b[1],
        b02 = b[2];
      let b10 = b[3],
        b11 = b[4],
        b12 = b[5];
      let b20 = b[6],
        b21 = b[7],
        b22 = b[8];

      return mat(
        b00 * a00 + b01 * a10 + b02 * a20,
        b00 * a01 + b01 * a11 + b02 * a21,
        b00 * a02 + b01 * a12 + b02 * a22,

        b10 * a00 + b11 * a10 + b12 * a20,
        b10 * a01 + b11 * a11 + b12 * a21,
        b10 * a02 + b11 * a12 + b12 * a22,

        b20 * a00 + b21 * a10 + b22 * a20,
        b20 * a01 + b21 * a11 + b22 * a21,
        b20 * a02 + b21 * a12 + b22 * a22,
      );
    } else {
      let x = b.x,
        y = b.y,
        z = b.z;
      return vec(
        x * a[0] + y * a[3] + z * a[6],
        x * a[1] + y * a[4] + z * a[7],
        x * a[2] + y * a[5] + z * a[8],
      );
    }
  } else if (isVec(a)) {
    return isVec(b) ? vecFn((i) => a[i] * b[i]) : vecFn((i) => a[i] * b);
  }
}

function mat(...a) {
  return a;
}

// function opSymX(p) {
//   return vec(Math.abs(p.x), p.y, p.z);
// }

function vecToArray(v) {
  return [v.x, v.y, v.z];
}

function boundsFromArray(b) {
  return { min: vec(...b[0]), max: vec(...b[1]) };
}

function boundsToArray(b) {
  return [vecToArray(b.min), vecToArray(b.max)];
}

function boundsIntersection(a, b) {
  return {
    min: max(a.min, b.min),
    max: min(a.max, b.max),
  };
}

let w = window;

w.vec = vec;
w.sub = sub;
w.div = div;
w.add = add;
w.mul = mul;
w.vecToArray = vecToArray;
w.normalize = normalize;
w.min = min;
w.max = max;
w.boundsFromArray = boundsFromArray;
w.boundsToArray = boundsToArray;
w.boundsIntersection = boundsIntersection;
