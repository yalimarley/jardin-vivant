# Raccordement au catalogue — 25 novembre 2026

Base : `8190bcfeff579efe0081a7ea9eebd7b843710d1b` (v145).

Les 18 liens absents et 6 liens vers des fiches désactivées sont remplacés par des cibles actives, non rejetées, vérifiées dans le catalogue JF Lab le 25 novembre. Les 700 cartes conservent leurs identifiants, leurs noms usuels et leurs paramètres de jeu ; 696 participent aux tirages. Elles correspondent à 690 UUID catalogue distincts.

Choix explicites de Yali : Hémérocalle → Hemerocallis fulva, Chêne → Quercus robur, Origan → Origanum vulgare. Les fiches provisoires ne sont pas utilisées pour ces cartes et ne sont pas supprimées du catalogue. Le nom latin de la carte Hélianthi nº 542 devient Helianthus strumosus, conformément à sa fiche cible existante. Bardane et Chicorée sont déjà harmonisées dans le catalogue (Arctium lappa et Cichorium intybus) ; aucune écriture en base n'a été nécessaire lors de cette reprise.

24 champs `cat` et 4 champs `latin` modifiés dans `data/plants2.json`. Dans les 1 635 entrées de l'herbier : 5 champs `c` et 6 champs `l` harmonisés. Les trois fichiers HTML sont reconstruits par `python3 src/build.py` et identiques octet pour octet. Aucun code du moteur, de l'interface ou de connexion n'est modifié.

## Contrôles avant publication

- Comparaison champ par champ avec la base : aucun changement des identifiants, ordre des cartes, paramètres de jeu ou nombre d'entrées.
- 700/700 liens contrôlés contre le catalogue actif et non rejeté.
- `tests/test_catalog_links.cjs` avec jsdom 26.1.0 : chargement du HTML assemblé, sauvegarde créée par le build précédent puis relue par le nouveau ; jour, inventaire et grille plantée identiques. Vérification des 24 liens réellement rendus et recherche des 4 noms botaniques dans l'herbier. Réussi.
- `tests/test_retired.js` exécuté dans un dossier temporaire contenant `src/engine.js` et `data/plants2.json`, pour respecter ses chemins relatifs historiques : 1 475 boosters, aucune carte retirée tirée ; ancienne sauvegarde avec cartes retirées toujours utilisable. Réussi.

Commande du test de régression (jsdom installé séparément) :

```sh
NODE_PATH=/tmp/jflab-link-tests/node_modules node tests/test_catalog_links.cjs /tmp/jflab-before.html
```

Le test DOM n'est pas un test de rendu WebGL. Le contrôle du site réellement publié et son résultat sont consignés dans la mission 05 de Notion.

## Retour arrière et limites

Revenir uniquement sur le commit de ce correctif puis republier les trois HTML ; ne pas supprimer de fiches catalogue ni réécrire les sauvegardes. La PR nº 1 des 30 noms reste séparée. Le reste de la revue des discordances botaniques n'est pas déclaré terminé par ce lot. Un lien catalogue valide ne vaut pas validation des données horticoles ou alimentaires.
