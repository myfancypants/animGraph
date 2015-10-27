window.globals = {};  
window.onload = function() {
  var box1 = document.getElementById('box1');
  var box2 = document.getElementById('box2');
  var canvas = document.getElementById('canvas');
  var play = false;
  var timeline = new TimelineMax({repeat: -1});
  var timeRot = new TimelineMax({delay: 2});
  var timeColor = new TimelineMax({delay: 2});
  var sync = new TimelineMax({repeat: -1});
  var scale = {
    x: {pixels: 100, ratio: 1},
    y: {pixels: 100, ratio: 300}
  }
  var prevPixelX = 100;
  var prevPixelY = 100;
  var prevCoordX = 0;
  var prevCoordY = 0;

  var playback = function() {
    if (play) {
      timeline.play();
      play = false; 
    }
    else {
      timeline.pause();
      play = true;
    }
  };

  var playButtonListener = document.getElementById('play-pause').addEventListener('click', function(){
    playback();
  });

  var keyPressListener = document.addEventListener('keydown', function(event){
    if (event.keyCode === 32) {
      playback();
    }
    if (event.keyCode === 75) {
      canvas.addEventListener('click', trackMouse);
    }
  });

  var trackMouse = function(event) {
    var x = event.layerX;
    var y = event.layerY;

    createKeyFrame(x, y);
    canvas.removeEventListener('click', trackMouse);
  };

  var addKeyFrameListener = document.getElementById('add-keyframe').addEventListener('click', function(){
    canvas.addEventListener('click', trackMouse);
  });
  
  var updateEase = function(ease) {
    // return new Ease(BezierEasing(ease[0], ease[1], ease[2], ease[3]).get);
    return new Ease(CubicBezier.config(ease[0], ease[1], ease[2], ease[3]));
  };

  var getEaseArray = function(segment1, segment2) {
    return globals.calcEase(segment1, segment2);
  };

  var adjustTime = function(x, prevX) {
    return ((x - prevX) / scale.x.pixels) * scale.x.ratio;
  };

  var adjustValue = function(y, prevY, prevPixelY) {
    return (((y - prevY) / scale.y.pixels) * scale.y.ratio) + prevPixelY;
  };

  var adjustPrevPixelY = function(y, prevY, nextPixelY) {
    return -((((y - prevY) / scale.y.pixels) * scale.y.ratio) - nextPixelY);
  };

  var recalcEase = function(tween) {
    if (globals.recalc) {
      var segmentPrev = globals.recalc.segmentPrev;
      var segmentNext = globals.recalc.segmentNext;
      var segmentSelected = globals.recalc.segmentSelected;
      var prevTween = segmentPrev ? timeline.getChildren()[segmentPrev.index] : null;
      var nextTween = segmentNext ? timeline.getChildren()[segmentSelected.index] : null;
      var keyframe = globals.recalc.keyframe;


      if (keyframe) {
        if (prevTween) {
          // console.log(prevTween);
          var tweenData = globals.xTSpline.tweenData[segmentPrev.index];
          var recalcDuration = adjustTime(keyframe.point.x, tweenData.prevCoordX);
          var recalcValue = adjustValue(keyframe.point.y, tweenData.prevCoordY, tweenData.prevPixelY);
          // console.log('prevTweeeeeeeen---> recalcValue',recalcValue, 'keyframe Y', keyframe.point.y, 'tween prevCoordY', tweenData.prevCoordY, '    prevPixel', tweenData.prevPixelY);

          // prevTween.invalidate();
          // prevTween.vars.css.left = recalcValue + 'px';
          // prevTween.duration(recalcDuration);
          tweenData.adjustedTime = recalcDuration;
          tweenData.adjustedValue = recalcValue;

        }
        if (nextTween) {
          var tweenData = globals.xTSpline.tweenData[segmentSelected.index];
          var recalcDuration = adjustTime(segmentNext.point.x, keyframe.point.x);
          var recalcValue = adjustPrevPixelY(segmentNext.point.y, keyframe.point.y, tweenData.adjustedValue);
          
          // nextTween.invalidate();
          // nextTween.vars.startAt.left = recalcValue + 'px';
          // nextTween.duration(recalcDuration);
          tweenData.adjustedTime = recalcDuration;
          tweenData.prevPixelY = recalcValue;

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


  var createKeyFrame = function(x, y) {
    var insertionIndex = keyFrameInsertionCheck(x, y);

    globals.drawKeyFrame(x, y, insertionIndex);
    var totalKeyFrames = globals.xTSpline.segments.length;


    if (totalKeyFrames > 1) {

      if (insertionIndex === null){
        console.log('null insertion');
        var length = globals.xTSpline.tweenData.length;
        var previousTweenData = length ? globals.xTSpline.tweenData[length - 1] : globals.xTSpline.firstKey;
        // console.log(previousTweenData);


        var adjustedTime = adjustTime(x, previousTweenData.currentCoordX);
        var adjustedValue = adjustValue(y, previousTweenData.currentCoordY, previousTweenData.adjustedValue);

        timeline.fromTo(box1, adjustedTime, {left: previousTweenData.adjustedValue + "px"}, {left: adjustedValue + "px", onUpdate: recalcEase, onUpdateParams:["{self}"], ease: updateEase(getEaseArray(globals.xTSpline.segments[totalKeyFrames - 2], globals.xTSpline.segments[totalKeyFrames - 1]))});
        globals.xTSpline.tweenData.push({element: box1, adjustedTime: adjustedTime, prevPixelY: previousTweenData.adjustedValue, adjustedValue: adjustedValue, prevCoordX: previousTweenData.currentCoordX, prevCoordY: previousTweenData.currentCoordY, currentCoordX: x, currentCoordY: y});
        // prevPixelY = adjustedValue;
        console.log(globals.xTSpline.tweenData);
      }
      else {
        rebuildTimeline({x:x, y:y, insertionIndex: insertionIndex});
      }
    }

    if (totalKeyFrames === 1) {
      globals.xTSpline.firstKey = {currentCoordX: x, currentCoordY: y, adjustedValue: 100};
    }
  };

  var rebuildTimeline = function(insertionObject) {
    insertionObject = insertionObject || null;
    timeline.clear();

    if (insertionObject) {
      for (var i = 0; i < globals.xTSpline.tweenData.length; i++) {
        var currentTween = globals.xTSpline.tweenData[i];

        if (i === insertionObject.insertionIndex) {

          var insertAdjustedTime = adjustTime(insertionObject.x, currentTween.prevCoordX);
          var insertAdjustedValue = adjustValue(insertionObject.y, currentTween.prevCoordY, currentTween.prevPixelY);
          var remainderTime = currentTween.adjustedTime - insertAdjustedTime;

          timeline.fromTo(currentTween.element, insertAdjustedTime, {left: currentTween.prevPixelY + "px"}, {left: insertAdjustedValue + "px", onUpdate: recalcEase, onUpdateParams:["{self}"], ease: updateEase(getEaseArray(globals.xTSpline.segments[insertionObject.insertionIndex], globals.xTSpline.segments[insertionObject.insertionIndex + 1]))});

          timeline.fromTo(currentTween.element, remainderTime, {left: insertAdjustedValue + "px"}, {left: currentTween.adjustedValue + "px", onUpdate: recalcEase, onUpdateParams:["{self}"], ease: updateEase(getEaseArray(globals.xTSpline.segments[insertionObject.insertionIndex + 1], globals.xTSpline.segments[insertionObject.insertionIndex + 2]))});
          globals.xTSpline.tweenData.splice(i + 1, 0, {element: box1, adjustedTime: remainderTime, prevPixelY: insertAdjustedValue, adjustedValue: currentTween.adjustedValue, prevCoordX: insertionObject.x, prevCoordY: insertionObject.y});
          currentTween.adjustedTime = insertAdjustedTime;
          currentTween.adjustedValue = insertAdjustedValue;
          
          i++;
        }
        else {
          timeline.fromTo(currentTween.element, currentTween.adjustedTime, {left: currentTween.prevPixelY + "px"}, {left: currentTween.adjustedValue + "px", onUpdate: recalcEase, onUpdateParams:["{self}"], ease: updateEase(getEaseArray(globals.xTSpline.segments[i], globals.xTSpline.segments[i + 1]))});
        }
      }
    }
    else {
      for (var i = 0; i < globals.xTSpline.tweenData.length; i++) {
        var currentTween = globals.xTSpline.tweenData[i];
        timeline.fromTo(currentTween.element, currentTween.adjustedTime, {left: currentTween.prevPixelY + "px"}, {left: currentTween.adjustedValue + "px", onUpdate: recalcEase, onUpdateParams:["{self}"], ease: updateEase(getEaseArray(globals.xTSpline.segments[i], globals.xTSpline.segments[i + 1]))});
      }
    }
  };

  var keyFrameInsertionCheck = function(x, y) {
    for (var i = 0; i < globals.xTSpline.segments.length; i++) {
      if (globals.xTSpline.segments[i + 1] && x > globals.xTSpline.segments[i].point.x && x < globals.xTSpline.segments[i + 1].point.x) {
        return i;
      }
    }
    return null;
  };
}