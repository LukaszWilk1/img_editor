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
