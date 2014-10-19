import collections
import ctypes
from struct import unpack_from, pack_into, Struct

DataLocation = collections.namedtuple('DataLocation', 'offset size')

HEADER = Struct('!4B')
TOC_ENTRY = Struct('!BII')

class CompressedStructureFile:

    def __init__(self, file_like, mode='r'):
        self._file_like = file_like
        self._mode = mode
        self._version = self._read_version()
        self._toc = self._read_table_of_contents()

    @property
    def version(self):
        """
        Returns the version of the compressed structure file
        """
        return self._version
    def _read_table_of_contents(self):
        num_chains, = unpack_from('!H', self._file_like.read(2))
        # should really be collections.OrderedDict(), but it's not available
        # in python 2.6, so for now just use a normal dictionary which ignores
        # the order in which the keys were inserted....
        toc = dict()
                   
        for i in range(num_chains):
            data = TOC_ENTRY.unpack_from(self._file_like.read(TOC_ENTRY.size))
            chain_name, offset, size = data
            toc[chr(chain_name)] = DataLocation(offset, size)
        return toc

    def _read_version(self):
        c, s, f, version = HEADER.unpack(self._file_like.read(HEADER.size))
        magic_word = '%s%s%s' % (chr(c), chr(s), chr(f))
        if magic_word == 'CSF':
            return version

        raise IOError('Missing magic word in CSF file')

    @staticmethod
    def open(path):
        return CompressedStructureFile(open(path, 'rb'), 'r')

    def write_chain_subset(self, file_like, chain_names):
        """
        Writes the selection of chains into the file_like object, creating a new 
        table of contents. The order of chains is as specified in the arguments.
        """

        # chec that all chains exist, raise IOError otherwise
        for chain_name in chain_names:
            if chain_name not in self._toc:
                raise IOError('chain "%s" does not exist' % chain_name)
        # struct.pack_into is rather limited. We can't directly write to the file-
        # like object. Instead we have to first create temporary buffer for the 
        # TOC. 
        # Since the chain data itself is copied 1:1, we can directly write it to
        # the file-like object.
        header_and_toc_size = HEADER.size + 2 + len(chain_names) * TOC_ENTRY.size
        current_offset = 0
        chain_offset = header_and_toc_size
        the_buffer = bytearray(header_and_toc_size)
        HEADER.pack_into(the_buffer, current_offset, ord('C'), ord('S'), ord('F'), 
                         self._version)
        current_offset += HEADER.size
        pack_into('!H', the_buffer, current_offset, len(chain_names))
        current_offset += 2
        for chain_name in chain_names:
            entry = self._toc[chain_name]
            TOC_ENTRY.pack_into(the_buffer, current_offset, ord(chain_name), 
                                chain_offset, entry.size)
            current_offset += TOC_ENTRY.size
            chain_offset += entry.size
        assert current_offset == header_and_toc_size
        file_like.write(the_buffer)
        for chain_name in chain_names:
            entry = self._toc[chain_name]
            self._file_like.seek(entry.offset)
            file_like.write(self._file_like.read(entry.size))



