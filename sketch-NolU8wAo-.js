let imgFile = "Assets/image.png";
let img; // place in mem

async function setup() {
  createCanvas(windowWidth, windowHeight);

  img = await loadImage(imgFile);

  reloadImage();
}

async function reloadImage() {
  img = await loadImage(imgFile);

  img.resize(width, height);

  image(img, 0, 0, width, height);
}

function windowResized() {
  // event when window is resize
  resizeCanvas(windowWidth, windowHeight);

  reloadImage();

  console.log(
    "w h:" + width + " " + height + "|" + windowWidth + " " + windowHeight
  );
}

function draw() {

  // center
  let cx = width / 2;
  let cy = height / 2;


  // random direction
  let angle = random(TWO_PI);



  //ring position

  let ringNum = 35;

  let ring = floor(random(ringNum));

  let maxRadius = min(width, height) * 0.75;

  let radius =
    map(
      ring,
      0,
      ringNum - 1,
      10,
      maxRadius
    );


  // small random variation
  radius += random(-15, 15);



  // rectangle size

  // farther from center = longer
  let rectLength =
    map(
      radius,
      0,
      maxRadius,
      10,
      110
    );

  rectLength *= random(0.5, 1.5);


  // very thin
  let rectWidth = random(2, 8);


  // position

  let x =
    cx +
    cos(angle) * radius;

  let y =
    cy +
    sin(angle) * radius;

  // get color from image

  let sampleX =
    constrain(round(x), 0, width - 1);

  let sampleY =
    constrain(round(y), 0, height - 1);

  let col =
    img.get(sampleX, sampleY);


  // draw radial rectangle

  push();

  translate(x, y);

  rotate(angle);

  noStroke();

  fill(
    red(col),
    green(col),
    blue(col),
    230
  );

  rect(
    0,
    -rectWidth / 2,
    rectLength,
    rectWidth
  );

  pop();
}