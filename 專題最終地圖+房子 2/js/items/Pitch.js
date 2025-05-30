class Pitch {
   constructor(polys, innerPolys=[]) {
      this.polys = polys;
      this.innerPolys = innerPolys;
   }

   static load(info) {
   return new Pitch(
      (info.polys || []).map(Polygon.load),
      (info.innerPolys || []).map(Polygon.load)
   );
}

    draw(ctx) {
   const color = "rgba(246, 94, 0, 0.81)";
   ctx.save();
   ctx.beginPath();
   // 畫外圈
   for (const poly of this.polys) {
      ctx.moveTo(poly.points[0].x, poly.points[0].y);
      for (const p of poly.points) {
         ctx.lineTo(p.x, p.y);
      }
      ctx.closePath();
   }
   // 畫內圈
   for (const poly of this.innerPolys) {
      ctx.moveTo(poly.points[0].x, poly.points[0].y);
      for (const p of poly.points) {
         ctx.lineTo(p.x, p.y);
      }
      ctx.closePath();
   }
   ctx.fillStyle = color;
   ctx.strokeStyle = "rgb(255, 255, 255)";
   ctx.lineWidth = 10;
   ctx.fill("evenodd");
   ctx.stroke();
   ctx.restore();
}
}