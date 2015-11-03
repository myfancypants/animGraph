window.globals.attributes = {
    'x-trans': {path: null, timeline: null, tweenData: [], css: 'left', scale: {pixels: 100, ratio: 300}, initialValue: 400, color: '#306EFF'},
    'y-trans': {path: null, timeline: null, tweenData: [], css: 'top', scale: {pixels: 100, ratio: 300}, initialValue: 500, color: '#F62217'},
    'rotation': {path: null, timeline: null, tweenData: [], css: 'rotation', scale: {pixels: 100, ratio: 300}, initialValue: 0, color: '#41A317'},
    'x-scale': {path: null, timeline: null, tweenData: [], css: 'scaleX', scale: {pixels: 300, ratio: 1}, initialValue: 1, color: '#FDD017'}, 
    'y-scale': {path: null, timeline: null, tweenData: [], css: 'scaleY', scale: {pixels: 300, ratio: 1}, initialValue: 1, color: '#F535AA'}
  }
window.globals.selected = 'x-trans';
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
    if (event.keyCode === 32) {
      playback();
    }
    if (event.keyCode === 75) {
      canvas.addEventListener('click', trackMouse);
    }
  });
  var addKeyFrameListener = document.getElementById('add-keyframe').addEventListener('click', function(){
    canvas.addEventListener('click', trackMouse);
    disableFocus(this);
  });

  globals.updateSelection = function(key) {
    document.getElementById('property-select').value = key;
    updateDOMSelection(key)
    globals.selected = key;
    selectedAttr = globals.attributes[globals.selected];
  };

  var trackMouse = function(event) {
    var x = event.layerX;
    var y = event.layerY;

    createKeyFrame(x, y);
    canvas.removeEventListener('click', trackMouse);
  };

  var disableFocus = function(element) {
    element.blur();
  }
  
  var updateEase = function(ease) {
    // return new Ease(BezierEasing(ease[0], ease[1], ease[2], ease[3]).get);
    return new Ease(CubicBezier.config(ease[0], ease[1], ease[2], ease[3]));
  };

  var getEaseArray = function(segment1, segment2) {
    return globals.calcEase(segment1, segment2);
  };

  var adjustTime = function(x, prevX) {
    return ((x - prevX) / timeScale.pixels) * timeScale.ratio;
  };

  var adjustValue = function(y, prevY, prevPixelY, scale) {
    return (((y - prevY) / scale.pixels) * scale.ratio) + prevPixelY;
  };

  var adjustPrevPixelY = function(y, prevY, nextPixelY, scale) {
    return -((((y - prevY) / scale.pixels) * scale.ratio) - nextPixelY);
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
        if (prevTween) {
          // console.log(prevTween);
          var tweenData = selectedAttr.tweenData[segmentPrev.index];
          var recalcDuration = adjustTime(keyframe.point.x, tweenData.prevCoordX);
          var recalcValue = adjustValue(keyframe.point.y, tweenData.prevCoordY, tweenData.prevPixelY, selectedAttr.scale);
          // console.log('prevTweeeeeeeen---> recalcValue',recalcValue, 'keyframe Y', keyframe.point.y, 'tween prevCoordY', tweenData.prevCoordY, '    prevPixel', tweenData.prevPixelY);

          // prevTween.invalidate();
          // prevTween.vars.css.left = recalcValue + 'px';
          // prevTween.duration(recalcDuration);
          tweenData.adjustedTime = recalcDuration;
          tweenData.adjustedValue = recalcValue;
          tweenData.currentCoordX = keyframe.point.x;
          tweenData.currentCoordY = keyframe.point.y;
          console.log('prev tween recalcValue', recalcValue, 'prevTween recalcDuration', recalcDuration);

        }
        if (nextTween) {
          var tweenData = selectedAttr.tweenData[segmentSelected.index];
          var recalcDuration = adjustTime(segmentNext.point.x, keyframe.point.x);
          var recalcValue = adjustPrevPixelY(segmentNext.point.y, keyframe.point.y, tweenData.adjustedValue, selectedAttr.scale);
          
          // nextTween.invaliate();
          // nextTween.vars.startAt.left = recalcValue + 'px';
          // nextTween.duration(recalcDuration);
          tweenData.adjustedTime = recalcDuration;
          tweenData.prevPixelY = recalcValue;
          tweenData.prevCoordX = keyframe.point.x;
          tweenData.prevCoordY = keyframe.point.y;
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
    var insertionIndex = keyFrameInsertionCheck(x, y);
    handleIn = handleIn || null;
    handleOut = handleOut || null;

    globals.drawKeyFrame(x, y, insertionIndex, selectedAttr.path, handleIn, handleOut);
    var totalKeyFrames = selectedAttr.path.segments.length;


    if (totalKeyFrames > 1) {

      if (insertionIndex === null){
        var length = selectedAttr.tweenData.length;
        var previousTweenData = length ? selectedAttr.tweenData[length - 1] : selectedAttr.firstKey;
        // console.log(previousTweenData);


        var adjustedTime = adjustTime(x, previousTweenData.currentCoordX);
        var adjustedValue = adjustValue(y, previousTweenData.currentCoordY, previousTweenData.adjustedValue, selectedAttr.scale);

        var fromValuesObj = {};
        var toValuesObj = {onUpdate: recalcEase, onUpdateParams:["{self}"], ease: updateEase(getEaseArray(selectedAttr.path.segments[totalKeyFrames - 2], selectedAttr.path.segments[totalKeyFrames - 1]))};

        fromValuesObj[selectedAttr.css] = previousTweenData.adjustedValue + "px"
        toValuesObj[selectedAttr.css] = adjustedValue + "px"

        selectedAttr.timeline.fromTo(box1, adjustedTime, fromValuesObj, toValuesObj);
        selectedAttr.tweenData.push({element: box1, adjustedTime: adjustedTime, prevPixelY: previousTweenData.adjustedValue, adjustedValue: adjustedValue, prevCoordX: previousTweenData.currentCoordX, prevCoordY: previousTweenData.currentCoordY, currentCoordX: x, currentCoordY: y});
        // prevPixelY = adjustedValue;
      }
      else {
        rebuildTimeline({x:x, y:y, insertionIndex: insertionIndex});
      }
    }

    if (totalKeyFrames === 1) {
      selectedAttr.firstKey = {currentCoordX: x, currentCoordY: y, adjustedValue: selectedAttr.initialValue};
    }
  };

  var rebuildTimeline = function(insertionObject) {
    insertionObject = insertionObject || null;
    selectedAttr.timeline.clear();

    if (insertionObject) {
      for (var i = 0; i < selectedAttr.tweenData.length; i++) {
        var currentTween = selectedAttr.tweenData[i];

        if (i === insertionObject.insertionIndex) {

          var insertAdjustedTime = adjustTime(insertionObject.x, currentTween.prevCoordX);
          var insertAdjustedValue = adjustValue(insertionObject.y, currentTween.prevCoordY, currentTween.prevPixelY, selectedAttr.scale);
          var remainderTime = currentTween.adjustedTime - insertAdjustedTime;

          var prevFromValuesObj = {};
          var prevToValuesObj = {onUpdate: recalcEase, onUpdateParams:["{self}"], ease: updateEase(getEaseArray(selectedAttr.path.segments[insertionObject.insertionIndex], selectedAttr.path.segments[insertionObject.insertionIndex + 1]))};
          var nextFromValuesObj = {};
          var nextToValuesObj = {onUpdate: recalcEase, onUpdateParams:["{self}"], ease: updateEase(getEaseArray(selectedAttr.path.segments[insertionObject.insertionIndex + 1], selectedAttr.path.segments[insertionObject.insertionIndex + 2]))};

          prevFromValuesObj[selectedAttr.css] = currentTween.prevPixelY + "px";
          prevToValuesObj[selectedAttr.css] = insertAdjustedValue + "px";
          nextFromValuesObj[selectedAttr.css] = insertAdjustedValue + "px";
          nextToValuesObj[selectedAttr.css] = currentTween.adjustedValue + "px";

          selectedAttr.timeline.fromTo(currentTween.element, insertAdjustedTime, prevFromValuesObj, prevToValuesObj);

          selectedAttr.timeline.fromTo(currentTween.element, remainderTime, nextFromValuesObj, nextToValuesObj);
          
          selectedAttr.tweenData.splice(i + 1, 0, {element: box1, adjustedTime: remainderTime, prevPixelY: insertAdjustedValue, adjustedValue: currentTween.adjustedValue, prevCoordX: insertionObject.x, prevCoordY: insertionObject.y});
          
          currentTween.adjustedTime = insertAdjustedTime;
          currentTween.adjustedValue = insertAdjustedValue;
          
          i++;
        }
        else {
          var fromValuesObj = {};
          var toValuesObj = {onUpdate: recalcEase, onUpdateParams:["{self}"], ease: updateEase(getEaseArray(selectedAttr.path.segments[i], selectedAttr.path.segments[i + 1]))};

          fromValuesObj[selectedAttr.css] = currentTween.prevPixelY + "px";
          toValuesObj[selectedAttr.css] = currentTween.adjustedValue + "px";
          selectedAttr.timeline.fromTo(currentTween.element, currentTween.adjustedTime, fromValuesObj, toValuesObj);
        }
      }
    }
    else {
      for (var i = 0; i < selectedAttr.tweenData.length; i++) {
        console.log('this should happen a lot');
        var currentTween = selectedAttr.tweenData[i];
        var fromValuesObj = {};
        var toValuesObj = {onUpdate: recalcEase, onUpdateParams:["{self}"], ease: updateEase(getEaseArray(selectedAttr.path.segments[i], selectedAttr.path.segments[i + 1]))};

        fromValuesObj[selectedAttr.css] = currentTween.prevPixelY + "px";
        toValuesObj[selectedAttr.css] = currentTween.adjustedValue + "px";
        selectedAttr.timeline.fromTo(currentTween.element, currentTween.adjustedTime, fromValuesObj, toValuesObj);
      }
    }
  };

  var keyFrameInsertionCheck = function(x, y) {
    for (var i = 0; i < selectedAttr.path.segments.length; i++) {
      if (selectedAttr.path.segments[i + 1] && x > selectedAttr.path.segments[i].point.x && x < selectedAttr.path.segments[i + 1].point.x) {
        return i;
      }
    }
    return null;
  };

  var updateDOMSelection = function(key) {
    var currentSelection = document.getElementById(globals.selected);
    currentSelection.className = currentSelection.className.split(' ')[0];

    document.getElementById(key).className += " selected";
  }

  for (var key in globals.attributes) {
    var attr = globals.attributes[key]
    // debugger;
    var loadData = JSON.parse(globals.defaultKeyframeJSON[key]);

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
}