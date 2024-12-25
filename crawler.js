const axios = require('axios');
const cheerio = require('cheerio');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Define the crawler
class LinkedInCrawler {
    constructor() {
        this.results = [];
        this.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        };
    }

    async fetchPage(url) {
        try {
            const response = await axios.get(url, { headers: this.headers });
            return response.data;
        } catch (error) {
            console.error(`Error fetching URL: ${url}`, error.message);
            return null;
        }
    }

    parseProfile(html) {
        const $ = cheerio.load(html);

        const name = $('h1.text-heading-xlarge').text().trim() || 'N/A';
        const jobTitle = $('div.text-body-medium').first().text().trim() || 'N/A';
        const location = $('span.text-body-small').first().text().trim() || 'N/A';
        const summary = $('#about').text().trim() || 'N/A';

        return { Name: name, JobTitle: jobTitle, Location: location, Summary: summary };
    }

    parseCompany(html) {
        const $ = cheerio.load(html);

        const companyName = $('h1.org-top-card-summary__title').text().trim() || 'N/A';
        const industry = $('div.org-top-card-summary__industry').text().trim() || 'N/A';
        const headquarters = $('div.org-top-card-summary__headquarter').text().trim() || 'N/A';
        const about = $('section.org-about-us-organization-description').text().trim() || 'N/A';

        return { CompanyName: companyName, Industry: industry, Headquarters: headquarters, About: about };
    }

    async crawl(urls, pageType = 'profile') {
        for (const url of urls) {
            console.log(`Fetching: ${url}`);
            const html = await this.fetchPage(url);
            if (!html) continue;

            let data;
            if (pageType === 'profile') {
                data = this.parseProfile(html);
            } else if (pageType === 'company') {
                data = this.parseCompany(html);
            } else {
                console.error(`Invalid page type: ${pageType}`);
                continue;
            }

            this.results.push(data);
            await delay(Math.random() * 2000 + 1000); // Random delay between requests (1-3 seconds)
        }
    }

    async saveToCSV(filename) {
        const csvWriter = createCsvWriter({
            path: filename,
            header: Object.keys(this.results[0]).map(key => ({ id: key, title: key }))
        });

        await csvWriter.writeRecords(this.results);
        console.log(`Results saved to ${filename}`);
    }
}

// Example Usage
(async () => {
    const crawler = new LinkedInCrawler();

    // Example LinkedIn public URLs (Replace with actual URLs)
    const profileUrls = [
        'https://www.linkedin.com/in/example-profile/',
        'https://www.linkedin.com/in/example-profile2/'
    ];

    const companyUrls = [
        'https://www.linkedin.com/company/example-company/',
        'https://www.linkedin.com/company/example-company2/'
    ];

    // Crawl public profiles
    await crawler.crawl(profileUrls, 'profile');
    await crawler.saveToCSV('linkedin_profiles.csv');

    // Crawl company pages
    await crawler.crawl(companyUrls, 'company');
    await crawler.saveToCSV('linkedin_companies.csv');
})();
