# Collaborative Slate Editor with Supabase Realtime

[![Next.js](https://img.shields.io/badge/Next.js-15+-black?logo=nextdotjs)](https://nextjs.org/) [![Supabase](https://img.shields.io/badge/Supabase-Realtime-3FCF8E?logo=supabase)](https://supabase.com/) [![Slate.js](https://img.shields.io/badge/Slate.js-Editor-blue)](https://www.slatejs.org/) [![Yjs](https://img.shields.io/badge/Yjs-CRDT-yellow)](https://yjs.dev/)

> **A real-time collaborative text editor built with Slate.js, Next.js, and Supabase Realtime presence.**

---

## Table of Contents

- [Collaborative Slate Editor with Supabase Realtime](#collaborative-slate-editor-with-supabase-realtime)
  - [Table of Contents](#table-of-contents)
  - [Demo](#demo)
  - [Features](#features)
  - [Tech Stack](#tech-stack)
  - [Quick Start](#quick-start)
  - [How It Works](#how-it-works)
  - [Customization](#customization)
  - [Deployment](#deployment)
  - [Contributing](#contributing)
  - [License](#license)
  - [Acknowledgments](#acknowledgments)
  - [Resources](#resources)

---

## Demo

<!-- markdownlint-disable MD033 -->
<div style="text-align:center;margin:20px 0; width:100%;">
  <img src="./public/demo.gif" alt="Collaborative Editor Demo" style="width:100%;max-width:100vw;height:auto;display:block;" />
<video src="https://github.com/Spagestic/slate-supabase-realtime/blob/master/public/demo.mp4" width="400" controls></video>
</div>

<!-- markdownlint-enable MD033 -->

---

## Features

- 📝 **Real-time collaboration** — Multiple users can edit the same document simultaneously
- 👤 **Cursor presence** — See other users' cursors and selections in real-time
- 🅱️ **Rich text formatting** — Bold, code blocks, and extensible formatting
- 🔄 **Persistent connections** — Robust real-time communication via Supabase
- 👥 **User awareness** — See who is active in the document
- ⚡ **Conflict resolution** — Powered by Yjs CRDTs for seamless merging

---

## Tech Stack

**Frontend:**

- Next.js 15+
- React 19
- Tailwind CSS 4
- Slate.js (with [slate-yjs](https://github.com/BitPhinix/slate-yjs))

**Backend:**

- Supabase Realtime (for presence and updates)
- Yjs (CRDT engine)

---

## Quick Start

```bash
# 1. Clone the repository
 git clone https://github.com/Spagestic/slate-supabase-realtime
 cd slate-supabase-realtime

# 2. Install dependencies
 npm install
 # or: bun install

# 3. Add your Supabase credentials to .env.local
#    (see .env.example for format)

# 4. Start the development server
 npm run dev
 # or: bun dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## How It Works

The app combines Slate.js for the editor UI, Yjs for CRDT operations, and Supabase Realtime for broadcasting updates and presence:

1. **Editor Initialization**: Slate editor is enhanced with Yjs bindings and connects to a Supabase Realtime channel.
2. **Collaboration Flow**: Edits are synced via Yjs and broadcast to all clients using Supabase.
3. **Presence Management**: User info (name, cursor, selection) is tracked and broadcast for live awareness.

---

## Customization

- **Editor logic**: See `app/page.tsx` for main editor logic.
- **Custom Elements**: Extend `renderElement` for new block types.
- **Custom Formatting**: Extend `renderLeaf` for new marks.
- **Commands**: Add to the `CustomEditor` object.
- **Styling**: Tailwind CSS in `app/globals.css` and `app/styles.css`.

---

## Deployment

This Next.js app can be deployed to Vercel or any platform supporting Next.js:

```bash
npm run build
npm run start
```

For Vercel, connect your repo and deploy. See [Next.js deployment docs](https://nextjs.org/docs/app/building-your-application/deploying).

---

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

---

## License

MIT — see the LICENSE file for details.

---

## Acknowledgments

- [Slate.js](https://www.slatejs.org/) — Rich text editor framework
- [Supabase](https://supabase.com/) — Real-time infrastructure
- [Yjs](https://yjs.dev/) — CRDT implementation
- [slate-yjs](https://github.com/BitPhinix/slate-yjs) — Slate/Yjs integration

---

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Yjs Documentation](https://docs.yjs.dev/)
- [Slate.js Documentation](https://docs.slatejs.org/)
