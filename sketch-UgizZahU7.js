let curves = [];         // 存已经完成的 bezier
let currentPoints = [];  // 当前这一条正在点的 4 个点

function setup() {
  createCanvas(1000, 1000);
}

function draw() {
  background("black");

  // ===== 画已经完成的 bezier =====
  for (let i = 0; i < curves.length; i++) {
    let c = curves[i];

    // 辅助线
    stroke(80);
    strokeWeight(1);
    line(c[0].x, c[0].y, c[1].x, c[1].y);
    line(c[1].x, c[1].y, c[2].x, c[2].y);
    line(c[2].x, c[2].y, c[3].x, c[3].y);

    // 点
    noStroke();
    fill("white");
    for (let j = 0; j < 4; j++) {
      circle(c[j].x, c[j].y, 10);
    }

    // bezier
    noFill();
    stroke("cyan");
    strokeWeight(3);
    bezier(
      c[0].x, c[0].y,
      c[1].x, c[1].y,
      c[2].x, c[2].y,
      c[3].x, c[3].y
    );
  }

  // ===== 画当前正在点的点 =====
  for (let i = 0; i < currentPoints.length; i++) {
    fill("yellow");
    noStroke();
    circle(currentPoints[i].x, currentPoints[i].y, 12);

    fill("white");
    textSize(16);
    text(i + 1, currentPoints[i].x + 10, currentPoints[i].y - 10);
  }

  // 当前点之间的辅助线
  stroke("yellow");
  strokeWeight(1);
  for (let i = 0; i < currentPoints.length - 1; i++) {
    line(
      currentPoints[i].x, currentPoints[i].y,
      currentPoints[i + 1].x, currentPoints[i + 1].y
    );
  }

  // ===== 鼠标预览：即将点的位置 =====
  fill("red");
  noStroke();
  circle(mouseX, mouseY, 10);

  fill("red");
  textSize(16);
  text("next", mouseX + 10, mouseY - 10);

  // 从最后一个已点的点连到鼠标
  if (currentPoints.length > 0) {
    stroke("red");
    strokeWeight(1);
    line(
      currentPoints[currentPoints.length - 1].x,
      currentPoints[currentPoints.length - 1].y,
      mouseX,
      mouseY
    );
  }

  // ===== 如果已经点了3个点，就预览完整 bezier =====
  if (currentPoints.length == 3) {
    noFill();
    stroke("orange");
    strokeWeight(3);
    bezier(
      currentPoints[0].x, currentPoints[0].y,
      currentPoints[1].x, currentPoints[1].y,
      currentPoints[2].x, currentPoints[2].y,
      mouseX, mouseY
    );
  }

  // 提示文字
  fill("white");
  noStroke();
  textSize(18);
  text("Click 4 points: start, control1, control2, end", 20, 30);
  text("SPACE = clear all   |   BACKSPACE = undo one point", 20, 55);
}

function mouseClicked() {
  currentPoints.push({ x: mouseX, y: mouseY });

  if (currentPoints.length == 4) {

    curves.push([
      currentPoints[0],
      currentPoints[1],
      currentPoints[2],
      currentPoints[3]
    ]);

    currentPoints = [];

    printAllBezier();
  }
}

function printAllBezier() {

  console.clear();

  console.log("=== ALL BEZIER ===");

  for (let i = 0; i < curves.length; i++) {

    let c = curves[i];

    console.log(
      "bezier(" +
      round(c[0].x) + ", " + round(c[0].y) + ", " +
      round(c[1].x) + ", " + round(c[1].y) + ", " +
      round(c[2].x) + ", " + round(c[2].y) + ", " +
      round(c[3].x) + ", " + round(c[3].y) +
      ");"
    );
  }
}

function keyPressed() {

  // Backspace 撤销
  if (key === "Backspace" || keyCode === 8) {

    // 如果当前正在画，撤销最后一个点
    if (currentPoints.length > 0) {
      currentPoints.pop();
    }

    // 如果当前没有点，就撤销上一整条 Bezier
    else if (curves.length > 0) {
      curves.pop();
    }

    return false; // 防止浏览器把 Backspace 当“返回上一页”
  }


  // 空格清空全部
  if (key === " ") {
    curves = [];
    currentPoints = [];
    return false;
  
}
}