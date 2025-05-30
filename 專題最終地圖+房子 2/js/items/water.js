class Water {
   constructor(polys, innerPolys=[]) {
      this.base = polys;
      this.innerPolys = innerPolys;
   }

   static load(info) {
      return new Water(Polygon.load(info.base), info.innerPolys);
   }

   draw(ctx) {
      
      this.base.draw(ctx, { fill: "rgba(0, 152, 246, 0.81)", stroke: "rgb(7, 99, 237)", lineWidth: 2 });
   }
}