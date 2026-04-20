const puppeteer = require('puppeteer');
const { PuppeteerScreenRecorder } = require('puppeteer-screen-recorder');
const cloudinary = require('cloudinary').v2;
const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

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
  console.log("🚀 GHOST_ENGINE: Sniper Mode V10 (Video Render Fix)...");
  
  const browser = await puppeteer.launch({ 
    headless: "new",
    args: [
      '--no-sandbox', 
      '--disable-setuid-sandbox', 
      '--disable-dev-shm-usage', // Memory fix
      '--disable-gpu',           // Blank video fix
      '--disable-web-security'
    ] 
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844 });
  await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1');

  const videoPath = path.join(__dirname, 'ghost_action.mp4');
  const recorder = new PuppeteerScreenRecorder(page, {
    followNewTab: true,
    fps: 15,
    videoFrame: { width: 390, height: 844 },
    aspectRatio: '9:16',
  });

  try {
    await recorder.start(videoPath);
    console.log("⏺️ Recording Started...");

    // 1. Initial Load
    console.log("🔑 Navigating to Login Page...");
    await page.goto('https://www.instagram.com/accounts/login/', { waitUntil: 'networkidle2', timeout: 60000 });
    await new Promise(r => setTimeout(r, 10000));

    // 2. Account Entry Logic
    const targetUser = process.env.INSTA_USER || "ayush_raj6888";
    const targetPass = process.env.INSTA_PASS;

    console.log(`👤 Processing Login for: ${targetUser}`);

    await page.evaluate((user, pass) => {
      // Choose account modal click (if present)
      const modalBtn = Array.from(document.querySelectorAll('*')).find(el => el.textContent.trim() === user);
      if (modalBtn) (modalBtn.closest('button') || modalBtn).click();

      // Fill inputs directly for speed
      const uField = document.querySelector('input[name="username"]');
      const pField = document.querySelector('input[name="password"]');
      if (uField && !uField.value) uField.value = user;
      if (pField) {
        pField.value = pass;
        pField.type = "text"; // Video mein password verify karne ke liye unhide
      }
      
      // Submit click
      const sub = Array.from(document.querySelectorAll('button')).find(b => b.type === 'submit' || b.innerText.includes('Log'));
      if (sub) sub.click();
    }, targetUser, targetPass);

    console.log("⏳ Waiting for Dashboard Redirect...");
    await new Promise(r => setTimeout(r, 15000));

    // 3. Targeting & Scrapping
    const targets = ["_anshu_2101", "_cool_butterfly_.6284", "dee_pu3477", "ritu_singh785903"];
    
    for (const user of targets) {
      console.log(`📡 TARGETING: @${user}`);
      await page.goto(`https://www.instagram.com/${user}/`, { waitUntil: 'networkidle2', timeout: 60000 });
      await new Promise(r => setTimeout(r, 8000));
      
      const media = await page.evaluate(() => {
        const results = [];
        const items = document.querySelectorAll('img[srcset], article img, video, div._aagv img');
        items.forEach(el => {
          const src = el.src || el.srcset?.split(' ')[0] || el.querySelector('source')?.src;
          if (src && src.includes('cdninstagram.com')) results.push(src);
        });
        return [...new Set(results)];
      });

      console.log(`📊 @${user}: Found ${media.length} items.`); // Ye log dekhna zaroori h!

      for (const mUrl of media) {
        await safeUpload(mUrl, user, mUrl.includes('.mp4') ? 'videos' : 'posts');
      }
    }

  } catch (error) {
    console.error("❌ FATAL ERROR:", error.message);
  } finally {
    await recorder.stop();
    await browser.close();
    console.log("⏹️ Recording Stopped. Uploading...");
    
    if (fs.existsSync(videoPath)) {
      await cloudinary.uploader.upload(videoPath, { 
        resource_type: "video", 
        folder: "debug/recordings",
        public_id: `ghost_session_${Date.now()}`
      }).then(() => console.log("✅ Video Uploaded Successfully!"))
        .catch(e => console.log("❌ Video Upload Failed:", e.message));
    }
  }
}

async function safeUpload(url, username, category) {
  try {
    const mediaId = url.split('?')[0].split('/').pop().substring(0, 45); 
    const docId = `${username}_${mediaId}`;
    const docRef = db.collection("archives").doc(docId);
    const doc = await docRef.get();
    if (doc.exists) return; 

    const upload = await cloudinary.uploader.upload(url, { folder: `insta_vault/${username}/${category}`, resource_type: "auto" });
    await docRef.set({ owner: username, url: upload.secure_url, type: category, time: admin.firestore.FieldValue.serverTimestamp() });
    console.log(`      ✅ Saved media for @${username}`);
  } catch (e) { console.log(`      ⚠️ Upload fail: ${e.message}`); }
}

runBot();
