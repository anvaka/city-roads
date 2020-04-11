export default function createOverlayManager() {
  let overlay;
  let downEvent = {
    clickedElement: null,
    x: 0,
    y: 0,
    time: Date.now(),
    left: 0,
    right: 0
  };

  document.addEventListener('mousedown', handleMouseDown);
  document.addEventListener('mouseup', handleMouseUp);
  document.addEventListener('touchstart', handleTouchStart, {passive: false, capture: true});
  document.addEventListener('touchend', handleTouchEnd, true);
  document.addEventListener('touchcancel', handleTouchEnd, true);

  return {
    track,
    dispose,
    clear
  }

  function clear() {
    const activeOverlays = document.querySelectorAll('.overlay-active');
    for (let i = 0; i < activeOverlays.length; ++i) {
      deselect(activeOverlays[i]);
    }
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
    if (secondTimeClicking) {
      if (!downEvent.clickedElement.contains(e.target)) {
        foundElement = null;
        secondTimeClicking = false;
      }
    }
    let shouldAddOverlay = secondTimeClicking && !foundElement.classList.contains('exclusive');
    if (shouldAddOverlay) {
      // prepare for move!
      addDragOverlay();
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
      clear();
    }
  }

  function onPointerUp(x, y) {
    if (!downEvent.clickedElement) return;
    removeOverlay();

    if (isSingleClick(x, y)) {
      // forward focus, we didn't move the element
      select(downEvent.clickedElement, x, y);
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

  function addDragOverlay() {
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
    let autoTrack = document.querySelectorAll('.can-drag');
    for (let i = 0; i < autoTrack.length; ++i) {
      let el = autoTrack[i];
      let rect = getRectangle(el);
      if (intersects(x, y, rect)) return el;
    }
  }

  function deselect(el) {
    el.style.pointerEvents = 'none';
    el.classList.remove('overlay-active');
    el.classList.remove('exclusive')
  }

  function select(el, x, y) {
    if (!el) return;

    el.style.pointerEvents = '';

    if (el.classList.contains('overlay-active')) {
      // When they click second time, we want to forward focus to the element
      // (if they support focus forwarding)
      if (el.receiveFocus) el.receiveFocus();
      // and make the element exclusive owner of the mouse/pointer
      // (so that native interaction can occur and we don't interfere with dragging)
      el.classList.add('exclusive')
    } else {
      // When they click first time, we enter to "drag around" mode
      el.classList.add('overlay-active');
      if (el.classList.contains('can-resize')) {
        // el.resizer = renderResizeHandlers(el);
      }
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
    domElement.classList.add('can-drag');

    if (options) {
      if (options.receiveFocus) domElement.receiveFocus = options.receiveFocus;
    }
  }

  function dispose() {
    document.removeEventListener('mousedown', handleMouseDown);
    document.removeEventListener('mouseup', handleMouseUp);
    document.removeEventListener('touchstart', handleTouchStart);
    document.removeEventListener('touchend', handleTouchEnd);
    document.removeEventListener('touchcancel', handleTouchEnd);
    downEvent.clickedElement = undefined;
    removeOverlay();
  }
}

function renderResizeHandlers(el) {
  el.getBoundingClientRect(el)
}