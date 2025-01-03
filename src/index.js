const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 8080;

// Set up middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));

// Set EJS as templating engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

// Routes
app.get('/', (req, res) => {
    res.render('index');
});

app.post('/compare', async (req, res) => {
    try {
        const { raceUrl1, raceUrl2 } = req.body;
        const raceService = require('./services/raceService');
        
        // Get both the comparison results and the individual race results
        const { matches, athletes1, athletes2 } = await raceService.compareRaces(raceUrl1, raceUrl2);
        
        res.render('results', { 
            results: matches,
            athletes1: athletes1 || [],
            athletes2: athletes2 || []
        });
    } catch (error) {
        res.render('results', { 
            results: [],
            athletes1: [],
            athletes2: [],
            error: error.message
        });
    }
});

app.listen(port, '0.0.0.0', () => {
    console.log(`Server starting on port ${port}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
    
    // Show clickable URL in development mode
    if (process.env.NODE_ENV === 'development') {
        console.log(`\nServer running at http://localhost:${port}`);
    }
}); 