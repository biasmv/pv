"""
Defines the main protein viewer interface to be used with ipython/jupyter
notebooks.
"""

import uuid
from .command import Command

_VIEWER_SCAFFOLD_BEGIN = """
<div id="%(id)s" style="width: %(width)dpx; height: %(height)dpx"><div>
<script>
    require.config({
        paths: {
            pv: '//raw.githubusercontent.com/biasmv/pv/master/bio-pv.min'
        }
    });
    require(["pv"], function (pv) {
        console.log('initialized')
        viewer = pv.Viewer(document.getElementById('%(id)s'),
                           {quality : 'medium', width: 'auto',
                            height : 'auto', antialias : true,
                            background : '#eee',
                            outline : true, style : '%(style)s' });
        viewer.fitParent();
"""

_VIEWER_SCAFFOLD_END = """
     });
</script>
"""


class Rendered:
    def __init__(self, data):
        self._data =data

    def _repr_html_(self):
        return self._data


class Viewer:
    """
    This class implements the main protein viewer interface and lets you add
    new structures to be displayed as well as configure their appearance. The
    interface is closely based on the JS pv interface with a few adjustments
    to make it more pythonic.
    """

    def __init__(self):
        self._style = 'phong'
        self._width = 500
        self._height = 500
        self._commands = []

    def show(self):
        replacements = {
            'id': str(uuid.uuid4()),
            'width': self._width,
            'height': self._height,
            'style': self._style
        }
        begin = _VIEWER_SCAFFOLD_BEGIN % replacements
        commands_text = '\n'.join([cmd.to_js() for cmd in self._commands])
        complete_text = '\n'.join((begin, commands_text, _VIEWER_SCAFFOLD_END))
        return Rendered(complete_text)

    def _add_viewer_command(self, command, *args, **kwargs):
        self._commands.append(Command('viewer', command, args, kwargs))

    def cartoon(self, name, structure, **kwargs):
        self._add_viewer_command('cartoon', name, structure, **kwargs)

    def tube(self, name, structure, **kwargs):
        self._add_viewer_command('tube', name, structure, **kwargs)

    def balls_and_sticks(self, name, structure, **kwargs):
        self._add_viewer_command('ballsAndSticks', name, structure, **kwargs)

    def lines(self, name, structure, **kwargs):
        self._add_viewer_command('lines', name, structure, **kwargs)

    def spheres(self, name, structure, **kwargs):
        self._add_viewer_command('spheres', name, structure, **kwargs)

    def line_trace(self, name, structure, **kwargs):
        self._add_viewer_command('lineTrace', name, structure, **kwargs)

    def sline(self, name, structure, **kwargs):
        self._add_viewer_command('sline', name, structure, **kwargs)

    def trace(self, name, structure, **kwargs):
        self._add_viewer_command('trace', name, structure, **kwargs)

    def auto_zoom(self):
        self._add_viewer_command('autoZoom')

    def _repr_html_(self):
        return self.show()._repr_html_()

__all__ = (
    Viewer,
)