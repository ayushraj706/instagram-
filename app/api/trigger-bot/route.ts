import { NextResponse } from 'next/server';

export async function POST() {
  const GITHUB_TOKEN = process.env.GITHUB_PAT; // GitHub Personal Access Token
  const REPO_OWNER = "ayushraj706";
  const REPO_NAME = "Instagram-";

  try {
    const res = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/dispatches`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event_type: 'start_ghost_automation', // Wahi naam jo .yml mein hai
      }),
    });

    if (res.ok) return NextResponse.json({ success: true });
    return NextResponse.json({ success: false }, { status: 500 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to trigger' }, { status: 500 });
  }
}

