# GPT Comedian Digital Figure

## Overview
This project focuses on utilizing Puppeteer and other tools to scrape and analyze data related to comedians. It includes functions to manage async tasks, interact with the IMDb website to gather comedian profiles and specials, and download subtitle files.

## Features
- Async task management with a custom utility function.
- Scraping IMDb for comedian profiles and their specials.
- Downloading subtitle files for comedian specials using the OpenSubtitles API.

## Installation
Clone the repository and install the dependencies using npm:

```bash
git clone https://github.com/FTAndy/gpt-comedian-digital-figure.git
cd gpt-comedian-digital-figure
npm install
npm run start
```

## Usage
The main functionality is centered around scraping comedian data and subtitles. You can start by exploring `main.ts` for the primary application logic.

## Code Structure
- `utils.ts`: Contains utility functions for managing asynchronous tasks.
- `main.ts`: The main script that uses Puppeteer for web scraping.
- `getSubtitleSRTFile.ts`: Functions for downloading subtitles from OpenSubtitles.

## Configuration
- TypeScript configuration is extended from a base configuration in `tsconfig.release.json`.
- The project uses various npm packages, as listed in `package-lock.json`.

## Dependencies
Key dependencies include:
- Puppeteer and Puppeteer Extra for web scraping.
- Axios for HTTP requests.
- Dotenv for environment variable management.
- File system modules from Node.js for file handling.

## Contributing
Contributions are welcome. Please submit a pull request or an issue on the GitHub repository.

## License
The project is licensed under the Apache-2.0 License.

## Disclaimer
This project is for educational purposes. Please ensure to comply with IMDb's terms of service and OpenSubtitles API usage policies.

## Contact
For any inquiries, please open an issue on the GitHub repository: [gpt-comedian-digital-figure](https://github.com/FTAndy/gpt-comedian-digital-figure)

---

This README is a basic template and can be expanded based on the specific needs and developments of the project.
