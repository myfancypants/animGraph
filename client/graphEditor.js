var hitOptions = {
  handles: true,
  segments: true,
  stroke: true,
  fill: true,
  pixel: true,
  tolerance: 5,
  match: function(hit) {
    return hit.item.layer === project.layers[0]
  }
};

var handleIn;
var handleOut;
var keyframe;
var initialCenter = view.center
var defaultHandles = 50;
var verticalGrid
var horizontalGrid


project.options.handleSize = 10;

globals.buildPath = function(attribute, key) {
  var keyArray = JSON.parse(globals.defaultKeyframeJSON[key]);
  attribute.path = new Path(); 
  attribute.path.fullySelected = true;
  attribute.path.selected = false;
  attribute.path.style.strokeWidth = '4';
  attribute.path.style.strokeColor = attribute.color;
  attribute.path.style.selectedColor = attribute.color;

}
var onMouseDown = function(event) {
  handleIn = handleOut = keyframe = null;
  var currentPath = globals.attributes[globals.selected].path
  var hitResult = project.hitTestAll(event.point, hitOptions);

  var hitResultCurrentPath = hitResult.find(function(path) {
    return path.item === currentPath
  })

  if (!hitResult.length) {
    return
  }
  else if (hitResultCurrentPath) {
    hitResultCurrentPath.item.selected = false;
    hitResultCurrentPath.item.fullySelected = true;

    if (hitResultCurrentPath.type === 'handle-in') {
        handleIn = hitResultCurrentPath.segment;
    }
    else if (hitResultCurrentPath.type === 'handle-out') {
      handleOut = hitResultCurrentPath.segment;
    }
    else if (hitResultCurrentPath.type === 'segment') {
      keyframe = hitResultCurrentPath.segment;
      keyframe.selected = true;

    }
    else if (hitResultCurrentPath.type === 'stroke') {
    }
  }
  else if (!globals.hasClickHandler) {
    for (var key in globals.attributes) {
      if (globals.attributes[key].path === hitResult[0].item) {
        currentPath.fullySelected = false;
        currentPath.selected = true;

        globals.updateSelection(key);
        globals.attributes[key].path.selected = false;
        globals.attributes[key].path.fullySelected = true;
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
  // test for CMD key on mac for zooming
  else {
    var movementX = event.event.movementX;
    var movementY = event.event.movementY;

    if (event.event.metaKey === true) {
      view.scaling += new Point(movementX * -0.01, movementY * -0.01);
      globals.grid.scale.zoom += new Point(movementX * -0.01, movementY * -0.01);

      movementX /= -0.01;
      movementY /= -0.01;
    }
    var xGridScale = globals.grid.scale.xOffset
    var yGridScale = globals.grid.scale.yOffset
    var positionOffest = new Point(movementX, movementY)
    // xGrid Lines should only be extended along their Y axis to be percieved as continuing onwards
    // yGrid Lines then are only extended along their X axis
    var xGridOffset = new Point(0, movementY)
    var yGridOffset = new Point(movementX, 0)

    var firstLineX = globals.grid.lines.x.children[0]
    var firstLineY = globals.grid.lines.y.children[0]
    var firstLineXPosition = view.projectToView(firstLineX.position)
    var firstLineYPosition = view.projectToView(firstLineY.position)

    var lastLineX = globals.grid.lines.x.children[globals.grid.lines.x.children.length - 1]
    var lastLineY = globals.grid.lines.y.children[globals.grid.lines.y.children.length - 1]
    var lastLineXPosition = view.projectToView(lastLineX.position)
    var lastLineYPosition = view.projectToView(lastLineY.position)

    var firstLabelX = globals.grid.labels.x.children[0]
    var firstLabelY = globals.grid.labels.y.children[0]

    var lastLabelX = globals.grid.labels.x.children[globals.grid.labels.x.children.length - 1]
    var lastLabelY = globals.grid.labels.y.children[globals.grid.labels.y.children.length - 1]

    globals.grid.lines.x.children = globals.grid.lines.x.children.filter(function(gridLine) {
      var gridLinePosition = view.projectToView(gridLine.position)
      return -100 <= gridLinePosition.x && gridLinePosition.x < window.innerWidth + 100
    })
    globals.grid.lines.y.children = globals.grid.lines.y.children.filter(function(gridLine) {
      var gridLinePosition = view.projectToView(gridLine.position)
      return -100 <= gridLinePosition.y && gridLinePosition.y < window.innerHeight + 100
    })
    globals.grid.labels.x.children = globals.grid.labels.x.children.filter(function(gridLine) {
      var gridLinePosition = view.projectToView(gridLine.position)
      return -100 <= gridLinePosition.x && gridLinePosition.x < window.innerWidth + 100
    })
    globals.grid.labels.y.children = globals.grid.labels.y.children.filter(function(gridLine) {
      var gridLinePosition = view.projectToView(gridLine.position)
      return -100 <= gridLinePosition.y && gridLinePosition.y < window.innerHeight + 100
    })

    if (firstLineXPosition.x > xGridScale) {
        globals.grid.labels.x.insertChild(0, new PointText({
          point: view.viewToProject(new Point(firstLineXPosition.x - xGridScale, 10)),
          content: parseInt(firstLabelX.content, 10) - globals.grid.scale.xUnit,
          fillColor: 'black',
          fontFamily: 'Courier New',
          fontWeight: 'bold',
          fontSize: 10
        }))
        globals.grid.lines.x.insertChild(0, new Path.Line({
          from: view.viewToProject(new Point(firstLineXPosition.x - xGridScale, 0)),
          to: view.viewToProject(new Point(firstLineXPosition.x - xGridScale, window.innerHeight)),
          strokeColor: 'black',
          opacity: 0.2
        }))
    }
    else if (window.innerWidth - lastLineXPosition.x > xGridScale) {
      var lastLabelIndex = globals.grid.labels.x.children.length
      var lastLineIndex = globals.grid.lines.x.children.length
      globals.grid.labels.x.insertChild(lastLabelIndex, new PointText({
        point: view.viewToProject(new Point(lastLineXPosition.x + xGridScale, 10)),
        content: parseInt(lastLabelX.content, 10) + globals.grid.scale.xUnit,
        fillColor: 'black',
        fontFamily: 'Courier New',
        fontWeight: 'bold',
        fontSize: 10
      }))
      globals.grid.lines.x.insertChild(lastLineIndex, new Path.Line({
        from: view.viewToProject(new Point(lastLineXPosition.x + xGridScale, 0)),
        to: view.viewToProject(new Point(lastLineXPosition.x + xGridScale, window.innerHeight)),
        strokeColor: 'black',
        opacity: 0.2
      })) 
    }

    if (firstLineYPosition.y > yGridScale) {
        globals.grid.labels.y.insertChild(0, new PointText({
          point: view.viewToProject(new Point(10, firstLineYPosition.y - yGridScale)),
          content: parseInt(firstLabelY.content, 10) + globals.grid.scale.yUnit,
          fillColor: 'black',
          fontFamily: 'Courier New',
          fontWeight: 'bold',
          fontSize: 10
        }))
        globals.grid.lines.y.insertChild(0, new Path.Line({
          from: view.viewToProject(new Point(0, firstLineYPosition.y - yGridScale)),
          to: view.viewToProject(new Point(window.innerWidth, firstLineYPosition.y - yGridScale)),
          strokeColor: 'black',
          opacity: 0.2
        }))
    }
    else if (window.innerHeight - lastLineYPosition.y > yGridScale) {
      var lastLabelIndex = globals.grid.labels.y.children.length
      var lastLineIndex = globals.grid.lines.y.children.length
      globals.grid.labels.y.insertChild(lastLabelIndex, new PointText({
        point: view.viewToProject(new Point(10, lastLineYPosition.y + yGridScale)),
        content: parseInt(lastLabelY.content, 10) - globals.grid.scale.yUnit,
        fillColor: 'black',
        fontFamily: 'Courier New',
        fontWeight: 'bold',
        fontSize: 10
      }))
      globals.grid.lines.y.insertChild(lastLineIndex, new Path.Line({
        from: view.viewToProject(new Point(0, lastLineYPosition.y + yGridScale)),
        to: view.viewToProject(new Point(window.innerWidth, lastLineYPosition.y + yGridScale)),
        strokeColor: 'black',
        opacity: 0.2
      })) 
    }

    extendGroupGridLines(globals.grid.lines.x.children, xGridOffset)
    extendGroupGridLines(globals.grid.lines.y.children, yGridOffset)

    extendGroupGridLines(globals.grid.labels.x.children, xGridOffset)
    extendGroupGridLines(globals.grid.labels.y.children, yGridOffset)
    view.translate(positionOffest)
  }
};

// Takes in an array of items and extends path segments, while simply repositioning TextItems
// Position is updated based on offset arg
var extendGroupGridLines = function(children, offset) {
  children.forEach(function(gridLine) {
    if (gridLine.segments) {
      gridLine.segments.forEach(function(segment){
        segment.point -= offset
      })
    }
    else if (gridLine.point) {
      gridLine.point -= offset
    }
  })
}

Path.prototype.resetPath = function() {
  var segments = this.removeSegments();
  view.update();

  return segments;
};

globals.drawKeyFrame = function(x, y, index, path, handleIn, handleOut, isHead) {
  var newKeyframe = new Point(x, y);
  var keyHandleIn = handleIn ? new Point(handleIn[0], -handleOut[1]) : new Point(-defaultHandles, 0);
  var keyHandleOut = handleOut ? new Point(handleOut[0], handleOut[1]) : new Point(defaultHandles, 0);

  // Resetting index to -1 allows a HEAD addition to be added to path[0]
  index = isHead ? -1 : index;
  var testKeyFrame = index !== null && index !== 'TAIL'
  var addKeyFrame = testKeyFrame || isHead ? path.insert(index + 1, new Segment(newKeyframe, keyHandleIn, keyHandleOut)) : path.add(new Segment(newKeyframe, keyHandleIn, keyHandleOut));
  
  path.selected = true;
  view.update();
}

globals.eraseKeyFrame = function(keyIndex, path) {
  path.removeSegment(keyIndex);
  path.selected = true;
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

};

globals.reRender = function(){
  var currentSelection = globals.attributes[globals.selected];
  currentSelection.path.selected = false;
  currentSelection.path.fullySelected = true;

  view.update();
};


globals.init = function() {  
  new Layer()
  globals.drawGrid()
  project.layers[0].activate()
  project.layers[1].off('click', onMouseDown)
  globals.grid.scale.zoom = view.scaling
  view.update()
}

globals.drawGrid = function() {
  var xOffset = globals.grid.scale.xOffset
  var yOffset = globals.grid.scale.yOffset

  var width = window.innerWidth
  var height = window.innerHeight
  var xPaths = globals.grid.lines.x = new Group()
  var yPaths = globals.grid.lines.y = new Group()
  var xLabels = globals.grid.labels.x = new Group()
  var yLabels = globals.grid.labels.y = new Group()
  // Calculate the middle to use as the basis for 0 values on both axis
  var xMidpoint = Math.floor((width / xOffset) / 2)
  var yMidpoint = Math.floor((height / yOffset) / 2)

  globals.grid.midpoint.x = xMidpoint
  globals.grid.midpoint.y = yMidpoint

  for (var i = 0; i <= width; i++) {
    if (i % xOffset === 0) {
      var xGridLine = i / xOffset
      var displayValue
      var color = 'black'
      var opacity = 0.2
      if (xGridLine < xMidpoint || xGridLine > xMidpoint) {
        displayValue = (xGridLine - xMidpoint)
      }
      else if (xGridLine === xMidpoint) {
        displayValue = 0
        color = 'red'
        opacity = 0.5
      }

      xPaths.addChild(new Path.Line({
        from: [i, 0],
        to: [i, height],
        strokeColor: color,
        opacity: opacity
      }))
      xLabels.addChild(new PointText({
        point: [i + 5, 10],
        content: displayValue,
        fillColor: color,
        fontFamily: 'Courier New',
        fontWeight: 'bold',
        fontSize: 10
      }))
    }
  }
  for (var j = 0; j <= height; j++) {
    if (j % yOffset === 0) {
      var yGridLine = j / yOffset
      var displayValue
      var color = 'black'
      var opacity = 0.2
      if (yGridLine < yMidpoint || yGridLine > yMidpoint) {
        displayValue = (yGridLine - yMidpoint) * yOffset * -1
      }
      else if (yGridLine === yMidpoint) {
        displayValue = 0
        color = 'red'
        opacity = 0.5
      }

      yPaths.addChild(new Path.Line({
        from: [0, j],
        to: [width, j],
        strokeColor: color,
        opacity: opacity
      }))
      yLabels.addChild(new PointText({
        point: [5, j + 10],
        content: displayValue,
        fillColor: color,
        fontFamily: 'Courier New',
        fontWeight: 'bold',
        fontSize: 10
      }))
    }
  }
}

globals.viewAdjustedPosition = function(x, y) {
  var viewOffSetX = (view.center.x - initialCenter.x)
  var viewOffSetY = (view.center.y - initialCenter.y)

  return [x + viewOffSetX, y + viewOffSetY]
}

// Determines the positional value relative to the rendered grid and not
// based on actual X, Y pixel coordinates
globals.calcPositionValue = function(x, y) {
  var xOffset = globals.grid.scale.xOffset
  var yOffset = globals.grid.scale.yOffset
  var xMidpoint = globals.grid.midpoint.x
  var yMidpoint = globals.grid.midpoint.y
  var xCenter = xOffset * xMidpoint
  var yCenter = yOffset * yMidpoint

  var positionX = (x - xCenter) / xOffset
  var positionY = (y - yCenter) * -1

  return [positionX, positionY]
}