const puppeteer = require('puppeteer');
const cloudinary = require('cloudinary').v2;
const admin = require('firebase-admin');
const path = require('path');

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

// Helper Function for Debug Screenshots
async function debugSnap(page, stepName) {
  try {
    const shot = await page.screenshot({ fullPage: false });
    await new Promise((resolve) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: `debug/steps`, public_id: `step_${stepName}`, overwrite: true },
        () => resolve()
      );
      stream.end(shot);
    });
    console.log(`📸 Screenshot Saved: Step ${stepName}`);
  } catch (e) { console.log("Failed to take debug snap"); }
}

async function runBot() {
  console.log("🚀 GHOST_ENGINE: Sniper Mode V6 (5-Step Debug Active)...");
  
  const browser = await puppeteer.launch({ 
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security'] 
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844 });
  await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1');

  try {
    // 1. Initial Page Load
    if (process.env.INSTA_COOKIES) {
      await page.setCookie(...JSON.parse(process.env.INSTA_COOKIES));
    }
    console.log("🔑 Loading Login Page...");
    await page.goto('https://www.instagram.com/accounts/login/', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 7000));
    await debugSnap(page, "1_Initial_Load"); // SNAP 1

    // 2. Choose Account Logic
    const targetUser = process.env.INSTA_USER || "ayush_raj6888";
    const clicked = await page.evaluate((user) => {
      const btn = Array.from(document.querySelectorAll('*')).find(el => el.textContent.trim().includes(user));
      if (btn) {
        const c = btn.closest('button') || btn.closest('div[role="button"]') || btn;
        c.click(); return true;
      }
      return false;
    }, targetUser);

    if (clicked) {
      console.log("🖱️ Account clicked...");
      await new Promise(r => setTimeout(r, 5000));
      await debugSnap(page, "2_After_Account_Click"); // SNAP 2
    }

    // 3. Password Entry
    const passBox = await page.$('input[name="password"]');
    if (passBox) {
      await page.type('input[name="password"]', process.env.INSTA_PASS, { delay: 150 });
      await page.click('button[type="submit"]');
      await new Promise(r => setTimeout(r, 8000));
      await debugSnap(page, "3_After_Password_Submit"); // SNAP 3
    }

    // 4. Verify Login
    console.log("⏳ Waiting for Dashboard...");
    await new Promise(r => setTimeout(r, 10000));
    await debugSnap(page, "4_Login_Result"); // SNAP 4

    const isLoggedIn = await page.evaluate(() => {
        return !document.body.innerText.includes('Log In') && (!!document.querySelector('nav') || !!document.querySelector('a[href*="/direct/inbox/"]'));
    });

    if (!isLoggedIn) {
      console.log("❌ LOGIN FAILED. Ending cycle.");
      return;
    }

    // 5. Targeting First Profile
    const targetUsers = ["_anshu_2101", "_cool_butterfly_.6284", "dee_pu3477", "ritu_singh785903"];
    
    console.log(`📡 Scanning: @${targetUsers[0]}`);
    await page.goto(`https://www.instagram.com/${targetUsers[0]}/`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 6000));
    await debugSnap(page, "5_First_Target_Profile"); // SNAP 5

    // Baaki targets loop...
    for (const user of targetUsers) {
      if (user !== targetUsers[0]) {
        await page.goto(`https://www.instagram.com/${user}/`, { waitUntil: 'networkidle2' });
        await new Promise(r => setTimeout(r, 5000));
      }
      
      const media = await page.evaluate(() => {
        const items = Array.from(document.querySelectorAll('img[srcset], article img, video, div._aagv img'))
                           .map(el => el.src || el.srcset?.split(' ')[0] || el.querySelector('source')?.src)
                           .filter(src => src && src.includes('cdninstagram.com'));
        return [...new Set(items)];
      });

      console.log(`   📊 @${user}: Found ${media.length} items.`);
      for (const mUrl of media) await safeUpload(mUrl, user, mUrl.includes('.mp4') ? 'videos' : 'posts');
    }

  } catch (error) {
    console.error("❌ ERROR:", error.message);
  } finally {
    await browser.close();
    console.log("🏁 Cycle Complete.");
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
      folder: `insta_vault/${username}/${category}`,
      resource_type: "auto"
    });

    await docRef.set({
      owner: username,
      url: upload.secure_url,
      type: category,
      time: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log(`      ✅ Saved [${category}]`);
  } catch (e) {}
}

runBot();
