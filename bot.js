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
  admin.initializeApp({ credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_KEY)) });
}
const db = admin.firestore();

async function runBot() {
  console.log("🚀 GHOST_ENGINE: V18 - URL Mastery & Highlight ID Discovery...");
  const browser = await puppeteer.launch({ 
    headless: "new", 
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled'] 
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844 });
  await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1');

  const videoPath = path.join(__dirname, 'ghost_deep_archives.mp4');
  const recorder = new PuppeteerScreenRecorder(page, {
    followNewTab: true, fps: 25, videoFrame: { width: 390, height: 844 }, aspectRatio: '9:16',
  });

  try {
    await page.goto('https://www.instagram.com/', { waitUntil: 'networkidle2' });
    await recorder.start(videoPath);
    console.log("⏺️ Recording Started...");

    if (process.env.INSTA_COOKIES) {
        console.log("🍪 Injecting App Cookies...");
        await page.setCookie(...JSON.parse(process.env.INSTA_COOKIES));
        await page.reload({ waitUntil: 'networkidle2' });
    }

    const targets = ["_anshu_2101", "_cool_butterfly_.6284", "dee_pu3477", "ritu_singh785903"];

    for (const user of targets) {
      console.log(`\n🕵️ Target: @${user}`);
      
      // --- 1. PROFILE PAGE (Highlight IDs Discover Karo) ---
      await page.goto(`https://www.instagram.com/${user}/`, { waitUntil: 'networkidle2' });
      await new Promise(r => setTimeout(r, 5000));

      // 🔍 JUGAAD: Profile page se saare Highlight links aur IDs uthao
      const highlightLinks = await page.evaluate(() => {
          // Instagram Highlight links '/stories/highlights/ID/' format mein hote hain
          return Array.from(document.querySelectorAll('a[href*="/stories/highlights/"]'))
                .map(a => a.href);
      });

      console.log(`✨ Found ${highlightLinks.length} Direct Highlight Links for @${user}`);

      // --- 2. HIGHLIGHTS DEEP SCAN (Direct URL Method) ---
      for (const hUrl of highlightLinks) {
          console.log(`🔗 Navigating to Highlight: ${hUrl}`);
          await page.goto(hUrl, { waitUntil: 'networkidle2' });
          await new Promise(r => setTimeout(r, 4000));
          await captureViewerSlides(page, user, 'highlights_direct');
      }

      // --- 3. ACTIVE STORIES (Direct Link Method) ---
      const storyUrl = `https://www.instagram.com/stories/${user}/`;
      console.log(`📸 Checking Active Stories Direct: ${storyUrl}`);
      await page.goto(storyUrl, { waitUntil: 'networkidle2' });
      await new Promise(r => setTimeout(r, 4000));

      // Check karo kya story active h (login ya error page na ho)
      const storyExists = await page.evaluate(() => {
          return !document.body.innerText.includes('Page Not Found') && 
                 !!(document.querySelector('video') || document.querySelector('img[decode="sync"]'));
      });

      if (storyExists) {
          await captureViewerSlides(page, user, 'stories_direct');
      }

      // --- 4. FEED & DP SCAN ---
      await page.goto(`https://www.instagram.com/${user}/`, { waitUntil: 'networkidle2' });
      const media = await page.evaluate(() => {
          const res = [];
          document.querySelectorAll('header img, article img, div._aagv img, video').forEach(el => {
            if (el.src && el.src.includes('cdninstagram.com')) res.push(el.src);
          });
          return [...new Set(res)];
      });
      for (const mUrl of media) await safeUpload(mUrl, user, 'feed_and_dp');
    }

  } catch (error) {
    console.error("❌ ERROR:", error.message);
  } finally {
    await recorder.stop();
    await browser.close();
    console.log("⏹️ Bot Mission Finished.");
  }
}

/**
 * Story/Highlight Viewer mein Har Slide ko Capture aur "Next" dabane ka logic
 */
async function captureViewerSlides(page, username, category) {
    for (let i = 0; i < 20; i++) { // Max 20 slides
        const slideMedia = await page.evaluate(() => {
            const v = document.querySelector('video source')?.src;
            const img = document.querySelector('img[decode="sync"]')?.src;
            const fallbackImg = document.querySelector('img[alt*="Story"]')?.src;
            return v || img || fallbackImg;
        });

        if (slideMedia) {
            await safeUpload(slideMedia, username, category);
        }

        // --- TAKRA JUGAAD: Keyboard ArrowRight use karo Next ke liye ---
        await page.keyboard.press('ArrowRight');
        await new Promise(r => setTimeout(r, 2000));

        // Check karo kya viewer band ho gaya (wapas profile par aa gaye)
        const isStillInViewer = await page.evaluate(() => {
            return !!document.querySelector('section[role="dialog"]') || !!document.querySelector('video') || window.location.href.includes('/stories/');
        });

        if (!isStillInViewer) break;
    }
}

async function safeUpload(url, username, category) {
  try {
    const mediaId = url.split('?')[0].split('/').pop().substring(0, 45); 
    const docId = `${username}_${mediaId}`;
    const docRef = db.collection("archives").doc(docId);
    
    const doc = await docRef.get();
    if (doc.exists) return; 

    const upload = await cloudinary.uploader.upload(url, { 
        folder: `insta_vault/${username}/${category}`, resource_type: "auto" 
    });

    await docRef.set({ 
        owner: username, url: upload.secure_url, type: category, time: admin.firestore.FieldValue.serverTimestamp() 
    });
    console.log(`      ✨ [NEW CONTENT] Saved to ${category}`);
  } catch (e) {}
}

runBot();
