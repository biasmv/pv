// generates a mesh from the given calpha positions
function make_mesh(calpha_positions) {
    var extrude_settings = { steps : calpha_positions.length*10,
                             radius : 0.4 }
   var spline_data = [];
   for (var  i = 0; i < calpha_positions.length; ++i) {
     spline_data.push(new THREE.Vector3(calpha_positions[i][0],
                                        calpha_positions[i][1],
                                        calpha_positions[i][2]));
   }
   var spline = new THREE.SplineCurve3(spline_data);

   var tube_mesh = new THREE.TubeGeometry(spline,
                                          extrude_settings.steps,
                                          extrude_settings.radius,
                                          12, false, false);
   return tube_mesh;
}


function Vehicle(radius, depth, thickness) {

  var geom = new THREE.Geometry();
  var depth_half = depth * 0.5;
  var angle = 70;
  var sin_angle_r = Math.sin(angle)*radius;
  var cos_angle_r = Math.cos(angle)*radius;
  geom.vertices.push(new THREE.Vector3(0, radius, -depth_half));
  geom.vertices.push(new THREE.Vector3(sin_angle_r, cos_angle_r, -depth_half));
  geom.vertices.push(new THREE.Vector3(sin_angle_r*1.1, cos_angle_r*1.1, -depth_half));
  geom.vertices.push(new THREE.Vector3(0, radius*1.2, -depth_half));
  geom.vertices.push(new THREE.Vector3(-sin_angle_r, cos_angle_r, -depth_half));
  geom.vertices.push(new THREE.Vector3(-sin_angle_r*1.1, cos_angle_r*1.1, -depth_half));

  geom.vertices.push(new THREE.Vector3(0, radius, depth_half));
  geom.vertices.push(new THREE.Vector3(sin_angle_r, cos_angle_r, depth_half));
  geom.vertices.push(new THREE.Vector3(sin_angle_r*1.1, cos_angle_r*1.1, depth_half));
  geom.vertices.push(new THREE.Vector3(0, radius*1.2, depth_half));
  geom.vertices.push(new THREE.Vector3(-sin_angle_r, cos_angle_r, depth_half));
  geom.vertices.push(new THREE.Vector3(-sin_angle_r*1.1, cos_angle_r*1.1, depth_half));

  geom.faces.push(new THREE.Face4(0, 3, 2, 1));
  geom.faces.push(new THREE.Face4(0, 4, 5, 3));

  geom.faces.push(new THREE.Face4(6, 7, 8, 9));
  geom.faces.push(new THREE.Face4(6, 9, 11, 10));

  geom.faces.push(new THREE.Face4(2, 3, 9, 8));
  geom.faces.push(new THREE.Face4(3, 5, 11, 9));

  geom.faces.push(new THREE.Face4(0, 1, 7, 6));

  geom.faces.push(new THREE.Face4(0, 6, 10, 4));
  geom.faces.push(new THREE.Face4(0, 1, 7, 6));

  geom.faces.push(new THREE.Face4(1, 2, 8, 7));

  geom.faces.push(new THREE.Face4(4, 10, 11, 5));

  geom.computeFaceNormals();

  return geom;

 
}
