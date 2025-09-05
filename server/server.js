require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { google } = require('googleapis');

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors()); // In production, you should configure this more securely
app.use(express.json());

// --- Serve Static Files ---
// This serves the main website files from the root directory
app.use(express.static(path.join(__dirname, '..')));
// This serves the admin panel files from the admin directory
app.use('/admin', express.static(path.join(__dirname, '..', 'admin')));


// --- Google Analytics Client Initialization ---
let auth;
let analyticsdata;
try {
    auth = new google.auth.GoogleAuth({
        credentials: {
            client_email: process.env.GOOGLE_CLIENT_EMAIL,
            private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        },
        scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
    });
    analyticsdata = google.analyticsdata({ version: 'v1beta', auth });
} catch (error) {
    console.error("Failed to initialize Google Analytics client:", error);
    console.error("Please ensure GOOGLE_CLIENT_EMAIL and GOOGLE_PRIVATE_KEY are set correctly in your .env file.");
}


// --- API Route for Analytics ---
app.get('/api/analytics', async (req, res) => {
    const propertyId = process.env.GA_PROPERTY_ID;

    if (!analyticsdata) {
        return res.status(500).json({ error: 'Analytics client is not initialized. Check server logs for details.' });
    }

    if (!propertyId) {
        return res.status(500).json({ error: 'GA_PROPERTY_ID not found in environment variables.' });
    }

    try {
        console.log(`Fetching report for property: properties/${propertyId}`);
        const [response] = await analyticsdata.properties.runReport({
            property: `properties/${propertyId}`,
            requestBody: {
                dateRanges: [
                    {
                        startDate: '28daysAgo',
                        endDate: 'today',
                    },
                ],
                metrics: [
                    { expression: 'activeUsers' },
                    { expression: 'screenPageViews' },
                    { expression: 'bounceRate' },
                ],
            }
        });

        const metrics = {
            activeUsers: '0',
            screenPageViews: '0',
            bounceRate: '0.00'
        };

        if (response.rows && response.rows.length > 0) {
            response.metricHeaders.forEach((header, index) => {
                const metricName = header.name;
                const metricValue = response.rows[0].metricValues[index].value;
                metrics[metricName] = metricValue;
            });
        } else {
            console.log('No data returned from Google Analytics API for the given period.');
        }

        res.json({
            totalVisitors: metrics.activeUsers,
            pageViews: metrics.screenPageViews,
            bounceRate: (parseFloat(metrics.bounceRate) * 100).toFixed(2) + '%',
        });

    } catch (error) {
        console.error('Error fetching Google Analytics data:', error);
        res.status(500).json({
            error: 'Failed to fetch analytics data.',
            details: error.message
        });
    }
});

// --- Fallback for direct navigation ---
// This sends the admin.html file for any routes starting with /admin
app.get('/admin/*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'admin', 'admin.html'));
});

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
    console.log('Project is now ready for deployment on Render.');
});
