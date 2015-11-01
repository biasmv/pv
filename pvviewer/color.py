"""
Contains the coloring operations
"""

from .command import Command


def _color_command(name, *args, **kwargs):
    return Command('pv.color', name, args, kwargs)


def _gradient(name):
    return Command('pv.color', 'gradient', [name], {})


def uniform(color='red'):
    return _color_command('uniform', color)


def by_element():
    return _color_command('byElement')


def by_ss():
    return _color_command('bySS')


def by_chain(gradient='rainbow'):
    return _color_command('byChain', _gradient(gradient))


def ss_succession(gradient='rainbow', coil_color='lightgrey'):
    return _color_command('ssSuccession', _gradient(gradient), coil_color)


def by_atom_prop(prop, gradient='rainbow', min_max=None):
    return _color_command('byAtomProp', prop, _gradient(gradient), min_max)


def by_residue_prop(prop, gradient='rainbow', min_max=None):
    return _color_command('byResidueProp', prop, _gradient(gradient), min_max)





