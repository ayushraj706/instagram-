const puppeteer = require('puppeteer');
const cloudinary = require('cloudinary').v2;
const admin = require('firebase-admin');

// 1. Cloudinary Setup
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 2. Firebase Setup
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_KEY))
  });
}
const db = admin.firestore();

async function runBot() {
  console.log("🚀 GHOST_ENGINE: Triple-Combo Mode (Cookies + Choose Account)...");
  
  const browser = await puppeteer.launch({ 
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security'] 
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844 });
  await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1');

  try {
    // --- STEP 1: LOAD COOKIES FIRST ---
    if (process.env.INSTA_COOKIES) {
      console.log("🍪 Loading existing cookies to trigger account recognition...");
      const cookies = JSON.parse(process.env.INSTA_COOKIES);
      await page.setCookie(...cookies);
    }

    console.log("🔑 Opening Instagram Login Page...");
    await page.goto('https://www.instagram.com/accounts/login/', { waitUntil: 'networkidle2', timeout: 60000 });
    await new Promise(r => setTimeout(r, 7000));

    // --- STEP 2: SMART "CHOOSE ACCOUNT" CLICKER ---
    const targetUser = process.env.INSTA_USER || "ayush_raj6888";
    
    const accountClicked = await page.evaluate((user) => {
      // Dhoondho ki kya page par kahi tumhara username likha h
      const elements = Array.from(document.querySelectorAll('button, div[role="button"], span'));
      const targetBtn = elements.find(el => el.textContent.includes(user));
      
      if (targetBtn) {
        const clickable = targetBtn.closest('button') || targetBtn.closest('div[role="button"]') || targetBtn;
        clickable.click();
        return true;
      }
      return false;
    }, targetUser);

    if (accountClicked) {
      console.log(`   🖱️ Account ${targetUser} found! Clicking to bypass username field...`);
      await new Promise(r => setTimeout(r, 4000));
    }

    // --- STEP 3: PASSWORD ENTRY ---
    try {
      console.log("⏳ Waiting for password field...");
      await page.waitForSelector('input[name="password"]', { visible: true, timeout: 15000 });
      
      // Agar username field khali h aur account click nahi hua, toh username bhi bhar do (Fallback)
      const needsUser = await page.evaluate(() => {
        const userField = document.querySelector('input[name="username"]');
        return userField && userField.value === "";
      });

      if (needsUser) {
        await page.type('input[name="username"]', process.env.INSTA_USER, { delay: 100 });
      }

      await page.type('input[name="password"]', process.env.INSTA_PASS, { delay: 100 });
      await page.click('button[type="submit"]');
      console.log("🚀 Login button clicked. Waiting for redirection...");
      await new Promise(r => setTimeout(r, 12000));
    } catch (e) {
      console.log("⚠️ Password field nahi mila ya login page different h. Taking debug shot...");
      const shot = await page.screenshot();
      await new Promise(res => cloudinary.uploader.upload_stream({ folder: "debug", public_id: "login_step_fail" }, res).end(shot));
    }

    // --- STEP 4: VERIFY & SCAN ---
    const isLoggedIn = await page.evaluate(() => !document.body.innerText.includes('Log In'));
    if (!isLoggedIn) {
        console.log("❌ LOGIN FAIL: Abhi bhi bahar h. Check debug folder in Cloudinary.");
        return;
    }
    console.log("✅ LOGIN SUCCESS! Scanning targets...");

    const targetUsers = ["_anshu_2101", "_cool_butterfly_.6284", "dee_pu3477", "ritu_singh785903"];

    for (const user of targetUsers) {
      console.log(`\n📡 SCANNING: @${user}`);
      await page.goto(`https://www.instagram.com/${user}/`, { waitUntil: 'networkidle2' });
      await new Promise(r => setTimeout(r, 6000));

      const media = await page.evaluate(() => {
        const items = Array.from(document.querySelectorAll('article img, div._aagv img, video, img[srcset]'))
                           .map(el => el.src || el.srcset?.split(' ')[0] || el.querySelector('source')?.src)
                           .filter(src => src && src.includes('cdninstagram.com'));
        return [...new Set(items)];
      });

      console.log(`   📊 Found ${media.length} items.`);
      for (const mUrl of media) {
        await safeUpload(mUrl, user, mUrl.includes('.mp4') ? 'videos' : 'posts');
      }
    }

  } catch (error) {
    console.error("❌ Fatal Error:", error.message);
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
