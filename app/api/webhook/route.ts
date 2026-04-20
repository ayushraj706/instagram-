import { NextResponse } from 'next/server';
import { db } from '../../../lib/firebase';
import { 
  doc, getDoc, setDoc, serverTimestamp, collection, addDoc 
} from 'firebase/firestore';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 1. META VERIFICATION (GET)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  try {
    const configSnap = await getDoc(doc(db, "config", "meta"));
    const dbVerifyToken = configSnap.exists() ? configSnap.data().verifyToken : null;

    if (mode === 'subscribe' && token === dbVerifyToken) {
      await setDoc(doc(db, "system", "status"), {
        verified: true,
        last_verified: serverTimestamp(),
        connection: "active"
      }, { merge: true });
      return new Response(challenge, { status: 200 });
    }
    return new Response('Verification Failed', { status: 403 });
  } catch (error) {
    return new Response('Server Error', { status: 500 });
  }
}

// 2. MAIN ENGINE (POST)
export async function POST(request: Request) {
  const startTime = Date.now(); // Performance track karne ke liye
  
  try {
    const body = await request.json();
    const messaging = body.entry?.[0]?.messaging?.[0];
    if (!messaging) return NextResponse.json({ status: 'no_msg' });

    const senderId = messaging.sender.id;
    const logRef = collection(db, "automation_logs");
    const statusSnap = await getDoc(doc(db, "system", "status"));
    const status = statusSnap.data();

    // System Check: Kya Engine ON hai?
    if (!status?.enabled) {
      return NextResponse.json({ status: 'engine_disabled' });
    }

    // Performance log metadata
    let executionMeta = {
      status: 200,
      ai_triggered: false,
      media_synced: false
    };

    // --- FEATURE: Media to Cloudinary ---
    if (messaging.message?.attachments) {
      for (const attachment of messaging.message.attachments) {
        const uploadRes = await cloudinary.uploader.upload(attachment.payload.url, {
          folder: `basekey/user_${senderId}`,
          resource_type: "auto"
        });
        await addDoc(logRef, { type: 'media', senderId, url: uploadRes.secure_url, time: serverTimestamp() });
        executionMeta.media_synced = true;
      }
    }

    // --- FEATURE: AI Logic (Only if aiActive is true) ---
    if (messaging.message?.text) {
      const userText = messaging.message.text;
      const chatRef = collection(db, `chats/${senderId}/messages`);
      await addDoc(chatRef, { content: userText, sender: 'user', time: serverTimestamp() });

      if (status?.aiActive) {
        const configSnap = await getDoc(doc(db, "config", "meta"));
        const config = configSnap.data();
        
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent(userText);
        const aiReply = result.response.text();

        // Send to Instagram
        const metaRes = await fetch(`https://graph.facebook.com/v19.0/me/messages?access_token=${config?.accessToken}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ recipient: { id: senderId }, message: { text: aiReply } })
        });

        if (metaRes.ok) {
          await addDoc(chatRef, { content: aiReply, sender: 'bot', time: serverTimestamp() });
          await addDoc(logRef, { type: 'ai_reply', senderId, text: aiReply, time: serverTimestamp() });
          executionMeta.ai_triggered = true;
        } else {
          executionMeta.status = metaRes.status;
        }
      } else {
        // AI Off hai toh bas manual log bnao
        await addDoc(logRef, { type: 'manual_receive', senderId, text: userText, time: serverTimestamp() });
      }
    }

    // --- FINAL LOG: Vercel-style performance log save karo ---
    const endTime = Date.now();
    await addDoc(collection(db, "system_logs"), {
      path: "/api/webhook",
      method: "POST",
      latency: `${endTime - startTime}ms`,
      status: executionMeta.status,
      details: executionMeta,
      timestamp: serverTimestamp()
    });

    return NextResponse.json({ status: 'success' });

  } catch (error: any) {
    console.error("Webhook Error:", error);
    // Error log save karo
    await addDoc(collection(db, "system_logs"), {
      path: "/api/webhook",
      status: 500,
      error: error.message,
      timestamp: serverTimestamp()
    });
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}
