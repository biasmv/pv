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
                                          12, false, true);
   return tube_mesh;
}
