Vec3 = function() {
  this.data = new Float32Array(3);
}

Vec3.prototype.x = function() {
  return this.data[0];
}

Vec3.prototype.y = function() {
  return this.data[1];
}

Vec3.prototype.z = function() {
  return this.data[2];
}

Vec3.prototype.length2 = function() {
  return this.data[0]*this.data[0]+
         this.data[1]*this.data[1]+
         this.data[2]*this.data[2]);
}

Vec3.prototype.length = function() {
  return Math.sqrt(this.length2());
}


