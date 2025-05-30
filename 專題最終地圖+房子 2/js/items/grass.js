class Grass {
   constructor(grasspoly, innerPolys=[]) {
      this.base = grasspoly;
      this.innerPolys = innerPolys;
   }

   static load(info) {
      return new Grass(Polygon.load(info.base), info.innerPolys);
   }

   draw(ctx) {
      this.base.draw(ctx, { fill: "rgba(3, 190, 34, 0.81)", stroke: "rgba(84, 246, 40, 0.57)", lineWidth: 10 });
   }
}