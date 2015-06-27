from docutils import nodes
from docutils.parsers.rst import Directive
from sphinx.util.compat import make_admonition
from sphinx.util.nodes import set_source_info
from sphinx.locale import _

class PVSample(nodes.Admonition, nodes.Element):
    pass

RAW_CODE_PRELUDE='''
<script type='text/javascript' src='/bio-pv.min.js'></script>

<style>
#viewer {
  border-width:1px;
  border-style:solid;
  border-color:#eee;
  padding : 0px;
  width : 300px;
  height : 300px;
  margin-left : auto; margin-right: auto;
}
#viewer-wrap {
  text-align:center;
  width: 100%;
}
</style>

<div id=viewer-wrap>
  <div id=viewer></div>
</div>
'''
class PVSampleDirective(Directive):

    # this enables content in the directive
    has_content = True

    def run(self):
        env = self.state.document.settings.env

        code = '\n'.join(self.content)

        literal = nodes.literal_block(code, code)
        literal['language' ] = 'html'

        raw_html_code = nodes.raw(code, RAW_CODE_PRELUDE + code, 
                                  format='html')
        set_source_info(self, literal)
        set_source_info(self, raw_html_code)
        return [raw_html_code, literal]

class PVSampleListDirective(Directive):

    def run(self):
        return [PVSampleList('')]

def visit_pv_sample(self, node):
    self.visit_admonition(node)

def depart_pv_sample(self, node):
    self.depart_admonition(node)

def setup(app):
    app.add_node(PVSample,
                 html=(visit_pv_sample, depart_pv_sample),
                 latex=(visit_pv_sample, depart_pv_sample),
                 text=(visit_pv_sample, depart_pv_sample))

    app.add_directive('pv-sample', PVSampleDirective)

    return {'version': '0.1'}   # identifies the version of our extension
