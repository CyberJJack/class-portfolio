function setup() {
  createCanvas(1000, 1000);
  let A = random(10,500)
  let B = random(50,700)
  background(200);
  // Create p5.Color objects to interpolate between.
  let from = color(A, 205, 20);
  let to = color(100, 150, B);

  // Create intermediate colors.
  let interA = lerpColor(from, to, 0.25);
  let interB = lerpColor(from, to, 0.5);
  let interC = lerpColor(from, to, 0.75);
  // Draw the bottom rectangle.
  fill(to);
  rect(40, 40, 1000-80,1000-80);
  
  // top rectangle
  fill(from);
  rect(40, 40, 1000-(40*2), (1000-(40*2))/5);
  
  // Draw the top-center rectangle.
  fill(interA);
  rect(40, ((1000-(40*2))/5), 1000-(40*2), (1000-(40*2))/5*3);
  
  // Draw the mid rectangle.
  fill(interB);
  rect(40, ((1000-(40*2))/5)*2, 1000-(40*2), (1000-(40*2))/5*2);
  
  // Draw the Bottom rectangle.
  fill(interC);
  rect(40, ((1000-(40*2))/5*3), 1000-(40*2), (1000-(40*2))/5);
  frameRate(60);
  loop(100);
}



function draw() {
  strokeWeight(random(1,4));
  stroke(random(20,180));
  line(random(150,850),random(180,900),random(250,750),random(250,900));
  // Get random coordinates between 0 and 100.


  strokeWeight(random(1,4)); //eye l
  stroke(random((218, 205, 32),(100, 150, 100)));
  line(random(250,400),random(400,450),random(240,450),random(350,400));
  // Get random coordinates between 0 and 100.

  strokeWeight(random(1,4)); //eye r
  stroke(random((218, 205, 32),(100, 150, 100)));
  line(random(750,600),random(400,450),random(1000-240,1000-450),random(350,400));
  // Get random coordinates between 0 and 100.

  strokeWeight(random(1,4)); //nose
  stroke(random(1,100));
  line(random(450,550),random(460,600),random(455,555),random(400,600));
  // Get random coordinates between 0 and 100.


  //pupil
  strokeWeight(3)
  stroke('white')
  fill('darkgray')
  circle(350,400,(random(30,100))); //x,y, RADIUS
  circle(650,400,(random(30,100))); //x,y, RADIUS

  //nose
  stroke('white')
  fill('darkgray');
  triangle(500,random(600,570),random(450,480),600, random(550,510),600)
  
  //mouth
  stroke(random((218, 205, 32),(100, 150, 100)));
  line(random(700,400),random(620,700),random(600,300),random(620,700));
  // Get random coordinates between 0 and 100.
  stroke('white')
  fill('darkgray');
  bezier(300, 650, 550, random(650,700), 450, random(650,700), 700, 650);

}



