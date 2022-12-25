"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const cheerio_1 = require("cheerio");
const models_1 = require("../../models");
class MangaPill extends models_1.MangaParser {
    constructor() {
        super(...arguments);
        this.name = 'MangaPill';
        this.baseUrl = 'https://mangapill.com';
        this.logo = '';
        this.classPath = 'MANGA.MangaPill';
        /**
         *
         * @param query Search query
         */
        this.search = async (query) => {
            try {
                const { data } = await axios_1.default.get(`${this.baseUrl}/search?q=${encodeURIComponent(query)}`);
                const $ = (0, cheerio_1.load)(data);
                const results = $('div.container div.my-3.justify-end > div')
                    .map((i, el) => {
                    var _a;
                    return ({
                        id: (_a = $(el).find('a').attr('href')) === null || _a === void 0 ? void 0 : _a.split('/manga/')[1],
                        title: $(el).find('div > a > div').text().trim(),
                        image: $(el).find('a img').attr('data-src'),
                    });
                })
                    .get();
                return {
                    results: results,
                };
            }
            catch (err) {
                //   console.log(err);
                throw new Error(err.message);
            }
        };
        this.fetchMangaInfo = async (mangaId) => {
            const mangaInfo = {
                id: mangaId,
                title: '',
            };
            try {
                const { data } = await axios_1.default.get(`${this.baseUrl}/manga/${mangaId}`);
                const $ = (0, cheerio_1.load)(data);
                mangaInfo.title = $('div.container div.my-3 div.flex-col div.mb-3 h1').text().trim();
                mangaInfo.description = $('div.container div.my-3  div.flex-col p.text--secondary')
                    .text()
                    .split('\n')
                    .join(' ');
                mangaInfo.releaseDate = $('div.container div.my-3 div.flex-col div.gap-3.mb-3 div:contains("Year")')
                    .text()
                    .split('Year\n')[1]
                    .trim();
                mangaInfo.genres = $('div.container div.my-3 div.flex-col div.mb-3:contains("Genres")')
                    .text()
                    .split('\n')
                    .filter((genre) => genre !== 'Genres' && genre !== '')
                    .map(genre => genre.trim());
                mangaInfo.chapters = $('div.container div.border-border div#chapters div.grid-cols-1 a')
                    .map((i, el) => {
                    var _a;
                    return ({
                        id: (_a = $(el).attr('href')) === null || _a === void 0 ? void 0 : _a.split('/chapters/')[1],
                        title: $(el).text().trim(),
                        chapter: $(el).text().split('Chapter ')[1],
                    });
                })
                    .get();
                return mangaInfo;
            }
            catch (err) {
                throw new Error(err.message);
            }
        };
        this.fetchChapterPages = async (chapterId) => {
            try {
                const { data } = await axios_1.default.get(`${this.baseUrl}/chapters/${chapterId}`);
                const $ = (0, cheerio_1.load)(data);
                const chapterSelector = $('chapter-page');
                const pages = chapterSelector
                    .map((i, el) => ({
                    img: $(el).find('div picture img').attr('data-src'),
                    page: parseFloat($(el).find(`div[data-summary] > div`).text().split('page ')[1]),
                }))
                    .get();
                return pages;
            }
            catch (err) {
                throw new Error(err.message);
            }
        };
    }
}
// (async () => {
//   const manga = new MangaPill();
//   const search = await manga.search('one piece');
//   const info = await manga.fetchMangaInfo(search.results[1].id);
//   const pages = await manga.fetchChapterPages(info.chapters![0].id);
//   console.log(pages);
// })();
exports.default = MangaPill;
//# sourceMappingURL=mangapill.js.map