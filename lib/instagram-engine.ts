const FACEBOOK_API_URL = 'https://graph.facebook.com/v19.0';

export const InstagramEngine = {
  // 1. Send Simple Text
  sendText: async (senderId: string, text: string, accessToken: string) => {
    return fetch(`${FACEBOOK_API_URL}/me/messages?access_token=${accessToken}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipient: { id: senderId },
        message: { text: text }
      })
    });
  },

  // 2. Send Buttons (Professional Interactive Feature)
  sendButtons: async (senderId: string, text: string, buttons: any[], accessToken: string) => {
    return fetch(`${FACEBOOK_API_URL}/me/messages?access_token=${accessToken}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipient: { id: senderId },
        message: {
          attachment: {
            type: "template",
            payload: {
              template_type: "generic",
              elements: [{
                title: "BaseKey Menu",
                subtitle: text,
                buttons: buttons // Max 3 buttons
              }]
            }
          }
        }
      })
    });
  }
};

