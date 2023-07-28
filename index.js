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
    else dom.appendChild(document.createTextNode(child));                            // If child is a string it creates text on page
  }
  return dom;
 }

const scale = 10;
class PictureCanvas {
  constructor(picture, pointerDown) {
    this.dom = elt("canvas",{onmousedown: event => this.mouse(event, pointerDown), ontouchstart: event => this.mouse(event, pointerDown)});
    this.syncState(picture);
  }
  syncState(picture) {
    if(this.picture==picture) return;
    this.picture = picture;
    drawPicture(this.picture, this.dom, scale);
  }
}

function drawPicture(picture, canvas, scale){
  canvas.width = picture.width*scale;
  canvas.height = picture.height*scale;
  let cx = canvas.getContext("2d");
  for(let y=0; y<picture.height;y++){
    for(let x=0; x<picture.wdith;x++){
      cx.fillStyle = picture.pixel(x,y);
      cx.fillRect(x*scale,y*scale,scale,scale);
    }
  }
}