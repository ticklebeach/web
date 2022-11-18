export const fragment = `\
#version 300 es
precision highp float;
precision highp int;
uniform float iTime,iDate,iTimeDelta;
uniform int iFrame;

#pragma optimize(off)

out lowp vec4 fragColor;
uniform vec2 iResolution;
uniform vec4 iMouse,iLastClick;
in vec2 fragCoord;

// uniform sampler2D uTreeTex;
// uniform sampler2D uStrokesTex;

uniform vec3 uCameraPos;
uniform vec3 uCameraLookAt;
uniform float uCameraZoom;

uniform Strokes {
  vec4 uStrokes[4000];
};

uniform vec3 uHardcoded[200];
uniform vec3 uRandomized[10];
uniform vec4 uMaterials[10];
uniform vec3 uBoundsMin;
uniform vec3 uBoundsMax;
uniform vec2 uOffs;

#define PI 3.1415925359
// max raymarching steps
#define MAX_STEPS 100
// max raymarching distance
#define MAX_DIST 300.
//50.
// max surface distance
#define SURF_DIST .001
//.01
#define ZERO (min(iFrame,0))
#define BOX_OFFS .02

struct Result {
    float d;
    float m1;
    float m2;
    float b;
    float k;
//    vec3 normal;
//    float ao;
};

// float sdBox( vec3 p, vec3 b )
// {
//     vec3 q = abs(p) - b;
//     return length(max(q,0.0)) + min(max(q.x,max(q.y,q.z)),0.0);
// }

// sim-specific

float blink(float x) {
    float t = iTime * 2.;
    float f1 = min(1., mod(t, 12.1));
    float f2 = smoothstep(0., .1, f1) - smoothstep(.18, .4, f1);
    float f3 = min(1., mod(t, 16.4));
    float f4 = smoothstep(0., .1, f3) - smoothstep(.18, .4, f3);
    float a = max(f2, f4) / 2.; //+.04*cos(t);
    return (1. - a * .9) * x;
}

// sdf primitives

float sdEllipsoid(in vec3 p, in vec3 r) {
  float k0 = length(p / r);
  float k1 = length(p / (r * r));
  return k0 * (k0 - 1.0) / k1;
}

float sdSphere(vec3 p, float s) {
  return length(p) - s;
}

float sdCapsule(vec3 p, vec3 a, vec3 b, float r) {
  vec3 pa = p - a, ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h) - r;
}

float sdVerticalCapsule(vec3 p, float h, float r) {
  p.z -= clamp(p.z, -h, h);
  return length(p) - r;
}

float sdRoundBox(vec3 p, vec3 b, float r) {
  vec3 q = abs(p) - b;
  return length(max(q, 0.)) + min(max(q.x, max(q.y, q.z)), 0.) - r;
}

float sdPlane(vec3 p, vec4 n) {
  // n must be normalized
  return dot(p, n.xyz) + n.w;
}

// ?
float sdLink(vec3 p, float le, float r1, float r2) {
  vec3 q = vec3(p.x, max(abs(p.y) - le, 0.), p.z);
  return length(vec2(length(q.xy) - r1, q.z)) - r2;
}

float sdOctahedron(vec3 p, float s) {
  p = abs(p);
  float m = p.x + p.y + p.z - s;
  vec3 q;
  if (3. * p.x < m) q = p.xyz;
  else if (3. * p.y < m) q = p.yzx;
  else if (3. * p.z < m) q = p.zxy;
  else return m * .57735027;

  float k = clamp(.5 * (q.z - q.y + s), 0., s);
  return length(vec3(q.x, q.y - s + k, q.z - k));
}

// 2d sdfs

float sdEllipse(in vec2 p, in vec2 ab) {
  if (abs(ab.x - ab.y) < 1e-6) return length(p) - ab.x;

  p = abs(p); if (p.x > p.y) { p = p.yx; ab = ab.yx; }
  float l = ab.y * ab.y - ab.x * ab.x;
  float m = ab.x * p.x / l; float m2 = m * m;
  float n = ab.y * p.y / l; float n2 = n * n;
  float c = (m2 + n2 - 1.0) / 3.0; float c3 = c * c * c;
  float q = c3 + m2 * n2 * 2.0;
  float d = c3 + m2 * n2;
  float g = m + m * n2;
  float co;
  if (d < 0.0) {
    float h = acos(q / c3) / 3.0;
    float s = cos(h);
    float t = sin(h) * sqrt(3.0);
    float rx = sqrt(-c * (s + t + 2.0) + m2);
    float ry = sqrt(-c * (s - t + 2.0) + m2);
    co = (ry + sign(l) * rx + abs(g) / (rx * ry) - m) / 2.0;
  } else {
    float h = 2.0 * m * n * sqrt(d);
    float s = sign(q + h) * pow(abs(q + h), 1.0 / 3.0);
    float u = sign(q - h) * pow(abs(q - h), 1.0 / 3.0);
    float rx = -s - u - c * 4.0 + 2.0 * m2;
    float ry = (s - u) * sqrt(3.0);
    float rm = sqrt(rx * rx + ry * ry);
    co = (ry / sqrt(rm - rx) + 2.0 * g / rm - m) / 2.0;
  }
  vec2 r = ab * vec2(co, sqrt(1.0 - co * co));
  return length(r - p) * sign(p.y - r.y);
}

float sdCircle(vec2 p, float r) {
  return length(p) - r;
}

float sdBox(in vec2 p, in vec2 b) {
  vec2 d = abs(p) - b;
  return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
}

float sdBox( vec3 p, vec3 b )
{
  vec3 q = abs(p) - b;
  return length(max(q,0.0)) + min(max(q.x,max(q.y,q.z)),0.0);
}

float sdRoundBox(in vec2 p, in vec2 b, in float r) {
  vec2 q = abs(p) - b + r;
  return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;
}

float sdEquilateralTriangle(in vec2 p, float s) {
  p /= s;
  p.y += 0.5;
  const float k = sqrt(3.0);
  p.x = abs(p.x) - 1.0;
  p.y = p.y + 1.0 / k;
  if (p.x + k * p.y > 0.0) p = vec2(p.x - k * p.y, -k * p.x - p.y) / 2.0;
  p.x -= clamp(p.x, -2.0, 0.0);
  return (-length(p) * sign(p.y)) * s;
}

float sdRoundTri(in vec2 p, float s, float r) {
  s = s - r;
  p /= s;
  const float k = sqrt(3.0);
  p.x = abs(p.x) - 1.0;
  p.y = p.y + 1.0 / k;
  if (p.x + k * p.y > 0.0) p = vec2(p.x - k * p.y, -k * p.x - p.y) / 2.0;
  p.x -= clamp(p.x, -2.0, 0.0);
  return (-length(p) * sign(p.y)) * s - r;
}

float dot2(in vec2 v) { return dot(v, v); }

float sdBezier(in vec2 pos, in vec2 A, in vec2 B, in vec2 C)
{
  vec2 a = B - A;
  vec2 b = A - 2.0 * B + C;
  vec2 c = a * 2.0;
  vec2 d = A - pos;
  float kk = 1.0 / dot(b, b);
  float kx = kk * dot(a, b);
  float ky = kk * (2.0 * dot(a, a) + dot(d, b)) / 3.0;
  float kz = kk * dot(d, a);
  float res = 0.0;
  float p = ky - kx * kx;
  float p3 = p * p * p;
  float q = kx * (2.0 * kx * kx - 3.0 * ky) + kz;
  float h = q * q + 4.0 * p3;
  if (h >= 0.0) {
    h = sqrt(h);
    vec2 x = (vec2(h, -h) - q) / 2.0;
    vec2 uv = sign(x) * pow(abs(x), vec2(1.0 / 3.0));
    float t = clamp(uv.x + uv.y - kx, 0.0, 1.0);
    res = dot2(d + (c + b * t) * t);
  } else {
    float z = sqrt(-p);
    float v = acos(q / (p * z * 2.0)) / 3.0;
    float m = cos(v);
    float n = sin(v) * 1.732050808;
    vec3 t = clamp(vec3(m + m, -n - m, n - m) * z - kx, 0.0, 1.0);
    res = min(dot2(d + (c + b * t.x) * t.x),
      dot2(d + (c + b * t.y) * t.y));
    // the third root cannot be the closest
    // res = min(res,dot2(d+(c+b*t.z)*t.z));
  }
  return sqrt(res);
}

// bound
float sdTriPrism(vec3 p, float h, float r, float r2) {
  vec3 q = abs(p);
  return max(q.z - h, max(q.x * r2 + p.y * 0.5, -p.y) - r * 0.5);
}

vec3 opConify(vec3 p, float zh) {
  float s = mix(.5, 1.5, clamp(p.z / zh, 0., 1.));
  return vec3(p.x * s, p.y * s, p.z);
}

float opExtrussion(in vec3 p, in float sdf, in float h) {
  vec2 w = vec2(sdf, abs(p.z) - h);
  return min(max(w.x, w.y), 0.0) + length(max(w, 0.0));
}

// sdf ops

Result opIntersect(Result a, Result b) {
  return Result(max(b.d, a.d), b.m1, b.m2, b.b, b.k);
}

Result opUnion(Result a, Result b) {
  if (a.d < b.d) return a;
  else return b;
}

Result opSubtract(Result b, Result a) {
  if (a.d > -b.d) return a;
  else return Result(-b.d, a.m1, a.m2, a.b, 0.);
}

#define BLEND_SIZE 3.

float getBlend(float d1, float d2, float blendSize)
{
  float diff = -abs(d1 - d2);
  float blend = diff / blendSize;
  blend = clamp((blend + 1.0) * 0.5, 0., 1.);
  return blend;
}

float smin( float a, float b, float k ) {
float h = max(k - abs(a - b), 0.0);
float t = min(a, b) - h * h * 0.25 / k;
return t;
}

Result opSmoothUnion(Result f1, Result f2, float k)
{
  k =k / 2.;

  // Branching a lot :( Needs more work

  Result closest  = f1;
  Result furthest = f2;

  float diff = float(f1.d > f2.d);

  closest.d =  mix(f1.d, f2.d,   diff);
  closest.m1 =  mix(f1.m1, f2.m1,   diff);
  closest.m2 = mix(f1.m2, f2.m2, diff);
  closest.b =  mix(f1.b, f2.b,   diff);

  furthest.d =  mix(f2.d, f1.d,   diff);
  furthest.m1 =  mix(f2.m1, f1.m1,   diff);
  furthest.m2 = mix(f2.m2, f1.m2, diff);
  furthest.b =  mix(f2.b, f1.b,   diff);

  // Dominant materials
  float mf1 = mix(closest.m2, closest.m1, float(closest.b < 0.5));
  float mf2 = mix(furthest.m2, furthest.m1, float(furthest.b < 0.5));

  // New distance
  float t  = smin(f1.d, f2.d, k);

  // New blend
  float bnew = getBlend(f1.d, f2.d, k);
  float b = max(closest.b, bnew);
  float bhigher = float(b > bnew);

  float m1  = mix(mf1, closest.m1,  bhigher);
  float m2 = mix(mf2, closest.m2, bhigher);

  return Result(t, m1, m2, b, 0.);
}

Result opSmoothUnion(Result a, Result b) {
  return opSmoothUnion(a, b, 5.);
}

Result opReplace(Result a, Result b) {
  Result r = opSmoothUnion(a, b, a.k);// / 2.);
  return Result(b.d, r.m1, r.m2, r.b, r.k);
}

Result opSmoothSubtraction(Result a, Result b, float k) {
  float h = max(k-abs(-a.d-b.d),0.0);
  float t = max(-a.d, b.d) + h*h*0.25/k;
  return Result(t, b.m1, b.m2, b.b, 0.);
}

Result opSmoothSubtraction(Result a, Result b) {
  return opSmoothSubtraction(a, b, 2.5);
}

vec3 opSymX(vec3 p) {
  return vec3(abs(p.x), p.yz);
}

vec4 opElongate(vec3 p, vec3 h) {
  vec3 q = abs(p)-h;
  return vec4(max(q,0.0), min(max(q.x,max(q.y,q.z)),0.0));
}

float opRound(float d, float rad) {
  return d - rad;
}

float sdCappedCylinder( vec3 p, float h, float r )
{
  vec2 d = abs(vec2(length(p.xy),p.z)) - vec2(h,r);
  return min(max(d.x,d.y),0.0) + length(max(d,0.0));
}

float sdExtrudedCylinder(vec3 p, float h, vec2 r) {
  return opExtrussion(p, sdEllipse(p.xy, r), h);
}

float sdExtrudedCircle(vec3 p, float h, vec2 r) {
  return opExtrussion(p, sdCircle(p.xy, r.x), h);
}

// modified primitives

float sdfModCube(vec3 _p, vec3 size, float round, float hole, float bevel, float cone) {
  float _d;
  vec3 p1 = _p;

  round = min(0.99, round);
  float rDim = round * min(size.x, min(size.y, size.z));
  if (hole > 0.) {
    if (bevel > 0.) {
      float holeRadius = max(0., (1. - hole) * min(size.x, size.y));
      round = round * max(2., min(holeRadius, size.z));
      float bevel = bevel * min(size.x - round, size.y - round);

      float coneScalar =
        cone > 0.
        ? cone * (p1.z + size.z - round) / (size.z - round) * 2.
        : 0.;

      float boxW = mix(size.z - round, round, coneScalar);
      float boxH = mix(size.y - round, round, coneScalar);
      float aBevel = mix(bevel, 0., coneScalar);
      _d = sdRoundBox(p1.xy, vec2(boxW, boxH), aBevel);
      // _a = abs(_d) - holeRadius;
      float aRound = round;
      _d = opExtrussion(p1, _d, size.z - round) - aRound;
    } else {
      float r2 = 1.;
      _d = opExtrussion(p1, abs(sdBox(p1.xy, size.xy)) - r2, size.z);
    }
  } else {
    if (bevel > 0. || round > 0. || cone > 0.) {
      round = round * max(2., min(min(size.x, size.y), size.z));
      bevel = bevel * min(size.x - round, size.y - round);

      float coneScalar =
        cone > 0.
        ? abs(size.z - round) > 1e-6
          ? cone * clamp((p1.z + size.z - round) / ((size.z - round) * 2.), 0., 1.)
          : 0.
        : 0.;

      float minW = max(0., size.x - size.y);
      float minH = max(0., size.y - size.x);
      float boxW = mix(size.x - round, minW, coneScalar);
      float boxH = mix(size.y - round, minH, coneScalar);
      float aBevel = mix(bevel, 0., coneScalar);
      _d = sdRoundBox(p1.xy,vec2(boxW, boxH), aBevel);
      float aRound = round;
      _d = opExtrussion(p1, _d, size.z - round) - aRound;
    } else {
      _d = sdRoundBox(p1, size - rDim, rDim);
    }
  }
  return _d;
}

float sdfModCylinder(vec3 _p, vec3 size, float hole, float cone, float round) {
  float _d;
  vec3 p1 = _p;

  if (hole > 0.) {
    float holeRadius = max(0., (1. - hole) * min(size.x, min(size.y, size.z)));
    float radius0 =
      abs(size.z) > 1e-6
        ? size.x - (cone * size.x) * (p1.z + (size.z / 2.)) / size.z
        : size.x;
    float radius1 =
      abs(size.z) > 1e-6
        ? size.y - (cone * size.y) * (p1.z + (size.z / 2.)) / size.z
        : size.y;
    bool hasRound = round > 0.1;
    round = hasRound ? min(0.99, round) : 0.;
    round = round * min(size.x, min(size.y, size.z));
    float rDepth = max(2., size.z - round);
    if (abs(cone) < 1e-6 && abs(size.x - size.y) < 1e-6) {
      _d = sdCircle(p1.xy, max(2.,radius0 - round));
    } else {
      _d = sdEllipse(p1.xy,vec2(max(2.,radius0 - round), max(2.,radius1 - round)));
    }
    _d = abs(_d - holeRadius);
    _d = opExtrussion(p1, _d, rDepth);
    if (hasRound) {
      _d = opRound(_d,round);
    }
  } else {
    float radius0 =
      abs(size.z) > 1e-6
        ? size.x - cone * size.x * (p1.z + (size.z / 2.)) / size.z
        : size.x;
    float radius1 =
      abs(size.z) > 1e-6
        ? size.y - cone * size.y * (p1.z + (size.z / 2.)) / size.z
        : size.y;
    bool hasRound = round > 0.1;
    round = hasRound ? min(0.99, round) : 0.;
    round = round * min(size.x, min(size.y, size.z));
    float rDepth = max(2., size.z - round);
    if (abs(cone) < 1e-6 && abs(size.x - size.y) < 1e-6) {
      _d = sdExtrudedCircle(p1,rDepth,vec2(max(2.,radius0 - round), max(2.,radius1 - round)));
    } else {
      _d = sdExtrudedCylinder(p1,rDepth,vec2(max(2.,radius0 - round), max(2.,radius1 - round)));
    }
    if (hasRound) {
      _d = opRound(_d,round);
    }
  }
  return _d;
}

float sdfModBezier(vec3 _p, vec3 size, int mode, float round, float lineWidth, float torus) {
  vec3 p1 = _p;
  float _d;

  float f = 1.5;
  vec2 p0_ = vec2(-size.x, size.y * -1.);
  vec2 p1_ = vec2(0., size.y * 2. * f);
  vec2 p2_ = vec2(size.x, size.y * -1.);

  round = min(0.99, round) * min(lineWidth, size.z);

  _d = sdBezier(p1.xy,p0_,p1_,p2_)-(lineWidth - round);

  if (mode == 1) {
    float ext = max(0., torus > 0. ? 0. : size.z - lineWidth);
    _d = opExtrussion(p1,_d,ext)-lineWidth;
  } else if (torus > 0.) {
    float r1 = max(0., lineWidth - 2.);
    float ext = max(0., size.z - lineWidth);
    _d = opExtrussion(p1,abs(_d-r1),ext)-size.z;
  } else {
    float ext = size.z - round;
    _d = opExtrussion(p1,_d,ext);
    bool hasRound = round > 0.1;
    if (hasRound) {
      _d = opRound(_d,round);
    }
  }
  return _d;
}

float sdfModJoint(vec3 _p, vec3 size, float cone, float round) {
  vec3 p1 = _p;
  float _d;
  
  float radius =
  cone > 0.
    ? size.x - (cone * size.x) * (p1.z + (size.x * 2.)) / (size.z + size.x * 2.)
    : size.x;
  _d = sdVerticalCapsule(p1,size.z,radius);
  if (round > 0.1) { // hasRound
    _d = opRound(_d,round);
  }
  return _d;
}


// sim-specific

/*
float blink(float x) {
  float t = iTime * 2.;
  float f1 = min(1., mod(t, 12.1));
  float f2 = smoothstep(0., .1, f1) - smoothstep(.18, .4, f1);
  float f3 = min(1., mod(t, 16.4));
  float f4 = smoothstep(0., .1, f3) - smoothstep(.18, .4, f3);
  float a = max(f2, f4) / 2.; //+.04*cos(t);
  return (1. - a * .9) * x;
}
*/

// scene

/*
const MODES = ['add', 'sub', 'int', 'rep'];
const FIELD_NAMES = [
  'blend', //c.w
  'shell', //d.x
  'hole',
  'bevel',
  'round',
  'cone', //e.x
  'lineWidth',
  'vertexPosition',
  'torus',
  'mirrorX', //f.x
  'material',
  'blink',
  'star',
  'vertexCount', //g.x
  'offsX',
];
*/

mat3 rotationMatrixFromEulers(vec3 v) {
  vec3 s = vec3(sin(v.x), sin(v.y), sin(v.z));
  vec3 c = vec3(cos(v.x), cos(v.y), cos(v.z));
  return mat3(
    c.y * c.z,
    c.x * s.z + c.z * s.x * s.y,
    s.x * s.z - c.x * c.z * s.y,
    -c.y * s.z,
    c.x * c.z - s.x * s.y * s.z,
    c.z * s.x + c.x * s.y * s.z,
    s.y,
    -c.y * s.x,
    c.x * c.y
  );
}

Result evalDistance(vec3 p) {
  p = p * 150.;
  p = mat3(1,0,0,0,0,1,0,-1,0) * p;// mat3(0,0,1,0,1,0,-1,0,0) * p;
  p = p + vec3(0,0,256-150);

  Result res = Result(9999.,0.,0.,0.,0.);
  // vec4 header = 
  // vec4 header = texelFetch(uStrokesTex, ivec2(0, 0), 0);
  // int strokeCount = int(header.x);
  int strokeCount = int(uStrokes[0].x);

  int stride = 8;
  int layerCount = 0;
  Result layerRes;
  // [loop] [fastop]
  for (int i = 1; i <= strokeCount; i++) {
    ivec2 texPos = ivec2(int(mod(float(i), 256.)) * 8, (i) / 256);
    vec4 a = uStrokes[i * stride + 0];
    vec4 b = uStrokes[i * stride + 1];
    vec4 c = uStrokes[i * stride + 2];
    vec4 d = uStrokes[i * stride + 3];
    vec4 e = uStrokes[i * stride + 4];
    vec4 f = uStrokes[i * stride + 5];
    vec4 g = uStrokes[i * stride + 6];
    vec4 h = uStrokes[i * stride + 7];
    // vec4 a = texelFetch(uStrokesTex, texPos + ivec2(0, 0), 0);
    // vec4 b = texelFetch(uStrokesTex, texPos + ivec2(1, 0), 0);
    // vec4 c = texelFetch(uStrokesTex, texPos + ivec2(2, 0), 0);
    // vec4 d = texelFetch(uStrokesTex, texPos + ivec2(3, 0), 0);
    // vec4 e = texelFetch(uStrokesTex, texPos + ivec2(4, 0), 0);
    // vec4 f = texelFetch(uStrokesTex, texPos + ivec2(5, 0), 0);
    // vec4 g = texelFetch(uStrokesTex, texPos + ivec2(6, 0), 0);
    // vec4 h = texelFetch(uStrokesTex, texPos + ivec2(7, 0), 0);

    int prim = int(a.x);
    int mode = int(a.y);
    vec3 pos = vec3(a.z, a.w, b.x);
    mat3 rot = inverse(rotationMatrixFromEulers(vec3(b.y, b.z, b.w)));
    vec3 size = vec3(c.x, c.y, c.z);
    float blend = c.w;
    float hole = d.y;
    float bevel = d.z;
    float round = d.w;
    float cone = e.x;
    float lineWidth = e.y;
    float torus = e.w;
    float mirror = f.x;
    float material = f.y;
    float offsX = g.y;
    Result r;
    float _d;
    vec3 _p;
    if (mirror == 1.) {
      _p = vec3(abs(p.x - (pos.x - offsX)) - abs(offsX), p.yz - pos.yz);
    } else {
      _p = p - pos;
    }
    _p = rot * _p;
    if (prim == 1) { // cube
      float _d = sdfModCube(_p, size, round, hole, bevel, cone);
      r = Result(_d, material, 0., 0., blend);
    } else if (prim == 2) { // cylinder
      float _d = sdfModCylinder(_p, size, hole, cone, round);
      r = Result(_d, material, 0., 0., blend);
    } else if (prim == 3) { // bezier
      float _d = sdfModBezier(_p, size, mode, round, lineWidth, torus);
      r = Result(_d, material, 0., 0., blend);
    } else if (prim == 4) {
      float _d = sdfModJoint(_p, size, cone, round);
      r = Result(_d, material, 0., 0., blend);
    } else if (prim == 5) {
      r = Result(sdEllipsoid(_p, size), material, 0., 0., blend);
    } else {
      r = Result(sdEllipsoid(_p, size), material, 0., 0., blend);
    }

    // merge with layer
    if (layerCount == 0) {
      layerRes = Result(9999.,0.,0.,0.,0.);
    }
    layerCount += 1;
    if (mode == 0) { // add
      if (r.k > 0.) {
        layerRes = opSmoothUnion(r, layerRes, r.k);
      } else {
        layerRes = opUnion(r, layerRes);
      }
    } else if (mode == 1) { // sub
      if (r.k > 0.) {
        layerRes = opSmoothSubtraction(r, layerRes, r.k);
      } else {
        layerRes = opSubtract(r, layerRes);
      }
    } else if (mode == 2) {
      layerRes = opIntersect(r, layerRes);
    } else if (mode == 3) {
      layerRes = opReplace(r, layerRes);
    }

    // handle end of layer
    if (g.z == 1.) {
      if (layerCount > 1) { // end of layer
        int layerMode = int(g.w);
        float layerBlend = h.x;
        if (layerMode == 0) {
          if (layerBlend > 0.) {
            res = opSmoothUnion(layerRes, res, layerBlend);
          } else {
            res = opUnion(layerRes, res);
          }
        } else if (mode == 1) {
          if (r.k > 0.) {
            res = opSmoothSubtraction(layerRes, res, layerBlend);
          } else {
            res = opSubtract(layerRes, res);
          }
        } else if (mode == 3) {
          res = opReplace(layerRes, res);
        }
      }
      layerCount = 0;
    }
  }
  res.d *= 1./150.;
  return res;
}

vec3 GetNormal(vec3 p) {
  vec3 n = vec3(0.0);
  for (int i = ZERO; i < 4; i++) {
    vec3 e = 0.5773 * (2.0 * vec3((((i + 3) >> 1) & 1), ((i >> 1) & 1), (i & 1)) - 1.0);
    n += e * evalDistance(p + e * 0.001).d;
  }
  return normalize(n);
}

float map2(in vec3 pos, vec3 dir)
{
  return min(pos.y + 1.0, evalDistance(pos).d);
}

float calcAO(in vec3 pos, in vec3 nor)
{
  float ao = 0.0;
  for (int i = ZERO; i < 8; i++)
  {
    float h = 0.02 + 0.5 * float(i) / 7.0;
    float d = map2(pos + h * nor, nor);
    ao += h - d;
  }
  return clamp(1.5 - ao * 0.6, 0.0, 1.0);
}

void evalMaterial(float m, vec3 p, out vec3 col, out vec4 mat) {
    m -= 1.; // we offset by 1 because 0 is not rendered
    int colorIndex = int(mod(abs(m), 10000.)) / 10;
    int materialTypeIndex = int(mod(abs(m), 10.));
    bool hardcodedPalette = m < 9999.;

    col = (hardcodedPalette ? uHardcoded[colorIndex] : uRandomized[colorIndex]) / 255.;
    col = pow(col, vec3(2.2));
    mat = uMaterials[materialTypeIndex];
}

void XformP(inout vec3 p) {
    p *= 900.;
    p = mat3(1,0,0,0,0,1,0,-1,0) * mat3(0,0,1,0,1,0,-1,0,0) * p;
    p += vec3(0,0,280);
}

// ray marching

Result GetDistIgnoreBox(vec3 p, vec3 dir) {
    return evalDistance(p);
    }

Result GetDist(vec3 p, vec3 dir) {
    return evalDistance(p);
}

Result RayMarch(vec3 ro,vec3 rd, out int steps) {
    float obj = 0.;
    float dO = 0.;
    Result r = Result(dO, 0., 0., 0., 0.);//, vec3(0), 0.);
    int i;
    // [loop] [fastop]
    for (i = ZERO; i < MAX_STEPS; i++) {
    if (dO > MAX_DIST) {
//      r = Result(dO, 0., 0., 0., 0.);
        break;
    }
    vec3 p = ro + rd * dO;
    Result ds = GetDist(p, rd);
    // if (ds.d < SURF_DIST * dO) {
    if (ds.d < SURF_DIST) {
        r = Result(dO, ds.m1, ds.m2, ds.b, 0.);//, ds.normal, ds.ao);
        break;
    }
    dO += ds.d;
    steps = i;
    }
    return r;
}

vec3 fresnel(vec3 F0, float NdotV, float roughness)
{
    return F0 + (max(vec3(1.0 - roughness, 1.0 - roughness, 1.0 - roughness), F0) - F0) * pow(NdotV, 5.);
}

const bool ATTENUATION = false;
const float FIVETAP_K = 22.0; //2.0;
const float AO_DIST = .015; //.085;
const float DISTORTION = 0.2;
const float GLOW = 6.0;
const float BSSRDF_SCALE = 3.0;
const float AMBIENT = 0.0;

float fiveTapAO(vec3 p, vec3 n, float k) {
    float aoSum = 0.0;
    for (float i = float(ZERO); i < 5.0; ++i) {
    float coeff = 1.0 / pow(2.0, i);
    aoSum += coeff * (i * AO_DIST - GetDist(p + n * i * AO_DIST, n).d);
    }
    //  return 1.0 - aoSum;
    return 1.0 - k * aoSum;
}

float subsurface(vec3 lightDir, vec3 normal, vec3 viewVec, float thickness) {
    vec3 scatteredLightDir = lightDir + normal * DISTORTION;
    float lightReachingEye = pow(clamp(dot(viewVec, -scatteredLightDir), 0.0, 1.0), GLOW) * BSSRDF_SCALE;
    float attenuation = 1.0;
    if (ATTENUATION) { attenuation = max(0.0, dot(normal, lightDir) + dot(viewVec, -lightDir)); }
    float totalLight = attenuation * (lightReachingEye + AMBIENT) * thickness;
    return totalLight;
}

float shadows(in vec3 ro, in vec3 rd, float mint, float k) {
    float res = 1.0;
    float t = mint;
    float h = 1.0;
    float maxt = 3.;
    for (; t < maxt;)
    {
    h = GetDistIgnoreBox(ro + rd * t, rd).d;
    if (h < SURF_DIST * 2.) return 0.;
    res = min(res, k * h / t);
    t += h;
    }
    return clamp(res, 0.0, 1.0);
}

float mapScale(float v, float inMin, float inMax, float outMin, float outMax) {
    return (v - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
}

vec3 GetLight(vec3 pos, vec3 col, vec3 rd, vec4 mat) {//, vec3 nor, float occ) {
    vec3 view = -rd;

    vec3 nor = GetNormal(pos); // normal vector
    float occ = calcAO(pos, nor);

    // directional light
    float angle = 1.;
    vec3 lightPos = vec3(5. * sin(angle), 5., 6. + 5. * cos(angle)); // light position

    // vec3 lig = normalize(lightPos - pos); // light vector
    vec3 lig = normalize(vec3(0.96, 0.8, -0.7)); // dir to light

    float spow = 5.; //128.;//128.0;
    vec3 ref = reflect(rd, nor);

    float dif = mapScale(dot(nor, lig), -1., 1., 0., 1.);
    float amb = clamp(1.5 + 0.5 * nor.y, 0.0, 1.0);
    float spe = pow(clamp(dot(ref, lig), 0.0, 1.0), spow);
    float fre = pow(clamp(1.0 + dot(nor, rd), 0.0, 1.0), 2.0);
    float dom = 0.; //smoothstep( -0.1, 0.1, ref.y );

    //  float shadow = 1.0;//shadows(pos, lig, 0.1);
    // float shadow = shadows(pos + 0.01 * nor, lig, 0.0005, 32.0);
    float shadow = shadows(pos + nor * SURF_DIST * 2., lig, 0.05, 3.); // 0. is in shadow

    dif *= mapScale(smoothstep(0., 1., shadow), 0., 1., 0.5, 1.);
    dom *= shadows(pos, nor, 0.0005, 32.0);

    vec3 lin = vec3(0.0);
    lin += dif;
    // lin += spe*dif*occ;
    // lin += fre*0.3*occ;
    lin += amb * 0.5 * occ;
    // lin += dom * 0.1 * occ;

    col = col * lin;

    // col = vec3(shadow); // show shadows
    // col = vec3(occ); // show AO

    return col;
}

struct ray {
    vec3 pos;
    vec3 dir;
};

ray cameraRay(vec2 uv, vec3 camPos, vec3 lookAt, float zoom) {
    vec3 f = normalize(lookAt - camPos);
    vec3 r = cross(vec3(0.0,1.0,0.0),f);
    vec3 u = cross(f,r);
    vec3 c=camPos+f*zoom;
    vec3 i=c+uv.x*r+uv.y*u;
    vec3 dir=i-camPos;
    return ray(camPos,normalize(dir));
}

// took it out as i was getting sick. and figured i'd comment it out until we decide to use it again
// vec3 wiggleCam(vec3 pos, float delay, float speed, float mult) {
//   float dt = iTime - iLastClick.z + delay / 5.;
//   return pos + vec3(sin(dt * speed), cos(dt * speed * 1.5), sin(dt * speed / 2.)) * mult;// * 1. / exp(dt / 3.) * dampen;
// }

// vec3 wiggleCam(vec3 pos) {
//   return wiggleCam(pos, .3, 3., 1./100.) * vec3(1., .5, 1.);
// }

// vec3 wiggleLookAt(vec3 pos) {
//   return wiggleCam(pos, .7, 2.1, 1./100.) * vec3(1., .1, 1.);
// }

struct cam {
    vec3 pos;
    vec3 lookAt;
    float zoom;
};

// antilizing
#define AA 1

void main() {
    vec3 tot = vec3(0.0); // output color

    // loop to anti-alias
    for (int m = 0; m < AA; m++)
    for (int n = 0; n < AA; n++) {
    // vec2 o = vec2(float(m), float(n)) / float(AA) - 0.5; // anti-alias offset
    vec2 o = uOffs / float(AA) - 0.5; // anti-alias offset

    vec2 uv=fragCoord + o / iResolution.x;
    uv.x*=iResolution.x/iResolution.y;

    ray camRay = cameraRay(uv, uCameraPos, uCameraLookAt, uCameraZoom);
    vec3 ro = camRay.pos;
    vec3 rd = camRay.dir;

    // raymarch
    int steps;
    Result d = RayMarch(ro, rd, steps);

    /*
    float x = float(steps) / float(MAX_STEPS);
    vec3 color = vec3(
        x < .1 ? x * 10. : 1.,
        x < .1 ? 0. : x < .5 ? (x - .1) * 4. : 1.,
        x < .5 ? 0. : (x - .5) * 2.
    );
    */

    // materials + light
    // vec3 color = vec3(1,1,1);//vec3(0.5 + 0.5 * cos(iTime + p.xyx + vec3(0,2,4)));
    vec3 color = vec3(0.30, 0.36, 0.60) - (rd.y * 0.7);
    if (d.d < MAX_DIST && d.m1 > 0.) {
        vec3 diffuse = vec3(1,1,1);
        vec4 mat;
        vec3 pp = ro + rd * d.d;
        evalMaterial(d.m1, pp, diffuse, mat);
        vec3 diffuse2 = vec3(1,1,1);
        vec4 mat2_;
        evalMaterial(d.m2, pp, diffuse2, mat2_);
        diffuse = d.m2 == 0. ? diffuse : mix(diffuse, diffuse2, d.b);
        mat = d.m2 == 0. ? mat : mix(mat, mat2_, d.b);
        color = GetLight(pp, diffuse, rd, mat);//, d.normal, d.ao);
    }
    tot += color;
    }

    tot /= float(AA * AA);
    // tot = tot * vec3(1.11,0.89,0.79); // color grading
    tot = pow(tot, vec3(1./2.2)); // linear to sRGB
    fragColor = vec4(tot/4.,1.);
}
`;
