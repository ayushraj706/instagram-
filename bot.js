const puppeteer = require('puppeteer');
const cloudinary = require('cloudinary').v2;
const admin = require('firebase-admin');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_KEY))
  });
}
const db = admin.firestore();

async function runBot() {
  console.log("🚀 GHOST_ENGINE: Targeted Sync Started...");
  const browser = await puppeteer.launch({ 
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox'] 
  });
  
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1');

  try {
    const cookies = JSON.parse(process.env.INSTA_COOKIES);
    await page.setCookie(...cookies);

    // BASS YAHI 4 TARGETS
    const targetUsers = [
      "_anshu_2101", 
      "_cool_butterfly_.6284", 
      "dee_pu3477", 
      "ritu_singh785903"
    ];

    for (const user of targetUsers) {
      console.log(`\n📂 Mirroring Everything for: @${user}`);
      
      // 1. Profile Page par jana
      await page.goto(`https://www.instagram.com/${user}/`, { waitUntil: 'networkidle2' });
      await new Promise(r => setTimeout(r, 5000));

      // 2. Profile Pic (DP)
      const dpUrl = await page.evaluate(() => {
        const img = document.querySelector('header img') || document.querySelector('img[alt*="profile picture"]');
        return img ? img.src : null;
      });
      if(dpUrl) await safeUpload(dpUrl, user, 'profile_pic');

      // 3. Saved Stories (Highlights)
      console.log(`  └─ Extracting Highlights...`);
      const highlightMedia = await page.evaluate(() => {
        const items = Array.from(document.querySelectorAll('canvas')).map(c => c.closest('div')?.querySelector('img')?.src);
        return items.filter(src => src && src.includes('cdninstagram.com'));
      });
      for (const hUrl of highlightMedia) await safeUpload(hUrl, user, 'highlights');

      // 4. All Posts & Reels (Deep Scroll)
      console.log(`  └─ Scanning All Posts/Videos...`);
      let mediaSet = new Set();
      
      for (let i = 0; i < 5; i++) { // Deep scroll logic
        const found = await page.evaluate(() => {
          const imgs = Array.from(document.querySelectorAll('article img')).map(el => el.src);
          const vids = Array.from(document.querySelectorAll('article video')).map(el => el.src || el.querySelector('source')?.src);
          return [...imgs, ...vids].filter(src => src && src.includes('cdninstagram.com'));
        });
        found.forEach(item => mediaSet.add(item));
        await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
        await new Promise(r => setTimeout(r, 2000));
      }

      for (const mUrl of Array.from(mediaSet)) {
        const isVideo = mUrl.includes('.mp4') || mUrl.includes('video');
        await safeUpload(mUrl, user, isVideo ? 'videos' : 'posts');
      }

      // 5. Active Stories (Agar koi laga rakhi ho)
      await page.goto(`https://www.instagram.com/stories/${user}/`, { waitUntil: 'networkidle2' });
      const storyMedia = await page.evaluate(() => {
        const media = Array.from(document.querySelectorAll('img[srcset], video source')).map(el => el.src || el.srcset);
        return media.filter(m => m && m.includes('cdninstagram'));
      });
      for (const sUrl of storyMedia) await safeUpload(sUrl, user, 'stories');
    }

  } catch (error) {
    console.error("❌ Fatal Error:", error.message);
  } finally {
    await browser.close();
    console.log("🏁 All 4 Targets Processed.");
  }
}

// NO-REPEAT UPLOAD LOGIC
async function safeUpload(url, username, category) {
  try {
    const mediaId = url.split('?')[0].split('/').pop(); 
    const docId = `${username}_${mediaId}`;

    const docRef = db.collection("archives").doc(docId);
    const doc = await docRef.get();

    // Repeat check
    if (doc.exists) return; 

    const upload = await cloudinary.uploader.upload(url, {
      folder: `insta_vault/${username}/${category}`,
      resource_type: "auto"
    });

    await docRef.set({
      owner: username,
      url: upload.secure_url,
      type: category,
      time: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`  ✅ New ${category} saved: ${username}`);
  } catch (e) {
    // Skip error
  }
}

runBot();
