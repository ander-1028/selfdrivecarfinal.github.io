class Car {
  constructor(
    x,
    y,
    width,
    height,
    controlType,
    angle = 0,
    maxSpeed = 3,
    color = "blue"
  ) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.speed = 0;
    this.acceleration = 0.2;
    this.maxSpeed = maxSpeed;
    this.friction = 0.05;
    this.angle = angle;
    this.damaged = false;
    this.stopped = false; // ✅ 新增：標記是否已到終點

    this.fittness = 0;
    this.offsets = [];
    this.useBrain = controlType == "AI";

    if (controlType != "DUMMY") {
      this.sensor = new Sensor(this);
      this.brain = new PDNet();
    }
    this.controls = new Controls(controlType);

    this.img = new Image();
    this.img.src = "car.png";

    this.mask = document.createElement("canvas");
    this.mask.width = width;
    this.mask.height = height;

    const maskCtx = this.mask.getContext("2d");
    this.img.onload = () => {
      maskCtx.fillStyle = color;
      maskCtx.rect(0, 0, this.width, this.height);
      maskCtx.fill();

      maskCtx.globalCompositeOperation = "destination-atop";
      maskCtx.drawImage(this.img, 0, 0, this.width, this.height);
    };

    this.endPoint = null;
  }

  setEndPoint(point) {
    this.endPoint = point;
    //console.log("🚗 endPoint 已設定為：", this.endPoint);
  }

  update(roadBorders, traffic) {
    if (this.stopped || this.damaged) return;

    // ✅ 檢查是否到達終點
    if (this.endPoint && this.#isAtEndPoint()) {
      console.log("✅ 車子已到達目標位置！");
      this.speed = 0;
      this.controls.forward = false;
      this.controls.reverse = false;
      this.controls.left = false;
      this.controls.right = false;
      this.stopped = true; // ✅ 設定為已停止，避免後續再進入
      return;
    }

    this.#move();
    this.fittness += this.speed;
    this.polygon = this.#createPolygon();
    this.damaged = this.#assessDamage(roadBorders, traffic);

    if (this.sensor) {
      this.sensor.update(roadBorders, traffic);
      const offsets = this.sensor.readings.map((s) =>
        s == null ? 0 : 1 - s.offset
      );
      this.offsets = offsets;

      const frontSensor = offsets[1]; // 假設 sensor 角度順序為：前、右、左、後
      const rightSensor = offsets[2];
      const speed = this.speed;
      const angle = this.angle;

      if (this.useBrain && !this.stopped) {
        const outputs = PDNet.controlPD(
          frontSensor,
          rightSensor,
          speed,
          angle,
          this.brain
        );
        this.controls.forward = outputs[0];
        this.controls.reverse = outputs[1];
        this.controls.right = outputs[2];
        this.controls.left = outputs[3];
      }
    }
  }

  #isAtEndPoint() {
    if (!this.endPoint) return false;
    const distance = Math.hypot(
      this.x - this.endPoint.x,
      this.y - this.endPoint.y
    );
    //console.log("🔍 檢查距離：", distance); // 新增這行
    return distance < 30; // 增加觸發距離
  }

  #assessDamage(roadBorders, traffic) {
    for (let i = 0; i < roadBorders.length; i++) {
      if (polysIntersect(this.polygon, roadBorders[i])) {
        return true;
      }
    }
    for (let i = 0; i < traffic.length; i++) {
      if (polysIntersect(this.polygon, traffic[i].polygon)) {
        return true;
      }
    }
    return false;
  }

  #createPolygon() {
    const points = [];
    const rad = Math.hypot(this.width, this.height) / 2;
    const alpha = Math.atan2(this.width, this.height);
    points.push({
      x: this.x - Math.sin(this.angle - alpha) * rad,
      y: this.y - Math.cos(this.angle - alpha) * rad,
    });
    points.push({
      x: this.x - Math.sin(this.angle + alpha) * rad,
      y: this.y - Math.cos(this.angle + alpha) * rad,
    });
    points.push({
      x: this.x - Math.sin(Math.PI + this.angle - alpha) * rad,
      y: this.y - Math.cos(Math.PI + this.angle - alpha) * rad,
    });
    points.push({
      x: this.x - Math.sin(Math.PI + this.angle + alpha) * rad,
      y: this.y - Math.cos(Math.PI + this.angle + alpha) * rad,
    });
    return points;
  }

  #move() {
    if (this.controls.forward) {
      this.speed += this.acceleration;
    }
    if (this.controls.reverse) {
      this.speed -= this.acceleration;
    }

    if (this.speed > this.maxSpeed) {
      this.speed = this.maxSpeed;
    }
    if (this.speed < -this.maxSpeed / 2) {
      this.speed = -this.maxSpeed / 2;
    }

    if (this.speed > 0) {
      this.speed -= this.friction;
    }
    if (this.speed < 0) {
      this.speed += this.friction;
    }
    if (Math.abs(this.speed) < this.friction) {
      this.speed = 0;
    }

    if (this.speed != 0) {
      const flip = this.speed > 0 ? 1 : -1;
      if (this.controls.left) {
        this.angle += 0.03 * flip;
      }
      if (this.controls.right) {
        this.angle -= 0.03 * flip;
      }
    }

    this.x -= Math.sin(this.angle) * this.speed;
    this.y -= Math.cos(this.angle) * this.speed;
  }

  getPos() {
    return { x: this.x, y: this.y, angle: this.angle };
  }

  setPos(carPos) {
    this.x = carPos.x;
    this.y = carPos.y;
    this.angle = carPos.angle;
  }

  getOffsets() {
    return this.offsets;
  }

  draw(ctx, drawSensor = true) {
    if (this.sensor && drawSensor) {
      this.sensor.draw(ctx);
    }

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(-this.angle);
    if (!this.damaged) {
      ctx.drawImage(
        this.mask,
        -this.width / 2,
        -this.height / 2,
        this.width,
        this.height
      );
      ctx.globalCompositeOperation = "multiply";
    }
    ctx.drawImage(
      this.img,
      -this.width / 2,
      -this.height / 2,
      this.width,
      this.height
    );
    ctx.restore();
  }
}
