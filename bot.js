const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

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
  console.log("🚀 GHOST_ENGINE: V13 - Xvfb Virtual Display Mode Active...");
  
  const browser = await puppeteer.launch({ 
    headless: false, // Xvfb ke saath 'false' hi rakhna h taaki video sahi aaye
    args: [
      '--no-sandbox', 
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--start-maximized'
    ] 
  });
  
  const page = await browser.newPage();
  // Virtual monitor size ke hisaab se viewport
  await page.setViewport({ width: 1280, height: 1024 }); 
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36');

  const videoPath = path.join(__dirname, 'ghost_action.mp4');
  const recorder = new PuppeteerScreenRecorder(page, {
    followNewTab: true,
    fps: 15,
    videoFrame: { width: 1280, height: 1024 },
    aspectRatio: '16:9',
  });

  try {
    await recorder.start(videoPath);
    console.log("⏺️ Recording Started on Virtual Display...");

    // 1. Visit Login
    console.log("🔑 Navigating to Instagram Login...");
    await page.goto('https://www.instagram.com/accounts/login/', { waitUntil: 'networkidle2', timeout: 60000 });
    await new Promise(r => setTimeout(r, 7000));

    // 2. Slow Typing Logic
    const targetUser = process.env.INSTA_USER || "ayush_raj6888";
    const targetPass = process.env.INSTA_PASS;

    console.log(`👤 Entering Username: ${targetUser}`);
    await page.type('input[name="username"]', targetUser, { delay: 250 });
    await new Promise(r => setTimeout(r, 2000));
    
    console.log("🔑 Entering Password...");
    await page.type('input[name="password"]', targetPass, { delay: 250 });
    
    // Unhide password for video verification
    await page.evaluate(() => {
        const p = document.querySelector('input[name="password"]');
        if (p) p.type = "text";
    });
    await new Promise(r => setTimeout(r, 3000));

    // 3. Click Login Button
    console.log("🚀 Clicking Log In button...");
    await page.evaluate(() => {
        const btn = Array.from(document.querySelectorAll('button')).find(b => 
            b.type === 'submit' || b.innerText.includes('Log In')
        );
        if (btn) {
            btn.style.border = "10px solid red"; // Video mein highlight hoga
            btn.click();
        }
    });

    console.log("⏳ Waiting 30s for Dashboard redirection...");
    await new Promise(r => setTimeout(r, 30000));

    // 4. Verification Check
    const isLoggedIn = await page.evaluate(() => {
        return !document.body.innerText.includes('Log In') && 
               (!!document.querySelector('nav') || !!document.querySelector('svg[aria-label="Home"]'));
    });

    if (!isLoggedIn) {
      console.log("❌ LOGIN FAILED: Page status check karo video mein.");
    } else {
      console.log("✅ LOGIN SUCCESS! Moving to targets...");
      
      const targets = ["_anshu_2101", "_cool_butterfly_.6284", "dee_pu3477", "ritu_singh785903"];
      for (const user of targets) {
        console.log(`📡 Scanning: @${user}`);
        await page.goto(`https://www.instagram.com/${user}/`, { waitUntil: 'networkidle2' });
        await new Promise(r => setTimeout(r, 10000));
        
        const media = await page.evaluate(() => {
          const results = [];
          const items = document.querySelectorAll('img[srcset], article img, video, div._aagv img');
          items.forEach(el => {
            const src = el.src || el.srcset?.split(' ')[0] || el.querySelector('source')?.src;
            if (src && src.includes('cdninstagram.com')) results.push(src);
          });
          return [...new Set(results)];
        });

        console.log(`📊 @${user}: Found ${media.length} items.`);
        for (const mUrl of media) await safeUpload(mUrl, user, mUrl.includes('.mp4') ? 'videos' : 'posts');
      }
    }

  } catch (error) {
    console.error("❌ FATAL ERROR:", error.message);
  } finally {
    await recorder.stop();
    await browser.close();
    console.log("⏹️ Recording Stopped. Sending to Cloudinary...");
    
    if (fs.existsSync(videoPath)) {
      await cloudinary.uploader.upload(videoPath, { 
        resource_type: "video", 
        folder: "debug/recordings",
        public_id: `xvfb_stealth_${Date.now()}`
      }).then(() => console.log("✅ Video Uploaded!"))
        .catch(e => console.log("❌ Video Upload Error:", e.message));
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
    console.log(`      ✅ Saved: ${category}`);
  } catch (e) {}
}

runBot();
