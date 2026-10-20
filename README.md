# Jardin Vivant

Jeu de forêt comestible réaliste : booster quotidien de 10 cartes, saisons réelles, tâches cliquables (~20 min/jour), apprendre les plantes et manger de sa forêt.

- `dist/jardin-vivant.html` : le jeu complet, un seul fichier, jouable en l'ouvrant dans un navigateur.
- `src/engine.js` : règles du jeu (pousse, saisons, boosters, parasites, miel, famille...).
- `src/ui.js` + `src/template.html` : interface isométrique SVG, boîte à outils (zoom, déplacer, tourner, supprimer).
- `src/build.py` : assemble le tout en `dist/jardin-vivant.html`.
- `data/plants2.json`, `data/herbier.json` : base de plantes (à terme alimentée par JF Lab).
- `tests/` : `node tests/test_engine.js`, `node tests/test_ui.js` (jsdom).

## Données et images
Les photos iNaturalist ont été retirées. Les images et données viendront de JF Lab (champs `photo`, `credit` dans `plants2.json`).

## À faire
Connexion JF Lab, score de guilde, vérification mobile.

(Les chemins dans `build.py` et les tests sont ceux de l'environnement de travail : à adapter si besoin.)
