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

// Configurations
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

// Settings
const MAX_WAIT_FOR_MEDIA = 45000; 

async function runBot() {
  console.log("🚀 GHOST_ENGINE: V22 - AI + WhatsApp + Profile Tracker Loaded...");
  
  const browser = await puppeteer.launch({ 
    headless: "new", 
    args: ['--no-sandbox', '--disable-setuid-sandbox'] 
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1920 }); 

  try {
    await page.goto('https://www.instagram.com/', { waitUntil: 'networkidle2' });
    if (process.env.INSTA_COOKIES) {
        await page.setCookie(...JSON.parse(process.env.INSTA_COOKIES));
        await page.reload({ waitUntil: 'networkidle2' });
    }

    const targets = ["_anshu_2101", "_cool_butterfly_.6284", "dee_pu3477", "ritu_singh785903"];

    for (const user of targets) {
      console.log(`\n🕵️ Target: @${user}`);
      
      // --- 1. PROFILE TRACKING (Bio & DP) ---
      await trackProfileChanges(page, user);

      // --- 2. HIGHLIGHT DISCOVERY ---
      await page.goto(`https://www.instagram.com/${user}/`, { waitUntil: 'networkidle2' });
      const highlightLinks = await page.evaluate(() => {
          return Array.from(document.querySelectorAll('a[href*="/stories/highlights/"]')).map(a => a.href);
      });

      // --- 3. DEEP SCAN (Stories & Highlights) WITH AUTO-LIKE ---
      // Stories
      await page.goto(`https://www.instagram.com/stories/${user}/`, { waitUntil: 'networkidle2' });
      await captureAndLike(page, user, 'stories_v22');

      // Highlights
      for (const hUrl of highlightLinks) {
          await page.goto(hUrl, { waitUntil: 'networkidle2' });
          await captureAndLike(page, user, 'highlights_v22');
      }
    }

  } catch (error) {
    console.error("❌ CRITICAL ERROR:", error.message);
  } finally {
    await browser.close();
    console.log("⏹️ Bot Mission Finished.");
  }
}

/**
 * ❤️ Auto-Like & Media Capture
 */
async function captureAndLike(page, username, category) {
    for (let i = 0; i < 25; i++) {
        await new Promise(r => setTimeout(r, 6000)); // Media loading wait

        // 🔥 AUTO LIKE LOGIC
        await page.evaluate(() => {
            const likeBtn = document.querySelector('span[role="button"] svg[aria-label="Like"]')?.closest('button');
            if (likeBtn) {
                likeBtn.click();
                console.log("   ❤️ Liked the post!");
            }
        });

        const media = await page.evaluate(() => {
            const video = document.querySelector('video');
            const img = document.querySelector('img[decode="sync"]') || document.querySelector('img[alt*="Story"]');
            if (video && video.readyState >= 3) return { url: video.currentSrc || video.src, type: 'video' };
            if (img && img.complete) return { url: img.src, type: 'image' };
            return null;
        });

        if (media && media.url) {
            const isNew = await safeSync(media.url, username, category, media.type === 'video');
            
            // 🤖 GEMINI AI & WHATSAPP (Only for new items)
            if (isNew) {
                const aiDesc = await analyzeMedia(media.url);
                await updateAIDesc(username, media.url, aiDesc);
                await sendWhatsApp(`🔔 NEW CONTENT: @${username} ne kuch naya dala h!\n\n🤖 AI: ${aiDesc}\n📂 Type: ${media.type}`);
            }
        }

        await page.keyboard.press('ArrowRight');
        await new Promise(r => setTimeout(r, 2000));
        if (!await page.evaluate(() => window.location.href.includes('/stories/'))) break;
    }
}

/**
 * 👤 Profile Tracking (DP & Bio Changes)
 */
async function trackProfileChanges(page, username) {
    const profile = await page.evaluate(() => ({
        bio: document.querySelector('header section div:nth-child(3) span')?.innerText || "",
        dp: document.querySelector('header img')?.src || ""
    }));

    const docRef = db.collection("profile_tracking").doc(username);
    const doc = await docRef.get();

    if (!doc.exists || doc.data().bio !== profile.bio || doc.data().dp !== profile.dp) {
        await docRef.set({ ...profile, updated_at: admin.firestore.FieldValue.serverTimestamp() });
        await sendWhatsApp(`👤 PROFILE UPDATED: @${username} ka Bio ya DP change hua h! Check karo.`);
    }
}

/**
 * 🤖 Gemini AI Image Analysis
 */
async function analyzeMedia(url) {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = "Briefly describe what is happening in this Instagram image for a database log.";
        const result = await model.generateContent(prompt); // Note: Simple prompt for speed, can be enhanced
        return result.response.text();
    } catch (e) { return "No description available."; }
}

/**
 * 📱 WhatsApp Notification (CallMeBot)
 */
async function sendWhatsApp(message) {
    const phone = process.env.WHATSAPP_PHONE;
    const apiKey = process.env.WHATSAPP_API_KEY;
    const url = `https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${encodeURIComponent(message)}&apikey=${apiKey}`;
    try { await fetch(url); } catch (e) {}
}

async function safeSync(url, username, category, isVideo) {
    const mediaId = url.split('?')[0].split('/').pop().substring(0, 40); 
    const docId = `V22_${username}_${mediaId}`;
    const docRef = db.collection("archives").doc(docId);
    
    const doc = await docRef.get();
    if (doc.exists) return false;

    const upload = await cloudinary.uploader.upload(url, { 
        folder: `insta_vault_v22/${username}/${category}`, 
        resource_type: isVideo ? "video" : "image"
    });

    await docRef.set({ owner: username, url: upload.secure_url, type: category, time: admin.firestore.FieldValue.serverTimestamp() });
    return true;
}

async function updateAIDesc(username, url, desc) {
    const mediaId = url.split('?')[0].split('/').pop().substring(0, 40);
    const docId = `V22_${username}_${mediaId}`;
    await db.collection("archives").doc(docId).update({ ai_description: desc });
}

runBot();
