/*
 * ATTENTION: The "eval" devtool has been used (maybe by default in mode: "development").
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/octree/sdf.js":
/*!***************************!*\
  !*** ./src/octree/sdf.js ***!
  \***************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"add\": () => (/* binding */ add),\n/* harmony export */   \"clamp\": () => (/* binding */ clamp),\n/* harmony export */   \"div\": () => (/* binding */ div),\n/* harmony export */   \"length\": () => (/* binding */ length),\n/* harmony export */   \"mul\": () => (/* binding */ mul),\n/* harmony export */   \"normalize\": () => (/* binding */ normalize),\n/* harmony export */   \"result\": () => (/* binding */ result),\n/* harmony export */   \"sdRoundBox\": () => (/* binding */ sdRoundBox),\n/* harmony export */   \"sdSphere\": () => (/* binding */ sdSphere),\n/* harmony export */   \"sdUnion\": () => (/* binding */ sdUnion),\n/* harmony export */   \"sub\": () => (/* binding */ sub),\n/* harmony export */   \"vec\": () => (/* binding */ vec)\n/* harmony export */ });\nfunction result(d, m1, m2, b, k) {\n  return { d, m1, m2, b, k };\n}\n\nfunction vec(x, y, z) {\n  return { x, y, z };\n}\n\nfunction vecFn(fn) {\n  return vec(fn('x'), fn('y'), fn('z'));\n}\n\nfunction isVec(v) {\n  // eslint-disable-next-line no-prototype-builtins\n  return v.hasOwnProperty('x');\n}\n\nfunction isMat(m) {\n  return Array.isArray(m);\n}\n\nfunction abs(v) {\n  return vecFn((i) => Math.abs(v[i]));\n}\n\nfunction sub(a, b) {\n  return isVec(b) ? vecFn((i) => a[i] - b[i]) : vecFn((i) => a[i] - b);\n}\n\nfunction add(a, b) {\n  return isVec(b) ? vecFn((i) => a[i] + b[i]) : vecFn((i) => a[i] + b);\n}\n\nfunction length(v) {\n  return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);\n}\n\nfunction min(a, b) {\n  return isVec(a)\n    ? isVec(b)\n      ? vecFn((i) => Math.min(a[i], b[i]))\n      : vecFn((i) => Math.min(a[i], b))\n    : Math.min(a, b);\n}\n\nfunction max(a, b) {\n  return isVec(a)\n    ? isVec(b)\n      ? vecFn((i) => Math.max(a[i], b[i]))\n      : vecFn((i) => Math.max(a[i], b))\n    : Math.max(a, b);\n}\n\nfunction sdRoundBox(p, b, r) {\n  const q = sub(abs(p), b);\n  return length(max(q, 0)) + min(max(q.x, max(q.y, q.z)), 0) - r;\n}\n\nfunction sdSphere(p, r) {\n  return length(p) - r;\n}\n\nfunction sdUnion(a, b) {\n  return a.d < b.d ? a : b;\n}\n\n// function opUnion(a, b) {\n//   return sdUnion(a, b);\n// }\n\n// function opSubtract(a, b) {\n//   if (a.d > -b.d) return a;\n//   else return result(-b.d, a.m1, a.m2, a.b, 0);\n// }\n\n// function opReplace(a, b) {\n//   const r = opSmoothUnion(a, b, a.k); // / 2.);\n//   return result(b.d, r.m1, r.m2, r.b, r.k);\n// }\n\n// function opSmoothSubtraction(a, b, k) {\n//   k = typeof k === 'undefined' ? 2.5 : k;\n//   const h = Math.max(k - Math.abs(-a.d - b.d), 0.0);\n//   const t = Math.max(-a.d, b.d) + (h * h * 0.25) / k;\n//   return result(t, b.m1, b.m2, b.b, 0);\n// }\n\nfunction clamp(x, min, max) {\n  return Math.min(max, Math.max(min, x));\n}\n\n// const BLEND_SIZE = 3;\n\n// function getBlend(d1, d2, blendSize) {\n//   const diff = -Math.abs(d1 - d2);\n//   let blend = diff / blendSize;\n//   blend = clamp((blend + 1.0) * 0.5, 0, 1);\n//   return blend;\n// }\n\n// function smin(a, b, k) {\n//   const h = Math.max(k - Math.abs(a - b), 0.0);\n//   const t = Math.min(a, b) - (h * h * 0.25) / k;\n//   return t;\n// }\n\n/*\nfloat smin(float a, float b, float k) {\n  float h = clamp(0.5 + 0.5*(a-b)/k, 0.0, 1.0);\n  return mix(a, b, h) - k*h*(1.0-h);\n}\n*/\n\n// function lerp(start, end, amt) {\n//   return (1 - amt) * start + amt * end;\n// }\n\n// function mix(a, b, t) {\n//   return lerp(a, b, t);\n// }\n\n// function float(x) {\n//   return x ? 1 : 0;\n// }\n\n// function opSmoothUnion(f1, f2, k) {\n//   k = typeof k === 'undefined' ? 0.5 : k;\n\n//   k = k / 2;\n\n//   // Branching a lot :( Needs more work\n\n//   let closest = f1;\n//   let furthest = f2;\n\n//   let diff = f1.d > f2.d ? 1 : 0;\n\n//   closest.d = mix(f1.d, f2.d, diff);\n//   closest.m1 = mix(f1.m1, f2.m1, diff);\n//   closest.m2 = mix(f1.m2, f2.m2, diff);\n//   closest.b = mix(f1.b, f2.b, diff);\n\n//   furthest.d = mix(f2.d, f1.d, diff);\n//   furthest.m1 = mix(f2.m1, f1.m1, diff);\n//   furthest.m2 = mix(f2.m2, f1.m2, diff);\n//   furthest.b = mix(f2.b, f1.b, diff);\n\n//   // Dominant materials\n//   let mf1 = mix(closest.m2, closest.m1, float(closest.b < 0.5));\n//   let mf2 = mix(furthest.m2, furthest.m1, float(furthest.b < 0.5));\n\n//   // New distance\n//   let t = smin(f1.d, f2.d, k);\n\n//   // New blend\n//   let bnew = getBlend(f1.d, f2.d, k);\n//   let b = Math.max(closest.b, bnew);\n//   let bhigher = float(b > bnew);\n\n//   let m1 = mix(mf1, closest.m1, bhigher);\n//   let m2 = mix(mf2, closest.m2, bhigher);\n\n//   return result(t, m1, m2, b, 0);\n// }\n\nfunction div(a, b) {\n  return vecFn((i) => a[i] / b);\n}\n\n// function sdEllipsoid(p, r) {\n//   const k0 = length(div(p, r));\n//   const k1 = length(div(p, r * r));\n//   return (k0 * (k0 - 1.0)) / k1;\n// }\n\nfunction normalize(v) {\n  const l = length(v);\n  return Math.abs(l) < 0.00001 ? vec(0, 0, 0) : div(v, l);\n}\n\nfunction mul(a, b) {\n  if (isMat(a)) {\n    if (isMat(b)) {\n      let a00 = a[0],\n        a01 = a[1],\n        a02 = a[2];\n      let a10 = a[3],\n        a11 = a[4],\n        a12 = a[5];\n      let a20 = a[6],\n        a21 = a[7],\n        a22 = a[8];\n\n      let b00 = b[0],\n        b01 = b[1],\n        b02 = b[2];\n      let b10 = b[3],\n        b11 = b[4],\n        b12 = b[5];\n      let b20 = b[6],\n        b21 = b[7],\n        b22 = b[8];\n\n      return mat(\n        b00 * a00 + b01 * a10 + b02 * a20,\n        b00 * a01 + b01 * a11 + b02 * a21,\n        b00 * a02 + b01 * a12 + b02 * a22,\n\n        b10 * a00 + b11 * a10 + b12 * a20,\n        b10 * a01 + b11 * a11 + b12 * a21,\n        b10 * a02 + b11 * a12 + b12 * a22,\n\n        b20 * a00 + b21 * a10 + b22 * a20,\n        b20 * a01 + b21 * a11 + b22 * a21,\n        b20 * a02 + b21 * a12 + b22 * a22,\n      );\n    } else {\n      let x = b.x,\n        y = b.y,\n        z = b.z;\n      return vec(\n        x * a[0] + y * a[3] + z * a[6],\n        x * a[1] + y * a[4] + z * a[7],\n        x * a[2] + y * a[5] + z * a[8],\n      );\n    }\n  } else if (isVec(a)) {\n    return isVec(b) ? vecFn((i) => a[i] * b[i]) : vecFn((i) => a[i] * b);\n  }\n}\n\nfunction mat(...a) {\n  return a;\n}\n\n// function opSymX(p) {\n//   return vec(Math.abs(p.x), p.y, p.z);\n// }\n\nfunction vecToArray(v) {\n  return [v.x, v.y, v.z];\n}\n\nfunction boundsFromArray(b) {\n  return { min: vec(...b[0]), max: vec(...b[1]) };\n}\n\nfunction boundsToArray(b) {\n  return [vecToArray(b.min), vecToArray(b.max)];\n}\n\nfunction boundsIntersection(a, b) {\n  return {\n    min: max(a.min, b.min),\n    max: min(a.max, b.max),\n  };\n}\n\nlet w = window;\n\nw.vec = vec;\nw.sub = sub;\nw.div = div;\nw.add = add;\nw.mul = mul;\nw.vecToArray = vecToArray;\nw.normalize = normalize;\nw.min = min;\nw.max = max;\nw.boundsFromArray = boundsFromArray;\nw.boundsToArray = boundsToArray;\nw.boundsIntersection = boundsIntersection;\n\n\n//# sourceURL=webpack://webpack-demo/./src/octree/sdf.js?");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The require scope
/******/ 	var __webpack_require__ = {};
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module can't be inlined because the eval devtool is used.
/******/ 	var __webpack_exports__ = {};
/******/ 	__webpack_modules__["./src/octree/sdf.js"](0, __webpack_exports__, __webpack_require__);
/******/ 	
/******/ })()
;