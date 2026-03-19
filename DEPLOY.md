# Birthday Wish - Deploy to Vercel

## Quick Deploy (Git Integration)

1. **Push this project to GitHub** (create a repo and push)
2. Go to [vercel.com](https://vercel.com)
3. Click **Add New...** → **Project**
4. Connect your GitHub repo
5. Settings:
   - **Framework Preset:** Other (it will detect static files)
   - **Build Command:** `echo "No build required"` (or leave blank)
   - **Output Directory:** `.` (root)
6. Click **Deploy**

Your site will be live at `https://<your-project>.vercel.app`

---

## Deploy using Vercel CLI

If you have [Vercel CLI](https://vercel.com/docs/cli) installed:

```bash
# Login to Vercel
vercel login

# Deploy from root
vercel --prod
```

---

## Testing Before Deploy

### Run locally

```bash
# Option 1: npx serve
npx serve -l 3000

# Option 2: Python
python -m http.server 3000

# Option 3: Node (if you have http-server)
npx http-server -p 3000
```

Then open: http://localhost:3000

### Test checklist

- [ ] Name input → Create Surprise → wish screen
- [ ] Upload photos → gallery in shapes (heart, circle, blob, rounded)
- [ ] Click hearts → random photo in heart popup
- [ ] Tap anywhere → slideshow (duration = photos × 5 sec)
- [ ] Big Surprise → confetti + custom message
- [ ] Share This Wish → link copied / fallback input
- [ ] Open shared link `?name=John` → direct to wish screen
- [ ] Music play/pause

---

## Share Links

After deploy, share links work like:

```
https://your-site.vercel.app/?name=Sarah&title=You%20Are%20Special&body=Happy%20Birthday!
```

Recipients open directly to the wish screen with name and custom message pre-filled.
