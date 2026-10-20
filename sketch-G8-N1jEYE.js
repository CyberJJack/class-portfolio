let palette = ["cyan", "white", "gray", "deepskyblue", "orange"];

function setup() {
  createCanvas(1000, 1000);
  rectMode(CENTER);
  frameRate(12);
}

function draw() {
  background("black");

  drawSquares();
  drawPortrait();
}

function drawSquares() {
  noFill();

  // background
  for (let i = 0; i < 40; i++) {
    let x = random(60, 940);
    let y = random(60, 940);
    let s = random(15, 80);
    stroke(random(palette));
    strokeWeight(random(1, 3));
    rect(x, y, s, s);
  }

}

function drawPortrait() {
  // 外轮廓（更克制一点）
  noFill();
  stroke(80);
  strokeWeight(2);
  rect(500, 500, 500, 700);

  // 少量背景装饰线，不要太多
  for (let i = 0; i < 8; i++) {
    stroke(random(["cyan", "gray", "white"]));
    strokeWeight(random(1, 2));
    line(
      random(180, 820),
      random(180, 820),
      random(250, 750),
      random(250, 750)
    );
  }

  // left
  noFill();
  stroke("white");
  strokeWeight(2);
  rect(350, 400, 140, 90);

  // right
  rect(650, 400, 140, 90);

  // eyes
  fill("darkgray");
  stroke("white");
  strokeWeight(3);
  circle(350, 400, 80);
  circle(650, 400, 80);

  // pupil
  fill("cyan");
  noStroke();
  circle(350 + random(-4, 4), 400 + random(-4, 4), 22);
  circle(650 + random(-4, 4), 400 + random(-4, 4), 22);

  // eyebrows
  stroke("white");
  strokeWeight(3);
  line(290, 350, 410, 365);
  line(590, 365, 710, 350);


  // mouth
  stroke(random(["cyan", "white", "orange"]));
  strokeWeight(3);
  noFill();
  bezier(320, 680, 430, 730, 570, 730, 680, 680);

}