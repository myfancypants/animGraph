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
  }
  var addKeyFrameListener = document.getElementById('add-keyframe').addEventListener('click', function(){
    canvas.addEventListener('click', trackMouse);
  });


  // timeline.add(TweenMax.to(box1, 1, {left:"300px", ease: new Ease(BezierEasing(1, 0, 0, 1).get)}));
  // timeline.add(TweenMax.to(box1, 1, {top:"100px", ease: new Ease(BezierEasing(.5, -2, .2, 2).get)}));
  // timeline.add(TweenMax.to(box1, 1, {left:"700px", ease: new Ease(BezierEasing(1, 1, 0, 1.5).get)}));

  // timeRot.add(TweenMax.to(box1, 1, {rotation: 360, ease: new Ease(BezierEasing(1, 1, 0, 1.5).get)}));
  // timeRot.add(TweenMax.to(box1, 1.5, {rotation: -540, ease: new Ease(BezierEasing(.7, 2, .3, 1).get)}));

  // timeColor.add(TweenMax.to(box1, 3, {backgroundColor: "red", ease: new Ease(BezierEasing(1, 1, 0, 1.5).get)}));
  
  var updateEase = function(ease) {
    // return new Ease(BezierEasing(ease[0], ease[1], ease[2], ease[3]).get);
    return new Ease(CubicBezier.config(ease[0], ease[1], ease[2], ease[3]));
  }

  var getEaseArray = function(segment1, segment2) {
    return globals.calcEase(segment1, segment2);
  }

  var recalcEase = function(tween) {
    if (globals.recalc) {
      // tween.kill();
      // tween = sync.fromTo(box2, 2, {left: "0px"}, {left: "500px", onUpdate: recalcEase, onUpdateParams:["{self}"], ease: new Ease(updateEase(getEaseArray()))});

      var prevTween = globals.recalc.segmentPrev ? timeline.getChildren()[globals.recalc.segmentPrev.index] : null;
      var nextTween = globals.recalc.segmentNext ? timeline.getChildren()[globals.recalc.segmentSelected.index] : null;
      
      if (prevTween){
        prevTween.invalidate();      
        prevTween.vars.ease = updateEase(getEaseArray(globals.recalc.segmentPrev, globals.recalc.segmentSelected));
      }
      if (nextTween) {
        nextTween.invalidate();      
        nextTween.vars.ease = updateEase(getEaseArray(globals.recalc.segmentSelected, globals.recalc.segmentNext));
      }
      // tween.play();
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

        var adjustedTime = ((x - prevCoordX) / scale.x.pixels) * scale.x.ratio;
        var adjustedValue = (((y - prevCoordY) / scale.y.pixels) * scale.y.ratio) + prevPixelY;

        timeline.fromTo(box1, adjustedTime, {left: prevPixelY + "px"}, {left: adjustedValue + "px", onUpdate: recalcEase, onUpdateParams:["{self}"], ease: updateEase(getEaseArray(globals.xTSpline.segments[totalKeyFrames - 2], globals.xTSpline.segments[totalKeyFrames - 1]))});
        globals.xTSpline.tweenData.push({element: box1, adjustedTime: adjustedTime, prevPixelY: prevPixelY, adjustedValue: adjustedValue, prevCoordX: prevCoordX, prevCoordY: prevCoordY});
        prevPixelY = adjustedValue;
        
      }

      else {
        console.log('insertionIndex found');

        timeline.clear();

        for (var i = 0; i < globals.xTSpline.tweenData.length; i ++) {
          var currentTween = globals.xTSpline.tweenData[i];
          console.log(currentTween);

          if (i === insertionIndex) {
            var insertAdjustedTime = ((x - currentTween.prevCoordX) / scale.x.pixels) * scale.x.ratio;
            var insertAdjustedValue = (((y - currentTween.prevCoordY) / scale.y.pixels) * scale.y.ratio) + currentTween.prevPixelY;
            var remainderTime = currentTween.adjustedTime - insertAdjustedTime;

            console.log('insertAdjustedTime', insertAdjustedTime);

            timeline.fromTo(currentTween.element, insertAdjustedTime, {left: currentTween.prevPixelY + "px"}, {left: insertAdjustedValue + "px", onUpdate: recalcEase, onUpdateParams:["{self}"], ease: updateEase(getEaseArray(globals.xTSpline.segments[insertionIndex], globals.xTSpline.segments[insertionIndex + 1]))});

            timeline.fromTo(currentTween.element, remainderTime, {left: insertAdjustedValue + "px"}, {left: currentTween.adjustedValue + "px", onUpdate: recalcEase, onUpdateParams:["{self}"], ease: updateEase(getEaseArray(globals.xTSpline.segments[insertionIndex + 1], globals.xTSpline.segments[insertionIndex + 2]))});
            globals.xTSpline.tweenData.splice(i + 1, 0, {element: box1, adjustedTime: insertAdjustedTime, prevPixelY: insertAdjustedValue, adjustedValue: currentTween.adjustedValue, prevCoordX: x, prevCoordY: y});
            
            i++;
          }
          else {
            timeline.fromTo(currentTween.element, currentTween.adjustedTime, {left: currentTween.prevPixelY + "px"}, {left: currentTween.adjustedValue + "px", onUpdate: recalcEase, onUpdateParams:["{self}"], ease: updateEase(getEaseArray(globals.xTSpline.segments[i], globals.xTSpline.segments[i + 1]))});
          }
        }
      }
    }

    if (insertionIndex === null) {
      prevCoordX = x;
      prevCoordY = y;
    }
  };

  var keyFrameInsertionCheck = function(x, y) {
    for (var i = 0; i < globals.xTSpline.segments.length; i++) {
      if (globals.xTSpline.segments[i + 1] && x > globals.xTSpline.segments[i].point.x && x < globals.xTSpline.segments[i + 1].point.x) {
        console.log('we have a point inbetween!, i is:', i);
        return i;
      }
    }
    return null;
  }

  // sync.fromTo(box1, 2, {left:"500px"}, {left: "800px", delay: 1, onUpdate: recalcEase, onUpdateParams:["{self}"], ease: updateEase(getEaseArray(globals.xTSpline.segments[0], globals.xTSpline.segments[1]))}, "myTween");
  // sync.fromTo(box1, 2, {left:"800px"}, {left: "200px", onUpdate: recalcEase, onUpdateParams:["{self}"], ease: updateEase(getEaseArray(globals.xTSpline.segments[1], globals.xTSpline.segments[2]))}, "myTween2");



  // TweenMax.ticker.addEventListener('tick', logEvent);
  // setTimeout(function(){TweenMax.ticker.removeEventListener('tick', logEvent)}, 1500);
}