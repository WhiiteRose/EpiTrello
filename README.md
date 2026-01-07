# EpiTrello

> A simple and collaborative Kanban application to organize your projects, inspired by Trello.

EpiTrello helps you **visualize work**, **track progress**, and **collaborate** with your team every day. Create boards, add lists (columns), and move cards (tasks) throughout your workflow.

---

## ✨ Project Overview

- **Boards** for your projects
- **Lists** (e.g., To do → In progress → Done)
- **Cards** with title, description, labels, due dates, and members
- **Drag & drop** to reorganize in one click
- **Collaboration**: comments and in-app notifications
- **Search and filters** to quickly find a task
- **Multilingual**: FR/EN

> Technically, the project uses React + TypeScript, Next.js (App Router), shadcn/ui, and Supabase. No need to dive into the details to use the app.

---

## 🖼️ Screenshots

![Landing Page](/images/landing-page.png)
![Dashboard](/images/dashboard.png)
![Board Kanban](/images/board-kanban.png)
![Create Task Dialog](/images/create-task-dialog.png)

---

## 🚀 Getting Started

### Requirements

- **Node.js 18+** (or newer)
- A package manager (**pnpm**, **npm**, or **yarn**)
- A **Supabase** account (free) to get a project URL and a public (anon) key

### 1) Clone and install

    git clone https://github.com/your-org/epitrello.git
    cd epitrello
    pnpm install
    # or
    # npm install

### 2) Configure environment variables

Create a **.env.local** file at the root of the project:

    cp .env.example .env.local

Open .env.local and fill in:

    NEXT_PUBLIC_SUPABASE_URL=Your_Supabase_URL
    NEXT_PUBLIC_SUPABASE_ANON_KEY=Your_Public_anon_key

> Where to find these values?  
> Supabase dashboard → **Project Settings → API**.

### 3) Run in development mode

    pnpm dev
    # or
    # npm run dev

Then open **http://localhost:3000** in your browser.

> **Tip:** If you don’t see any boards on first launch, create one using the **“New board”** button.

---

## 🧭 Project Structure

    epitrello/
    ├─ app/                # Next.js pages and routes (App Router)
    ├─ components/         # UI components (shadcn/ui + project components)
    ├─ lib/                # Helpers (e.g., Supabase client)
    ├─ public/             # Icons/manifest
    ├─ docs/images/        # Screenshots to include in the README
    └─ .env.local          # Environment variables (not committed)

---

## ❓ Quick FAQ

**Q: Do I need technical knowledge?**  
A: Not to use the app. You just need to run the project and have a Supabase account (values to copy/paste).

**Q: How do I add images to the README?**  
A: Put your files in `docs/images`, then update the image paths in the *Screenshots* section.

**Q: Can I deploy it online?**  
A: Yes. The easiest way is **Vercel** (for Next.js) + **Supabase**. You can reuse the same environment variables.

---

## 🤝 Contributing

Contributions are welcome! For suggestions, open an **Issue** or a **Pull Request** on the repository.

---

## 📄 License

Define according to your needs (e.g., MIT).

---

**Contact:** EpiTrello team — please open an **Issue** for any question.
