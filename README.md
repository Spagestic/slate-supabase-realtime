# Collaborative Slate Editor with Supabase Realtime

A real-time collaborative text editor built with [Slate.js](https://www.slatejs.org/), [Next.js](https://nextjs.org/), and [Supabase Realtime](https://supabase.com/docs/guides/realtime) for presence and collaboration features.

![Collaborative Editor Demo](./public//demo.gif)

## Features

- **Real-time collaboration**: Multiple users can edit the same document simultaneously
- **Cursor presence**: See other users' cursors and selections in real-time
- **Rich text formatting**: Support for basic formatting like bold text and code blocks
- **Persistent connections**: Uses Supabase Realtime for robust real-time communication
- **User awareness**: Shows which users are currently active in the document
- **Conflict resolution**: Built on [Yjs](https://yjs.dev/) for conflict-free replicated data types

## Tech Stack

- **Frontend**:

  - Next.js 15+
  - React 19
  - Tailwind CSS 4
  - Slate.js for the editor
  - slate-yjs for collaboration

- **Backend**:
  - Supabase Realtime for broadcasting updates
  - Yjs for CRDT (Conflict-free Replicated Data Type) operations

## Getting Started

### Prerequisites

- Node.js 18+ (or Bun)
- Supabase account and project

### Environment Setup

1. Clone the repository:

   ```bash
   git clone <your-repo-url>
   cd slate-supabase-realtime
   ```

2. Install dependencies:

   ```bash
   npm install
   # or
   bun install
   ```

3. Create a `.env.local` file in the root directory with your Supabase credentials:

   ```
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

4. Start the development server:

   ```bash
   npm run dev
   # or
   bun dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## How It Works

### Architecture Overview

The application uses a combination of Slate.js for the editor UI, Yjs for CRDT operations, and Supabase Realtime for broadcasting these operations to all connected clients:

1. **Editor Initialization**:

   - Creates a Slate editor instance enhanced with Yjs bindings
   - Connects to Supabase Realtime channel

2. **Collaboration Flow**:

   - User edits are captured by Slate and synchronized with the local Yjs document
   - Yjs generates update messages that are broadcast via Supabase Realtime
   - Other clients receive these updates and apply them to their local Yjs document
   - Changes are reflected in each user's Slate editor

3. **Presence Management**:
   - User information (name, cursor position, selection) is tracked using the Awareness protocol
   - This information is broadcast through the same Supabase Realtime channel
   - Connected clients render cursor positions and selections for all active users

## Customization

### Modifying the Editor

The editor components can be found in `app/page.tsx`. The main customization points are:

- **Custom Elements**: Add new block types by extending the `renderElement` function
- **Custom Formatting**: Add new formatting options by extending the `renderLeaf` function
- **Editor Commands**: Add new commands to the `CustomEditor` object

### Styling

The project uses Tailwind CSS for styling. The main styles are in:

- `app/globals.css` - Global styles
- `app/styles.css` - Editor-specific styles

## Deployment

This Next.js application can be deployed to Vercel or any other platform that supports Next.js:

```bash
npm run build
npm run start
```

For Vercel deployment, simply connect your GitHub repository to Vercel, and it will automatically deploy your application.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Slate.js](https://www.slatejs.org/) - The rich text editor framework
- [Supabase](https://supabase.com/) - For the real-time infrastructure
- [Yjs](https://yjs.dev/) - For the CRDT implementation
- [slate-yjs](https://github.com/BitPhinix/slate-yjs) - For connecting Slate with Yjs
  This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
