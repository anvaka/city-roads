export default function createOverlayManager() {
  let overlay;
  let isPaused;
  let downEvent = {
    clickedElement: null,
    x: 0,
    y: 0,
    time: Date.now(),
    left: 0,
    right: 0
  };

  document.addEventListener('mousedown', handleMouseDown, true);
  document.addEventListener('mouseup', handleMouseUp, true);
  document.addEventListener('touchstart', handleTouchStart, {passive: false, capture: true});
  document.addEventListener('touchend', handleTouchEnd, true);
  document.addEventListener('touchcancel', handleTouchEnd, true);

  return {
    track,
    dispose,
    pause(newIsPaused) {
       isPaused = newIsPaused; 
      }
  }

  function pause(newIsPaused) {
    isPaused = newIsPaused;
  }

  function handleMouseDown(e) {
    onPointerDown(e.clientX, e.clientY, e);
  }

  function handleMouseMove(e) {
    onPointerMove(e.clientX, e.clientY);
  }

  function handleMouseUp(e) {
    onPointerUp(e.clientX, e.clientY)
  }

  function handleTouchStart(e) {
    if (e.touches.length > 1) return;

    let touch = e.touches[0];
    onPointerDown(touch.clientX, touch.clientY, e);
  }

  function handleTouchEnd(e) {
    if (e.changedTouches.length > 1) return;
    let touch = e.changedTouches[0];
    let gotSomethingSelected = onPointerUp(touch.clientX, touch.clientY);
    if (gotSomethingSelected) {
      e.preventDefault();
      e.stopPropagation();
    }
  }

  function handleTouchMove(e) {
    if (e.touches.length > 1) return;
    let touch = e.touches[0];
    onPointerMove(touch.clientX, touch.clientY);
    e.preventDefault();
    e.stopPropagation();
  }

  function onPointerDown(x, y, e) {
    let foundElement = findTrackedElementUnderCursor(x, y)
    let activeOverlays = document.querySelectorAll('.overlay-active');

    for (let i = 0; i < activeOverlays.length; ++i) {
      let el = activeOverlays[i];
      if (el !== foundElement) deselect(el);
    }
    if (activeOverlays.length === 1) downEvent.clickedElement = activeOverlays[0];

    let secondTimeClicking = foundElement && foundElement === downEvent.clickedElement;
    let shouldAddOverlay = !isPaused && secondTimeClicking
    if (shouldAddOverlay) {
      // prepare for move!
      addOverlay();
      e.preventDefault();
      e.stopPropagation();
    } else {
      downEvent.clickedElement = foundElement;
    }

    downEvent.x = x;
    downEvent.y = y;
    downEvent.time = Date.now();
    if (foundElement) {
      let bBox = foundElement.getBoundingClientRect();
      downEvent.dx = bBox.right - downEvent.x; 
      downEvent.dy = bBox.bottom - downEvent.y;
    } else {
      isPaused = false;
    }
  }

  function onPointerUp(x, y) {
    if (!downEvent.clickedElement) return;
    removeOverlay();

    if (isSingleClick(x, y)) {
      // forward focus, we didn't move the element
      select(downEvent.clickedElement);
      return true;
    } else {
      downEvent.clickedElement = null;
    }
  }

  function onPointerMove(x, y) {
    if (!downEvent.clickedElement) return;

    let style = downEvent.clickedElement.style;
    style.right = 100*(window.innerWidth - x - downEvent.dx)/window.innerWidth + '%';
    style.bottom = 100*(window.innerHeight - y - downEvent.dy)/window.innerHeight + '%';
  }

  function addOverlay() {
    removeOverlay();

    overlay = document.createElement('div');
    overlay.classList.add('drag-overlay');
    document.body.appendChild(overlay);

    document.addEventListener('mousemove', handleMouseMove, true);
    document.addEventListener('touchmove', handleTouchMove, {passive: false, capture: true});
  }

  function removeOverlay() {
    if (overlay) {
      document.body.removeChild(overlay);
      overlay = null;
    }

    document.removeEventListener('mousemove', handleMouseMove, true);
    document.removeEventListener('touchmove', handleTouchMove, {passive: false, capture: true});
  }

  function isSingleClick(x, y) {
    let timeDiff = Date.now() - downEvent.time;
    if (timeDiff > 300) return false; // took too long for a single click;

    // should release roughly in the same place where pressed:
    return Math.hypot(x - downEvent.x, y - downEvent.y) < 40; 
  }

  function findTrackedElementUnderCursor(x, y) {
    let autoTrack = document.querySelectorAll('.tracked');
    for (let i = 0; i < autoTrack.length; ++i) {
      let el = autoTrack[i];
      let rect = getRectangle(el);
      if (intersects(x, y, rect)) return el;
    }
  }

  function deselect(el) {
    el.style.pointerEvents = 'none';
    el.classList.remove('overlay-active');
  }

  function select(el) {
    if (!el) return;

    el.style.pointerEvents = '';

    if (el.classList.contains('overlay-active')) {
      if (el.receiveFocus) el.receiveFocus();
    } else {
      el.classList.add('overlay-active');
    }
  }

  function intersects(x, y, rect) {
    return !(x < rect.left || x > rect.right || y < rect.top || y > rect.bottom);
  }

  function getRectangle(x) {
    return x.getBoundingClientRect();
  }

  function track(domElement, options) {
    domElement.style.pointerEvents = 'none'
    domElement.classList.add('tracked');

    if (options) {
      if (options.receiveFocus) domElement.receiveFocus = options.receiveFocus;
    }
  }

  function dispose() {
    document.removeEventListener('mousedown', handleMouseDown, true);
    document.removeEventListener('mouseup', handleMouseUp, true);
    document.removeEventListener('touchstart', handleTouchStart, true);
    document.removeEventListener('touchend', handleTouchEnd, true);
    document.removeEventListener('touchcancel', handleTouchEnd, true);
    downEvent.clickedElement = undefined;
    removeOverlay();
  }
}