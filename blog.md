# Building a Race Time Comparer: Web Scraping Made Easy with DigitalOcean App Platform

### Headless Chrome in a Container

One of the most interesting technical aspects is running headless Chrome in a containerized environment. Puppeteer, a Node.js library developed by the Chrome DevTools team, provides a high-level API to control Chrome programmatically. It uses the Chrome DevTools Protocol - the same protocol that powers Chrome's Developer Tools - to communicate with the browser. This means we can automate any action you could perform manually in Chrome's DevTools, like inspecting elements, monitoring network requests, or capturing performance metrics. When we say "headless" Chrome, we mean running Chrome without its graphical user interface - perfect for server environments where we need to programmatically interact with web pages.

This is particularly powerful for web scraping because Puppeteer: 