class PDNet {
  constructor() {
    this.kp = 50;
    this.kd = 3;
    this.target = 0.45;
    this.bias0 = 0;
    this.bias1 = -1;
    this.bias2 = 0.6;
    this.bias3 = 0.4;
    this.bias4 = 1 * 100; //useless for now
    this.bias5 = 0.8 * 100; //useless for now
    this.bias6 = -0.5 * 100; //useless for now
  }

  static mutate(brain, amount = 1) {
    brain.bias2 = lerp(brain.bias2, Math.random() * 2 - 1, amount);
    brain.bias3 = lerp(brain.bias3, Math.random() * 2 - 1, amount);
    brain.bias4 = lerp(brain.bias4, Math.random() * 2 - 1, amount);
    brain.bias5 = lerp(brain.bias5, Math.random() * 2 - 1, amount);
    brain.bias6 = lerp(brain.bias6, Math.random() * 2 - 1, amount);
  }
  static controlPD(frontSensor, rightSensor, speed, angle, brain) {
    const kp = brain.kp;
    const kd = brain.kd;
    const target = brain.target;
    const n0 = kp * (target - frontSensor) - kd * speed;
    const bias0 = brain.bias0;
    const bias1 = brain.bias1;
    const bias2 = brain.bias2;
    const bias3 = brain.bias3;
    const bias4 = brain.bias4;
    const bias5 = brain.bias5;
    const bias6 = brain.bias6;
    // const out0 = n0>0 ? 1 : 0;
    // const out1 = n0<-1 ? 1 : 0;
    // const out2 = rightSensor<0.75 ? 1 : 0;
    // const out3 = rightSensor>0.99 ? 1 : 0;
    const out0 = n0 > bias0 && speed < 2 ? 1 : 0; // forward
    const out1 =
      n0 < bias1 || (Math.abs(angle) > bias4 && speed > bias5) ? 1 : 0; // reverse
    const out2 = rightSensor < bias2 && angle > bias6 ? 1 : 0; // right
    const out3 = rightSensor > bias3 ? 1 : 0; // left
    return [out0, out1, out2, out3];
  }
}

PDNet.clone = function (brain) {
  const clone = new PDNet();
  Object.assign(clone, brain);
  return clone;
};
