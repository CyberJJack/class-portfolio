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
  // empty blocks
  for (let i = 0; i < 80; i++) {
    let x = random(60, 940);
    let y = random(60, 940);
    let s = random(15, 80);

    // stop it from blocking the face
    if (dist(x, y, 500, 500) > 180) {
      stroke(random(palette));
      strokeWeight(random(1, 3));
      rect(x, y, s, s);
    }
  }
}

function drawPortrait() {

  // left
  noFill();
  stroke("white");
  strokeWeight(2);
  rect(350, 580, 160, 120);

  // right
  rect(660, 580, 160, 120);

  // eyes
  fill("cyan");
  stroke("white");
  strokeWeight(3);
  circle(360, 580, 80);
  circle(640, 580, 80);

  // eyebrows
  stroke("white");
  strokeWeight(7);
  line(290, 550, 410, 540);
  line(590, 540, 710, 550);

    stroke(random(["cyan", "white", "orange"]));
  strokeWeight(5);
  noFill();
bezier(502, 269, 445, 30, 353, 444, 473, 594); 
bezier(505, 253, 547, 26, 633, 398, 538, 552); 
bezier(507, 229, 516, 15, 652, 40, 853, 438); 
bezier(503, 223, 473, 5, 313, 55, 170, 418); 
bezier(485, 200, 391, 4, 208, 275, 254, 537); 
bezier(254, 537, 263, 486, 279, 453, 288, 443); 
bezier(277, 460, 287, 491, 307, 543, 373, 588); 
bezier(309, 464, 320, 509, 341, 539, 376, 592); 
bezier(383, 355, 397, 468, 435, 550, 476, 589); 
bezier(381, 347, 368, 451, 386, 514, 418, 587); 
bezier(349, 401, 359, 522, 395, 590, 406, 588); 
bezier(505, 228, 548, 3, 654, 323, 563, 556); 
bezier(499, 248, 461, 6, 374, 239, 412, 458); 
bezier(511, 171, 511, 31, 602, 25, 765, 264); 
bezier(596, 268, 626, 433, 625, 545, 588, 577); 
bezier(700, 347, 700, 457, 670, 543, 638, 566); 
bezier(692, 333, 716, 441, 714, 531, 668, 569); 
bezier(754, 451, 744, 508, 709, 561, 699, 570); 
bezier(744, 478, 712, 745, 664, 800, 500, 859); 
bezier(237, 469, 274, 734, 317, 796, 496, 859); 
bezier(804, 389, 791, 541, 750, 652, 703, 697); 
bezier(194, 386, 205, 539, 243, 659, 293, 709); 
bezier(769, 290, 802, 392, 804, 606, 764, 739); 
bezier(802, 317, 827, 464, 826, 574, 767, 735); 
bezier(199, 389, 204, 649, 247, 750, 272, 782); 
bezier(168, 398, 173, 543, 199, 685, 273, 784); 
bezier(459, 112, 333, 43, 188, 147, 168, 427); 
bezier(496, 129, 446, 24, 309, 59, 239, 187); 
bezier(482, 98, 535, 33, 648, 49, 727, 204); 
bezier(485, 90, 576, 10, 784, 81, 868, 493); 
bezier(478, 82, 307, 19, 154, 135, 135, 509); 
bezier(223, 208, 176, 321, 155, 402, 138, 505); 
bezier(148, 436, 140, 553, 147, 590, 172, 672); 
bezier(172, 505, 166, 543, 167, 601, 174, 668); 
bezier(832, 394, 859, 518, 856, 622, 817, 716); 
bezier(815, 443, 834, 524, 836, 630, 817, 711); 
bezier(318, 76, 232, 95, 155, 175, 129, 310); 
bezier(256, 119, 218, 137, 166, 202, 130, 315); 
bezier(156, 247, 112, 384, 94, 531, 124, 668); 
bezier(144, 392, 131, 472, 122, 553, 127, 666); 
bezier(507, 229, 590, 2, 777, 269, 743, 496); 
}