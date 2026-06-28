# Kinder

Kinder is a social discovery, friendship, and dating platform designed for undergraduate students. It provides a secure environment for students to meet like-minded peers, send anonymous confessions, and match based on shared relationship intents.

## 🌟 Key Features

- **Robust Profiles:** Rich profiles including photos, short bios, study fields, graduation year, relationship intent, food habits, and interactive interest tags.
- **Discovery Algorithm:** Dynamic profile matching that respects user intent (e.g., Friendship vs. Dating) and prevents showing discarded or matched profiles.
- **Anonymous Confessions:** A completely anonymous messaging system where students can send messages to campus crushes. All messages pass through a moderation queue and require the recipient's consent ("Accept & Read") before they are revealed.
- **Real-Time Chat:** Supabase-powered real-time chat between mutual matches with generated icebreaker prompts to kickstart conversations.

## 🛠️ Tech Stack

- **Framework:** [Next.js 16](https://nextjs.org/) (App Router, React 19)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) with custom design tokens for a vibrant, modern UI.
- **UI Components:** Built using [Radix UI](https://www.radix-ui.com/) primitives and [Lucide Icons](https://lucide.dev/).
- **Database & Auth:** [Supabase](https://supabase.com/) (PostgreSQL, Realtime, Storage, Authentication).

## 🚀 Getting Started

Follow these instructions to run the application locally.

### 1. Prerequisites

- **Node.js** (v18 or higher)
- **npm** or **yarn** or **pnpm**
- A **Supabase** project (you can create a free tier project at [supabase.com](https://supabase.com))

### 2. Install Dependencies

Clone the repository and install the NPM packages:

```bash
git clone https://github.com/cyanidemilkshakee/kinder.git
cd kinder
npm install
```

### 3. Environment Variables

Create a `.env.local` file in the root of your project and populate it with your Supabase credentials:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-or-anon-key
```

### 4. Database Setup

You need to provision your Supabase database schema. Run the following SQL script in your Supabase SQL Editor:

1. Copy and execute the contents of `schema.sql`.

*Note: This script will set up your tables (`profiles`, `matches`, `messages`, `confessions`, `reports`), trigger functions, storage buckets, and Row Level Security (RLS) policies. It is idempotent and can be safely re-run to apply updates.*

### 5. Run the Development Server

Start the application:

```bash
npm run dev
```

Open [http://localhost:790](http://localhost:790) in your browser to see the result. You can log in, create a profile, and start exploring!

---

## 🔒 Security & Privacy

Kinder is designed to be a safe space. All data is protected by Supabase Row Level Security (RLS) policies to ensure that users can only access information that they are authorized to see (e.g., their own matches, approved confessions, etc.).
