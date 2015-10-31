import json

try:
    from urllib.request import urlopen
    PY3 = True
except ImportError:
    from urllib import urlopen
    PY3 = False


class Mol:
    """
    Class to hold a molecular structure in Python, essentially something that
    can be converted to a PDB data string.
    """
    def __init__(self, data):
        self._data = data

    def to_js(self):
        return 'pv.io.pdb(%s)' % json.dumps(self._data)

    @staticmethod
    def from_url(url):
        response = urlopen(url)
        if not PY3:
            return Mol(response.read())
        else:
            return Mol(response.read().decode())

    @staticmethod
    def from_pdb_id(pdb_id):
        base_url = 'http://www.rcsb.org/pdb/download/downloadFile.do' +\
                   '?fileFormat=pdb&structureId='
        return Mol.from_url(base_url + pdb_id)

    @staticmethod
    def from_file(file_name):
        with open(file_name, 'r') as data:
            return Mol(data.read())


def from_url(url):
    return Mol.from_url(url)


def from_file(file_name):
    return Mol.from_file(file_name)


def from_pdb_id(pdb_id):
    return Mol.from_pdb_id(pdb_id)


__all__ = (
    Mol,
    from_file,
    from_pdb_id,
    from_url
)