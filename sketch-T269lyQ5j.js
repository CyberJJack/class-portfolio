let myModel;

async function setup() {
  createCanvas(800, 800, WEBGL);

  myModel = await loadModel(
    "MyCharacterHead.obj",
    true
  );
}

function draw() {
  background(30);

  orbitControl();

  model(myModel);
}