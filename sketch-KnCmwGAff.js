
let handPose;
let video;
let hands = [];

async function setup() {
  createCanvas(640, 480);

  // open camera
  video = createCapture(VIDEO);
  video.size(640, 480);
  video.hide();

  // AI
  handPose = await ml5.handPose();

  // Pose Check
  handPose.detectStart(video, gotHands);
}

function gotHands(results) {
  hands = results;
}

function draw() {
  image(video, 0, 0, width, height);

  for (let hand of hands) {

    // draw handPose
    for (let point of hand.keypoints) {
      fill(0, 255, 0);
      noStroke();
      circle(point.x, point.y, 10);
    }

    // find finger
    let thumb = hand.keypoints[4];
    let index = hand.keypoints[8];

    // calculate distance
    let d = dist(
      thumb.x, thumb.y,
      index.x, index.y
    );

    stroke(255, 0, 0);
    strokeWeight(3);
    line(thumb.x, thumb.y, index.x, index.y);

    if (d < 35) {
      fill(255, 0, 0);
      noStroke();
      textSize(25);
      text("PINCH!", 20, 40);
    }
  }
}
