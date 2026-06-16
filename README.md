# Kinder

Kinder is a campus-exclusive social discovery, friendship, and dating platform designed for undergraduate students. It provides a secure, verified environment for students to meet like-minded peers, send anonymous confessions, and match based on shared relationship intents.

## 🌟 Key Features

- **Institution Verification:** Restricts access to students with verified `.ac.in` email addresses via Supabase Authentication.
- **Robust Profiles:** Rich profiles including photos, short bios, study fields, graduation year, relationship intent, and interactive interest tags.
- **Discovery Algorithm:** Dynamic profile matching that respects user intent (e.g., Friendship vs. Dating) and prevents showing discarded or matched profiles.
- **Hookup Intent Visibility:** A mutual opt-in system specifically for casual intent. Strictly filters discovery so casual seekers only see other casual seekers. Automatically restricted for minor students (under 18) based on Date of Birth.
- **Anonymous Confessions:** A completely anonymous messaging system where students can send messages to campus crushes. All messages pass through a moderation queue and require the recipient's consent ("Accept & Read") before they are revealed.
- **Real-Time Chat:** Supabase-powered real-time chat between mutual matches with generated icebreaker prompts to kickstart conversations.
- **Admin & Moderation Dashboard:** A secure dashboard exclusively for administrative users to approve/reject confessions and manage user reports. Features automated threshold bans (e.g., 7-day bans or permanent suspensions based on report volume).

## 🛠️ Tech Stack

- **Framework:** [Next.js 15](https://nextjs.org/) (App Router, React 19)
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
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 4. Database Setup

You need to provision your Supabase database schema. Run the following SQL scripts in your Supabase SQL Editor in this exact order:

1. Copy and execute the contents of `schema.sql`.
2. Copy and execute the contents of `schema_v3.sql`.

*Note: These scripts will set up your tables (`profiles`, `matches`, `messages`, `confessions`, `reports`), trigger functions, storage buckets, and Row Level Security (RLS) policies.*

### 5. Run the Development Server

Start the application:

```bash
npm run dev
```

Open [http://localhost:790](http://localhost:790) in your browser to see the result. You can log in, create a profile, and start exploring!

---

## 🔒 Security & Privacy

Kinder is designed to be a safe space. All data is protected by Supabase Row Level Security (RLS) policies to ensure that users can only access information that they are authorized to see (e.g., their own matches, approved confessions, etc.). The Admin dashboard is strictly restricted by a user role check in the database.
