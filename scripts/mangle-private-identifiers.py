"""
Script to convert the private identifiers into something shorter. 

The PV source code uses '_' to mark functions and properties as private. Because 
some of these are attached to exported objects/classes, uglifyjs does not mangle 
them. Since these properties are not supposed to be accessed directly, we can
save a few kilobytes by renaming them to short character sequences.

The script is really simple: It splits the entire file and at every non-
alphanumeric character. It does not even try to do a proper tokenization of the 
input script, it's just a way to get identifiers as separate tokens. Then it 
extracts all identifiers starting with an underscore and counts the number of 
occurrences. All occurrences are then sorted in descending order by how often
they appear and replaced by the shortest possible identifier. 

On my initial tests, this reduces the minified file size to 90% of the original. 
While not great it certainly helps to get things smaller a bit. It does not 
reduce the size of the gzip output in a significant way.
"""
import re
import sys
import collections

if len(sys.argv) != 3:
  print >> sys.stderr, 'usage: mangle-private-identifiers.py <input> <output>'

contents = ''.join(open(sys.argv[1]).readlines())


token_occurences = collections.defaultdict(int)
tokens = re.split('([^A-Za-z0-9_])', contents)
for token in tokens:
  token_occurences[token] += 1

allowed_chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVW0123456789'
first_name = '_a'
index = 0
def next_available_name(index):
  chars = []
  remaining = index
  while remaining > 0:
    chars.append(allowed_chars[remaining % len(allowed_chars)])
    remaining /= len(allowed_chars)
  return '_%s' % ''.join(reversed(chars))

private_tokens = [(v,k) for k,v in token_occurences.iteritems() if k.startswith('_')]

sorted_by_occurence = sorted(private_tokens, reverse=True)
replacements = {}
index = 0
for occurences, token in sorted_by_occurence:
  replacements[token] = next_available_name(index)
  index += 1

replaced = [replacements.get(t, t) for t in tokens]
open(sys.argv[2], 'w').write(''.join(replaced))




