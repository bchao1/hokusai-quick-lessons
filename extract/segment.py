"""Find the drawings on a page without looking at it.

page → paper area (the spread is photographed on a dark ground) → ink → remove the
ruled frame lines → group ink that lies close together → classify each group as a
drawing or a caption column (narrow, tall, made of small separate marks).

    .venv/bin/python -m extract.segment 5            # one page → data/regions/p05.json + .debug.png
    .venv/bin/python -m extract.segment --all
"""
import argparse
import json
import os

import cv2
import numpy as np

from . import ink as I

OUT = os.path.join(I.ROOT, 'data', 'regions')
CONTENT_PAGES = list(range(5, 30)) + list(range(34, 61))


def paper_mask(gray):
    """The bright page area of the photographed spread."""
    small = cv2.resize(gray, None, fx=0.125, fy=0.125, interpolation=cv2.INTER_AREA)
    small = cv2.GaussianBlur(small, (5, 5), 0)
    _, th = cv2.threshold(small, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    th = cv2.morphologyEx(th, cv2.MORPH_CLOSE, np.ones((15, 15), np.uint8))  # close over the ink
    n, lab, st, _ = cv2.connectedComponentsWithStats(th)
    if n < 2:
        return np.ones_like(gray, np.uint8)
    big = 1 + int(np.argmax(st[1:, cv2.CC_STAT_AREA]))
    pm = (lab == big).astype(np.uint8)
    pm = cv2.morphologyEx(pm, cv2.MORPH_CLOSE, np.ones((31, 31), np.uint8))
    pm = cv2.erode(pm, np.ones((9, 9), np.uint8))  # stay off the page edge and gutter shadow
    return cv2.resize(pm, (gray.shape[1], gray.shape[0]), interpolation=cv2.INTER_NEAREST)


def frame_lines(mask, frac=0.05):
    """Long straight horizontal / vertical ink: ruled borders and panel dividers."""
    H, W = mask.shape
    # only line-like ink can be a ruled line: remove solid masses (thicker than ~21 px) first
    thick = cv2.morphologyEx(mask, cv2.MORPH_OPEN, np.ones((21, 21), np.uint8))
    thick = cv2.dilate(thick, np.ones((7, 7), np.uint8))
    mask = mask & (1 - thick)
    h = cv2.morphologyEx(mask, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_RECT, (int(W * frac), 1)))
    v = cv2.morphologyEx(mask, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_RECT, (1, int(H * frac))))
    lines = cv2.dilate(h | v, np.ones((9, 9), np.uint8))
    return lines & mask


def caption_columns(ink, W, H):
    """Caption text is vertical columns of small separate marks. Stack the small marks
    into columns; a tall narrow column that doesn't overlap large drawn forms is text."""
    n, lab, st, _ = cv2.connectedComponentsWithStats(ink)
    side = np.maximum(st[:, cv2.CC_STAT_WIDTH], st[:, cv2.CC_STAT_HEIGHT])
    small = (side < W * 0.022) & (st[:, cv2.CC_STAT_AREA] > 8)
    small[0] = False
    big = (side >= W * 0.04)
    big[0] = False
    sm = small[lab].astype(np.uint8)
    bg = big[lab].astype(np.uint8)
    col = cv2.dilate(sm, cv2.getStructuringElement(cv2.MORPH_RECT, (int(W * 0.006) | 1, int(H * 0.035) | 1)))
    bgd = cv2.dilate(bg, np.ones((25, 25), np.uint8))
    k, cl, cst, _ = cv2.connectedComponentsWithStats(col)
    text = np.zeros_like(ink)
    for i in range(1, k):
        x, y, w, h, a = cst[i]
        if h > H * 0.08 and w < W * 0.05 and h > 2.5 * w:
            region = cl[y:y + h, x:x + w] == i
            if (bgd[y:y + h, x:x + w][region]).mean() < 0.15:
                text[y:y + h, x:x + w][region] = 1
    return text & sm


def segment(page, dpi=300, gap=None):
    gray = I.page_image(page, dpi)
    H, W = gray.shape
    pm = paper_mask(gray)
    mask, _ = I.ink_mask(gray)
    mask = mask & pm
    frames = frame_lines(mask)
    ink = mask & (1 - frames)
    text = caption_columns(ink, W, H)
    ink = ink & (1 - text)
    gap = gap or int(W * 0.007)  # ink closer than this belongs to the same group
    grp = cv2.dilate(ink, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (gap, gap)))
    n, lab, st, _ = cv2.connectedComponentsWithStats(grp)
    regions = []
    for i in range(1, n):
        x, y, w, h, a = st[i]
        if w * h < (W * H) * 0.002:
            continue
        sub = ink[y:y + h, x:x + w] & (lab[y:y + h, x:x + w] == i)
        k, _, sst, _ = cv2.connectedComponentsWithStats(sub)
        areas = sst[1:, cv2.CC_STAT_AREA] if k > 1 else np.array([0])
        density = float(sub.sum()) / max(1, w * h)
        # a caption column: narrow and tall, built of many small separate marks
        is_text = (w < W * 0.055 and h > 2.2 * w and np.median(areas) < (W * 0.012) ** 2 * 4) or (w < W * 0.035 and h > 1.5 * w)
        regions.append({
            'id': 'p%02d-%s%d' % (page, 't' if is_text else 'd', i),
            'page': page, 'kind': 'text' if is_text else 'drawing',
            'box': [round(x / W, 4), round(y / H, 4), round((x + w) / W, 4), round((y + h) / H, 4)],
            'px': [int(x), int(y), int(w), int(h)], 'density': round(density, 4), 'parts': int(k - 1),
        })
    # merge drawing boxes that overlap (one figure split by a gap in its lines)
    def overlap(a, b):
        ax, ay, aw, ah = a['px']; bx, by, bw, bh = b['px']
        ix = max(0, min(ax + aw, bx + bw) - max(ax, bx)); iy = max(0, min(ay + ah, by + bh) - max(ay, by))
        return ix * iy / max(1, min(aw * ah, bw * bh))
    merged = True
    while merged:
        merged = False
        dr = [r for r in regions if r['kind'] == 'drawing']
        for i in range(len(dr)):
            for j in range(i + 1, len(dr)):
                if overlap(dr[i], dr[j]) > 0.35:
                    a, b = dr[i], dr[j]
                    x0, y0 = min(a['px'][0], b['px'][0]), min(a['px'][1], b['px'][1])
                    x1, y1 = max(a['px'][0] + a['px'][2], b['px'][0] + b['px'][2]), max(a['px'][1] + a['px'][3], b['px'][1] + b['px'][3])
                    a['px'] = [x0, y0, x1 - x0, y1 - y0]
                    a['box'] = [round(x0 / W, 4), round(y0 / H, 4), round(x1 / W, 4), round(y1 / H, 4)]
                    a['parts'] += b['parts']
                    regions.remove(b); merged = True
                    break
            if merged:
                break
    # number drawings left→right, top→bottom for stable ids
    dr = sorted([r for r in regions if r['kind'] == 'drawing'], key=lambda r: (round(r['box'][1] * 4), r['box'][0]))
    for j, r in enumerate(dr):
        r['id'] = 'p%02d-d%d' % (page, j + 1)
    os.makedirs(OUT, exist_ok=True)
    json.dump({'page': page, 'size': [W, H], 'regions': regions}, open(os.path.join(OUT, 'p%02d.json' % page), 'w'), indent=1)
    dbg = cv2.cvtColor(gray, cv2.COLOR_GRAY2BGR)
    dbg[frames > 0] = (0, 140, 255)
    dbg[cv2.dilate(text, np.ones((5, 5), np.uint8)) > 0] = (220, 90, 90)
    for r in regions:
        x, y, w, h = r['px']
        col = (40, 160, 40) if r['kind'] == 'drawing' else (200, 80, 80)
        cv2.rectangle(dbg, (x, y), (x + w, y + h), col, 6)
        if r['kind'] == 'drawing':
            cv2.putText(dbg, r['id'][4:], (x + 8, y + 60), cv2.FONT_HERSHEY_SIMPLEX, 2.2, col, 6)
    cv2.imwrite(os.path.join(OUT, 'p%02d.debug.jpg' % page), cv2.resize(dbg, None, fx=0.3, fy=0.3, interpolation=cv2.INTER_AREA))
    nd = sum(r['kind'] == 'drawing' for r in regions)
    print('p.%-3d %2d drawings, %2d caption columns' % (page, nd, len(regions) - nd))
    return regions


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('pages', nargs='*', type=int)
    ap.add_argument('--all', action='store_true')
    a = ap.parse_args()
    for p in (CONTENT_PAGES if a.all else a.pages):
        segment(p)


if __name__ == '__main__':
    main()
