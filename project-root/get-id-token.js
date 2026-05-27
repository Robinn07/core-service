const axios = require('axios');
const API_KEY = "YOUR_FIREBASE_WEB_API_KEY";
const customToken = "YOUR_CUSTOM_TOKEN_HERE";

async function getIdToken() {
  try {
    const response = await axios.post(`https://www.googleapis.com/identitytoolkit/v3/relyingparty/verifyCustomToken?key=${API_KEY}`, {
      token: customToken,
      returnSecureToken: true
    });
    console.log(response.data.idToken);
  } catch (error) {
    console.error(error.response ? error.response.data : error.message);
  }
}
getIdToken();
