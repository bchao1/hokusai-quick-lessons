"""Scan → ink mask.

The spreads are photographs of yellowed paper with uneven light, so a single
global threshold fails. We divide out a large-scale estimate of the paper
(background normalisation), threshold the normalised image, and clean specks.
"""
import os
import subprocess

import cv2
import numpy as np

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
PDF = os.path.join(ROOT, 'ryakuga-hayaoshie.pdf')
CACHE = os.path.join(ROOT, '.cache', 'pages')


def page_image(page, dpi=300):
    """Grayscale uint8 image of one PDF page (cached)."""
    os.makedirs(CACHE, exist_ok=True)
    path = os.path.join(CACHE, 'p%02d-%d.png' % (page, dpi))
    if not os.path.exists(path):
        subprocess.run(['pdftoppm', '-r', str(dpi), '-png', '-gray', '-singlefile',
                        '-f', str(page), '-l', str(page), PDF, path[:-4]], check=True)
    return cv2.imread(path, cv2.IMREAD_GRAYSCALE)


def crop(img, box):
    """box = [x0, y0, x1, y1] as fractions of the image."""
    h, w = img.shape[:2]
    x0, y0, x1, y1 = int(box[0] * w), int(box[1] * h), int(box[2] * w), int(box[3] * h)
    return img[y0:y1, x0:x1], (x0, y0)


def ink_mask(gray, thresh=0.70, min_area=10, bg_kernel=61):
    """Return (mask uint8 {0,1}, darkness float 0..1).

    darkness = 1 - gray / paper, so 0 is bare paper and 1 is full ink.
    """
    g = gray.astype(np.float32)
    # paper estimate: close away the ink (ink is darker than paper), then blur
    k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (bg_kernel, bg_kernel))
    paper = cv2.morphologyEx(g, cv2.MORPH_CLOSE, k)
    paper = cv2.GaussianBlur(paper, (0, 0), bg_kernel / 3)
    norm = np.clip(g / np.maximum(paper, 1), 0, 1.2)
    darkness = np.clip(1 - norm, 0, 1)
    # hysteresis: strong ink seeds, grown into weaker connected ink
    strong = norm < thresh - 0.08
    weak = norm < thresh
    n, lab = cv2.connectedComponents(weak.astype(np.uint8), connectivity=8)
    keep = np.zeros(n, bool)
    keep[np.unique(lab[strong])] = True
    keep[0] = False
    mask = keep[lab]
    # clean: drop specks, close pinholes inside lines
    mask = cv2.morphologyEx(mask.astype(np.uint8), cv2.MORPH_CLOSE, np.ones((2, 2), np.uint8))
    n, lab, stats, _ = cv2.connectedComponentsWithStats(mask, connectivity=8)
    small = stats[:, cv2.CC_STAT_AREA] < min_area
    small[0] = True
    mask = (~small[lab]).astype(np.uint8)
    return mask, darkness
