# The learned model

extract/model.py over 48 figures (29 registered well)

## Ink from construction (pooled over well-registered figures)

Along the outer edge of the construction, the finished drawing puts:

- **line**: 46% of the edge (median run 13.5 line widths)
- **fur**: 19% of the edge (median run 10.2 line widths)
- **fill**: 8% of the edge (median run 7.5 line widths)
- **none**: 27% of the edge (median run 11.5 line widths)

The finished line sits **-0.18** line widths outside the construction edge on average (std 0.61, correlation length 2.5 line widths).
Inner construction lines surviving as ink: **239 of 613** (39%).

## Texture (pooled)

| mark | density by depth (per line width², bins [-4, -1, 1, 3, 6, 10, 16, 999]) | median length | coherence |
|---|---|---|---|
| hair | [0.0058, 0.0078, 0.01334, 0.01945, 0.01238, 0.01209, 0.0] | 6.9 | 0.28 |
| tick | [0.00493, 0.00907, 0.00974, 0.00909, 0.01048, 0.00896, 0.0] | 3.4 | 0.17 |
| dot | [0.00035, 0.0006, 0.00064, 0.0, 0.00076, 0.00113, 0.00137] | 1.5 | 0.44 |

## Per figure

| figure | registered | line / fur / fill / none on the edge | offset std | inner kept | hair per 100 lw² at depth 1–3 |
|---|---|---|---|---|---|
| asagao | yes | 61 / 3 / 0 / 36 % | 0.50 | 10/18 | 0.0 |
| chochin-futamaru | yes | 51 / 20 / 17 / 12 % | 0.72 | 1/3 | 2.7 |
| daikoku-daitoku | poor | 24 / 6 / 27 / 43 % | 0.71 | 13/28 | 0.4 |
| daruma | yes | 28 / 9 / 9 / 54 % | 0.61 | 4/15 | 0.5 |
| daruma-shi | poor | 20 / 12 / 10 / 59 % | 0.70 | 2/13 | 0.2 |
| fugu-maru | yes | 29 / 13 / 6 / 53 % | 0.61 | 4/5 | 0.4 |
| fuji-moji | poor | 52 / 48 / 0 / 0 % | 0.29 | 0/0 | 4.0 |
| fukurokuju | yes | 28 / 17 / 2 / 53 % | 0.66 | 24/35 | 2.6 |
| gama | yes | 73 / 9 / 5 / 13 % | 0.57 | 8/15 | 0.2 |
| gan-masu | poor | 20 / 36 / 11 / 34 % | 0.78 | 4/39 | 1.3 |
| hotei | yes | 68 / 1 / 10 / 21 % | 0.68 | 18/33 | 0.7 |
| hotei-wa | poor | 27 / 34 / 4 / 35 % | 0.70 | 0/1 | 1.2 |
| inoshishi | yes | 22 / 47 / 0 / 31 % | 0.84 | 1/1 | 1.0 |
| kamishimo | yes | 44 / 29 / 20 / 7 % | 0.60 | 1/29 | 1.8 |
| kannon-moji | yes | 70 / 0 / 0 / 30 % | 0.59 | 0/0 | 0.0 |
| karakasa | poor | 68 / 6 / 3 / 22 % | 0.78 | 24/27 | 0.1 |
| kaze-hito | poor | 50 / 16 / 15 / 19 % | 0.53 | 0/0 | 0.0 |
| komori-tsuki | poor | 15 / 51 / 8 / 26 % | 0.82 | 0/8 | 8.9 |
| kuge-kokoro | poor | 27 / 30 / 4 / 39 % | 1.03 | 10/22 | 1.0 |
| kuge-ushiro | yes | 34 / 8 / 16 / 42 % | 0.50 | 25/101 | 1.9 |
| kumo-shishi | yes | 54 / 34 / 3 / 8 % | 0.69 | 12/24 | 2.6 |
| matsu-eda | yes | 41 / 38 / 6 / 15 % | 0.64 | 2/20 | 2.3 |
| mendori | yes | 39 / 27 / 0 / 34 % | 0.64 | 0/9 | 3.0 |
| minokasa-ame | poor | 51 / 8 / 5 / 36 % | 0.68 | 11/20 | 0.9 |
| momiji-rokkaku | yes | 72 / 2 / 0 / 26 % | 0.46 | 13/13 | 0.0 |
| namazu-mo | yes | 27 / 26 / 37 / 11 % | 0.59 | 2/10 | 3.6 |
| nidauma | yes | 27 / 27 / 16 / 29 % | 0.73 | 34/119 | 0.6 |
| nyobo-ha-to | poor | 40 / 26 / 5 / 29 % | 0.73 | 5/20 | 2.8 |
| okame-men | yes | 43 / 14 / 4 / 38 % | 0.52 | 3/7 | 1.7 |
| ondori | yes | 22 / 34 / 16 / 28 % | 0.72 | 5/9 | 0.9 |
| oni-men | yes | 49 / 43 / 2 / 7 % | 0.65 | 13/24 | 2.3 |
| onna-kasa-hishi | yes | 40 / 25 / 6 / 28 % | 0.56 | 0/9 | 2.8 |
| onna-mi | poor | 40 / 38 / 4 / 18 % | 0.75 | 0/0 | 0.6 |
| saru-kanban | yes | 55 / 5 / 8 / 32 % | 0.49 | 7/37 | 1.3 |
| shika-momiji | yes | 22 / 16 / 6 / 56 % | 0.58 | 4/9 | 0.7 |
| shishi | yes | 75 / 20 / 4 / 2 % | 0.65 | 19/20 | 2.6 |
| shishimai-maru | yes | 54 / 4 / 4 / 38 % | 0.55 | 6/8 | 0.2 |
| suzume-hishi | yes | 34 / 41 / 21 / 4 % | 0.54 | 0/8 | 1.5 |
| suzume-yoko | yes | 56 / 21 / 11 / 12 % | 0.67 | 1/3 | 1.3 |
| tai-mikazuki | poor | 45 / 29 / 1 / 24 % | 0.80 | 61/131 | 1.4 |
| tako | yes | 48 / 9 / 0 / 43 % | 0.62 | 21/27 | 0.4 |
| tako-maru | yes | 82 / 1 / 0 / 17 % | 0.37 | 1/2 | 0.3 |
| tsuribito-hiruko | poor | 58 / 21 / 8 / 12 % | 0.63 | 1/1 | 1.7 |
| tsuru | poor | 19 / 38 / 2 / 41 % | 0.69 | 12/18 | 1.1 |
| uoya-mi | poor | 62 / 15 / 11 / 12 % | 0.72 | 0/0 | 1.3 |
| ushi | poor | 80 / 10 / 10 / 0 % | 0.49 | 44/54 | 3.3 |
| yamazato-yama | poor | 18 / 34 / 18 / 30 % | 0.74 | 1/6 | 1.2 |
| yurei-urame | poor | 50 / 10 / 32 / 8 % | 0.73 | 17/23 | 0.8 |
