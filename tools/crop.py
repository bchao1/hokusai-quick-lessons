#!/usr/bin/env python3
"""Crop a region of a book page at 200 dpi with a 10x10 red grid, for reading
construction coordinates.
  python3 tools/crop.py PAGE x0 y0 x1 y1 OUT.jpg
x0..y1 are fractions (0..1) of the page spread image. Page = PDF page number."""
import os, subprocess, sys
from PIL import Image, ImageDraw
page, x0, y0, x1, y1, out = int(sys.argv[1]), *map(float, sys.argv[2:6]), sys.argv[6]
here = os.path.dirname(os.path.abspath(__file__))
pdf = os.path.join(here, '..', 'ryakuga-hayaoshie.pdf')
cache = os.path.join(os.environ.get('TMPDIR', '/tmp'), 'hokusai-pages')
os.makedirs(cache, exist_ok=True)
src = os.path.join(cache, 'p%02d.jpg' % page)
if not os.path.exists(src):
    subprocess.run(['pdftoppm', '-r', '200', '-jpeg', '-singlefile', '-f', str(page), '-l', str(page), pdf, src[:-4]], check=True)
im = Image.open(src); W, H = im.size
c = im.crop((int(x0 * W), int(y0 * H), int(x1 * W), int(y1 * H))).convert('RGB')
d = ImageDraw.Draw(c); w, h = c.size
for i in range(1, 10):
    d.line([(i * w / 10, 0), (i * w / 10, h)], fill=(255, 0, 0), width=1)
    d.line([(0, i * h / 10), (w, i * h / 10)], fill=(255, 0, 0), width=1)
c.save(out); print(out, c.size)
