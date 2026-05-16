const express = require('express');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

// Function to handle sign-up and sync with Retentioneering
async function signUpUser(userData) {
    const userId = uuidv4(); 
    
    try {
        // Pinging the Ingestion Gateway instead of Analytics directly
        // Note: Ingestion is on 3000, Analytics on 8080
        await axios.post('http://localhost:3000/track-event', {
            orgId: "test-org",
            userId: userId,
            event_type: 'email_sent', // Changed to a valid event type for the system
            channel: 'EMAIL',
            campaignId: 'signup-welcome',
            metadata: { 
                email: userData.email, 
                source: 'Getloopx'
            }
        }, {
            headers: { 'X-API-Key': 'test-api-key' }
        });
        console.log(`[Ingestion] Identity synced for user: ${userId}`);
    } catch (err) {
        console.error("[Ingestion] Sync failed:", err.message);
    }
    
    return userId;
}

// Route to trigger a test sign-up
router.post('/signup', async (req, res) => {
    const { email } = req.body;
    
    if (!email) {
        return res.status(400).json({ error: "Email is required" });
    }

    const userId = await signUpUser({ email });
    
    res.status(201).json({
        message: "User created successfully",
        user_id: userId,
        enterprise: "Getloopx"
    });
});

// Health check endpoint
router.get('/status', (req, res) => {
    res.json({ status: "Auth router is live", system: "A&M Hub Auth" });
});

module.exports = router;