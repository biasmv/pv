var structure;
var cameraSamples = hammersleySequence(16);

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
    var phi = Math.acos(t);
            
    points.push({'theta': theta, 'phi':phi});
    
  }
  return points;
}
function viewMode(mode) {
  
  var rotation = mat4.create();
  
  if (mode === 'entropy') {
       
    rotation = computePCA();
    var maxI = viewer.computeEntropy(rotation);
    
    for (var k = 0; k < cameraSamples.length; ++k) {
       
      var pos = cameraSamples[k];
      
      // create auxiliary rotation for the new camera position
      var auxRotation = mat4.create();
      mat4.rotateY(auxRotation, auxRotation, pos.theta);
      mat4.rotateZ(auxRotation, auxRotation, pos.phi);
      
      var auxI = viewer.computeEntropy(auxRotation);
      if (auxI > maxI) {
        rotation = auxRotation;
        maxI = auxI;
      }
    }
    
//  uncomment this to see the sampling positions
//  var u = Math.cos(pos.phi);
//  var st = Math.sqrt(1 - u * u);
//  var x = st * Math.cos(pos.theta); 
//  var y = st * Math.sin(pos.theta); 
//  var center = viewer._cam.center();
//  var zoom = viewer._cam.zoom();
//  viewer.label(x, 'X', [zoom*x+center[0],zoom*y+center[1],zoom*u+center[2]]);
  
  } else if (mode === 'pca') {
    
    rotation = computePCA();
    
  }
  
  viewer.setRotation(rotation, 200);
    
  };
function computePCA() {
  var X = [];

  viewer.forEach(function(obj) {
    obj.structure().eachResidue(function(residue) {
      var centralAtom = residue.centralAtom();
      if (centralAtom === null) {
        return;
      } 
      var pos = centralAtom.pos();
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