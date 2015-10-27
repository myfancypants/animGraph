var hitOptions = {
  handles: true,
  segments: true,
  stroke: true,
  fill: true,
  pixel: true,
  tolerance: 5
};

var handleIn;
var handleOut;

var defaultHandles = 50;


project.options.handleSize = 10;

var xTSpline = globals.xTSpline = new Path();
xTSpline.strokeColor = "black";
xTSpline.smooth();
xTSpline.fullySelected = true;
xTSpline.tweenData = [];
// console.log(xTSpline.segments[0]);

var onMouseDown = function(event) {
  handleIn = handleOut = null;

  var hitResult = project.hitTest(event.point, hitOptions);

  if (!hitResult) {
    // for (var i = 0; i < xTSpline.segments.length; i++) {
    //   if (xTSpline.segments[i + 1] && event.point.x > xTSpline.segments[i].point.x && event.point.x < xTSpline.segments[i + 1].point.x) {
    //     console.log('we have a point inbetween!, i is:', i);
    //   }
    // }
  }
  else if (hitResult.type === 'handle-in') {
      handleIn = hitResult.segment;
  }
  else if (hitResult.type === 'handle-out') {
    handleOut = hitResult.segment;
  }
  else {
    console.log('location--->',hitResult.location, 'location index', hitResult.location.index);
  }
};

var onMouseDrag = function(event) {
  if (handleIn) {
    handleIn.handleIn += event.delta;
    handleIn.handleOut -= event.delta;
  } 
  else if (handleOut) {
    handleOut.handleOut += event.delta;
    handleOut.handleIn -= event.delta;
  } 
};

globals.drawKeyFrame = function(x, y, index) {

  var keyframe = new Point(x, y);
  var keyHandleIn = new Point(-defaultHandles, 0);
  var keyHandleOut = new Point(defaultHandles, 0);
  var addKeyFrame = index !== null ? xTSpline.insert(index + 1, new Segment(keyframe, keyHandleIn, keyHandleOut)) : xTSpline.add(new Segment(keyframe, keyHandleIn, keyHandleOut));
  
  addKeyFrame.selected = true;
  view.update();
  
}

globals.calcEase = function(segment1, segment2) {
  var xDist = segment2.point.x - segment1.point.x;
  var yDist = segment1.point.y - segment2.point.y;

  if (yDist >= 0){
    var segment1EaseX = segment1.handleOut.x / xDist;
    var segment1EaseY = (segment1.handleOut.y / yDist) === 0 ? 0 : -(segment1.handleOut.y / yDist);
    var segment2EaseX = 1 + (segment2.handleIn.x / xDist);
    var segment2EaseY = 1 - (segment2.handleIn.y / yDist);
  }
  else {
    yDist = Math.abs(yDist);
    var segment1EaseX = segment1.handleOut.x / xDist;
    var segment1EaseY = (segment1.handleOut.y / yDist) === 0 ? 0 : (segment1.handleOut.y / yDist);
    var segment2EaseX = 1 + (segment2.handleIn.x / xDist);
    var segment2EaseY = 1 + (segment2.handleIn.y / yDist); 
  }
  return [segment1EaseX, segment1EaseY, segment2EaseX, segment2EaseY];
};

var onMouseUp = function(event) {
  var segmentPrev, segmentSelected, segmentNext;

  if (handleOut) {
    segmentPrev = xTSpline.segments[handleOut.index - 1] ? xTSpline.segments[handleOut.index - 1] : null;
    segmentSelected = xTSpline.segments[handleOut.index];
    segmentNext = xTSpline.segments[handleOut.index + 1] ? xTSpline.segments[handleOut.index + 1] : null;
  }
  else if (handleIn) {
    segmentPrev = xTSpline.segments[handleIn.index - 1] ? xTSpline.segments[handleIn.index- 1] : null;
    segmentSelected = xTSpline.segments[handleIn.index]; 
    segmentNext = xTSpline.segments[handleIn.index + 1] ? xTSpline.segments[handleIn.index + 1] : null; 
  }
  globals.recalc = {segmentPrev: segmentPrev, segmentSelected: segmentSelected, segmentNext: segmentNext};

}


// console.log(globals.calcEase(xTSpline.segments));