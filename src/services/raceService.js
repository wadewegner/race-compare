const puppeteer = require('puppeteer');

class RaceService {
    static async fetchRaceResults(url) {
        let browser;
        try {
            const options = {
                headless: 'new',
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-gpu',
                    '--no-zygote',
                    '--single-process',
                    '--disable-extensions',
                    '--disable-software-rasterizer',
                    '--disable-accelerated-2d-canvas',
                    '--disable-web-security',
                    '--no-first-run',
                    '--window-size=1280,800'
                ],
                executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium-browser',
                protocolTimeout: 60000,
                timeout: 60000
            };

            // Add environment info logging
            console.log('Environment details:');
            console.log('- Current user:', require('os').userInfo().username);
            console.log('- Current directory:', process.cwd());
            console.log('- Chrome path exists:', require('fs').existsSync('/usr/bin/chromium-browser'));
            console.log('- Process memory:', process.memoryUsage());
            console.log('- Environment variables:', {
                PUPPETEER_EXECUTABLE_PATH: process.env.PUPPETEER_EXECUTABLE_PATH,
                CHROME_PATH: process.env.CHROME_PATH,
                NODE_ENV: process.env.NODE_ENV
            });

            console.log('Launching browser with options:', JSON.stringify(options, null, 2));
            browser = await puppeteer.launch(options);
            const page = await browser.newPage();
            
            // Set a reasonable viewport
            await page.setViewport({ width: 1280, height: 800 });
            
            console.log(`Navigating to ${url}`);
            
            // More robust navigation with timeout and waitUntil conditions
            await page.goto(url, { 
                waitUntil: ['networkidle0', 'domcontentloaded'],
                timeout: 30000 
            });

            // Use setTimeout instead of waitForTimeout
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Different handling for each site
            if (url.includes('ultrasignup.com')) {
                await page.waitForSelector('tr', { timeout: 10000 });
            } else {
                // For Pacific Multisports
                const iframe = await page.$('iframe');
                if (iframe) {
                    console.log('Found iframe, switching context...');
                    const frame = page.frames().find(frame => frame.url().includes('raceresult.com'));
                    if (frame) {
                        console.log('Switched to iframe context');
                        await frame.waitForSelector('table', { timeout: 5000 });
                        const content = await frame.content();
                        return { type: 'pacific', html: content };
                    }
                }
            }

            // Get the rendered HTML
            const content = await page.content();
            console.log('Page loaded successfully');

            return { 
                type: url.includes('ultrasignup.com') ? 'ultrasignup' : 'pacific', 
                html: content 
            };
        } catch (error) {
            console.error('Error details:', error);
            throw new Error(`Failed to fetch race results: ${error.message}`);
        } finally {
            if (browser) {
                await browser.close();
            }
        }
    }

    static normalizeAthleteName(name) {
        if (!name) return '';
        return name.toLowerCase()
            .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    static extractAthletes(response) {
        const athletes = [];
        const $ = require('cheerio').load(response.html);

        if (response.type === 'ultrasignup') {
            console.log('Processing UltraSignup results');
            
            $('tr').each((i, element) => {
                const $row = $(element);
                const firstname = $row.find('td[aria-describedby="list_firstname"]').text().trim();
                const lastname = $row.find('td[aria-describedby="list_lastname"]').text().trim();
                const time = $row.find('td[aria-describedby="list_formattime"]').text().trim();
                
                if (firstname && lastname && time && time !== '0' && time !== '--:--:--') {
                    const name = `${firstname} ${lastname}`;
                    console.log('Found UltraSignup athlete:', { name, time });
                    athletes.push({
                        name: this.normalizeAthleteName(name),
                        originalName: name,
                        time: time
                    });
                }
            });
        } else if (response.type === 'pacific') {
            // Pacific Multisports format
            console.log('Processing Pacific Multisports results');
            
            const selectors = [
                'table tbody tr',
                '.list-table tr',
                '#results-table tr',
                'tr'  // Most generic fallback
            ];

            for (const selector of selectors) {
                console.log(`Trying selector: ${selector}`);
                $(selector).each((i, element) => {
                    const $row = $(element);
                    const cells = $row.find('td');
                    
                    if (cells.length >= 8) {  // Make sure we have enough cells
                        const name = $(cells[3]).text().trim();    // Name is in the 4th column (index 3)
                        const time = $(cells[6]).text().trim();    // Time is in the 7th column (index 6)
                        
                        if (name && time && !name.toLowerCase().includes('name') && time !== '00:00:00') {
                            console.log('Found Pacific athlete:', { name, time });
                            athletes.push({
                                name: this.normalizeAthleteName(name),
                                originalName: name,
                                time: time
                            });
                        }
                    }
                });

                if (athletes.length > 0) {
                    console.log(`Found athletes using selector: ${selector}`);
                    break;
                }
            }
        }

        // Debug logging
        console.log(`Found ${athletes.length} athletes from ${response.type}`);
        if (athletes.length > 0) {
            console.log('First athlete:', athletes[0]);
            console.log('Last athlete:', athletes[athletes.length - 1]);
        }

        return athletes;
    }

    static isNameMatch(name1, name2) {
        const n1 = this.normalizeAthleteName(name1);
        const n2 = this.normalizeAthleteName(name2);

        if (!n1 || !n2) return false;

        // Split names into parts and filter out very short parts
        const parts1 = n1.split(' ').filter(p => p.length > 1);
        const parts2 = n2.split(' ').filter(p => p.length > 1);

        // Both names must have at least 2 parts
        if (parts1.length < 2 || parts2.length < 2) return false;

        // Check for exact match
        if (n1 === n2) return true;

        // Check for reversed match (e.g., "Puppi, Francesco" vs "Francesco Puppi")
        const reversed1 = [...parts1].reverse().join(' ');
        if (reversed1 === n2) return true;

        // Otherwise, require both first and last name to match exactly
        const firstName1 = parts1[0];
        const lastName1 = parts1[parts1.length - 1];
        const firstName2 = parts2[0];
        const lastName2 = parts2[parts2.length - 1];

        return (firstName1 === firstName2 && lastName1 === lastName2) ||
               (firstName1 === lastName2 && lastName1 === firstName2);
    }

    static async compareRaces(url1, url2) {
        console.log('Fetching results from:', url1);
        const html1 = await this.fetchRaceResults(url1);
        console.log('Fetching results from:', url2);
        const html2 = await this.fetchRaceResults(url2);

        const athletes1 = this.extractAthletes(html1);
        const athletes2 = this.extractAthletes(html2);

        const matches = [];

        athletes1.forEach(athlete1 => {
            athletes2.forEach(athlete2 => {
                if (this.isNameMatch(athlete1.name, athlete2.name)) {
                    matches.push({
                        name: athlete1.originalName,
                        race1Time: athlete1.time,
                        race2Time: athlete2.time
                    });
                }
            });
        });

        return {
            matches,
            athletes1,
            athletes2
        };
    }
}

module.exports = RaceService; 