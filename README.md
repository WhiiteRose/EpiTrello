# EpiTrello

> Une application Kanban simple et collaborative pour organiser vos projets, inspirée de Trello.

EpiTrello vous aide à **visualiser le travail**, **suivre l’avancement** et **collaborer** en équipe au quotidien. Créez des tableaux (boards), ajoutez des listes (colonnes) et déplacez des cartes (tâches) au fil de votre workflow.

---

## ✨ Aperçu du projet (non technique)

- **Tableaux** pour vos projets
- **Listes** (ex. À faire → En cours → Fait)
- **Cartes** avec titre, description, étiquettes, échéances et membres
- **Glisser‑déposer** pour réorganiser en un clic
- **Collaboration** : commentaires et notifications in‑app
- **Recherche et filtres** pour retrouver rapidement une tâche
- **Multilingue** : FR/EN

> Techniquement, le projet utilise React + TypeScript, Next.js (App Router), shadcn/ui et Supabase. Pas besoin d’entrer dans les détails pour utiliser l’application.

---

## 🖼️ Captures d’écran (à insérer plus tard)

> Ajoutez vos visuels dans `docs/images` puis remplacez les chemins ci‑dessous.

- **Vue Board (Kanban)**  
  ![Board](docs/images/board.png)

- **Carte ouverte (détails)**  
  ![Card Modal](docs/images/card-modal.png)

- **Recherche & Filtres**  
  ![Filters](docs/images/filters.png)

- **Vue Calendrier**  
  ![Calendar](docs/images/calendar.png)

---

## 🚀 Démarrer l’application

### Prérequis
- **Node.js 18+** (ou supérieur)
- Un gestionnaire de paquets (**pnpm**, **npm** ou **yarn**)
- Un compte **Supabase** (gratuit) pour obtenir une URL de projet et une clé publique (anon)

### 1) Cloner et installer
```bash
git clone https://github.com/votre-org/epitrello.git
cd epitrello
# avec pnpm (recommandé)
pnpm install
# ou npm
# npm install
```

### 2) Configurer les variables d’environnement
Créez un fichier **`.env.local`** à la racine du projet avec vos informations Supabase :
```bash
cp .env.example .env.local
```
Ouvrez `.env.local` et renseignez :
```env
NEXT_PUBLIC_SUPABASE_URL=Votre_URL_Supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=Votre_CLE_PUBLIQUE_anon
```

> Où trouver ces valeurs ?  
> Dans votre tableau de bord Supabase → **Project Settings → API**.

### 3) Lancer en mode développement
```bash
pnpm dev
# ou
# npm run dev
```
Puis ouvrez votre navigateur sur **http://localhost:3000**.

> **Astuce :** si vous ne voyez aucun tableau au premier lancement, créez‑en un via le bouton **“Nouveau board”**.

---

## 🧭 Structure (simplifiée)
```
epitrello/
├─ app/                # Pages et routes Next.js (App Router)
├─ components/         # Composants UI (shadcn/ui + composants projet)
├─ lib/                # Aides (ex. client Supabase)
├─ public/             # Icônes/manifest
├─ docs/images/        # Captures d’écran à insérer dans le README
└─ .env.local          # Variables d’environnement (non commité)
```

---

## ❓ FAQ rapide

**Q : Ai‑je besoin de connaissances techniques ?**  
R : Non pour utiliser l’app. Il suffit de lancer le projet et de disposer d’un compte Supabase (valeurs à copier/coller).

**Q : Comment ajouter des images au README ?**  
R : Placez vos fichiers dans `docs/images`, puis mettez à jour les chemins d’images dans la section *Captures d’écran*.

**Q : Puis‑je déployer en ligne ?**  
R : Oui. Le plus simple est **Vercel** (pour Next.js) + **Supabase**. Vous pourrez réutiliser les mêmes variables d’environnement.

---

## 🤝 Contribuer
Les contributions sont bienvenues ! Pour des suggestions, ouvrez une *Issue* ou une *Pull Request* sur le dépôt.

---

## 📄 Licence
À définir selon vos besoins (ex. MIT).

---

**Contact** : équipe EpiTrello – merci d’ouvrir une *Issue* pour toute question.
