window.globals.attributes = {
    'x-trans': {path: null, timeline: null, tweenData: [], css: 'left', scale: {pixels: 100, ratio: 1}, initialValue: 400, color: '#306EFF'},
    'y-trans': {path: null, timeline: null, tweenData: [], css: 'top', scale: {pixels: 100, ratio: -1}, initialValue: 500, color: '#F62217'},
    'rotation': {path: null, timeline: null, tweenData: [], css: 'rotation', scale: {pixels: 100, ratio: 1}, initialValue: 0, color: '#41A317'},
    'x-scale': {path: null, timeline: null, tweenData: [], css: 'scaleX', scale: {pixels: 200, ratio: 1}, initialValue: 1, color: '#FDD017'}, 
    'y-scale': {path: null, timeline: null, tweenData: [], css: 'scaleY', scale: {pixels: 200, ratio: 1}, initialValue: 1, color: '#F535AA'}
  }
window.globals.selected = 'x-trans';
window.globals.grid = { lines: {x: null, y: null }, labels:{x: null, y: null}, scale: {xOffset: 50, yOffset: 100, zoom: null, xUnit: 1, yUnit: 100}, midpoint: {x: 0, y: 0}}
window.globals.hasClickHandler = false
window.onload = function() {
  var box1 = document.getElementById('box1');
  var box2 = document.getElementById('box2');
  var canvas = document.getElementById('canvas');
  var play = false;
  // var timeline = new TimelineMax({repeat: -1});
  var masterTimeline = new TimelineMax({repeat: -1});
  var scale = {
    x: {pixels: 100, ratio: 1},
    y: {pixels: 100, ratio: 300}
  };
  var timeScale = {pixels: 100, ratio: 1};
  var prevPixelX = 500;
  var prevPixelY = 500;
  var initialY = 200;
  var prevCoordX = 0;
  var prevCoordY = 0;
  var selectedAttr = globals.attributes[globals.selected];
  var domValues = {
    'x-trans': 'X Translate',
    'y-trans':'Y Translate',
    'rotation': 'Rotation',
    'x-scale': 'X Scale',
    'y-scale': 'Y Scale'
  }

  var playback = function() {
    if (play) {
      masterTimeline.play();
      play = false; 
    }
    else {
      masterTimeline.pause();
      play = true;
    }
  };

  var playButtonListener = document.getElementById('play-pause').addEventListener('click', function(){
    playback();
    disableFocus(this);
  });

  var attributeListener = document.getElementById('property-select').addEventListener('change', function(event) {
    globals.attributes[globals.selected].path.fullySelected = false;
    globals.attributes[globals.selected].path.selected = true;
    updateDOMSelection(event.target.value);
    globals.selected = event.target.value;
    selectedAttr = globals.attributes[globals.selected];

    globals.reRender();
    disableFocus(this);
  }); 

  var clearSelectedAnimationListener = document.getElementById('clear').addEventListener('click', function(){
    selectedAttr.timeline.clear();
    selectedAttr.path.resetPath();
    selectedAttr.tweenData = [];
    disableFocus(this);
  });

  var clearAllAnimationListener = document.getElementById('clear-all').addEventListener('click', function(){
    for (var key in globals.attributes) {
      globals.attributes[key].timeline.clear();
      globals.attributes[key].path.resetPath();
      globals.attributes[key].tweenData = [];
    }

    disableFocus(this);
  });

  var keyPressListener = document.addEventListener('keydown', function(event){
    if (event.key === ' ') {
      playback();
    }
    if (event.key === 'k') {
      globals.hasClickHandler = true
      canvas.addEventListener('click', addKeyTrackMouse);
    }
    if (event.key === 'r') {
      globals.hasClickHandler = true
      canvas.addEventListener('click', removeKeyTrackMouse);
    }
    if (event.key === 'Escape') {
      globals.hasClickHandler = false
      canvas.removeEventListener('click', addKeyTrackMouse);
      canvas.removeEventListener('click', removeKeyTrackMouse);
    }
  });

  var removeKeyFrameListener = document.getElementById('remove-keyframe').addEventListener('click', function(){
    canvas.addEventListener('click', removeKeyTrackMouse);
    globals.hasClickHandler = true
    disableFocus(this);
  });

  var addKeyFrameListener = document.getElementById('add-keyframe').addEventListener('click', function(){
    canvas.addEventListener('click', addKeyTrackMouse);
    globals.hasClickHandler = true
    disableFocus(this);
  });

  globals.updateSelection = function(key) {
    document.getElementById('property-select').value = key;
    updateDOMSelection(key);
    globals.selected = key;
    selectedAttr = globals.attributes[globals.selected];
  };

  var addKeyTrackMouse = function(event) {
    var correctedPosition = globals.viewAdjustedPosition(event.layerX, event.layerY)
    var x = correctedPosition[0]
    var y = correctedPosition[1]

    if (detectKeyframeBoundary(x,y) === false) {
      createKeyFrame(x, y);
    }
    globals.hasClickHandler = false
    canvas.removeEventListener('click', addKeyTrackMouse);
  };

  var removeKeyTrackMouse = function(event) {
    var correctedPosition = globals.viewAdjustedPosition(event.layerX, event.layerY)
    var x = correctedPosition[0]
    var y = correctedPosition[1]
    var keyToRemove = detectKeyframeBoundary(x,y)

    if (keyToRemove !== false) {
      deleteKeyFrame(keyToRemove);
      globals.hasClickHandler = false
      canvas.removeEventListener('click', removeKeyTrackMouse);
    }
  };

  var disableFocus = function(element) {
    element.blur();
  }

  var detectKeyframeBoundary = function(x, y) {
    var keyFramePadding = 5;

    return selectedAttr.path.segments.reduce(function(isInBounds, segment, index) {
      if (isInBounds !== false) return isInBounds;

      var xLowerBoundary = segment.point.x - keyFramePadding;
      var xUpperBoundary = segment.point.x + keyFramePadding;
      var yLowerBoundary = segment.point.y - keyFramePadding;
      var yUpperBoundary = segment.point.y + keyFramePadding;

      // If a mouse click is found to be within the boundaries of a keyframe, return the segment index value
      return (x >= xLowerBoundary && x <= xUpperBoundary && y >= yLowerBoundary && y <= yUpperBoundary) ? index : false
    }, false)
  }
  
  var updateEase = function(ease) {
    // return new Ease(BezierEasing(ease[0], ease[1], ease[2], ease[3]).get);
    return new Ease(CubicBezier.config(ease[0], ease[1], ease[2], ease[3]));
  };

  var getEaseArray = function(segment1, segment2) {
    return globals.calcEase(segment1, segment2);
  };

  // var adjustTime = function(x, prevX) {
  //   return ((x - prevX) / timeScale.pixels) * timeScale.ratio;
  // };
  // // This calculates the amount of actual pixel movement the animated object will make
  // // across the screen relative to the position differences of the keyFrameInsertionCheck
  // var adjustValue = function(y, prevY, prevPixelY, scale) {
  //   return (((y - prevY) / scale.pixels) * scale.ratio) + prevPixelY;
  // };

  // var adjustPrevPixelY = function(y, prevY, nextPixelY, scale) {
  //   return -((((y - prevY) / scale.pixels) * scale.ratio) - nextPixelY);
  // };

  var adjustTime = function(x, prevX) {
    return x - prevX
  };
  // This calculates the amount of actual pixel movement the animated object will make
  // across the screen relative to the position differences of the keyFrameInsertionCheck
  var adjustValue = function(y, prevY, prevPixelY, scale) {
    return ((y - prevY) * scale.ratio) + prevPixelY
  };

  var adjustPrevPixelY = function(y, prevY, nextPixelY, scale) {
    return -(((y - prevY) * scale.ratio) - nextPixelY);
  };

  var recalcEase = function(tween) {
    if (globals.recalc) {
      var segmentPrev = globals.recalc.segmentPrev;
      var segmentNext = globals.recalc.segmentNext;
      var segmentSelected = globals.recalc.segmentSelected;
      var prevTween = segmentPrev ? selectedAttr.timeline.getChildren()[segmentPrev.index] : null;
      var nextTween = segmentNext ? selectedAttr.timeline.getChildren()[segmentSelected.index] : null;
      var keyframe = globals.recalc.keyframe;

      if (keyframe) {
        var positionOnGrid = globals.calcPositionValue(keyframe.point.x, keyframe.point.y)
        if (prevTween) {
          // console.log(prevTween);
          var tweenData = selectedAttr.tweenData[segmentPrev.index];
          var recalcDuration = adjustTime(positionOnGrid[0], tweenData.prevCoordX);
          var recalcValue = adjustValue(positionOnGrid[1], tweenData.prevCoordY, tweenData.prevPixelY, selectedAttr.scale);
          // console.log('prevTweeeeeeeen---> recalcValue',recalcValue, 'keyframe Y', positionOnGrid[1], 'tween prevCoordY', tweenData.prevCoordY, '    prevPixel', tweenData.prevPixelY);

          // prevTween.invalidate();
          // prevTween.vars.css.left = recalcValue + 'px';
          // prevTween.duration(recalcDuration);
          tweenData.adjustedTime = recalcDuration;
          tweenData.adjustedValue = recalcValue;
          tweenData.currentCoordX = positionOnGrid[0];
          tweenData.currentCoordY = positionOnGrid[1];
          console.log('prev tween recalcValue', recalcValue, 'prevTween recalcDuration', recalcDuration);

        }
        if (nextTween) {
          var nextPositionOnGrid = globals.calcPositionValue(segmentNext.point.x, segmentNext.point.y)
          var tweenData = selectedAttr.tweenData[segmentSelected.index];
          var recalcDuration = adjustTime(nextPositionOnGrid[0], positionOnGrid[0]);
          var recalcValue = adjustPrevPixelY(nextPositionOnGrid[1], positionOnGrid[1], tweenData.adjustedValue, selectedAttr.scale);
          
          // nextTween.invaliate();
          // nextTween.vars.startAt.left = recalcValue + 'px';
          // nextTween.duration(recalcDuration);
          tweenData.adjustedTime = recalcDuration;
          tweenData.prevPixelY = recalcValue;
          tweenData.prevCoordX = positionOnGrid[0];
          tweenData.prevCoordY = positionOnGrid[1];
          console.log('nextTween recalcValue', recalcValue, 'nextTween recalcDuration', recalcDuration);

        }
        rebuildTimeline();
      }
      else {
        if (prevTween){
          prevTween.invalidate();      
          prevTween.vars.ease = updateEase(getEaseArray(globals.recalc.segmentPrev, globals.recalc.segmentSelected));
        }
        if (nextTween) {
          nextTween.invalidate();      
          nextTween.vars.ease = updateEase(getEaseArray(globals.recalc.segmentSelected, globals.recalc.segmentNext));
        }
      }

      globals.recalc = null;
    }
  };


  var createKeyFrame = function(x, y, handleIn, handleOut) {
    var positionOnGrid = globals.calcPositionValue(x,y)
    var insertionIndex = keyFrameInsertionCheck(x);
    var isHead = insertionIndex === 'HEAD' || (insertionIndex === null && selectedAttr.path.segments.length === 1)
    handleIn = handleIn || null;
    handleOut = handleOut || null;

    globals.drawKeyFrame(x, y, insertionIndex, selectedAttr.path, handleIn, handleOut, isHead);
    var totalKeyFrames = selectedAttr.path.segments.length;

    if (totalKeyFrames > 1) {
      
      if (insertionIndex === null || insertionIndex === 'TAIL'){
        var length = selectedAttr.tweenData.length;
        var previousTweenData;
        if (length) {
          previousTweenData = selectedAttr.tweenData[length - 1];
        }
        else {
          // Swap values if the 2nd key of a new spline is behind the initial key
          if (positionOnGrid[0] < selectedAttr.firstKey.currentCoordX) {
            var tempX = selectedAttr.firstKey.currentCoordX;
            var tempY = selectedAttr.firstKey.currentCoordY;

            selectedAttr.firstKey.currentCoordX = positionOnGrid[0];
            selectedAttr.firstKey.currentCoordY = positionOnGrid[1];
            positionOnGrid[0] = tempX;
            positionOnGrid[1] = tempY;
          }
          previousTweenData = selectedAttr.firstKey;
        } 
        // console.log(previousTweenData);
      
        var adjustedTime = adjustTime(positionOnGrid[0], previousTweenData.currentCoordX);
        var adjustedValue = adjustValue(positionOnGrid[1], previousTweenData.currentCoordY, previousTweenData.adjustedValue, selectedAttr.scale);
        var fromValuesObj = {};
        var toValuesObj = {
          onUpdate: recalcEase,
          onUpdateParams:["{self}"],
          ease: updateEase(getEaseArray(selectedAttr.path.segments[totalKeyFrames - 2],selectedAttr.path.segments[totalKeyFrames - 1]))
        };

        fromValuesObj[selectedAttr.css] = previousTweenData.adjustedValue + "px"
        toValuesObj[selectedAttr.css] = adjustedValue + "px"

        selectedAttr.timeline.fromTo(box1, adjustedTime, fromValuesObj, toValuesObj);
        var timelineObject = {
          element: box1,
          adjustedTime: adjustedTime,
          prevPixelY: previousTweenData.adjustedValue,
          adjustedValue: adjustedValue,
          prevCoordX: previousTweenData.currentCoordX,
          prevCoordY: previousTweenData.currentCoordY,
          currentCoordX: positionOnGrid[0],
          currentCoordY: positionOnGrid[1]
        };

        selectedAttr.tweenData.push(timelineObject)

        // prevPixelY = adjustedValue;
      }
      else {
        rebuildTimeline({x: positionOnGrid[0], y: positionOnGrid[1], insertionIndex: insertionIndex});
      }
    }

    if (totalKeyFrames === 1) {
      selectedAttr.firstKey = {
        currentCoordX: positionOnGrid[0],
        currentCoordY: positionOnGrid[1],
        adjustedValue: selectedAttr.initialValue
      };
    }
  };

  var rebuildTimeline = function(insertionObject) {
    var shouldRestartPlayback = play ? true : false;
    // if the aninimation is already running, we pause playback to clear the timeline
    // and recalculate the new one
    if (shouldRestartPlayback) {
      playback()
    }

    console.log('insertionObject', insertionObject)
    insertionObject = insertionObject || null;
    selectedAttr.timeline.clear();

    if (insertionObject) {
      var currentTween;
      var headInsertionData;
      // During a HEAD addition, we create the new first keyframe before rebuilding all existing frames
      if (insertionObject.insertionIndex === 'HEAD') {
        currentTween = selectedAttr.tweenData[0];
        var insertAdjustedTime = adjustTime(currentTween.prevCoordX, insertionObject.x);
        var insertAdjustedValue = adjustValue(insertionObject.y, currentTween.prevCoordY, selectedAttr.initialValue, selectedAttr.scale);

        var fromValuesObj = {};
        var toValuesObj = {
          onUpdate: recalcEase,
          onUpdateParams:["{self}"],
          ease: updateEase(getEaseArray(selectedAttr.path.segments[0], selectedAttr.path.segments[1]))
        };

        fromValuesObj[selectedAttr.css] = insertAdjustedValue + "px";
        toValuesObj[selectedAttr.css] = currentTween.prevPixelY + "px";
        selectedAttr.timeline.fromTo(currentTween.element, currentTween.adjustedTime, fromValuesObj, toValuesObj);

        headInsertionData = {
          element: box1,
          adjustedTime: insertAdjustedTime,
          prevPixelY: insertAdjustedValue,
          adjustedValue: currentTween.prevPixelY,
          prevCoordX: insertionObject.x,
          prevCoordY: insertionObject.y,
          currentCoordX: currentTween.prevCoordX,
          currentCoordY: currentTween.prevCoordY
        };
      }

      for (var i = 0; i < selectedAttr.tweenData.length; i++) {
        currentTween = selectedAttr.tweenData[i];

        if (i === insertionObject.insertionIndex) {
          var insertAdjustedTime = adjustTime(insertionObject.x, currentTween.prevCoordX);
          var insertAdjustedValue = adjustValue(insertionObject.y, currentTween.prevCoordY, currentTween.prevPixelY, selectedAttr.scale);
          var remainderTime = currentTween.adjustedTime - insertAdjustedTime;

          var prevFromValuesObj = {};
          var prevToValuesObj = {
            onUpdate: recalcEase,
            onUpdateParams:["{self}"],
            ease: updateEase(getEaseArray(selectedAttr.path.segments[insertionObject.insertionIndex], selectedAttr.path.segments[insertionObject.insertionIndex + 1]))
          };
          var nextFromValuesObj = {};
          var nextToValuesObj = {
            onUpdate: recalcEase,
            onUpdateParams:["{self}"],
            ease: updateEase(getEaseArray(selectedAttr.path.segments[insertionObject.insertionIndex + 1], selectedAttr.path.segments[insertionObject.insertionIndex + 2]))
          };

          prevFromValuesObj[selectedAttr.css] = currentTween.prevPixelY + "px";
          prevToValuesObj[selectedAttr.css] = insertAdjustedValue + "px";
          nextFromValuesObj[selectedAttr.css] = insertAdjustedValue + "px";
          nextToValuesObj[selectedAttr.css] = currentTween.adjustedValue + "px";

          selectedAttr.timeline.fromTo(currentTween.element, insertAdjustedTime, prevFromValuesObj, prevToValuesObj);

          selectedAttr.timeline.fromTo(currentTween.element, remainderTime, nextFromValuesObj, nextToValuesObj);
          
          selectedAttr.tweenData.splice(i + 1, 0, {
            element: box1,
            adjustedTime: remainderTime,
            prevPixelY: insertAdjustedValue,
            adjustedValue: currentTween.adjustedValue,
            prevCoordX: insertionObject.x,
            prevCoordY: insertionObject.y
          });
          
          currentTween.adjustedTime = insertAdjustedTime;
          currentTween.adjustedValue = insertAdjustedValue;
          
          i++;
        }
        else {
          var fromValuesObj = {};
          var toValuesObj = {
            onUpdate: recalcEase,
            onUpdateParams:["{self}"],
            ease: updateEase(getEaseArray(selectedAttr.path.segments[i], selectedAttr.path.segments[i + 1]))
          };

          fromValuesObj[selectedAttr.css] = currentTween.prevPixelY + "px";
          toValuesObj[selectedAttr.css] = currentTween.adjustedValue + "px";
          selectedAttr.timeline.fromTo(currentTween.element, currentTween.adjustedTime, fromValuesObj, toValuesObj);
        }
      }

      if (headInsertionData) {
        selectedAttr.tweenData.unshift(headInsertionData);
      }
    }
    else {
      for (var i = 0; i < selectedAttr.tweenData.length; i++) {
        var currentTween = selectedAttr.tweenData[i];
        var fromValuesObj = {};
        var toValuesObj = {
          onUpdate: recalcEase,
          onUpdateParams:["{self}"],
          ease: updateEase(getEaseArray(selectedAttr.path.segments[i], selectedAttr.path.segments[i + 1]))
        };

        fromValuesObj[selectedAttr.css] = currentTween.prevPixelY + "px";
        toValuesObj[selectedAttr.css] = currentTween.adjustedValue + "px";
        selectedAttr.timeline.fromTo(currentTween.element, currentTween.adjustedTime, fromValuesObj, toValuesObj);
      }
    }
    if (shouldRestartPlayback) {
      playback()
    }
  };
  // Checks to see if a given X coordinate is before, inbtween, or after a given spline
  //
  // Also returns null on edge cases for when a new spline is being created
  var keyFrameInsertionCheck = function(x) {
    if (selectedAttr.path.segments && selectedAttr.path.segments.length) {
      // Only assign HEAD to new keys being added to an existing spline with more than 2 keys
      if (x < selectedAttr.path.segments[0].point.x && selectedAttr.path.segments.length > 1) {
        console.log('found HEAD')
        return 'HEAD'
      }
      if (x > selectedAttr.path.segments[selectedAttr.path.segments.length - 1].point.x) {
        return 'TAIL'
      }
    }
    for (var i = 0; i < selectedAttr.path.segments.length; i++) {
      if (selectedAttr.path.segments[i + 1] && x > selectedAttr.path.segments[i].point.x && x < selectedAttr.path.segments[i + 1].point.x) {
        return i;
      }
    }
    return null;
  };

  var deleteKeyFrame = function(keyToRemove) {
    var prevTween = selectedAttr.tweenData[keyToRemove - 1];
    var nextTween = selectedAttr.tweenData[keyToRemove];

    globals.eraseKeyFrame(keyToRemove, selectedAttr.path);

    if (prevTween && nextTween) {
      var insertAdjustedTime = adjustTime(nextTween.currentCoordX, prevTween.prevCoordX);
      var insertAdjustedValue = adjustValue(nextTween.currentCoordY, prevTween.prevCoordY, prevTween.prevPixelY, selectedAttr.scale);

      prevTween.adjustedTime = insertAdjustedTime;
      prevTween.adjustedValue = insertAdjustedValue;
      prevTween.currentCoordX = nextTween.currentCoordX;
      prevTween.currentCoordY = nextTween.currentCoordY;

      // remove the old key
      selectedAttr.tweenData.splice(keyToRemove, 1)

      rebuildTimeline();
    }
  }

  var updateDOMSelection = function(key) {
    var currentSelection = document.getElementById(globals.selected);
    currentSelection.className = currentSelection.className.split(' ')[0];

    document.getElementById(key).className += " selected";
  }

  // Initialize default animation
  for (var key in globals.attributes) {
    var attr = globals.attributes[key]
    // var loadData = JSON.parse(globals.defaultKeyframeJSON[key]);
    var loadData = []

    attr.timeline = new TimelineMax();
    masterTimeline.add(attr.timeline, 0);
    globals.buildPath(attr, key);
    selectedAttr = attr;

    for (var i = 0; i < loadData.length; i++) {
      createKeyFrame(loadData[i][0][0], loadData[i][0][1], loadData[i][1], loadData[i][2]);
    }

    var legend = document.getElementById('legend');
    var tempDOM = document.createElement('div');
    tempDOM.id = key;
    tempDOM.className = 'properties'
    tempDOM.innerHTML = domValues[key];

    legend.appendChild(tempDOM);
  };
  selectedAttr = globals.attributes['x-trans'];
  updateDOMSelection('x-trans');

  var domProperties = document.getElementsByClassName('properties');
  for (var i = 0; i < domProperties.length; i++) {
    domProperties[i].addEventListener('click', function(event) {
      selectedAttr.path.fullySelected = false;
      selectedAttr.path.selected = true;
      globals.updateSelection(event.target.id);
      globals.reRender();
    });
  } 
  globals.init()
}