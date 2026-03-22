# Birthday Wish - Ethereal Edition Deployment Guide

This project is a completely static, Vanilla JS & CSS frontend that relies on **Supabase** as its backend database and storage.

## 1. Supabase Setup (Required)
Before deploying the code, your Supabase project must be configured perfectly.

1. Go to [Supabase](https://supabase.com) and create/open your project.
2. **Database Schema:** Go to SQL Editor and run this query to create your table.
   ```sql
   create table surprises (
     id uuid default gen_random_uuid() primary key,
     name text not null,
     wish_message text,
     photo_urls text[] not null,
     music_url text,
     created_at timestamp with time zone default timezone('utc'::text, now()) not null
   );
   ```
3. **Storage Buckets:** Go to Storage -> New Bucket.
   * Create a bucket exactly named: `birthday-photos`
   * Create a bucket exactly named: `birthday-music`
   * **IMPORTANT:** Ensure both buckets have the "Public" toggle set to ON. You must also click on **Policies** for each bucket and click "New Policy" -> allow `INSERT` for any user, so visitors can upload files!

4. **Environment Variables:** Update `script.js` line 3 & 4 with your Supabase URL and Anon Key.

## 2. Deploy to Vercel

1. **Push this project to GitHub**
2. Go to [vercel.com](https://vercel.com)
3. Click **Add New...** → **Project**
4. Connect your GitHub repository.
5. Vercel will automatically detect the static configuration using the `vercel.json` file provided in this repository.
6. Click **Deploy**.

Your live sharing URL will look like: 
`https://your-site.vercel.app/view.html?id=xxxx-xxxx-xxxx-xxxx` 

## 3. Testing Flow
- [ ] Open creator page (`index.html`).
- [ ] Enter Guest Name and Custom Message.
- [ ] Upload up to 10 photos (`.png`, `.jpg`).
- [ ] (Optional) Upload an audio background track (`.mp3`, `.wav`).
- [ ] Click "Craft Surprise Link".
- [ ] Copy the generated link (`view.html?id=...`) and thoroughly test the viewer page animations natively on mobile and desktop!
- [ ] Wait 12 seconds on the viewer screen until the beautiful slideshow finishes to confirm the custom text and particles load perfectly.
