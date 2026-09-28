#!/usr/bin/env python3
"""Save a crop of Hokusai's finished drawing as the reference for a figure.
  python3 tools/ref.py FIGURE_ID PAGE x0 y0 x1 y1
x0..y1 are fractions of the spread (PDF page). Writes assets/refs/FIGURE_ID.jpg
at 300 dpi (max 1400 px). In the figure, set ref: { page, box: [x0, y0, x1, y1] }
and make `size` the same aspect as the box so the overlay lines up."""
import os, subprocess, sys
from PIL import Image
fid, page = sys.argv[1], int(sys.argv[2]); box = list(map(float, sys.argv[3:7]))
here = os.path.dirname(os.path.abspath(__file__)); root = os.path.join(here, '..')
cache = os.path.join(os.environ.get('TMPDIR', '/tmp'), 'hokusai-pages-300'); os.makedirs(cache, exist_ok=True)
src = os.path.join(cache, 'p%02d.jpg' % page)
if not os.path.exists(src):
    subprocess.run(['pdftoppm', '-r', '300', '-jpeg', '-singlefile', '-f', str(page), '-l', str(page), os.path.join(root, 'ryakuga-hayaoshie.pdf'), src[:-4]], check=True)
im = Image.open(src); W, H = im.size
c = im.crop((int(box[0] * W), int(box[1] * H), int(box[2] * W), int(box[3] * H))).convert('RGB')
c.thumbnail((1400, 1400))
out = os.path.join(root, 'assets', 'refs', fid + '.jpg'); c.save(out, quality=85)
print(out, c.size, 'aspect %.3f' % (c.size[0] / c.size[1]))
