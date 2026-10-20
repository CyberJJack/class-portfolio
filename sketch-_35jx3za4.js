class Particle {
  //blueprint for making objects (instances)

  constructor(_x =100, _y=200, _r=20, _c='gold', _vx=0, _vy=0) { //declare with default values
    this.x = _x;
    this.y = _y;
    this.r = _r;
    this.c = _c;
    this.vx = _vx;
    this.vy = _vy;
  }

  draw() {
    line(0, height/2, width, height/2);
    //method
    fill(this.c);
    stroke(this.c);
    rect(this.x, this.y, this.r, this.r);
    noFill();
    rect(this.x-(this.r*2)/4, this.y-(this.r*2)/4, this.r*2, this.r*2);
  }

  interact( a, b) {
    
  }
  
  update() {
    this.x = (this.x + this.vx);
    if (this.x > width) this.x  = 0;
    if(this.x < 0) this.x = width;
    // % width;
    this.y = (this.y + this.vy ) ;
    if(this.y > height) this.y = 0;
    if(this.y < 0) this.y = height;
    // % height;
  }
}

//////////////////////////

// things that need to persist for the world
let bgColor = "black";

let particles = [] ; //store the particle array

let palette  = ['lightblue','cyan','yellow', 'gold','white','plum','lightgreen','lightyellow'];

function setup() {
  createCanvas(500, 500);
  background(bgColor);

  for(let i =0; i < 200; i++) {
    let c = random(palette);
    let x = random(width);
    let y = random(height);
    let r = random(10,20);
    let p = new Particle(x,y,r,c); //actual creation

    p.vx = random(random(-8.,-2.),random(8.,2.));
    p.vy = random(-.5,.5);
    // p.shape = random( ['rect','circle']);
   

    particles.push(p); // world ledger
  }
  console.log(particles);
}

function updateAndDrawParticles() {
  for ( let p of particles) { //iterate over
    p.update();
    p.draw();
  }

  // iterate over all pairs and have them interact
}

function draw() {
  background(bgColor);
  updateAndDrawParticles();
  // console.log(dot1);
}
