const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const { PuppeteerScreenRecorder } = require('puppeteer-screen-recorder');
const cloudinary = require('cloudinary').v2;
const admin = require('firebase-admin');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const path = require('path');
const fs = require('fs');

// ⚙️ CONFIGURATIONS
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_KEY))
  });
}
const db = admin.firestore();

// 🕒 GLOBAL SETTINGS
const MAX_WAIT_FOR_MEDIA = 45000; // 45 sec max wait for HD content
const FORCE_RE_SYNC = true; 

async function runBot() {
  console.log("🚀 GHOST_ENGINE: V22 - AI Detective & Deep Archiver (Final Stable)...");
  
  const browser = await puppeteer.launch({ 
    headless: "new", 
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled'] 
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1920 }); // HD Rendering

  try {
    // 1. WARM UP
    await page.goto('https://www.instagram.com/', { waitUntil: 'networkidle2' });
    if (process.env.INSTA_COOKIES) {
        console.log("🍪 Injecting Session...");
        await page.setCookie(...JSON.parse(process.env.INSTA_COOKIES));
        await page.reload({ waitUntil: 'networkidle2' });
    }

    const targets = ["_anshu_2101", "_cool_butterfly_.6284", "dee_pu3477", "ritu_singh785903"];

    for (const user of targets) {
      console.log(`\n🕵️ [TARGET: @${user}] Starting Mission...`);
      
      // A. Profile Tracker (Bio/DP Check)
      await page.goto(`https://www.instagram.com/${user}/`, { waitUntil: 'networkidle2' });
      await trackProfileChanges(page, user);

      // B. Auto-Discovery
      const highlightLinks = await page.evaluate(() => {
          return Array.from(document.querySelectorAll('a[href*="/stories/highlights/"]')).map(a => a.href);
      });
      console.log(`   ✨ Highlights Found: ${highlightLinks.length}`);

      // C. Deep Scraping (Stories & Highlights)
      console.log(`   📸 Scanning Stories...`);
      await page.goto(`https://www.instagram.com/stories/${user}/`, { waitUntil: 'networkidle2' });
      await captureSmartHD(page, user, 'stories_v22');

      for (const hUrl of highlightLinks) {
          console.log(`   🔗 Entering Highlight: ${hUrl}`);
          await page.goto(hUrl, { waitUntil: 'networkidle2' });
          await captureSmartHD(page, user, 'highlights_v22');
      }
    }

  } catch (error) {
    console.error("❌ CRITICAL ERROR:", error.message);
  } finally {
    await browser.close();
    console.log("⏹️ Bot Mission Finished. System Cooling Down.");
  }
}

/**
 * 🔥 SMART CAPTURE: Auto-Wait + Auto-Like + AI Detection
 */
async function captureSmartHD(page, username, category) {
    for (let i = 0; i < 30; i++) {
        console.log(`   ⏳ Slide ${i+1}: Polling for HD Media...`);

        const media = await page.evaluate(async (maxWait) => {
            const start = Date.now();
            while (Date.now() - start < maxWait) {
                const video = document.querySelector('video');
                const img = document.querySelector('img[decode="sync"]') || document.querySelector('img[alt*="Story"]');

                // Video/Audio Check
                if (video && video.readyState >= 3) {
                    const src = video.currentSrc || video.src || video.querySelector('source')?.src;
                    if (src && src.startsWith('http')) return { url: src, type: 'video' };
                }
                // Image Check
                if (img && img.complete && img.naturalWidth > 150) {
                    if (img.src && !img.src.includes('data:image')) return { url: img.src, type: 'image' };
                }
                await new Promise(r => setTimeout(r, 600));
            }
            return null;
        }, MAX_WAIT_FOR_MEDIA);

        if (media && media.url) {
            // ❤️ AUTO LIKE (Safe Mode)
            await page.evaluate(() => {
                const likeBtn = document.querySelector('span[role="button"] svg[aria-label="Like"]')?.closest('button');
                if (likeBtn) likeBtn.click();
            });

            // 💾 SYNC & AI ANALYSIS
            const isNew = await safeSync(media.url, username, category, media.type === 'video');
            if (isNew && media.type === 'image') {
                console.log(`      🤖 AI Analysis Triggered...`);
                const aiResponse = await analyzeWithGemini(media.url);
                await updateAIDesc(username, media.url, aiResponse);
            }
        }

        // Navigation
        await page.keyboard.press('ArrowRight');
        await new Promise(r => setTimeout(r, 2000));
        if (!await page.evaluate(() => window.location.href.includes('/stories/'))) break;
    }
}

/**
 * 👤 PROFILE TRACKER
 */
async function trackProfileChanges(page, username) {
    const profile = await page.evaluate(() => ({
        bio: document.querySelector('header section div:nth-child(3) span')?.innerText || "",
        dp: document.querySelector('header img')?.src || ""
    }));

    const docRef = db.collection("profile_tracking").doc(username);
    const doc = await docRef.get();

    if (!doc.exists || doc.data().bio !== profile.bio || doc.data().dp !== profile.dp) {
        await docRef.set({ ...profile, last_seen: admin.firestore.FieldValue.serverTimestamp() });
        console.log(`   📝 Logged: Profile Update for @${username}`);
    }
}

/**
 * 🤖 GEMINI CONTEXTUAL AI
 */
async function analyzeWithGemini(imageUrl) {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        // Bhai, ye wahi logic h: Pehle AI 'area/context' pehchanega phir detail dega
        const prompt = `Identify the primary 'area' or 'setting' of this Instagram media (e.g., Home, Cafe, Party, Nature). Then, provide an automatic description of what is happening. Format: [Area] - [Description]`;
        
        const response = await fetch(imageUrl);
        const buffer = await response.buffer();
        
        const result = await model.generateContent([
            prompt,
            { inlineData: { data: buffer.toString('base64'), mimeType: "image/jpeg" } }
        ]);
        
        const text = result.response.text();
        console.log(`      📝 AI Result: ${text}`);
        return text;
    } catch (e) { return "AI analysis failed during capture."; }
}

/**
 * 💾 SYNC TO CLOUDINARY & FIREBASE
 */
async function safeSync(url, username, category, isVideo) {
    const mediaId = url.split('?')[0].split('/').pop().substring(0, 40); 
    const docId = `V22_${username}_${mediaId}`;
    const docRef = db.collection("archives").doc(docId);
    
    if (!FORCE_RE_SYNC) {
        const doc = await docRef.get();
        if (doc.exists) return false;
    }

    const upload = await cloudinary.uploader.upload(url, { 
        folder: `insta_vault_v22/${username}/${category}`, 
        resource_type: isVideo ? "video" : "image",
        invalidate: true
    });

    await docRef.set({ 
        owner: username, url: upload.secure_url, type: category, is_video: isVideo, 
        time: admin.firestore.FieldValue.serverTimestamp() 
    });
    console.log(`      ✅ Archived: ${isVideo ? '📹 Video+Audio' : '🖼️ HD Photo'}`);
    return true;
}

async function updateAIDesc(username, url, desc) {
    const mediaId = url.split('?')[0].split('/').pop().substring(0, 40);
    const docId = `V22_${username}_${mediaId}`;
    await db.collection("archives").doc(docId).update({ ai_report: desc });
}

runBot();
      
