window.globals = {};
window.onload = function() {
  var box1 = document.getElementById('box1');
  var box2 = document.getElementById('box2');
  var play = false;
  var button = document.getElementById('button').addEventListener('click', function(){
    if (play) {
      sync.play();
      play = false; 
    }
    else {
      sync.pause();
      play = true;
    }
  });
  var testEase = BezierEasing(.5,-2,.2,2);
  var timeline = new TimelineMax({delay: 2});
  var timeRot = new TimelineMax({delay: 2});
  var timeColor = new TimelineMax({delay: 2});
  var sync = new TimelineMax({repeat: -1})


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
      // console.log(sync.currentLabel()); 
      // tween.kill();
      // tween = sync.fromTo(box2, 2, {left: "0px"}, {left: "500px", onUpdate: recalcEase, onUpdateParams:["{self}"], ease: new Ease(updateEase(getEaseArray()))});

      var prevTween = globals.recalc.segmentPrev ? sync.getChildren()[globals.recalc.segmentPrev.index] : null;
      var nextTween = globals.recalc.segmentNext ? sync.getChildren()[globals.recalc.segmentSelected.index] : null;
      
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

  sync.fromTo(box2, 2, {left:"500px"}, {left: "800px", delay: 1, onUpdate: recalcEase, onUpdateParams:["{self}"], ease: updateEase(getEaseArray(globals.xTSpline.segments[0], globals.xTSpline.segments[1]))}, "myTween");
  sync.fromTo(box2, 2, {left:"800px"}, {left: "200px", onUpdate: recalcEase, onUpdateParams:["{self}"], ease: updateEase(getEaseArray(globals.xTSpline.segments[1], globals.xTSpline.segments[2]))}, "myTween2");


  // TweenMax.ticker.addEventListener('tick', logEvent);
  // setTimeout(function(){TweenMax.ticker.removeEventListener('tick', logEvent)}, 1500);
  }