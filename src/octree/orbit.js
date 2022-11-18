/* global vec, sub, mul, vecToArray, add */

let w = window;

const config = { el: null, reversed: false };
const orbit = {
  pos: vec(0, 10, 0),
  lookAt: vec(0, 1.5, 0),
  zoom: 6,
};
let state = null;
let rotateStart = null;
const rotateSpeed = 0.5;
const sphericalDelta = { radius: 1, phi: 0, theta: 0 };
const sphericalTarget = {
  radius: 40, // distance to the target at start
  phi: Math.PI / 2, // rotation
  theta: -Math.PI / 2, // -Math.PI / 4, // going around it
};
const spherical = { radius: 1, phi: 0, theta: 0 };
// const panDelta = vec(0,0,0);
const minAzimuthAngle = -Infinity;
const maxAzimuthAngle = Infinity;
const minPolarAngle = 0.1;
const maxPolarAngle = (Math.PI * 2) / 3;
const ease = 0.25;
let panDelta = vec(0, 0, 0);
let offset = vec(0, 0, 0);
const minDistance = 20;
const maxDistance = 60;
let target = vec(0, 2, -0.5);
const inertia = 0.85 / 10;
const zoomSpeed = 1;

function clamp(x, min, max) {
  return Math.max(min, Math.min(max, x));
}

export function update() {
  //  if (state === null) return;

  // apply delta
  sphericalTarget.radius *= sphericalDelta.radius;
  sphericalTarget.theta += sphericalDelta.theta;
  sphericalTarget.phi += sphericalDelta.phi;

  // apply boundaries
  sphericalTarget.theta = clamp(sphericalTarget.theta, minAzimuthAngle, maxAzimuthAngle);
  sphericalTarget.phi = clamp(sphericalTarget.phi, minPolarAngle, maxPolarAngle);
  sphericalTarget.radius = clamp(sphericalTarget.radius, minDistance, maxDistance);

  // ease values
  spherical.phi += (sphericalTarget.phi - spherical.phi) * ease;
  spherical.theta += (sphericalTarget.theta - spherical.theta) * ease;
  spherical.radius += (sphericalTarget.radius - spherical.radius) * ease;

  // apply pan to target. As offset is relative to target, it also shifts
  target = add(target, panDelta);

  // apply rotation to offset
  let sinPhiRadius = spherical.radius * Math.sin(Math.max(0.000001, spherical.phi));
  offset.x = sinPhiRadius * Math.cos(spherical.theta);
  offset.y = spherical.radius * Math.cos(spherical.phi);
  offset.z = sinPhiRadius * Math.sin(spherical.theta);

  // Apply updated values to object
  orbit.pos = add(target, offset);
  orbit.lookAt = vec(...vecToArray(target));

  // Apply inertia to values
  sphericalDelta.theta *= inertia;
  sphericalDelta.phi *= inertia;
  panDelta = mul(panDelta, inertia);

  // Reset scale every frame to avoid applying scale multiple times
  sphericalDelta.radius = 1;
}

function handleMoveRotate(x, y) {
  const tempVec2a = vec(x, y, 0);
  const tempVec2b = mul(sub(tempVec2a, rotateStart), rotateSpeed);
  let el = config.el === document ? document.body : config.el;
  sphericalDelta.theta -=
    ((config.reversed ? -1 : 1) * (2 * Math.PI * tempVec2b.x)) / el.clientHeight;
  sphericalDelta.phi -= (2 * Math.PI * tempVec2b.y) / el.clientHeight;
  rotateStart = tempVec2a;
}

function onMouseDown(e) {
  switch (e.button) {
    case 0:
      rotateStart = vec(e.clientX, e.clientY, 0);
      state = 0;
      break;
    // case this.mouseButtons.ZOOM:
    //     if (enableZoom === false) return;
    //     dollyStart.set(e.clientX, e.clientY);
    //     state = STATE.DOLLY;
    //     break;
    // case this.mouseButtons.PAN:
    //     if (enablePan === false) return;
    //     panStart.set(e.clientX, e.clientY);
    //     state = STATE.PAN;
    //     break;
  }

  if (state !== null) {
    w.addEventListener('mousemove', onMouseMove, false);
    w.addEventListener('mouseup', onMouseUp, false);
  }
}

function onTouchDown(e) {
  if (e.touches.length > 0) {
    const touch = e.touches[0];
    rotateStart = vec(touch.screenX, touch.screenY, 0);
    state = 0;
  }

  if (state !== null) {
    w.addEventListener('touchmove', onTouchMove, false);
    w.addEventListener('touchup', onTouchEnd, false);
  }
}

function onMouseMove(e) {
  if (state === 0) {
    handleMoveRotate(e.clientX, e.clientY);
  }
}

function onTouchMove(e) {
  if (e.touches.length > 0) {
    const touch = e.touches[0];
    handleMoveRotate(touch.screenX, touch.screenY);
  }

  e.preventDefault();
  e.stopPropagation();
}

function dolly(dollyScale) {
  sphericalDelta.radius /= dollyScale;
}

function getZoomScale() {
  return Math.pow(0.95, zoomSpeed);
}

function onMouseWheel(e) {
  //   if (state === null) return;
  e.stopPropagation();
  e.preventDefault();

  if (e.deltaY < 0) {
    dolly(1 / getZoomScale());
  } else if (e.deltaY > 0) {
    dolly(getZoomScale());
  }
}

function onMouseUp() {
  w.removeEventListener('mousemove', onMouseMove, false);
  w.removeEventListener('mouseup', onMouseUp, false);
  state = null;
}

function onTouchEnd() {
  w.removeEventListener('touchmove', onTouchMove, false);
  w.removeEventListener('touchup', onTouchEnd, false);
  state = null;
}

export function setup(reversed = false) {
  const el = document;

  config.el = el;
  config.reversed = reversed;

  el.addEventListener('mousedown', onMouseDown, false);
  el.addEventListener('wheel', onMouseWheel, { passive: false });

  el.addEventListener('touchstart', onTouchDown);
  el.addEventListener('touchend', onTouchEnd);
  el.addEventListener('touchcancel', onTouchEnd);
  el.addEventListener('touchmove', onTouchMove, { passive: false });

  return orbit;
}
