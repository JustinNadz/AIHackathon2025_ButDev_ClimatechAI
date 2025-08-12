# Environment setup for Frontend-Admin

Create a file named `.env.local` in the project root with:

```
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_key_here
NEXT_PUBLIC_BACKEND_BASE_URL=http://localhost:5000
```

Notes:
- Only variables prefixed with `NEXT_PUBLIC_` are exposed to the browser in Next.js.
- Never hardcode keys in code. Keep them in `.env.local` which is ignored by git.
- Restart `npm run dev` after changing env files. 