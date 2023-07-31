class Picture {
  constructor(width, height, pixels){
    this.width=width;
    this.height=height;
    this.pixels=pixels;
  }
  static empty(width, height, color){
    let pixels = new Array(width*height).fill(color);                           // New Array creates new array at a certain lenght (width*height) ann fill it with color
    return new Picture(width, height, pixels);                                  // This method is responsible for creating array of pixels in one color
  }
  pixel(x, y){                                                                  // This method is returning pixel set on certain position
    return this.pixels[x+y*this.width];
  }
  draw(pixels){                                                                 // Method responsible for actually drawing picture
    let copy = this.pixels.slice();                                             // Using slice() without arguments on an array just creates its copy
    for(let {x, y, color} of pixels) {                                          // Pixel is an object represented by its (x, y) coordinates and its color
      copy[x+y*this.width] = color;                                             // For a certain pixel in copied array is asigned new color
    }
    return new Picture(this.width, this.height, copy);                          // Function returns new Picter created with copied array of pixels which is holding new values
  }
}

function updateState(state, action){                                            // This function is returns new object that will have new state and new actions it it
  return Object.assign({}, state, action);                                      // {} represents new object and state and action are values that will be added to it
}

 function elt(type, props, ...children){                                        // This function is responsible for creating dom elements. ... means that we are including all instances of object from it to another object
  let dom = document.createElement(type);                                       // dom variable holds actual DOM element which have type of type
  if(props) Object.assign(dom,props);
  for(let child of children){
    if(typeof child != "string") dom.appendChild(child);                        // If child is not a string it adds element to end of children list on page
    else dom.appendChild(document.createTextNode(child));                       // If child is a string it creates text on page
  }
  return dom;
 }

const scale = 10;
class PictureCanvas {
  constructor(picture, pointerDown) {
    this.dom = elt("canvas",{onmousedown: event => this.mouse(event, pointerDown), ontouchstart: event => this.touch(event, pointerDown)});     // this.dom element holds our canvas with 2 events and functions assigned to them
                                                                                                                                                // Argument event holds object of MouseEvent or TouchEvent which has its own instances. We pass this objects to mouse and touch methods
    this.syncState(picture);                                                                                                                    // Every time we create PictureCanvas we sync state which is assigning new picture to old one if they are diferent and then we draw this
                                                                                                                                                // picture using drawPicture funcion
  }
  syncState(picture) {
    if(this.picture==picture) return;
    this.picture = picture;
    drawPicture(this.picture, this.dom, scale);
  }
}

function drawPicture(picture, canvas, scale){                                   // Draw picture takkes 3 arguments: picture that is passed to PictureCanvas while creating it (mostly this), canvas which is dom element from PictureCanvas, and scale which tels us that 1 px is equal to ten our units
  canvas.width = picture.width*scale;
  canvas.height = picture.height*scale;                                         // This 2 lines make pixels size fit our "boxes" that are 10 wide and height
  let cx = canvas.getContext("2d");
  for(let y=0; y<picture.height;y++){
    for(let x=0; x<picture.width;x++){
      cx.fillStyle = picture.pixel(x,y);
      cx.fillRect(x*scale,y*scale,scale,scale);
    }
  }
}

PictureCanvas.prototype.mouse = function(downEvent, onDown){
  if(downEvent.button != 0) return;
  let pos = pointerPosition(downEvent, this.dom);
  let onMove = onDown(pos);
  if(!onMove) return;
  let move = moveEvent => {
    if(moveEvent.buttons == 0){
      this.dom.removeEventListener("mousemove", move);
    } else {
      let newPos = pointerPosition(moveEvent, this.dom);
      if(newPos.x==pos.x && newPos.y==pos.y) return;
      pos = newPos;
      onMove(newPos);
    }
  };
  this.dom.addEventListener("mousemove", move);
};

function pointerPosition(pos, domNode) {
  let rect = domNode.getBoundingClientRect();
  return {x: Math.floor((pos.clientX-rect.left)/scale),
          y: Math.floor((pos.clientY-rect.top)/scale)};
}

PictureCanvas.prototype.touch = function(startEvent, onDown){
  let pos = pointerPosition(startEvent.touches[0], this.dom);
  let onMove = onDown(pos);
  startEvent.preventDefault();
  if(!onMove) return;
  let move = moveEvent => {
    let newPos = pointerPosition(moveEvent.touches[0], this.dom);
    if(newPos.x==pos.x && newPos.y==pos.y) return;
    pos=newPos;
    onMove(newPos);
  };
  let end = () => {
    this.dom.removeEventListener("touchmove", move);
    this.dom.removeEventListener("touchend", end);
  };
  this.dom.addEventListener("touchmove", move);
  this.dom.addEventListener("touchend", end);
};

class PixelEditor {
  constructor(state, config){
    let {tools, controls, dispatch} = config;
    this.state=state;
    this.canvas = new PictureCanvas(state.picture, pos => {
      let tool = tools[this.state.tool];
      let onMove = tool(pos, this.state, dispatch);
      if(onMove) return pos => onMove(pos, this.state);
    });
    this.controls = controls.map(
      Control => new Control(state, config));
      this.dom = elt("div", {}, this.canvas.dom, elt("br"),
    ...this.controls.reduce(
      (a, c) => a.concat(" ", c.dom), []));
  }
  syncState(state) {
    this.state = state;
    this.canvas.syncState(state.picture);
    for(let ctrl of this.controls) ctrl.syncState(state);
  }
}

class ToolSelect {
  constructor(state, {tools, dispatch}) {
    this.select = elt("select", {
      onchange: () => dispatch({tool: this.select.value})
    }, ...Object.keys(tools).map(name => elt("option", {
      selected: name == state.tool
    }, name)));
    this.dom = elt("label", null, "Narzedzie: ", this.select);
  }
  syncState(state) {this.select.value=state.tool;}
}

class ColorSelect {
  constructor(state, {dispatch}) {
    this.input = elt("input", {
      type: "color", value: state.color,
      onchange: () => dispatch({color: this.input.value})
    });
    this.dom = elt("label", null, "Kolor: ", this.input);
  }
  syncState(state) {this.input.value=state.color;}
}

function draw(pos, state, dispatch){
  function drawPixel({x ,y}, state){
    let drawn = {x, y, color: state.color};
    dispatch({picture: state.picture.draw([drawn])});
  }
  drawPixel(pos, state);
  return drawPixel;
}

function rectangle(start, state, dispatch){
  function drawRectangle(pos){
    let xStart = Math.min(start.x, pos.x);
    let yStart = Math.min(start.y, pos.y);
    let xEnd = Math.max(start.x, pos.x);
    let yEnd = Math.max(start.y, pos.y);
    let drawn = [];
    for(let y = yStart; y <= yEnd; y++){
      for(let x= xStart; x< xEnd; x++){
        drawn.push({x, y, color: state.color});
      }
    }
    dispatch({picture: state.picture.draw(drawn)});
  }
  drawRectangle(start);
  return drawRectangle;
}

const around = [{dx: -1, dy: 0}, {dx: 1, dy: 0},
{dx: 0, dy: -1}, {dx: 0, dy: 1}];
function fill({x, y}, state, dispatch){
  let targetColor = state.picture.pixel(x, y);
  let drawn = [{x, y, color: state.color}];
  for(let done = 0; done < drawn.length; done++){
    for(let {dx, dy} of around){
      let x = drawn[done].x +dx, y = drawn[done].y+dy;
      if(x>=0 && x < state.picture.width && y >= 0 && y < state.picture.height && state.picture.pixel(x, y) == targetColor && !drawn.some(p => p.x==x && p.y==y)) {
        drawn.push({x, y, color: state.color});
      }
    }
  }
  dispatch({picture: state.picture.draw(drawn)});
}

function pick(pos, state, dispatch){
  dispatch({color: state.picture.pixel(pos.x, pos.y)});
}

class SaveButton {
  constructor(state){
    this.picture = state.picture;
    this.dom = elt("button", {
      onclick: () => this.save()
    }, "Zapisz");
  }
  save(){
    let canvas = elt("canvas");
    drawPicture(this.picture, canvas, 1);
    let link = elt("a", {
      href: canvas.toDataURL(),
      download: "pixelart.png"
    });
    document.body.appendChild(link);
    link.click();
    link.remove();
  }
  syncState(state) {this.picture = state.picture;}
}

class LoadButton {
  constructor(_, {dispatch}) {
    this.dom = elt("button", {
      onclick: () => startLoad(dispatch)
    }, "Wczytaj");
  }
  syncState() {}
}

function startLoad(dispatch){
  let input = elt("input", {
    type: "file",
    onchange: () => finishLoad(input.files[0], dispatch)
  });
  document.body.appendChild(input);
  input.click();
  input.remove();
}

function finishLoad(file, dispatch) {
  if(file == null) return;
  let reader = new FileReader();
  reader.addEventListener("load", () => {
    let image = elt("img", {
      onload: () => dispatch({
        picture: pictureFromImage(image)
      }),
      src: reader.result
    });
  });
  reader.readAsDataURL(file);
}

function pictureFromImage(image){
  let width = Math.min(100, image.width);
  let height = Math.min(100, image.height);
  let canvas = elt("canvas", {width, height});
  let cx = canvas.getContext("2d");
  cx.drawImage(image, 0, 0);
  let pixels = [];
  let {data} = cx.getImageData(0, 0, width, height);
  function hex(n) {
    return n.toString(16).padStart(2, "0");
  }
  for(let i = 0; i<data.length; i+= 4){
    let [r, g, b] = data.slice(i, i+3);
    pixels.push("#" + hex(r) + hex(g) + hex(b));
  }
  return new Picture(width, height, pixels);
}

function historyUpdateState(state, action){
  if(action.undo == true){
    if(state.done.lenght==0) return state;
    return Object.assign({}, state, {
      picture: state.done[0],
      done: state.done.slice(1),
      doneAt: 0
    });
  } else if(action.picture &&
  state.doneAt < Date.now() - 1000) {
    return Object.assign({}, state, action, {
      done: [state.picture, ...state.done],
      doneAt: Date.now()
    });
  } else {
    return Object.assign({}, state, action);
  }
}

class UndoButton {
  constructor(state, {dispatch}) {
    this.dom = elt("button", {
      onclick: () => dispatch({undo: true}),
      disabled: state.done.length == 0
    }, "Cofnij");
  }
  syncState(state){
    this.dom.disabled = state.done.length == 0;
  }
}

const startState = {
  tool: "draw",
  color: "#000000",
  picture: Picture.empty(60, 30, "#f0f0f0"),
  done: [],
  doneAt: 0
};
const baseTools = {draw, fill, rectangle, pick};
const baseControls = [
  ToolSelect, ColorSelect, SaveButton, LoadButton, UndoButton
];
function startPixelEditor({state=startState, tools=baseTools, controls=baseControls}){
  let app = new PixelEditor(state, {
    tools, controls,
    dispatch(action){
      state = historyUpdateState(state, action);
      app.syncState(state);
    }
  });
  return app.dom;
}
