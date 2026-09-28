# The Hayaoshie rulebook

These are the drawing rules of Hokusai's *Ryakuga Hayaoshie* (略画早指南), distilled from the
construction diagrams on every spread. Each rule names the engine operation that carries it
out, so a rule here always corresponds to code in `lib/hokusai.js`.

**Source and limits.** The rules come from reading the diagrams: which shapes Hokusai
lays out, and which of their lines survive into the finished drawing. His cursive kana
captions were not translated. Where a note quotes a character, it is one written large on the
page as part of the lesson. Page numbers are PDF pages of the University of Pennsylvania scan
(`assets/pages/page-NN.jpg`).

---

## Part I — The compass and the ruler (Volume 1, 1812)

### 1. 規矩 Build before you draw · `guides`
Lay the whole subject out first with two instruments: the compass, which gives circles and
arcs, and the ruler, which gives straight lines, squares, lozenges and triangles. Nothing is
drawn freehand until the construction is complete. *(pp. 5–29, every spread)*

### 2. 丸 Round masses are circles · `maru`, `daen`, `ko`
Every soft mass gets one circle, sized to the mass, largest first:
- **Bodies:** the ox is chest, belly and rump circles on a ruled wedge (p. 9). The packhorse is three circles in a row (p. 12). The toad is two large circles and a haunch circle (p. 17).
- **Faces:** a mask is a ring of circles. Features sit on the circle centres and where the circles meet (p. 26).
- **Repeated forms:** a mane, a cloud, grapes and water-weed are all clusters of equal circles (pp. 5, 8, 17).
- **Curves:** a horn or a tail is a span of a larger circle (p. 9).

### 3. 角 Hard forms are squares, lozenges and triangles · `kaku`, `hishi`, `sankaku`, `kata`
- **Clothing:** shoulders are a lozenge, the hakama is a fan swung from its top point, and a sedge hat is a tall triangle (p. 7).
- **Birds:** the rooster and hen are chains of tilted squares (p. 13), and a goose is a parallelogram ruled into a grid (p. 14).
- **Animals:** the boar is one tilted lozenge with snout, hump, rump and belly at its corners (p. 27).
- **Leaves and insects:** a maple leaf is a regular hexagon with its lobes at the corners (p. 27), and insects fit inside triangles (p. 11).

### 4. 輪郭 Ink only the outer edge of the union · `rinkaku`
Where construction shapes overlap, the contour is the boundary of their union. The inner arcs
are left as guidelines. This single rule turns a pile of circles into a cloud, a lion, a toad
or a lantern (two equal circles, p. 23). Close any gaps inside a cluster, or their edges ink
as holes.

### 5. なぞる Keep a few inner arcs · `nazoru` (`deg`, `t`, `inside`, `outside`)
A small number of guide lines survive inside the silhouette because they describe real form:
- the cleft where a horse's two rump circles cross (p. 9)
- the face box inside Daruma's hood (p. 6)
- a crane's toes, traced along two lozenge edges (p. 10)
- the edge of a fold

Trace just that span.

### 6. 消す Erase the construction · `render({ guideFade })`
The guides are drawn light and then removed. The finished drawing implies the circles only
through the certainty of its curves. *(every spread shows construction and finish side by side)*

### 7. 黒白 Decide the blacks during construction · `nuri`
Solid black is chosen while the guides are still on the page:
- a rooster's hackle is the black half of a square (p. 13)
- the kamishimo sleeves are the black circle behind the wings (p. 7)
- a drum-carrier's leggings are lozenges already filled in (p. 24)

A night sky is flat ink with the moon left as bare paper (p. 20). Mid-tones are one flat grey. There are no gradients.

### 8. 毛引き Texture with short strokes that follow the form · `kebiki`
Fur, straw coats and hair are rows of short tapered strokes laid inside the silhouette
(pp. 5, 9, 12, 26). A bristly contour is the same stroke broken along the edge (boar, p. 27).

### 9. 鱗 Scales and feathers in rows · `uroko`
Fish scales, feather rows and roof tiles are rows of small overlapping arcs that follow the
construction. On the sea bream they run along its crescent (p. 18), and on the goose along its grid (p. 14).

### 10. 点 Stipple for skin and speckle · `ten`
Dots scattered inside the form: warts on the toad (p. 17), spots on the octopus and blowfish
(pp. 6, 19), patterns sprinkled on cloth.

### 11. 渦 Curls are circles collapsed into spirals · `uzu`
Each circle of a mane, a cloud or an octopus arm becomes a tight spiral in the finished drawing (pp. 5, 6).

### 12. 松葉 Pine is circles of needle fans · `matsuba`
A pine is a zigzag ruled branch hung with equal circles. Each circle keeps its upper arc, and
its lower half turns into a fan of needles radiating from one point (p. 12; clumps on p. 22).

### 13. 放射 Radials for ribs and rays · `hosha`
Umbrella ribs, the ribs of a sedge hat, chrysanthemum crests: straight lines from one centre,
cut by two circles (pp. 7, 23, 26).

### 14. 雨 Weather is ruled lines across the panel · `ame`
Rain is a field of parallel ruled diagonals drawn over the whole panel, passing behind the
figures (pp. 7, 17, 26). Waves are rows of overlapping compass arcs. The distant rows are bare, and the near rows are filled with strokes that follow each arc (`nami`, p. 29).

## Part II — Characters become figures (Volume 2, 1814)

### 15. 文字絵 Write the character, then let it become the body · `moji`
Write a kana or a simple kanji with the brush and keep its strokes as the main lines of the
figure. Then add the head, hands and patterns.

| Character | Becomes | Page |
|---|---|---|
| 心 | a seated courtier | 36 |
| し | the opening of Daruma's hood | 36 |
| わ | Hotei's sack | 38 |
| み | a kneeling woman's robe | 40 |
| キ | a scarecrow | 40 |
| は, と | a court lady's robe | 42 |
| 山, 久, キ, 入, 回 | hill, pine trunk, needles, roof and hut | 43 |
| 人, く, ノ, し | Kannon | 48 |
| ひ, る, こ | an angler | 53 |
| 大, と, く | Daikoku's sack and body | 54 |
| the outer curve of 風 | a man bowed into the wind | 55 |
| ふ, じ | Mount Fuji | 56 |
| う, ら, め | a ghost | 57 |

Birds are へ marks (p. 54). Waves are rows of つ (p. 44). Pines can be numerals stacked into a tree: 三, 十, 二, 六 (p. 46).

### 16. 早引き One stroke, one motion · `fude`, `press`, `taper`
Every stroke is made in a single motion: press at the entry, swell through the middle, and lift into a
tapered release (払い). Hokusai shows the brush grips and the marks each one makes (pp. 58–59).

### 17. Hokusai's own letterforms
Hokusai's brush forms of the kana differ from typographic ones. The figures that depend on his
exact shape register it as a glyph with a page suffix (`み:40`, `心:36`, `し:35`, `わ:38`),
and the generic stroke font stays untouched.

## Part III — Composition (used by `Hokusai.inventScene`)

The book never teaches composition directly: each lesson is a single subject. It does show its
subjects in particular settings, and the engine only combines what those settings allow.
Every figure has a `habitat` (in `figures/scenes.js`), and each habitat maps to one setting in
`Hokusai.SETTINGS`:

| Setting | Weather and sky | Companions | From the book |
|---|---|---|---|
| 海 At sea | waves, plovers | other sea creatures | pp. 29, 44 |
| 池 Pond | ruled rain | toad, catfish | p. 17 |
| 沢 Marsh | water, moon or pine | cranes, geese | pp. 10, 14, 35 |
| 野 Open country | moon or birds | field animals, scarecrow | pp. 9, 27, 28, 40 |
| 道 Travellers | rain, or pine and birds, Fuji far off | other travellers | pp. 7, 12, 26, 40, 56 |
| 人 Gods and figures | plain ground | other figures | pp. 6, 10, 16, 21, 36 |
| 庭 Farmyard | birds | rooster with hen | p. 13 |
| 獅 Lion | its cloud | none | p. 5 |
| 夜 Night | moon | none | pp. 20, 57 |

The panel follows the book's page conventions:
- **Subject:** one dominant subject off-centre, standing on the lower edge.
- **Companion:** a smaller one opposite it.
- **Weather:** ruled across the whole panel and masked behind the figures.
- **Frame:** a ruled border around the panel.

Every composed picture carries a `caption` that lists each choice and the page it comes from. The Compose tab shows it.

One exception: snow (`yuki`) is an engine convention. The book has no snow lesson.

## What is codified, and what is not

- **Codified:** the construction method (rules 1–6) and the tone and texture vocabulary (7–14). The character-to-figure method (15–17) is codified too. 50 figures are transcribed as plain data from 33 of the book's roughly 50 lesson spreads.
- **Not codified:**
  - Hokusai's judgement of *which* construction fits a new subject. A new figure still needs a person, or a program, to choose its circles.
  - The expressive irregularity of his line, approximated here by seeded tremor and pressure.
  - The cursive captions.
- **Lessons described but not yet transcribed** are listed in `figures/*.notes.md`, one bullet per spread. Good next candidates: the iris (p. 27), the courtier's lattice (p. 25), the waves and plover (p. 29), the dragons (p. 35) and the elephant (p. 41).
