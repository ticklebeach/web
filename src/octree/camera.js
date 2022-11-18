/* global vec, add, mul, sub */

let current = {};
let currentChoice = -1;
let target = {};
let targetChoice = -1;
let start = 0;
let dur = 0;
let orbit = null;

export function setOrbit(_orbit) {
  orbit = _orbit;
}

export function set(pos, lookAt, zoom) {
  current = { pos, lookAt, zoom };
  currentChoice = -1;
  target = null;
}

export function setChoice(choice) {
  currentChoice = choice;
  targetChoice = -1;
}

export function move(pos, lookAt, zoom, _dur) {
  target = { pos, lookAt, zoom };
  start = Date.now();
  dur = _dur;
}

export function moveChoice(choice, _dur) {
  targetChoice = choice;
  start = Date.now();
  dur = _dur;
}

export function update() {
  if (currentChoice === -1) {
    if (target) {
      const t = (Date.now() - start) / 1000 / dur;
      const clampT = Math.min(t, 1);
      const now = lerp(current, target, clampT);
      if (t >= 1) {
        current = target;
        target = null;
      }
      return now;
    } else {
      return current;
    }
  } else {
    if (targetChoice > -1) {
      const t = (Date.now() - start) / 1000 / dur;
      const clampT = Math.min(t, 1);
      const now = lerp(camChoice(currentChoice), camChoice(targetChoice), clampT);
      if (t >= 1) {
        currentChoice = targetChoice;
        targetChoice = -1;
      }
      return now;
    } else {
      return camChoice(currentChoice);
    }
  }
}

function lerp(from, to, t) {
  return {
    pos: add(from.pos, mul(sub(to.pos, from.pos), t)),
    lookAt: add(from.lookAt, mul(sub(to.lookAt, from.lookAt), t)),
    zoom: from.zoom + (to.zoom - from.zoom) * t,
  };
}

// pos: vec(0, 0.25, -2);
window.locX = 0;
window.locY = 0.25;
window.locZ = -2;

function pick(choice) {
  const t = Date.now() / 1000;

  if (choice === 0) {
    // sweeping in/out is default (0)
    const angle = Math.sin(t);
    const angleY = Math.cos(t) / 2;
    return {
      pos: vec(Math.sin(angle) + Math.cos(angleY), Math.sin(angleY) / 2 + 0.2, -Math.cos(angle)),
      lookAt: vec(0, 0, 0),
      zoom: 0.5 + (Math.sin(t + 0.5) + 1) / 4,
    };
  } else if (choice === 1) {
    // rotate from slightly above
    const angle = t / 1.4;
    return {
      pos: vec(Math.sin(angle), 0.3, -Math.cos(angle)),
      lookAt: vec(-0.05, 1.5, -0.4),
      zoom: 1,
    };
  } else if (choice === 2) {
    // steady from the right
    const angle = -1;
    return {
      pos: vec(Math.sin(angle), 0.3, -Math.cos(angle)),
      lookAt: vec(-0.05, 1.5, -0.4),
      zoom: 1,
    };
  } else if (choice === 3) {
    // steady front
    return {
      pos: vec(0, 0.2, -1),
      lookAt: vec(-0.05, 1.5, -0.4),
      zoom: 1.3,
    };
  } else if (choice === 4) {
    // front telephoto, full body
    return {
      pos: vec(0, 0.25, -2),
      lookAt: vec(-0.05, 1.5, -0.4),
      zoom: 6,
    };
  } else if (choice === 5) {
    // front telephoto, bust
    return {
      pos: vec(0, 0.25, -2),
      lookAt: vec(-0.05, 2.0, -0.4),
      zoom: 9,
    };
  } else if (choice === 6) {
    // full body, steady profile right
    const angle = -1.6;
    return {
      pos: vec(Math.sin(angle), 0.2, -Math.cos(angle)),
      lookAt: vec(0, 0.5, 0),
      zoom: 2,
    };
  } else if (choice === 7) {
    // rotating under the chin
    const angle = t / 1.2;
    return {
      pos: vec(Math.sin(angle), 0.2, -Math.cos(angle)),
      lookAt: vec(-0.05, 2.0, -0.4),
      zoom: 2,
    };
  } else if (choice === 8) {
    // iso view (iso-ish) BAYC style
    return {
      pos: vec(-1.2, 0.35, -1.75),
      lookAt: vec(-0.05, 2.0, -0.4),
      zoom: 8,
    };
  } else if (choice === 9) {
    // iso view (iso-ish) full body
    return {
      pos: vec(-1.2, 0.35, -1.75),
      lookAt: vec(-0.05, 1.25, -0.4),
      zoom: 7,
    };
  } else if (choice === 10) {
    // profile style (azuki ish)
    // const angle = -1.6;
    return {
      pos: vec(-1, 0.25, -0.2),
      lookAt: vec(0, 1.7, -0.2),
      zoom: 4.5,
    };
  } else if (choice === 11) {
    // slow back and forth
    const angle = t / 6;
    const x = Math.sin(angle) / 2;
    return {
      pos: vec(x, 0.25, -2),
      lookAt: vec(-0.05, 1.5, -0.4),
      zoom: 6,
    };
  } else if (choice === 13) {
    // explicit location
    // console.log('location', window.locX, window.locY, window.locZ);
    return {
      pos: vec(window.locX, 0.2, -1),
      lookAt: vec(-0.05, 1.5, -0.4),
      zoom: 1.3,
    };
  } else {
    // camera 12
    // orbit with manual control
    return { ...orbit, zoom: 5, skipScale: true };
  }
}

function camChoice(choice) {
  const posScale = 20;
  const zoomScale = 3;

  const cam = pick(choice);
  if (cam.skipScale) {
    cam.zoom *= zoomScale;
    return cam;
  } else {
    return {
      pos: mul(cam.pos, posScale),
      lookAt: cam.lookAt,
      zoom: cam.zoom * zoomScale,
    };
  }
}
