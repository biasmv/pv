import json


def encode(obj):

    if hasattr(obj, 'to_js'):
        return obj.to_js()
    if isinstance(obj, bool):
        return obj and 'true' or 'false'
    if isinstance(obj, type(None)):
        return 'null'
    if isinstance(obj, basestring):
        # use json.dumps here to handle special characters etc.
        return json.dumps(obj)
    if isinstance(obj, list):
        return '[%s]' % ','.join(encode(sub) for sub in obj)
    if isinstance(obj, float) or isinstance(obj, int):
        # FIXME: Nan, Inf handling
        return str(obj)
    if isinstance(obj, dict):
        contents = ['%s:%s' % (encode(k), encode(v)) for k,v in obj]
        return '{%s}' % ', '.join(contents)


class Command:
    """
    Simple object for holding the receiver, method and arguments of a method
    call that can be translated to JS.
    """

    def __init__(self, receiver, command, args, kwargs):
        self._receiver = receiver
        self._command = command
        self._args = args
        self._kwargs = kwargs

    def to_js(self):
        all_args = [', '.join(encode(arg) for arg in self._args)]
        if self._kwargs:
            all_args.append(encode(self._kwargs))

        args_string = ', '.join(all_args)
        return '%s.%s(%s);' % (self._receiver, self._command, args_string)