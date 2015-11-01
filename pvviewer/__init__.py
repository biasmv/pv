try:
    from urllib.request import urlopen
    PY3 = True
except ImportError:
    from urllib import urlopen
    PY3 = False

import uuid

from .viewer import Viewer
from . import color
from . import mol


base_url = ('http://www.rcsb.org/pdb/download/downloadFile.do'
            '?fileFormat=pdb&structureId=')


class PDBViewer(object):
    def __init__(self, pdb_id):
        response = urlopen(base_url + pdb_id)
        if not PY3:
            self.pdb = response.read()
        else:
            self.pdb = response.read().decode()

    def _repr_html_(self):
        div_id = str(uuid.uuid4())
        return """
        <div id="%s" style="width: 500px; height: 500px"><div>
        <script>
        require.config({paths: {"pv": "//biasmv.github.io/pv/js/pv.min"}});
        require(["pv"], function (pv) {
            pdb = "%s";
            structure = pv.io.pdb(pdb);
            viewer = pv.Viewer(document.getElementById('%s'),
                               {quality : 'medium', width: 'auto',
                                height : 'auto', antialias : true,
                                outline : true});
            viewer.fitParent();
            viewer.cartoon('protein', structure);
            viewer.centerOn(structure);
        });
        </script>
        """ % (div_id, self.pdb.replace("\n", "\\n"), div_id)
