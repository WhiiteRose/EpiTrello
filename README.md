# EpiTrello

> A modern, collaborative Kanban board application inspired by Trello. Organize your projects, track progress, and collaborate with your team in real-time.

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)

---

## 🖼️ Screenshots

![Landing Page](/images/landing-page.png)
![Dashboard](/images/dashboard.png)
![Board Kanban](/images/board-kanban.png)
![Create Task Dialog](/images/create-task-dialog.png)

---

## ✨ Features

### Core Functionality
- 📋 **Boards & Lists**: Create unlimited boards with customizable columns
- 🎯 **Tasks (Cards)**: Rich task cards with descriptions, labels, due dates, and attachments
- 🖱️ **Drag & Drop**: Intuitive drag-and-drop interface for task management
- 🏷️ **Labels**: Color-coded labels for visual organization
- 📎 **Attachments**: Upload and manage task attachments
- 💬 **Comments**: Real-time collaboration through task comments
- 🔍 **Search & Filters**: Powerful filtering by priority, labels, and due dates

### Team Collaboration
- 🔐 **Role-Based Permissions**: Owner, Member, and Viewer roles
- 👥 **Member Management**: Invite users, assign roles, and manage access
- 🔄 **Ownership Transfer**: Transfer board ownership with confirmation
- 📧 **Invitations**: Email-based board invitations
- 🔔 **Real-time Updates**: Live synchronization across all users

### User Experience
- 🌓 **Dark/Light Mode**: Toggle between themes
- 🌍 **Multilingual**: Support for FR/EN
- 📱 **Responsive Design**: Works seamlessly on desktop and mobile
- ⚡ **Fast & Modern**: Built with Next.js 14 and React Server Components

### Premium Features
- 💳 **Subscription Plans**: Free, Pro, and Enterprise tiers
- 📊 **My Tasks View**: Centralized view of all assigned tasks
- 🎨 **Custom Board Colors**: Personalize your workspace

---


## 🚀 Getting Started

###  Option 1: Access directly via URL

Check out the live application: **[https://epi-trello-iota.vercel.app/](https://epi-trello-iota.vercel.app/)** 🌐

### Option 2: Run from GitHub

1. **Clone the repository**
   ```bash
   git clone https://github.com/WhiiteRose/EpiTrello.git
   cd epitrello
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Fill in your `.env.local` with the required values:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   CLERK_SECRET_KEY=your_clerk_secret_key
   
   STRIPE_SECRET_KEY=your_stripe_secret_key
   STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
   STRIPE_PRICE_PRO_ID=price_xxx
   STRIPE_PRICE_ENTERPRISE_ID=price_xxx
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```
   
   Open [http://localhost:3000](http://localhost:3000) in your browser.

### Option 3: Run with Docker

1. **Build the Docker image**
   ```bash
   docker build -t epitrello .
   ```

2. **Run the container**
   ```bash
   docker run -p 3000:3000 --env-file .env.local epitrello
   ```

**Or using Docker Compose:**
```bash
docker-compose up -d
```

---

## 🔐 Roles & Permissions

| Role | View Tasks | Create/Edit Tasks | Manage Members | Delete Board | Transfer Ownership |
|------|------------|-------------------|----------------|--------------|-------------------|
| **Owner** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Member** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Viewer** | ✅ | ❌ | ❌ | ❌ | ❌ |

### Ownership Transfer
Board owners can transfer ownership to another member. This action:
- Promotes the selected member to Owner
- Demotes the current owner to Member
- Cannot be undone
- Requires confirmation

---

## 📚 Documentation

For detailed documentation, guides, and tutorials, visit our [**Wiki**](https://github.com/WhiiteRose/EpiTrello/wiki).

### Wiki Contents
- 📖 [Getting Started Guide](https://github.com/WhiiteRose/EpiTrello/wiki/Getting-Started)
- 🔧 [Configuration & Setup](https://github.com/WhiiteRose/EpiTrello/wiki/Configuration)
- 🗄️ [Database Schema](https://github.com/WhiiteRose/EpiTrello/wiki/Database-Schema)
- 🔌 [API Reference](https://github.com/WhiiteRose/EpiTrello/wiki/API-Reference)
- 🐳 [Docker Guide](https://github.com/WhiiteRose/EpiTrello/wiki/Docker-Deployment)
- 🚀 [Deployment Guide](https://github.com/WhiiteRose/EpiTrello/wiki/Deployment)
- 🎨 [Customization](https://github.com/WhiiteRose/EpiTrello/wiki/Customization)

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/)
- **Database**: [Supabase](https://supabase.com/) (PostgreSQL)
- **Authentication**: [Clerk](https://clerk.com/)
- **Payments**: [Stripe](https://stripe.com/)
- **Drag & Drop**: [@dnd-kit](https://dndkit.com/)

---

## 📁 Project Structure

```
epitrello/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── boards/            # Board pages
│   ├── dashboard/         # Dashboard page
│   └── my-tasks/          # My tasks page
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   └── navbar.tsx        # Navigation bar
├── lib/                   # Utilities and helpers
│   ├── hooks/            # Custom React hooks
│   ├── services.ts       # API services
│   └── supabase/         # Supabase client & models
├── public/               # Static assets
└── .env.local           # Environment variables (not committed)
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please read our [Contributing Guidelines](CONTRIBUTING.md) for more details.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Inspired by [Trello](https://trello.com/)
- Built with [shadcn/ui](https://ui.shadcn.com/)
- Powered by [Supabase](https://supabase.com/) and [Vercel](https://vercel.com/)

---

## 📞 Support

- 📧 **Email**: Open an [Issue](https://github.com/WhiiteRose/EpiTrello/issues)
- 📖 **Documentation**: [Wiki](https://github.com/WhiiteRose/EpiTrello/wiki)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/WhiiteRose/EpiTrello/discussions)

---

**Made with ❤️ by the EpiTrello Team**
