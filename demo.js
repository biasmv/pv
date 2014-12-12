var structure;
//var cameraSamples = hammersleySequence(16);
var rotationSamples = createRandomRotations(4); 

function lines() {
  viewer.clear();
  viewer.lines('structure', structure, {
              color: color.byResidueProp('num'),
              showRelated : '1' });
}
function cartoon() {
  viewer.clear();
  viewer.cartoon('structure', structure, {
              color : color.ssSuccession(), showRelated : '1',
  });
}

function lineTrace() {
  viewer.clear();
  viewer.lineTrace('structure', structure, { showRelated : '1' });
}

function spheres() {
  viewer.clear();
  viewer.spheres('structure', structure, { showRelated : '1' });
}

function sline() {
  viewer.clear();
  viewer.sline('structure', structure,
          { color : color.uniform('red'), showRelated : '1'});
}

function tube() {
  viewer.clear();
  viewer.tube('structure', structure);
  viewer.lines('structure.ca', structure.select({aname :'CA'}),
            { color: color.uniform('blue'), lineWidth : 1,
              showRelated : '1' });
}

function trace() {
  viewer.clear();
  viewer.trace('structure', structure, { showRelated : '1' });
}
function ballsAndSticks() {
  viewer.clear();
  viewer.ballsAndSticks('structure', structure, { showRelated : '1' });
}

function preset() {
  viewer.clear();
  var ligand = structure.select({'rnames' : ['SAH', 'RVP']});
  viewer.ballsAndSticks('structure.ligand', ligand, {
  });
  viewer.cartoon('structure.protein', structure, { boundingSpheres: false });
}

function load(pdb_id) {
  $.ajax({ url : 'pdbs/'+pdb_id+'.pdb', success : function(data) {
    structure = io.pdb(data);
    //mol.assignHelixSheet(structure);
    cartoon();

    viewer.autoZoom();
  }});
}
function kinase() {
  load('1ake');
}

function crambin() {
  load('1crn');
}

function transferase() {
  load('1r6a');
}

function telethonin() { load('2f8v'); }

function porin() {
  load('2por');
}
function longHelices() {
  load('4C46');
}

function ssSuccession() {
  viewer.forEach(function(go) {
    go.colorBy(color.ssSuccession());
  });
  viewer.requestRedraw();
}

function uniform() {
  viewer.forEach(function(go) {
    go.colorBy(color.uniform([0,1,0]));
  });
  viewer.requestRedraw();
}
function byElement() {
  viewer.forEach(function(go) {
    go.colorBy(color.byElement());
  });
  viewer.requestRedraw();
}

function ss() {
  viewer.forEach(function(go) {
    go.colorBy(color.bySS());
  });
  viewer.requestRedraw();
}

function proInRed() {
  viewer.forEach(function(go) {
    go.colorBy(color.uniform('red'), go.select({rname : 'PRO'}));
  });
  viewer.requestRedraw();
}
function rainbow() {
  viewer.forEach(function(go) {
    go.colorBy(color.rainbow());
  });
  viewer.requestRedraw();
}

function byChain() {
  viewer.forEach(function(go) {
    go.colorBy(color.byChain());
  });
  viewer.requestRedraw();
}

function polymerase() {
  load('4UBB');
};
function entropy() {
  viewMode('entropy');
  viewer.requestRedraw();
};
function pca() {
  viewMode('pca');
  viewer.requestRedraw();
};
function hammersleySequence(n) {
  var points = [];
  var t;
  for (var k = 0; k < n; ++k) {
    t = 0;
    var kk;
    for (var p = 0.5, kk=k; kk; p*=0.5, kk>>=1) {
      if (kk & 1) {
        t += p;
      }
    }
    t = 2 * t - 1;
    var theta = (k + 0.5) / n;  // theta in [0,1]
    theta *= 2 * Math.PI;
    var st = Math.sqrt(1 - t*t);
    //var phi = Math.acos(t);
    var vec = vec3.fromValues(st * Math.cos(theta), st*Math.sin(theta), t);
    points.push(vec);
    
  }
  return points;
}
function createRandomRotations(n) {
  var twoPI = 2 * Math.PI;
  var ret = [];
  for (var i = 0; i < n; ++i) {
    var u1 = Math.random();
    var u2 = Math.random();
    var u3 = Math.random();
    var st = Math.sqrt(1-u1);
    
    var q = quat.fromValues(st*Math.sin(twoPI*u2),st*Math.cos(twoPI*u2), Math.sqrt(u1)*Math.sin(twoPI*u3), Math.sqrt(u1)*Math.cos(twoPI*u3));
    var auxRotation = mat4.create();
    mat4.fromQuat(auxRotation,q);
    ret.push(auxRotation);
  }
  return(ret);
}

function viewMode(mode) {
  
  var rotation = mat4.clone(viewer._cam.rotation());
  var center = vec3.clone(viewer._cam.center());
  var zoom = viewer._cam.zoom();
  
  var cameraPosition = function(rotation, center, zoom) {
    var currentCameraPosition = vec3.fromValues(rotation[2], rotation[6], rotation[10]);
    vec3.normalize(currentCameraPosition, currentCameraPosition);
    vec3.scaleAndAdd(currentCameraPosition, center, currentCameraPosition, zoom);
    return(currentCameraPosition);
  }
  
  var spherical = function(point) {
    var r = vec3.length(point);
    var theta = Math.atan(point[1]/point[2]);
    var phi = Math.acos(point[2]/r);
    return([r, theta, phi]);
  }
  
  if (mode === 'entropy') {
    
    var samples = rotationSamples.slice(0);
    
    var rotation = computePCA();
    samples.push(rotation);
    
    // rotate by 180 degrees around the vertical axes
    var auxRotation = mat4.create();
    mat4.rotate(auxRotation, rotation, Math.PI, [rotation[1], rotation[5], rotation[9]]);
    samples.push(auxRotation);
    
    // now sample all rotations
    var maxI = 0;
    for (var k = 0; k < samples.length; ++k) {
       
      auxRotation = samples[k];
      
      var auxI = viewer.computeEntropy(auxRotation);
      if (auxI > maxI) {
        rotation = auxRotation;
        maxI = auxI;
        console.log(k);
      }
      
    }
  
  } else if (mode === 'pca') {
    
    rotation = computePCA();
    
  }
  
  viewer.setRotation(rotation, 200);
    
  };
function computePCA() {
  var X = [];

  viewer.forEach(function(obj) {
    obj.eachCentralAtom(function(atom, pos) {
      X.push([pos[0], pos[1], pos[2]]);
    });
  });
      
  if (!X.length) {
    return(mat4.create());
  }
  
  // compute and subtract column means
  var XT = numeric.transpose(X);
  var mean = XT.map(function(row) {return numeric.sum(row) / row.length;});
  X = numeric.transpose(XT.map(function(row, i) {return numeric.sub(row, mean[i]);}));
  
  var sigma = numeric.dot(numeric.transpose(X), X);
  var svd = numeric.svd(sigma);
  var V = svd.V;
  var right = V[0];
  var up = V[1];
  var view = V[2];
  
  var m = mat4.fromValues(right[0], right[1], right[2], 0,
                          up[0], up[1], up[2], 0,
                          view[0], view[1], view[2], 0,
                          0, 0, 0, 1);
  
  var r = mat3.create();
  mat3.fromMat4(r, m);
  if (mat3.determinant(r) < 0) {
      m = mat4.fromValues(right[0], right[1], right[2], 0,
                          up[0], up[1], up[2], 0,
                          -view[0], -view[1], -view[2], 0,
                          0, 0, 0, 1);
  }
  return(m);
}