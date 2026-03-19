# Birthday Wish - Deploy to Render

## Quick Deploy

1. **Push this project to GitHub** (create a repo and push)
2. Go to [dashboard.render.com](https://dashboard.render.com)
3. Click **New** → **Static Site**
4. Connect your GitHub repo
5. Settings:
   - **Name:** birthday-wish (or any name)
   - **Branch:** main (or your default branch)
   - **Build Command:** `echo "No build required"` (or leave blank)
   - **Publish Directory:** `.` (root)
6. Click **Create Static Site**

Your site will be live at `https://<your-service>.onrender.com`

---

## Using render.yaml (Blueprint)

If your repo has `render.yaml` in the root:

1. Go to [dashboard.render.com](https://dashboard.render.com)
2. Click **New** → **Blueprint**
3. Connect your repo
4. Render will detect `render.yaml` and create the static site

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
https://your-site.onrender.com/?name=Sarah&title=You%20Are%20Special&body=Happy%20Birthday!
```

Recipients open directly to the wish screen with name and custom message pre-filled.
