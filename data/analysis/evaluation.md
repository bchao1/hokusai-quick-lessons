# Evaluation: generated vs Hokusai

Produced by `extract/evaluate.py`. Each generated drawing is compared with Hokusai's traced finished drawing of the same figure, starting only from his construction.

## Figures whose construction registered well

| variant | n | outline F | texture error | all-ink F | contour count × / length err | hair count × / length err | tick count × / length err |
|---|---|---|---|---|---|---|---|
| Construction inked evenly (no model) | 29 | **0.54** | **2.14** | 0.64 | 1.33 / 0.31 | 10.31 / 0.47 | 4.67 / 0.19 |
| Statistical model, leave-one-out | 29 | **0.31** | **1.06** | 0.52 | 1.32 / 0.48 | 3.36 / 0.35 | 1.68 / 0.13 |
| Statistical model, own style | 29 | **0.39** | **0.80** | 0.59 | 1.42 / 0.45 | 2.06 / 0.22 | 1.72 / 0.11 |
| Stroke analogy, leave-one-out (other figures' strokes) | 29 | **0.26** | **0.92** | 0.48 | 1.46 / 0.38 | 2.36 / 0.21 | 1.52 / 0.14 |
| Hokusai's trace re-inked (ceiling) | 29 | **1.00** | **0.20** | 1.00 | 1.14 / 0.14 | 1.10 / 0.09 | 1.12 / 0.06 |

## All figures

| variant | n | outline F | texture error | all-ink F | contour count × / length err | hair count × / length err | tick count × / length err |
|---|---|---|---|---|---|---|---|
| Construction inked evenly (no model) | 48 | **0.43** | **2.17** | 0.51 | 1.52 / 0.33 | 10.42 / 0.45 | 5.28 / 0.20 |
| Statistical model, leave-one-out | 48 | **0.24** | **1.39** | 0.41 | 1.44 / 0.52 | 4.55 / 0.36 | 2.00 / 0.12 |
| Statistical model, own style | 48 | **0.30** | **1.04** | 0.46 | 1.60 / 0.48 | 2.70 / 0.26 | 2.20 / 0.11 |
| Stroke analogy, leave-one-out (other figures' strokes) | 48 | **0.21** | **1.13** | 0.40 | 1.70 / 0.40 | 4.19 / 0.23 | 2.10 / 0.13 |
| Hokusai's trace re-inked (ceiling) | 48 | **1.00** | **0.17** | 1.00 | 1.14 / 0.15 | 1.09 / 0.07 | 1.10 / 0.06 |

*outline F*: ink match of the outline strokes only (contour, compass, whorl, ruled), within 2 line widths; placement matters here. *texture error*: for hair, ticks and dots, |log count ratio| + length-distribution error, median over figures (0 = same statistics); placement is not scored, because a mark in a different pixel can be equally right.

*count ×*: median factor between generated and traced stroke counts (1 = same number). *length err*: median Wasserstein distance of stroke lengths ÷ traced median length (0 = same distribution).

## Per figure (outline F)

| figure | registered | base | stat loo | stat own | analogy loo | ceiling |
|---|---|---|---|---|---|---|
| asagao | yes | 0.75 | 0.53 | 0.71 | 0.28 | 1.00 |
| chochin-futamaru | yes | 0.47 | 0.32 | 0.32 | 0.20 | 1.00 |
| daikoku-daitoku | poor | 0.22 | 0.08 | 0.05 | 0.06 | 1.00 |
| daruma | yes | 0.51 | 0.16 | 0.22 | 0.25 | 1.00 |
| daruma-shi | poor | 0.25 | 0.13 | 0.12 | 0.13 | 1.00 |
| fugu-maru | yes | 0.42 | 0.18 | 0.14 | 0.14 | 1.00 |
| fuji-moji | poor | 0.19 | 0.05 | 0.05 | 0.00 | 1.00 |
| fukurokuju | yes | 0.51 | 0.33 | 0.46 | 0.31 | 1.00 |
| gama | yes | 0.58 | 0.26 | 0.39 | 0.17 | 1.00 |
| gan-masu | poor | 0.23 | 0.21 | 0.19 | 0.12 | 1.00 |
| hotei | yes | 0.75 | 0.51 | 0.68 | 0.44 | 1.00 |
| hotei-wa | poor | 0.16 | 0.06 | 0.06 | 0.10 | 1.00 |
| inoshishi | yes | 0.35 | 0.21 | 0.16 | 0.18 | 1.00 |
| kamishimo | yes | 0.37 | 0.19 | 0.29 | 0.19 | 1.00 |
| kannon-moji | yes | 0.53 | 0.05 | 0.08 | 0.09 | 1.00 |
| karakasa | poor | 0.46 | 0.27 | 0.41 | 0.24 | 1.00 |
| kaze-hito | poor | 0.10 | 0.04 | 0.04 | 0.04 | 1.00 |
| komori-tsuki | poor | 0.12 | 0.08 | 0.02 | 0.07 | 1.00 |
| kuge-kokoro | poor | 0.25 | 0.16 | 0.10 | 0.14 | 1.00 |
| kuge-ushiro | yes | 0.55 | 0.43 | 0.50 | 0.37 | 1.00 |
| kumo-shishi | yes | 0.46 | 0.21 | 0.28 | 0.47 | 1.00 |
| matsu-eda | yes | 0.51 | 0.36 | 0.45 | 0.23 | 1.00 |
| mendori | yes | 0.50 | 0.29 | 0.33 | 0.12 | 1.00 |
| minokasa-ame | poor | 0.41 | 0.13 | 0.15 | 0.18 | 1.00 |
| momiji-rokkaku | yes | 0.85 | 0.39 | 0.65 | 0.31 | 1.00 |
| namazu-mo | yes | 0.40 | 0.25 | 0.25 | 0.10 | 1.00 |
| nidauma | yes | 0.45 | 0.35 | 0.43 | 0.22 | 1.00 |
| nyobo-ha-to | poor | 0.33 | 0.15 | 0.17 | 0.11 | 1.00 |
| okame-men | yes | 0.62 | 0.34 | 0.30 | 0.35 | 1.00 |
| ondori | yes | 0.36 | 0.19 | 0.22 | 0.09 | 1.00 |
| oni-men | yes | 0.64 | 0.43 | 0.47 | 0.35 | 1.00 |
| onna-kasa-hishi | yes | 0.52 | 0.23 | 0.21 | 0.37 | 1.00 |
| onna-mi | poor | 0.37 | 0.20 | 0.20 | 0.26 | 1.00 |
| saru-kanban | yes | 0.52 | 0.30 | 0.49 | 0.34 | 1.00 |
| shika-momiji | yes | 0.35 | 0.22 | 0.26 | 0.20 | 1.00 |
| shishi | yes | 0.56 | 0.27 | 0.48 | 0.26 | 1.00 |
| shishimai-maru | yes | 0.52 | 0.36 | 0.41 | 0.20 | 1.00 |
| suzume-hishi | yes | 0.44 | 0.33 | 0.49 | 0.28 | 1.00 |
| suzume-yoko | yes | 0.51 | 0.46 | 0.45 | 0.35 | 1.00 |
| tai-mikazuki | poor | 0.41 | 0.25 | 0.33 | 0.10 | 1.00 |
| tako | yes | 0.74 | 0.42 | 0.68 | 0.43 | 1.00 |
| tako-maru | yes | 0.82 | 0.36 | 0.54 | 0.31 | 1.00 |
| tsuribito-hiruko | poor | 0.19 | 0.06 | 0.09 | 0.10 | 1.00 |
| tsuru | poor | 0.25 | 0.12 | 0.12 | 0.13 | 1.00 |
| uoya-mi | poor | 0.31 | 0.21 | 0.22 | 0.10 | 1.00 |
| ushi | poor | 0.30 | 0.19 | 0.28 | 0.13 | 1.00 |
| yamazato-yama | poor | 0.25 | 0.12 | 0.11 | 0.11 | 1.00 |
| yurei-urame | poor | 0.29 | 0.15 | 0.21 | 0.25 | 1.00 |
