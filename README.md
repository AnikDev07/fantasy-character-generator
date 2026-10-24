# Fantasy Character Generator

Create fantasy adventurers with randomized attributes, illustrated character cards, origin stories, and a personal character deck.

## Features

- Generate characters with fantasy lineages, classes, stats, and equipment.
- Create short origin stories with Gemini when an API key is configured, with a procedural fallback when it is not.
- Use bundled character artwork, with optional Gemini portrait generation.
- Save and revisit characters in the My Deck view.

## Requirements

- Node.js and npm

## Run locally

1. Install dependencies:

   ```sh
   npm install
   ```

2. Copy `.env.example` to `.env` and add a Gemini API key to enable AI-generated stories and portraits. The app also runs without a key using its built-in fallbacks.

   Keep `.env` private. It is excluded by `.gitignore`.

3. Start the development server:

   ```sh
   npm run dev
   ```

4. Open the local URL printed in the terminal (usually `http://localhost:3000`).

## Build and run for production

```sh
npm run build
npm start
```

The production server serves the built app and API from one Node.js process. It uses the `PORT` environment variable when provided, or port `3000` by default.

## Configuration

| Variable | Required | Purpose |
| --- | --- | --- |
| `GEMINI_API_KEY` | No | Enables Gemini-powered story and portrait generation. Without it, the app uses procedural stories and bundled portraits. |
| `PORT` | No | Port used by the server. Defaults to `3000`. |
