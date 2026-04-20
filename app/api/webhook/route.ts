import { NextResponse } from 'next/server';
import { db } from '../../../lib/firebase';
import { 
  doc, 
  getDoc, 
  setDoc, 
  serverTimestamp, 
  collection, 
  addDoc 
} from 'firebase/firestore';

// 1. META VERIFICATION (GET) - Green Tick & Sound Logic
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  try {
    // Firestore se woh token mangwao jo tumne Setup page par save kiya hai
    const configSnap = await getDoc(doc(db, "config", "meta"));
    const dbVerifyToken = configSnap.exists() ? configSnap.data().verifyToken : null;

    if (mode === 'subscribe' && token === dbVerifyToken) {
      console.log('WEBHOOK_VERIFIED');

      // 🔥 SUCCESS: Firestore mein verified status update karo (Blue Tick Trigger)
      await setDoc(doc(db, "system", "status"), {
        verified: true,
        last_verified: serverTimestamp(),
        connection: "active"
      }, { merge: true });

      // Meta ko challenge wapas bhejo (Zaroori hai)
      return new Response(challenge, { status: 200 });
    }

    console.log('VERIFICATION_FAILED: Token mismatch or not found');
    return new Response('Verification Failed', { status: 403 });

  } catch (error) {
    console.error("Verification Error:", error);
    return new Response('Server Error', { status: 500 });
  }
}

// 2. DATA HANDLING (POST) - Messages, Stories, Buttons
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const entry = body.entry?.[0];
    const messaging = entry?.messaging?.[0];
    const senderId = messaging?.sender?.id;

    // System Status Update (Live indicator ke liye)
    await setDoc(doc(db, "system", "status"), {
      last_active: serverTimestamp(),
      connection: "active"
    }, { merge: true });

    if (messaging) {
      const logRef = collection(db, "automation_logs");
      const baseData = {
        senderId,
        raw_data: body,
        time: serverTimestamp(),
      };

      // --- FEATURE: Story Mentions ---
      if (messaging.message?.reply_to?.story || messaging.message?.text?.includes("mentioned you")) {
        await addDoc(logRef, { ...baseData, type: 'story_mention' });
      }

      // --- FEATURE: Media (Images/Video/Voice) ---
      else if (messaging.message?.attachments) {
        await addDoc(logRef, { 
          ...baseData, 
          type: 'media_received', 
          attachments: messaging.message.attachments 
        });
      }

      // --- FEATURE: Interactive Buttons / Quick Replies ---
      else if (messaging.postback || messaging.message?.quick_reply) {
        const payload = messaging.postback?.payload || messaging.message?.quick_reply?.payload;
        await addDoc(logRef, { ...baseData, type: 'button_click', payload });
      }

      // --- FEATURE: Normal Text Message ---
      else if (messaging.message?.text) {
        await addDoc(logRef, { ...baseData, type: 'text_message', text: messaging.message.text });
      }
    }

    return NextResponse.json({ status: 'success' }, { status: 200 });
  } catch (error) {
    console.error("Webhook POST Error:", error);
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}
