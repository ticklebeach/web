#version 300 es
precision highp float;
precision highp int;
uniform float iTime,iDate,iTimeDelta;
uniform int iFrame;

uniform int MARKER;
/* MARKER
out lowp vec4 fragColor;
uniform vec2 iResolution;
uniform vec4 iMouse,iLastClick;
in vec2 fragCoord;
*/

uniform sampler2D iTreeTex;
// uniform sampler2D iStrokesTex;
uniform sampler2D uResultTex;
uniform sampler2D uNormalTex;

uniform vec3 uColors[75];
// uniform vec3 uHardcoded[200];
// uniform vec3 uRandomized[50];
uniform vec4 uMaterials[10];
uniform vec3 uBoundsMin;
uniform vec3 uBoundsMax;

uniform vec3 uCameraPos;
uniform vec3 uCameraLookAt;
uniform float uCameraZoom;

uniform vec3 uBackgroundColor1;
uniform vec3 uBackgroundColor2;

#define PI 3.1415925359
// max raymarching steps
#define MAX_STEPS 100
// max raymarching distance
#define MAX_DIST 65.
// max surface distance
#define SURF_DIST .01
#define ZERO (min(iFrame,0))
#define BOX_OFFS .02



struct Result {
  float d; // d is the signed distance to the scene
  // positive is outside the scene,
  // 0 is on the surface
  // negative is inside

  float m1; // material 1
  float m2; // material 2
  float b; // material blend
  float k; // blending between objects, unused when the scene is fully built
  vec3 normal; // normal is the direction away from the closest scene surface
  float ao; // ao is the amount of ambient occlusion there is (darkening from being in a corner, for instance)
  float d2;
};

float sdBox( vec3 p, vec3 b )
{
  vec3 q = abs(p) - b;
  return length(max(q,0.0)) + min(max(q.x,max(q.y,q.z)),0.0);
}

// sim-specific

// vec3 wiggle(vec3 pos, float delay, float dampen) {
//   float dt = iTime - iLastClick.z + delay / 5.;
//   float speed = 10.;
//   return pos + vec3(sin(dt * speed), cos(dt * speed * 1.5), sin(dt * speed / 2.)) * 10. * 1. / exp(dt / 3.) * dampen;
// }

// vec3 wiggle(vec3 pos) {
//   return wiggle(pos, .3, .8);
// }

// float blink(float x) {
//   float t = iTime * 2.;
//   float f1 = min(1., mod(t, 12.1));
//   float f2 = smoothstep(0., .1, f1) - smoothstep(.18, .4, f1);
//   float f3 = min(1., mod(t, 16.4));
//   float f4 = smoothstep(0., .1, f3) - smoothstep(.18, .4, f3);
//   float a = max(f2, f4) / 2.; //+.04*cos(t);
//   return (1. - a * .9) * x;
// }

float aabb_ray_cast(vec3 boxMin, vec3 boxMax, vec3 from, vec3 dir) {
  float tMin;
  float tMax;

  vec3 invD = 1.0f / dir;
  vec3 t1 = (boxMin.xyz - from) * invD;
  vec3 t2 = (boxMax.xyz - from) * invD;
  vec3 minComps = min(t1, t2);
  vec3 maxComps = max(t1, t2);

  tMin = max(minComps.x, max(minComps.y, minComps.z));
  tMax = min(maxComps.x, min(maxComps.y, maxComps.z));

  return max(tMin, tMax);
}

ivec2 texturePos(int entryIndex, int stride) {
  int width = 2048;
  int perRow = width / stride;
  int x = int(mod(float(entryIndex), float(perRow))) * stride;
  int y = entryIndex / perRow;
  return ivec2(x, y);
}

Result evalDistanceBounds(vec3 p, out bool hits) {
  vec3 halfSize = (uBoundsMax - uBoundsMin) / 2.;
  vec3 boxPos = uBoundsMin + halfSize;
  float boxD = sdBox(p - boxPos, halfSize);

  hits = boxD < SURF_DIST;
  return Result(boxD + BOX_OFFS, 81., 0., 0., 0., vec3(0), 0., boxD + BOX_OFFS);
}

Result evalDistance(vec3 p, vec3 dir) {
  vec3 fullSize = uBoundsMax - uBoundsMin;
  vec3 halfSize = fullSize / 2.;
  vec3 center = uBoundsMin + halfSize;

  int treeIndex = 0;
  ivec2 texPos;
  vec4 node;
  int depth = 0;
  while (true) {
  // for (depth = 0; depth < 10; depth++) {
    halfSize = fullSize / float(1 << (depth + 1));
    texPos = texturePos(treeIndex, 1);
    node = texelFetch(iTreeTex, texPos, 0);
    bool recurse = node.x > 0.5;
    if (recurse) {
      // recurse -- figure out which octant we move to next
      ivec3 pos = ivec3(greaterThanEqual(p, center));
      int octant = pos.x + 2 * pos.y + 4 * pos.z;
      treeIndex = int(node.x) + octant;
      center += halfSize / 2. * (vec3(pos) * 2. - 1.);
    } else {
      break;
    }
    depth++;
    if (depth == 10) break;
  }

  vec4 result = texelFetch(uResultTex, texPos, 0);
  float dist = result.x;
  if (depth == 10) {
    return Result(dist, 0., 0., 0., 0., vec3(0), 0., dist);
  } else {
    bool deadEnd = node.x < -0.01;
    if (deadEnd) {
      // a dead end leaf
      vec3 minPos = center - halfSize;
      vec3 maxPos = center + halfSize;
      float t = aabb_ray_cast(minPos, maxPos, p, dir);
      float d = t < 0. ? dist : min(t + BOX_OFFS, dist);//min(t, min(a.y, length(p + dir * t - center)));
      return Result(d, 0., result.z, result.w, 0., vec3(0), 0., dist);
    } else {
      // a valid leaf
      vec4 normalAO = texelFetch(uNormalTex, texPos, 0);
      vec3 normal = normalAO.xyz;
      float ao = normalAO.w;
      // return Result(-.1, b.y, c.y, c.z, 0., normal, ao, a.y);
      // return Result(min(-SURF_DIST * 2., a.y), b.y, c.y, c.z, 0., normal, ao, a.y);
      // return Result(dist, 111. + float(treeIndex) * 20., 0., 0., 0., normal, 0., dist);
      return Result(-.1, result.y, result.z, result.w, 0., normal, ao, dist);
    }
  }
}

void evalMaterial(float m, vec3 p, out vec3 col, out vec4 mat) {
  m -= 1.; // we offset by 1 because 0 is not rendered
  int colorIndex = int(mod(abs(m), 10000.)) / 10; // 10 it to pull apart marterial from color
  int materialTypeIndex = int(mod(abs(m), 10.));
  // bool hardcodedPalette = m < 9999.;

  col = uColors[colorIndex] / 255.;
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
  // bool hits;
  // return evalDistanceBounds(p, hits);

  return evalDistance(p, dir);
}

Result GetDist(vec3 p, vec3 dir, out bool hits) {
  // return evalDistanceBounds(p, hits);

  Result r = evalDistanceBounds(p, hits);
  if (hits) {
    return evalDistance(p, dir);
  } else {
    return r;
  }
}

// position, direction, steps (0)
Result RayMarch(vec3 ro, vec3 rd, out int steps) {
  // default of 0
  float dO = 0.;
  Result r = Result(dO, 0., 0., 0., 0., vec3(0), 0., dO);

  int i;
  for (i = ZERO; i < MAX_STEPS; i++) {
    if (dO > MAX_DIST) {
//      r = Result(dO, 0., 0., 0., 0.);
      break;
    }

    vec3 p = ro + rd * dO;
    bool hits;
    Result ds = GetDist(p, rd, hits);
    if (ds.d < SURF_DIST) {
      dO += ds.d;
      r = Result(dO, ds.m1, ds.m2, ds.b, 0., ds.normal, ds.ao, dO);
      break;
    }

    dO += ds.d;
    steps = i;
  }
  return r;
}

// vec3 fresnel(vec3 F0, float NdotV, float roughness)
// {
//   return F0 + (max(vec3(1.0 - roughness, 1.0 - roughness, 1.0 - roughness), F0) - F0) * pow(NdotV, 5.);
// }

// const bool ATTENUATION = false;
// const float FIVETAP_K = 22.0; //2.0;
// const float AO_DIST = .015; //.085;
// const float DISTORTION = 0.2;
// const float GLOW = 6.0;
// const float BSSRDF_SCALE = 3.0;
// const float AMBIENT = 0.0;

// float fiveTapAO(vec3 p, vec3 n, float k) {
//   float aoSum = 0.0;
//   for (float i = float(ZERO); i < 5.0; ++i) {
//     float coeff = 1.0 / pow(2.0, i);
//     aoSum += coeff * (i * AO_DIST - GetDist(p + n * i * AO_DIST, n).d);
//   }
//   //  return 1.0 - aoSum;
//   return 1.0 - k * aoSum;
// }

// float subsurface(vec3 lightDir, vec3 normal, vec3 viewVec, float thickness) {
//   vec3 scatteredLightDir = lightDir + normal * DISTORTION;
//   float lightReachingEye = pow(clamp(dot(viewVec, -scatteredLightDir), 0.0, 1.0), GLOW) * BSSRDF_SCALE;
//   float attenuation = 1.0;
//   if (ATTENUATION) { attenuation = max(0.0, dot(normal, lightDir) + dot(viewVec, -lightDir)); }
//   float totalLight = attenuation * (lightReachingEye + AMBIENT) * thickness;
//   return totalLight;
// }

float shadows(in vec3 ro, in vec3 rd, float mint, float k) {
  float res = 1.0;
  float t = mint;
  float h = 1.0;
  float maxt = 3.;
  for (; t < maxt;)
  {
    h = GetDistIgnoreBox(ro + rd * t, rd).d2;
    if (h < SURF_DIST * 2.) return 0.;
    res = min(res, k * h / t);
    t += h;
  }
  return clamp(res, 0.0, 1.0);
}

float mapScale(float v, float inMin, float inMax, float outMin, float outMax) {
  return (v - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
}

vec3 GetLight(vec3 pos, vec3 col, vec3 rd, vec4 mat, vec3 nor, float occ) {
  vec3 view = -rd;

  // vec3 nor = GetNormal(pos, rd); // normal vector

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
  vec3 r = normalize(cross(vec3(0.0,1.0,0.0),f));
  vec3 u = normalize(cross(f,r));
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
    vec2 o = vec2(float(m), float(n)) / float(AA) - 0.5; // anti-alias offset

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

    // background color
    vec3 color = pow(mix(uBackgroundColor1, uBackgroundColor2, uv.y), vec3(2.2));

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
      color = GetLight(pp, diffuse, rd, mat, d.normal, d.ao);
    }
    tot += color;
  }

  tot /= float(AA * AA);
  // tot = tot * vec3(1.11,0.89,0.79); // color grading
  tot = pow(tot, vec3(1./2.2)); // linear to sRGB
  fragColor = vec4(tot,1.);
}
