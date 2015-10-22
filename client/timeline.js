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
  var spaceBarListener = document.addEventListener('keydown', function(event){
    if (event.keyCode === 32) {
      playback();
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
    return new Ease(BezierEasing(ease[0], ease[1], ease[2], ease[3]).get);
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
    globals.drawKeyFrame(x, y);
    var totalKeyFrame = globals.xTSpline.segments.length;
    var adjustedTime = ((x - prevCoordX) / scale.x.pixels) * scale.x.ratio;
    var adjustedValue = (((y - prevCoordY) / scale.y.pixels) * scale.y.ratio) + prevPixelY;

    console.log(adjustedValue, adjustedTime);

    if (totalKeyFrame > 1) {
      timeline.fromTo(box1, adjustedTime, {left: prevPixelY + "px"}, {left: adjustedValue + "px", onUpdate: recalcEase, onUpdateParams:["{self}"], ease: updateEase(getEaseArray(globals.xTSpline.segments[totalKeyFrame - 2], globals.xTSpline.segments[totalKeyFrame - 1]))});
    }
    prevPixelY = adjustedValue;
    prevCoordX = x;
    prevCoordY = y;
  }

  // sync.fromTo(box1, 2, {left:"500px"}, {left: "800px", delay: 1, onUpdate: recalcEase, onUpdateParams:["{self}"], ease: updateEase(getEaseArray(globals.xTSpline.segments[0], globals.xTSpline.segments[1]))}, "myTween");
  // sync.fromTo(box1, 2, {left:"800px"}, {left: "200px", onUpdate: recalcEase, onUpdateParams:["{self}"], ease: updateEase(getEaseArray(globals.xTSpline.segments[1], globals.xTSpline.segments[2]))}, "myTween2");



  // TweenMax.ticker.addEventListener('tick', logEvent);
  // setTimeout(function(){TweenMax.ticker.removeEventListener('tick', logEvent)}, 1500);
  }