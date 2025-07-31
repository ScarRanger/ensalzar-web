# Ensalzar Web
Christian Youth in Power X Community of the Good Shepherd

Ensalzar is a modern web app for discovering, saving, and presenting worship songs with beautiful chord sheets. Built with Next.js, it helps worship leaders and musicians manage their music, share with audiences, and keep favorites organized.

## Features

- 🎵 Browse a curated list of worship songs
- ⭐ Save your favorite songs for quick access
- 📅 Add songs to your daily setlist
- 🎸 View and transpose chords easily
- 👥 Audience display mode for presentations
- 🔒 Secure user authentication (Supabase)
- 🌐 Responsive design for desktop and mobile

## Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or yarn

### Installation
1. Clone the repository:
   ```sh
   git clone https://github.com/ScarRanger/ensalzar-web.git
   cd ensalzar-web
   ```
2. Install dependencies:
   ```sh
   npm install
   # or
   yarn install
   ```
3. Create a `.env.local` file in the root directory and add your environment variables:
   ```env
   NEXT_PUBLIC_SONG_S3_URL=https://cgs-songs-config.s3.ap-south-1.amazonaws.com/
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

### Running Locally
```sh
npm run dev
# or
yarn dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure
```
ensalzar-web/
├── public/           # Static assets (SVGs, icons, etc.)
├── src/app/          # Main app code (pages, components, styles)
├── .env.local        # Environment variables
├── package.json      # Project metadata and scripts
└── README.md         # Project documentation
```

## Technologies Used
- [Next.js](https://nextjs.org/) (React framework)
- [Supabase](https://supabase.com/) (Auth & Database)
- [PostCSS](https://postcss.org/) (Styling)
- [ESLint](https://eslint.org/) (Linting)

## Contributing
Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

## License
MIT

---

**Ensalzar Web** — Elevate your worship music experience.
