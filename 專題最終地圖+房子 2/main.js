const myCanvas = document.getElementById("myCanvas");
myCanvas.width = 600;
myCanvas.height = 600;
const ctx = myCanvas.getContext("2d");

const worldString = localStorage.getItem("world");
const worldInfo = worldString ? JSON.parse(worldString) : null;
let world = worldInfo ? World.load(worldInfo) : new World(new Graph());
const graph = world.graph;

const viewport = new Viewport(myCanvas, world.zoom, world.offset);
const graphEditor = new GraphEditor(viewport, graph);

let roadBorders;
if (graphEditor.start && graphEditor.end) {
  world.generateCorridor(graphEditor.start, graphEditor.end);
  roadBorders = world.corridor.map((s) => [s.p1, s.p2]);
} else {
  roadBorders = world.roadBorders.map((s) => [s.p1, s.p2]);
}

// 讀取車輛位置資料
const carPosString = localStorage.getItem("carPos");
const carPos = carPosString ? JSON.parse(carPosString) : null;
let traffic = [];

// 產生車輛
const N = 100;
const cars = generateCars(N);
let myCar = cars[0];
for (let i = 1; i < cars.length; i++) {
  PDNet.mutate(cars[i].brain, 0.2);
}

function generateCars(N) {
  const cars = [];
  const bestBrainString = localStorage.getItem("bestBrain");
  const bestBrain = bestBrainString ? JSON.parse(bestBrainString) : null;

  for (let i = 1; i <= N; i++) {
    const car = new Car(0, 0, 35, 45, "AI");

    if (carPos) {
      car.setPos(carPos);
    }
    car.acceleration = 0;

    if (bestBrain) {
      car.brain = PDNet.clone(bestBrain);
      if (i != 1) {
        PDNet.mutate(car.brain, 0.2);
      }
    }

    cars.push(car);
  }
  return cars;
}
let oldGraphHash = graph.hash();
animate();

function animate() {
  viewport.reset();
  if (graph.hash() !== oldGraphHash) {
    world.generate();
    oldGraphHash = graph.hash();
  }
  const viewPoint = scale(viewport.getOffset(), -1);
  world.draw(ctx, viewPoint);
  ctx.globalAlpha = 0.3;
  graphEditor.display();
  myCar.update(roadBorders, traffic);
  myCar.draw(ctx);
  for (let i = 1; i < cars.length; i++) {
    cars[i].update(roadBorders, traffic);
    cars[i].draw(ctx);
  }
  requestAnimationFrame(animate);
}

function store() {
  localStorage.setItem("bestBrain", JSON.stringify(myCar.brain));
  console.log("🧠 已儲存最佳車的 PDNet 參數");
}

function cancel() {
  localStorage.removeItem("bestBrain");
  console.log("🧹 已刪除儲存的 PDNet 參數");
}

function dispose() {
  graphEditor.dispose();
  world.buildings.length = 0;
  world.trees.length = 0;
  world.waters.length = 0;
  world.markings.length = 0;
  world.grass.length = 0;
  world.pitch.length = 0;
  cars.length = 0;
}

function save() {
  world.zoom = viewport.zoom;
  world.offset = viewport.offset;

  const element = document.createElement("a");
  element.setAttribute(
    "href",
    "data:application/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(world))
  );

  const fileName = "name.world";
  element.setAttribute("download", fileName);

  element.click();

  localStorage.setItem("world", JSON.stringify(world));
  const carPos = myCar.getPos();
  localStorage.setItem("carPos", JSON.stringify(carPos));
}

function load(event) {
  const file = event.target.files[0];

  if (!file) {
    alert("No file selected.");
    return;
  }
  const reader = new FileReader();
  reader.readAsText(file);

  reader.onload = (evt) => {
    const fileContent = evt.target.result;
    const jsonData = JSON.parse(fileContent);
    world = World.load(jsonData);
    localStorage.setItem("world", JSON.stringify(world));
    location.reload();
  };
}

function polysIntersect(poly1, poly2) {
  for (let i = 0; i < poly1.length; i++) {
    for (let j = 0; j < poly2.length; j++) {
      const touch = segmentsIntersect(
        poly1[i],
        poly1[(i + 1) % poly1.length],
        poly2[j],
        poly2[(j + 1) % poly2.length]
      );
      if (touch) {
        return true;
      }
    }
  }
  return false;
}

function segmentsIntersect(p1, p2, q1, q2) {
  function ccw(a, b, c) {
    return (c.y - a.y) * (b.x - a.x) > (b.y - a.y) * (c.x - a.x);
  }
  return (
    ccw(p1, q1, q2) !== ccw(p2, q1, q2) && ccw(p1, p2, q1) !== ccw(p1, p2, q2)
  );
}

function setMode(mode) {
  graphEditor.setMode(mode);
  if (mode === "target") {
    document.getElementById("targetBtn").style.backgroundColor = "red";
  } else {
    document.getElementById("targetBtn").style.backgroundColor = "white";
  }
}

function placeCar() {
  graphEditor.placeCarFlag = !graphEditor.placeCarFlag;
  if (graphEditor.placeCarFlag) {
    document.querySelector("#btnCar").style.backgroundColor = "red";
  } else {
    document.querySelector("#btnCar").style.backgroundColor = "white";
  }
}

function dispOffsets() {
  for (let i = 0; i < cars.length; i++) {
    const car = cars[i];
    if (car.acceleration == 0) {
      car.acceleration = 0.1;
      console.log("bias2", car.brain.bias2, "bias3", car.brain.bias3);
    } else {
      carPaused = false;

      // 如果有儲存的目標點，重新導引一次
      if (lastTarget) {
        console.log("🔄 恢復前往目標：", lastTarget);
        setTargetFromCar(lastTarget.x, lastTarget.y);
      }

      console.log("▶️ 車輛繼續前進");
    }
  }
}

// 學院對應目標座標點
const mapTargets = {
  map1: { x: 69.99999999999989, y: 518.5000000000001 }, // 工程學院
  map2: { x: 677.2000000000003, y: 102.1999999999999 }, // 設計學院
  map3: { x: 880.8000000000003, y: 722.4000000000002 }, // 管理學院
  map4: { x: 969.6000000000004, y: 52.79999999999987 }, // 人文學院
  map5: { x: 523.2, y: 489.60000000000014 }, // 未來學院
};

// 監聽下拉選單事件
const selectEl = document.getElementById("mapSelect");
if (selectEl) {
  selectEl.addEventListener("change", (e) => {
    const key = e.target.value;
    if (!key) {
      console.log("尚未選擇目的地，車輛不動");
      return;
    }
    const destination = mapTargets[key];
    if (destination) {
      setTargetFromCar(destination.x, destination.y);
    }
  });
}

function setTargetFromCar(x, y) {
  // 清除舊目標（如果有 Target 類）
  if (typeof Target !== "undefined") {
    world.markings = world.markings.filter((m) => !(m instanceof Target));
    const newTarget = new Target(x, y);
    world.markings.push(newTarget);
  }

  // 建立新起點與終點
  const start = new Point(myCar.x, myCar.y);
  const end = new Point(x, y);

  graphEditor.start = start;
  graphEditor.end = end;
  myCar.setEndPoint(end);

  world.generateCorridor(start, end);
  roadBorders = world.corridor.map((s) => [s.p1, s.p2]);

  console.log(
    `🚗 新目標設定：從 (${start.x}, ${start.y}) 到 (${end.x}, ${end.y})`
  );
}
