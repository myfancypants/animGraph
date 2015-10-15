var hitOptions = {
  handles: true,
  segments: true,
  stroke: true,
  fill: true,
  tolerance: 5
};

var handleIn;
var handleOut;


project.options.handleSize = 10;

var xTSpline = globals.xTSpline = new Path();
xTSpline.strokeColor = "black";
xTSpline.add(new Point(300, 300));
xTSpline.add(new Point(500, 200));
xTSpline.add(new Point(700, 400));
// xTSpline.add(new Point(700, 400));
xTSpline.smooth();
xTSpline.fullySelected = true;


xTSpline.segments[0].handleIn.x = -150;
xTSpline.segments[0].handleIn.y = 0;
xTSpline.segments[0].handleOut.x = 150;
xTSpline.segments[0].handleOut.y = 0;

xTSpline.segments[1].handleIn.x = -100;
xTSpline.segments[1].handleIn.y = 0;
xTSpline.segments[1].handleOut.x = 100;
xTSpline.segments[1].handleOut.y = 0;

xTSpline.segments[2].handleIn.x = -100;
xTSpline.segments[2].handleIn.y = 0;
xTSpline.segments[2].handleOut.x = 100;
xTSpline.segments[2].handleOut.y = 0;
// console.log(xTSpline.segments[0]);

var onMouseDown = function(event) {
  handleIn = handleOut = null;

  var hitResult = project.hitTest(event.point, hitOptions);

  if (hitResult.type === 'handle-in') {
      handleIn = hitResult.segment;
  }
  else if (hitResult.type === 'handle-out') {
    handleOut = hitResult.segment;
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
  globals.pause = true;
};

globals.calcEase = function(segment1, segment2){
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
    console.log([segment1EaseX, segment1EaseY, segment2EaseX, segment2EaseY])
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

  console.log(globals.recalc);
}


// console.log(globals.calcEase(xTSpline.segments));