
let video, handPose, hands = [];
let gifs = {};
let action = "STOP";
let robot = { x: 320, y: 240, angle: -Math.PI / 2 };
let clapLocked = false;
let lastSeen = 0;
let pending = "STOP", pendingSince = 0;

function preload() {
  gifs.STOP = loadImage("assets/robot_idle.gif");
  gifs.FORWARD = loadImage("assets/robot_forward.gif");
  gifs.LEFT = loadImage("assets/robot_turn_left.gif");
  gifs.RIGHT = loadImage("assets/robot_turn_right.gif");
}

async function setup() {
  createCanvas(640, 480);

  // Load robot GIFs
  gifs.STOP = await loadImage("assets/robot_idle.gif");
  gifs.FORWARD = await loadImage("assets/robot_forward.gif");
  gifs.LEFT = await loadImage("assets/robot_turn_left.gif");
  gifs.RIGHT = await loadImage("assets/robot_turn_right.gif");

  // Start camera
  video = createCapture(VIDEO);
  video.size(640, 480);
  video.hide();

  // Load HandPose AI
  handPose = await ml5.handPose({ maxHands: 2 });
  handPose.detectStart(video, gotHands);
}

function draw() {
  // Full-screen mirrored camera background
  push();
  translate(width, 0);
  scale(-1, 1);
  image(video, 0, 0, width, height);
  pop();

  if (millis() - lastSeen > 500) action = "STOP";

  let dt = min(deltaTime / 1000, 0.05);

  // Robot movement
  if (action === "FORWARD") {
    robot.x += cos(robot.angle) * 110 * dt;
    robot.y += sin(robot.angle) * 110 * dt;
  }

  if (action === "LEFT") {
    robot.angle -= 1.8 * dt;
  }

  if (action === "RIGHT") {
    robot.angle += 1.8 * dt;
  }

  robot.x = constrain(robot.x, 55, width - 55);
  robot.y = constrain(robot.y, 65, height - 65);

  // Draw animated robot
  push();
  translate(robot.x, robot.y);
  rotate(robot.angle + HALF_PI);
  imageMode(CENTER);
  image(gifs[action], 0, 0, 120, 158);
  pop();
}

function gotHands(results) {
  hands = results;
  lastSeen = millis();

  // Two open hands together -> RESET
  if (hands.length === 2) {
    let a = hands[0].keypoints;
    let b = hands[1].keypoints;

    let distance = dist(
      a[9].x, a[9].y,
      b[9].x, b[9].y
    );

    let palmWidth = (
      dist(a[5].x, a[5].y, a[17].x, a[17].y) +
      dist(b[5].x, b[5].y, b[17].x, b[17].y)
    ) / 2;

    let bothOpen =
      fingers(hands[0]).filter(Boolean).length >= 3 &&
      fingers(hands[1]).filter(Boolean).length >= 3;

    if (bothOpen && distance < palmWidth * 1.7) {
      if (!clapLocked) {
        robot.x = width / 2;
        robot.y = height / 2;
        robot.angle = -HALF_PI;
        clapLocked = true;
      }
    }

    if (distance > palmWidth * 2.5) {
      clapLocked = false;
    }

    action = "STOP";
    pending = "STOP";
    return;
  }

  if (hands.length !== 1) {
    action = "STOP";
    pending = "STOP";
    return;
  }

  let f = fingers(hands[0]);
  let next = "STOP";

  // Fist
  if (f.every(v => !v)) {
    next = "FORWARD";
  }

  // One finger
  else if (f[0] && !f[1] && !f[2] && !f[3]) {
    next = "LEFT";
  }

  // Two fingers
  else if (f[0] && f[1] && !f[2] && !f[3]) {
    next = "RIGHT";
  }

  // Small delay to avoid accidental commands
  if (next !== pending) {
    pending = next;
    pendingSince = millis();
  }

  action = (
    next === "STOP" ||
    millis() - pendingSince > 150
  ) ? next : "STOP";
}

// Detect extended fingers, excluding thumb
function fingers(hand) {
  let k = hand.keypoints;

  return [8, 12, 16, 20].map(tip => {
    let joint = tip - 2;

    let tipDistance = dist(
      k[tip].x, k[tip].y,
      k[0].x, k[0].y
    );

    let jointDistance = dist(
      k[joint].x, k[joint].y,
      k[0].x, k[0].y
    );

    return tipDistance > jointDistance * 1.12;
  });
}
