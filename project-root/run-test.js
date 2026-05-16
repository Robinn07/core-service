const axios = require('axios');

const CONFIG = {
    // Ensure this matches the port and route in your server.js
    URL: 'http://localhost:5000/api/v1/campaigns/send', 
    TOKEN: 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjNiMDk1NzQ3YmY4MzMxZWE0YWQ1M2YzNzBjNjMyNjAxNzliMGQyM2EiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vbG9vcHgtZDRjOWIiLCJhdWQiOiJsb29weC1kNGM5YiIsImF1dGhfdGltZSI6MTc3Njg2MTMzMiwidXNlcl9pZCI6ImQ0S28xaW5uQmJQSHg1SmFOQkhNZ0p2NjVCazEiLCJzdWIiOiJkNEtvMWlubkJiUEh4NUphTkJITWdKdjY1QmsxIiwiaWF0IjoxNzc2ODYxMzMyLCJleHAiOjE3NzY4NjQ5MzIsImVtYWlsIjoiYWJ1dGFsaGFzb2xhbmtpQGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjpmYWxzZSwiZmlyZWJhc2UiOnsiaWRlbnRpdGllcyI6eyJlbWFpbCI6WyJhYnV0YWxoYXNvbGFua2lAZ21haWwuY29tIl19LCJzaWduX2luX3Byb3ZpZGVyIjoicGFzc3dvcmQifX0.Mux8a3rAMHtbCXFCsc4o6Nx9nxEwKe9vrqI3atXeoaye2Dw3A8xy_0rjHMZpmxJtJ2s5NXWjg5hffI80PVEl_cQdY_OfbJeZRt2BAod_4W4PrQ9vyAZpDf2CxjvlbyrjgBcSRUYTG9dvjP3odK51XjyPpCCBQZHOKEhdcxRSro3B13APZxWy8oyNwgNUf5vqn2HD4_1YESGBNgT5LnN4g8xDI4tAPb8x-Y_T0iJm3J_A5XgAS3ST7p4bDq73poXi-lz0UV81e4NuVGysm1tzIDklRtjnBJmSikPsgdzMpahsk3wfEVjzBnwChVkTjYrI_LF736YvP2S0emFQY34-BQ',
    EMAIL: 'abutalhasolanki@gmail.com'
};

async function triggerCampaign() {
    console.log("📡 Sending request to GetLoopx Server...");

    try {
        const response = await axios.post(CONFIG.URL, {
            to: CONFIG.EMAIL,
            subject: "GetLoopx Production Test - Zero Manual Work",
            body: "<h1>It Works!</h1><p>The backend automatically provisioned this workspace and queued this email.</p>"
        }, {
            headers: {
                'Authorization': `Bearer ${CONFIG.TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        console.log("✅ Server Response:", response.data);
        console.log("\n--- Check Your Terminals ---");
        console.log("Terminal 1 (Server): Should log 'Provisioning workspace'");
        console.log("Terminal 2 (Worker): Should log 'Successfully connected' and 'Job completed'");
        
    } catch (error) {
        console.error("❌ Test Failed!");
        if (error.response) {
            console.error("Status:", error.response.status);
            console.error("Error Message:", error.response.data);
        } else {
            console.error(error.message);
        }
    }
}

triggerCampaign();