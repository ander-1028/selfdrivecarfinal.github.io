class GraphEditor {
  constructor(viewport, graph) {
    this.viewport = viewport;
    this.canvas = viewport.canvas;
    this.graph = graph;

    this.ctx = this.canvas.getContext("2d");

    this.selected = null;
    this.hovered = null;
    this.dragging = false;
    this.mouse = null;
    this.placeCarFlag = false;
    this.mode = null; // "target" or null
    this.target = null;

    this.start = null;
    this.end = null;

    this.endPointSize = 10; // 設定一個end點的初始大小

    this.#addEventListeners();
  }

  setMode(mode) {
    this.mode = mode;
  }

  #addEventListeners() {
    this.canvas.addEventListener("mousedown", this.#handleMouseDown.bind(this));
    this.canvas.addEventListener("mousemove", this.#handleMouseMove.bind(this));
    this.canvas.addEventListener("contextmenu", (evt) => evt.preventDefault());
    this.canvas.addEventListener("mouseup", () => (this.dragging = false));

    window.addEventListener("keydown", (evt) => {
      if (evt.key == "s" && this.mouse) {
        this.start = this.mouse;
        console.log("start");
      }
      if (evt.key == "e") {
        this.end = this.mouse
          ? this.mouse
          : new Point(this.mouse.x, this.mouse.y);
        console.log("End point set at:", this.end);
        console.log("end");
        // 更新Car的endPoint
        if (myCar) {
          myCar.setEndPoint(this.end);
        }
      }
      if (this.start && this.end) {
        world.generateCorridor(this.start, this.end);
        roadBorders = world.corridor.map((s) => [s.p1, s.p2]);
      }
    });
  }

  #handleMouseMove(evt) {
    this.mouse = this.viewport.getMouse(evt, true);
    this.hovered = getNearestPoint(
      this.mouse,
      this.graph.points,
      10 * this.viewport.zoom
    );
    if (this.dragging) {
      this.selected.x = this.mouse.x;
      this.selected.y = this.mouse.y;
    }
  }

  #handleMouseDown(evt) {
    if (evt.button == 2) {
      if (this.selected) {
        this.selected = null;
      } else if (this.hovered) {
        this.#removePoint(this.hovered);
      }
      return;
    }

    if (evt.button == 0) {
      if (this.mode === "target") {
        this.target = { x: this.mouse.x, y: this.mouse.y };
        this.mode = null; // 只放一次
        return;
      }

      if (this.placeCarFlag) {
        myCar.x = this.mouse.x;
        myCar.y = this.mouse.y;
        const currentPoint = new Point(myCar.x, myCar.y);
        const nearest = getNearestSegment(currentPoint, this.graph.segments);
        myCar.angle = Math.atan2(
          nearest.p2.x - nearest.p1.x,
          nearest.p2.y - nearest.p1.y
        );
        return;
      }

      if (this.hovered) {
        this.#select(this.hovered);
        this.dragging = true;
        return;
      }

      this.graph.addPoint(this.mouse);
      this.#select(this.mouse);
      this.hovered = this.mouse;
    }
  }

  #select(point) {
    if (this.selected) {
      this.graph.tryAddSegment(new Segment(this.selected, point));
    }
    this.selected = point;
  }

  #removePoint(point) {
    this.graph.removePoint(point);
    this.hovered = null;
    if (this.selected == point) {
      this.selected = null;
    }
  }

  dispose() {
    this.graph.dispose();
    this.selected = null;
    this.hovered = null;
    this.target = null;
    this.start = null;
    this.end = null;
  }

  display() {
    this.graph.draw(this.ctx);
    if (this.hovered) {
      this.hovered.draw(this.ctx, { fill: true });
    }
    if (this.selected) {
      const intent = this.hovered ? this.hovered : this.mouse;
      new Segment(this.selected, intent).draw(this.ctx, { dash: [3, 3] });
      this.selected.draw(this.ctx, { outline: true });
    }

    // 🎯 畫出 target
    if (this.target) {
      this.ctx.font = "24px Arial";
      this.ctx.textAlign = "center";
      this.ctx.textBaseline = "middle";
      this.ctx.fillText("🎯", this.target.x, this.target.y);
    }

    // 畫出 start 與 end 點（可視化）
    if (this.start) {
      this.ctx.fillStyle = "green";
      this.ctx.beginPath();
      this.ctx.arc(this.start.x, this.start.y, 6, 0, 2 * Math.PI);
      this.ctx.fill();
    }
    if (this.end) {
      this.ctx.fillStyle = "red";
      this.ctx.beginPath();
      this.ctx.arc(this.end.x, this.end.y, this.endPointSize, 0, 2 * Math.PI); // 設定大小為 `endPointSize`
      this.ctx.fill();
    }
  }
}
