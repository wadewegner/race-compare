const express = require('express');
const path = require('path');
const { convertTimeToMinutes } = require('./utils/timeUtils');
const app = express();
const port = process.env.PORT || 8080;

// Set up middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));

// Redirect from walrus URL to racetimeinsights.com
app.use((req, res, next) => {
    if (req.hostname === 'walrus-app-hhf9v.ondigitalocean.app') {
        return res.redirect(301, 'https://racetimeinsights.com' + req.url);
    }
    next();
});

// Set EJS as templating engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

// Routes
app.get('/', (req, res) => {
    res.render('index');
});

app.post('/compare', async (req, res) => {
    try {
        const { raceUrl1, raceUrl2, runnerName } = req.body;
        const raceService = require('./services/raceService');
        
        // Get both the comparison results and the individual race results
        const { matches, athletes1, athletes2 } = await raceService.compareRaces(raceUrl1, raceUrl2);

        // Find user's result and calculate closest matches
        let userResult = null;
        let closestMatches = [];

        if (runnerName) {
            const normalizedUserName = runnerName.toLowerCase().trim();
            const [firstName, lastName] = normalizedUserName.split(' ');
            
            userResult = athletes1.find(a => {
                const normalizedName = a.originalName.toLowerCase().trim();
                return normalizedName === normalizedUserName || // Exact match
                       normalizedName === `${lastName}, ${firstName}`; // Last, First format
            });

            if (userResult) {
                const userTimeMinutes = convertTimeToMinutes(userResult.time);
                const matchesWithDiff = matches.map(result => ({
                    ...result,
                    timeDiff: Math.abs(convertTimeToMinutes(result.race1Time) - userTimeMinutes)
                }));
                
                closestMatches = matchesWithDiff
                    .sort((a, b) => a.timeDiff - b.timeDiff)
                    .slice(0, 1)
                    .map(match => match.name);
            }
        }
        
        res.render('results', { 
            results: matches,
            athletes1: athletes1 || [],
            athletes2: athletes2 || [],
            runnerName,
            userResult,
            closestMatches
        });
    } catch (error) {
        res.render('results', { 
            results: [],
            athletes1: [],
            athletes2: [],
            runnerName: req.body.runnerName,
            error: error.message
        });
    }
});

// Add global error handler
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

app.listen(port, '0.0.0.0', () => {
    console.log(`Server starting on port ${port}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
}); 