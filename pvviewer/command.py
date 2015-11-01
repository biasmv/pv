import json

# Python2/3 compatibility
try:
    string_base_type = basestring
except NameError:
    string_base_type = str


def encode(obj):
    """
    Dead-simple serialization of Python objects to JavaScript. The serialization
    format is not pure JSON, but instead is allowed to contain arbitrary JS
    expressions such as function calls. Basic data types (strings, numbers,
    bool, dict, list) are directly converted to their JS counterpart. Custom,
    user-defined objects must have a to_js method defined on them that converts
    the object to a string. Note that the object strings are not escaped, so
    the to_js methods are allowed to be arbitrary JS expressions themselves.
    """
    if hasattr(obj, 'to_js'):
        return obj.to_js()
    if isinstance(obj, bool):
        return obj and 'true' or 'false'
    if isinstance(obj, type(None)):
        return 'null'
    if isinstance(obj, string_base_type):
        # use json.dumps here to handle special characters etc.
        return json.dumps(obj)
    if isinstance(obj, list):
        return '[%s]' % ','.join(encode(sub) for sub in obj)
    if isinstance(obj, float) or isinstance(obj, int):
        # FIXME: Nan, Inf handling
        return str(obj)
    if isinstance(obj, dict):
        # use items here for Python3 compat, even tough it's not as efficient
        # as it can be. But then again, I'm not expecting huge dictionaries
        # here.
        contents = ['%s:%s' % (encode(k), encode(v)) for k,v in obj.items()]
        return '{%s}' % ', '.join(contents)


class Command:
    """
    Simple object for holding the receiver, method and arguments of a method
    call that can be translated to JS.
    """

    def __init__(self, receiver, command, args, kwargs, terminate=False):
        self._receiver = receiver
        self._command = command
        self._args = args
        self._kwargs = kwargs
        self._terminate = terminate

    def to_js(self):
        all_args = [', '.join(encode(arg) for arg in self._args)]
        if self._kwargs:
            all_args.append(encode(self._kwargs))

        args_string = ', '.join(all_args)
        t = self._terminate and ';' or ''
        if not self._receiver:
            call = self._command
        else:
            call = '%s.%s' % (self._receiver, self._command)
        return '%s(%s)%s' % (call, args_string, t)