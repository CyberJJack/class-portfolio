let sun;

let planets = [];
let activePlanet = null;
let bgColor = "black";
let linkDistance = 150;
let planetColors = [
  "lightblue",
  "pink",
  "gold",
  "plum",
  "lightgreen",
  "orange",
  "cyan",
  "salmon"
];

////////////////////////////////////

class Planet {

  constructor(_x, _y, _r, _c) {

    this.x = _x;
    this.y = _y;
    this.r = _r;
    this.c = _c;

    this.vx = 0;
    this.vy = 0;

    // shape of planets

    if (random(1) < 0.5) {
      this.shape = "circle";
    } else {
      this.shape = "square";
    }

    if (random(1) < 0.5) {
      this.solid = true;
    } else {
      this.solid = false;
    }

    this.orbiting = false;
    this.orbitR = 0;
    this.angle = 0;
    this.speed =
      random(0.003, 0.012);
  }



  update() {

    // orbit planet

    if (this.orbiting == true) {

      this.angle =
        this.angle +
        this.speed;

      this.x =
        sun.x +
        cos(this.angle) *
        this.orbitR;

      this.y =
        sun.y +
        sin(this.angle) *
        this.orbitR;
    }

    // flying planet

    else {

      this.x =
        this.x +
        this.vx;

      this.y =
        this.y +
        this.vy;

      // galaxy capture

      let d =
        dist(
          this.x,
          this.y,
          sun.x,
          sun.y
        );

      let galaxyRange =
        min(width, height) * 0.38;

      if (
        d < galaxyRange &&
        d > 70
      ) {

        this.capture();
      }
    }
  }


  capture() {

    this.orbiting = true;

    this.orbitR =
      dist(
        this.x,
        this.y,
        sun.x,
        sun.y
      );

    this.angle =
      atan2(
        this.y - sun.y,
        this.x - sun.x
      );

    this.speed =
      random(
        0.003,
        0.012
      );

    // random direction

    if (random(1) < 0.5) {

      this.speed =
        this.speed * -1;
    }
  }


  draw() {

    stroke(this.c);

    if (this.solid == true) {

      fill(this.c);

    } else {

      noFill();

      strokeWeight(2);
    }

    ////////////////////

    if (this.shape == "circle") {

      circle(
        this.x,
        this.y,
        this.r
      );

    } else {

      rectMode(CENTER);

      square(
        this.x,
        this.y,
        this.r
      );
    }

    strokeWeight(1);
  }
}

function setup() {

  createCanvas(
    windowWidth,
    windowHeight
  );

  // sun center

  sun = {
    x: width / 2,
    y: height / 2,
    r: 75
  };
}

//Star connections

function draw() {

  background(bgColor);

  drawStars();
  drawConnections();
  // sun
  drawSun();
  // planets

  for (let p of planets) {

    p.update();

    p.draw();
  }


  // active planet
  if (activePlanet != null) {

    activePlanet.draw();
    // aim line

    stroke(255, 120);

    line(
      activePlanet.x,
      activePlanet.y,
      mouseX,
      mouseY
    );
  }
}



function drawSun() {
  noStroke();
  fill("gold");

  circle(
    sun.x,
    sun.y,
    sun.r
  );


  // gold

  fill("darkorange");
  circle(
    sun.x,
    sun.y,
    sun.r * 0.65
  );
}

function drawConnections() {

  for (
    let i = 0;
    i < planets.length;
    i++
  ) {

    for (
      let j = i + 1;
      j < planets.length;
      j++
    ) {

      let a = planets[i];
      let b = planets[j];

      let d =
        dist(
          a.x,
          a.y,
          b.x,
          b.y
        );



      if (d < linkDistance) {

        stroke(
          255,
          map(
            d,
            0,
            linkDistance,
            180,
            20
          )
        );

        strokeWeight(1);

        line(
          a.x,
          a.y,
          b.x,
          b.y
        );
      }
    }
  }
}

//randomplanet

function randomPlanets() {

  randomSeed(
    millis()
  );


  // random amount

  let amount =
    floor(
      random(2, 8)
    );


  for (
    let i = 0;
    i < amount;
    i++
  ) {

    // distance

    let orbitR =
      random(
        100,
        min(width, height) * 0.38
      );

    // angle

    let angle =
      random(TWO_PI);


    let x =
      sun.x +
      cos(angle) *
      orbitR;

    let y =
      sun.y +
      sin(angle) *
      orbitR;


    let r =
      random(12, 55);

    let c =
      random(planetColors);


    let p =
      new Planet(
        x,
        y,
        r,
        c
      );

    // orbit

    p.orbiting = true;

    p.orbitR =
      orbitR;

    p.angle =
      angle;

    p.speed =
      random(
        0.002,
        0.012
      );

    // random direction

    if (random(1) < 0.5) {

      p.speed =
        p.speed * -1;
    }

    planets.push(p);
  }
}

////////////////////////////////////

function mousePressed() {

  //click on the sun
  // sun click

  let d =
    dist(
      mouseX,
      mouseY,
      sun.x,
      sun.y
    );

  if (d < sun.r / 2) {

    randomPlanets();

    return;
  }

  // new flying planet

  let r =
    random(15, 45);

  let c =
    random(planetColors);

  activePlanet =
    new Planet(
      mouseX,
      mouseY,
      r,
      c
    );
}

////////////////////////////////////

function mouseReleased() {

  if (activePlanet == null) {
    return;
  }

  // direction of shooting the planet 

  let vx =
    (
      mouseX -
      activePlanet.x
    ) * 0.05;

  let vy =
    (
      mouseY -
      activePlanet.y
    ) * 0.05;


  activePlanet.vx = vx;

  activePlanet.vy = vy;


  planets.push(
    activePlanet
  );

  activePlanet = null;
}


function drawStars() {

  randomSeed(20);

  noStroke();

  for (
    let i = 0;
    i < 100;
    i++
  ) {

    fill(
      random(30, 90)
    );

    circle(
      random(width),
      random(height),
      random(1, 3)
    );
  }
}