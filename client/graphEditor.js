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
var keyframe;

var defaultHandles = 50;


project.options.handleSize = 10;

globals.buildPath = function(attribute) {
  attribute.path = new Path();
  // attribute.path.smooth();
  attribute.path.fullySelected = true;
  attribute.path.selected = false;
  attribute.tweenData = [];
  attribute.path.style.strokeWidth = '4';
  attribute.path.style.strokeColor = '#306EFF';
  // attribute.path.style.selectedColor = 'red';

}
var onMouseDown = function(event) {
  handleIn = handleOut = keyframe = null;
  var currentPath = globals.attributes[globals.selected].path

  var hitResult = project.hitTest(event.point, hitOptions);
  if (!hitResult) {
    currentPath.fullySelected = false;
    currentPath.selected = true;
    // globals.attributes[globals.selected].path.style.strokeColor = 'grey';

  }
  else if (hitResult.item === currentPath) {
    hitResult.item.selected = false;
    hitResult.item.fullySelected = true;
    hitResult.item.style.strokeColor = '#306EFF';

    if (hitResult.type === 'handle-in') {
        handleIn = hitResult.segment;
    }
    else if (hitResult.type === 'handle-out') {
      handleOut = hitResult.segment;
    }
    else if (hitResult.type === 'segment') {
      keyframe = hitResult.segment;
      keyframe.selected = true;

    }
    else if (hitResult.type === 'stroke') {
      console.log('hit result looking for path reference', hitResult);
    }
  }
  else {
    for (var key in globals.attributes) {
      if (globals.attributes[key].path === hitResult.item) {
        currentPath.fullySelected = false;
        currentPath.selected = true;

        globals.updateSelection(key);
      }
    }
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
  else if (keyframe) {
    keyframe.point += event.delta;
  }
};

Path.prototype.resetPath = function() {
  var segments = this.removeSegments();
  view.update();

  return segments;
};

globals.drawKeyFrame = function(x, y, index, path) {

  var newKeyframe = new Point(x, y);
  var keyHandleIn = new Point(-defaultHandles, 0);
  var keyHandleOut = new Point(defaultHandles, 0);
  var addKeyFrame = index !== null ? path.insert(index + 1, new Segment(newKeyframe, keyHandleIn, keyHandleOut)) : path.add(new Segment(newKeyframe, keyHandleIn, keyHandleOut));
 path.fullySelected = true;
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
  var selectedPath = globals.attributes[globals.selected].path

  if (handleOut) {
    segmentPrev = selectedPath.segments[handleOut.index - 1] ? selectedPath.segments[handleOut.index - 1] : null;
    segmentSelected = selectedPath.segments[handleOut.index];
    segmentNext = selectedPath.segments[handleOut.index + 1] ? selectedPath.segments[handleOut.index + 1] : null;
  }
  else if (handleIn) {
    segmentPrev = selectedPath.segments[handleIn.index - 1] ? selectedPath.segments[handleIn.index- 1] : null;
    segmentSelected = selectedPath.segments[handleIn.index]; 
    segmentNext = selectedPath.segments[handleIn.index + 1] ? selectedPath.segments[handleIn.index + 1] : null; 
  }
  else if (keyframe) {
    segmentPrev = selectedPath.segments[keyframe.index - 1] ? selectedPath.segments[keyframe.index- 1] : null;
    segmentSelected = selectedPath.segments[keyframe.index]; 
    segmentNext = selectedPath.segments[keyframe.index + 1] ? selectedPath.segments[keyframe.index + 1] : null; 

  }
  globals.recalc = {segmentPrev: segmentPrev, segmentSelected: segmentSelected, segmentNext: segmentNext, keyframe: keyframe};

}

