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
  console.log("🚀 GHOST_ENGINE: Sniper Mode V4 (Smart Wait Active)...");
  
  const browser = await puppeteer.launch({ 
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security'] 
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844 });
  await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1');

  try {
    // --- STEP 1: LOGIN WITH SMART WAIT ---
    console.log(`🔑 Logging in as: ${process.env.INSTA_USER}`);
    await page.goto('https://www.instagram.com/accounts/login/', { waitUntil: 'networkidle2', timeout: 60000 });

    try {
      // Ab bot 20 seconds tak wait karega dabba dikhne ka
      console.log("⏳ Waiting for login fields...");
      await page.waitForSelector('input[name="username"]', { visible: true, timeout: 20000 });
    } catch (e) {
      console.log("❌ SELECTOR ERROR: Page slow hai ya Instagram ne block kiya. Taking screenshot...");
      const debugImg = await page.screenshot();
      await new Promise(res => cloudinary.uploader.upload_stream({ folder: "debug", public_id: "selector_fail" }, res).end(debugImg));
      throw new Error("Login field nahi mila.");
    }

    // Type credentials with human-like delay
    await page.type('input[name="username"]', process.env.INSTA_USER, { delay: 150 });
    await page.type('input[name="password"]', process.env.INSTA_PASS, { delay: 150 });
    
    await Promise.all([
        page.click('button[type="submit"]'),
        page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 }).catch(() => {})
    ]);

    console.log("⏳ Verifying Session...");
    await new Promise(r => setTimeout(r, 10000)); 

    const isLoggedIn = await page.evaluate(() => !document.body.innerText.includes('Log In'));
    if (!isLoggedIn) {
        console.log("❌ LOGIN FAILED: Account might be asking for OTP/Checkpoint.");
        const failImg = await page.screenshot();
        await new Promise(res => cloudinary.uploader.upload_stream({ folder: "debug", public_id: "login_blocked" }, res).end(failImg));
        return;
    }
    console.log("✅ LOGIN SUCCESS: Ghost is inside!");

    // --- STEP 2: TARGET SCANNING ---
    const targetUsers = ["_anshu_2101", "_cool_butterfly_.6284", "dee_pu3477", "ritu_singh785903"];

    for (const user of targetUsers) {
      console.log(`\n📡 TARGETING: @${user}`);
      await page.goto(`https://www.instagram.com/${user}/`, { waitUntil: 'networkidle2' });
      await new Promise(r => setTimeout(r, 6000));

      const mediaFound = await page.evaluate(() => {
        const items = Array.from(document.querySelectorAll('img[srcset], article img, video, div._aagv img'))
                           .map(el => el.src || el.srcset?.split(' ')[0] || el.querySelector('source')?.src)
                           .filter(src => src && src.includes('cdninstagram.com'));
        return [...new Set(items)];
      });

      console.log(`   📊 Found ${mediaFound.length} items.`);
      for (const mUrl of mediaFound) {
        await safeUpload(mUrl, user, mUrl.includes('.mp4') ? 'videos' : 'posts');
      }

      // Highlights Snipe for dee_pu3477
      if (user === "dee_pu3477") {
          console.log(`   └─ Sniping Highlights...`);
          await page.goto(`https://www.instagram.com/stories/highlights/18059274617459516/`, { waitUntil: 'networkidle2' });
          await new Promise(r => setTimeout(r, 5000));
          const hMedia = await page.evaluate(() => {
            const s = Array.from(document.querySelectorAll('img[srcset], video source')).map(el => el.src || el.srcset?.split(' ')[0]);
            return s.filter(src => src && src.includes('cdninstagram'));
          });
          for (const hmUrl of hMedia) await safeUpload(hmUrl, user, 'highlights');
      }
    }

  } catch (error) {
    console.error("❌ Fatal Error:", error.message);
  } finally {
    await browser.close();
    console.log("🏁 All targets cleared. Engine Standby.");
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
