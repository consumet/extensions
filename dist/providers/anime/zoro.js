"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cheerio_1 = require("cheerio");
const models_1 = require("../../models");
const utils_1 = require("../../utils");
const utils_2 = require("../../utils");
class Zoro extends models_1.AnimeParser {
    constructor() {
        super(...arguments);
        this.name = 'Zoro';
        this.baseUrl = 'https://hianime.to';
        this.logo = 'https://is3-ssl.mzstatic.com/image/thumb/Purple112/v4/7e/91/00/7e9100ee-2b62-0942-4cdc-e9b93252ce1c/source/512x512bb.jpg';
        this.classPath = 'ANIME.Zoro';
        /**
         * @param id Anime id
         */
        this.fetchAnimeInfo = async (id) => {
            const info = {
                id: id,
                title: '',
            };
            try {
                const { data } = await this.client.get(`${this.baseUrl}/${id}`);
                const $ = (0, cheerio_1.load)(data);
                const { mal_id, anilist_id } = JSON.parse($('#syncData').text());
                info.malID = Number(mal_id);
                info.alID = Number(anilist_id);
                info.title = $('h2.film-name').text();
                info.japaneseTitle = $('div.anisc-info div:nth-child(2) span.name').text();
                info.image = $('img.film-poster-img').attr('src');
                info.description = $('div.film-description').text().trim();
                // Movie, TV, OVA, ONA, Special, Music
                info.type = $('span.item').last().prev().prev().text().toUpperCase();
                info.url = `${this.baseUrl}/${id}`;
                info.character = [];
                $('div.block-actors-content div.bac-list-wrap div.bac-item').each((i, el) => {
                    var _b;
                    const card = $(el);
                    info.character.push({
                        characterID: (card.find('div.per-info:nth-child(1) a.pi-avatar').attr('href') || '').replace('/character/', '') || null,
                        name: card.find('div.per-info:nth-child(1) div.pi-detail h4.pi-name a').text() || null,
                        role: card.find('div.per-info:nth-child(1) div.pi-detail span.pi-cast').text() || null,
                        characterImage: card.find('div.per-info:nth-child(1) a.pi-avatar img').attr('data-src') || null,
                        actorID: ((_b = card.find('div.per-info:nth-child(2) a.pi-avatar').attr('href')) === null || _b === void 0 ? void 0 : _b.replace('/people/', '')) || null,
                        voiceActor: card.find('div.per-info:nth-child(2) div.pi-detail h4.pi-name a').text() || null,
                        voice: card.find('div.per-info:nth-child(2) div.pi-detail span.pi-cast').text() || null,
                        ActorImage: card.find('div.per-info:nth-child(2) a.pi-avatar img').attr('data-src') || null
                    });
                });
                info.recommendations = await this.scrapeCard($);
                info.relatedAnime = [];
                $("#main-sidebar section:nth-child(1) div.anif-block-ul li").each((i, ele) => {
                    var _b, _c, _d, _e, _f, _g, _h;
                    const card = $(ele);
                    const aTag = card.find('.film-name a');
                    const id = (_b = aTag.attr('href')) === null || _b === void 0 ? void 0 : _b.split('/')[1].split('?')[0];
                    info.relatedAnime.push({
                        id: id,
                        title: aTag.text(),
                        url: `${this.baseUrl}${aTag.attr('href')}`,
                        image: (_c = card.find('img')) === null || _c === void 0 ? void 0 : _c.attr('data-src'),
                        japaneseTitle: aTag.attr('data-jname'),
                        type: (_e = (_d = card.find(".tick").contents().last()) === null || _d === void 0 ? void 0 : _d.text()) === null || _e === void 0 ? void 0 : _e.trim(),
                        sub: parseInt((_f = card.find('.tick-item.tick-sub')) === null || _f === void 0 ? void 0 : _f.text()) || 0,
                        dub: parseInt((_g = card.find('.tick-item.tick-dub')) === null || _g === void 0 ? void 0 : _g.text()) || 0,
                        episodes: parseInt((_h = card.find('.tick-item.tick-eps')) === null || _h === void 0 ? void 0 : _h.text()) || 0,
                    });
                });
                const hasSub = $('div.film-stats div.tick div.tick-item.tick-sub').length > 0;
                const hasDub = $('div.film-stats div.tick div.tick-item.tick-dub').length > 0;
                if (hasSub) {
                    info.subOrDub = models_1.SubOrSub.SUB;
                    info.hasSub = hasSub;
                }
                if (hasDub) {
                    info.subOrDub = models_1.SubOrSub.DUB;
                    info.hasDub = hasDub;
                }
                if (hasSub && hasDub) {
                    info.subOrDub = models_1.SubOrSub.BOTH;
                }
                const episodesAjax = await this.client.get(`${this.baseUrl}/ajax/v2/episode/list/${id.split('-').pop()}`, {
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest',
                        Referer: `${this.baseUrl}/watch/${id}`,
                    },
                });
                const $$ = (0, cheerio_1.load)(episodesAjax.data.html);
                info.totalEpisodes = $$('div.detail-infor-content > div > a').length;
                info.episodes = [];
                $$('div.detail-infor-content > div > a').each((i, el) => {
                    var _b, _c, _d, _e;
                    const episodeId = (_d = (_c = (_b = $$(el)
                        .attr('href')) === null || _b === void 0 ? void 0 : _b.split('/')[2]) === null || _c === void 0 ? void 0 : _c.replace('?ep=', '$episode$')) === null || _d === void 0 ? void 0 : _d.concat(`$${info.subOrDub}`);
                    const number = parseInt($$(el).attr('data-number'));
                    const title = $$(el).attr('title');
                    const url = this.baseUrl + $$(el).attr('href');
                    const isFiller = $$(el).hasClass('ssl-item-filler');
                    (_e = info.episodes) === null || _e === void 0 ? void 0 : _e.push({
                        id: episodeId,
                        number: number,
                        title: title,
                        isFiller: isFiller,
                        url: url,
                    });
                });
                return info;
            }
            catch (err) {
                throw new Error(err.message);
            }
        };
        /**
         *
         * @param episodeId Episode id
         */
        this.fetchEpisodeSources = async (episodeId, server = models_1.StreamingServers.VidStreaming) => {
            var _b;
            if (episodeId.startsWith('http')) {
                const serverUrl = new URL(episodeId);
                switch (server) {
                    case models_1.StreamingServers.VidStreaming:
                    case models_1.StreamingServers.VidCloud:
                        return Object.assign({}, (await new utils_1.MegaCloud().extract(serverUrl)));
                    case models_1.StreamingServers.StreamSB:
                        return {
                            headers: {
                                Referer: serverUrl.href,
                                watchsb: 'streamsb',
                                'User-Agent': utils_2.USER_AGENT,
                            },
                            sources: await new utils_1.StreamSB(this.proxyConfig, this.adapter).extract(serverUrl, true),
                        };
                    case models_1.StreamingServers.StreamTape:
                        return {
                            headers: { Referer: serverUrl.href, 'User-Agent': utils_2.USER_AGENT },
                            sources: await new utils_1.StreamTape(this.proxyConfig, this.adapter).extract(serverUrl),
                        };
                    default:
                    case models_1.StreamingServers.VidCloud:
                        return Object.assign({ headers: { Referer: serverUrl.href } }, (await new utils_1.MegaCloud().extract(serverUrl)));
                }
            }
            if (!episodeId.includes('$episode$'))
                throw new Error('Invalid episode id');
            // Fallback to using sub if no info found in case of compatibility
            // TODO: add both options later
            const subOrDub = ((_b = episodeId.split('$')) === null || _b === void 0 ? void 0 : _b.pop()) === 'dub' ? 'dub' : 'sub';
            episodeId = `${this.baseUrl}/watch/${episodeId
                .replace('$episode$', '?ep=')
                .replace(/\$auto|\$sub|\$dub/gi, '')}`;
            try {
                const { data } = await this.client.get(`${this.baseUrl}/ajax/v2/episode/servers?episodeId=${episodeId.split('?ep=')[1]}`);
                const $ = (0, cheerio_1.load)(data.html);
                /**
                 * vidtreaming -> 4
                 * rapidcloud  -> 1
                 * streamsb -> 5
                 * streamtape -> 3
                 */
                let serverId = '';
                try {
                    switch (server) {
                        case models_1.StreamingServers.VidCloud:
                            serverId = this.retrieveServerId($, 1, subOrDub);
                            // zoro's vidcloud server is rapidcloud
                            if (!serverId)
                                throw new Error('RapidCloud not found');
                            break;
                        case models_1.StreamingServers.VidStreaming:
                            serverId = this.retrieveServerId($, 4, subOrDub);
                            // zoro's vidcloud server is rapidcloud
                            if (!serverId)
                                throw new Error('vidtreaming not found');
                            break;
                        case models_1.StreamingServers.StreamSB:
                            serverId = this.retrieveServerId($, 5, subOrDub);
                            if (!serverId)
                                throw new Error('StreamSB not found');
                            break;
                        case models_1.StreamingServers.StreamTape:
                            serverId = this.retrieveServerId($, 3, subOrDub);
                            if (!serverId)
                                throw new Error('StreamTape not found');
                            break;
                    }
                }
                catch (err) {
                    throw new Error("Couldn't find server. Try another server");
                }
                const { data: { link }, } = await this.client.get(`${this.baseUrl}/ajax/v2/episode/sources?id=${serverId}`);
                return await this.fetchEpisodeSources(link, server);
            }
            catch (err) {
                throw err;
            }
        };
        this.retrieveServerId = ($, index, subOrDub) => {
            return $(`.ps_-block.ps_-block-sub.servers-${subOrDub} > .ps__-list .server-item`)
                .map((i, el) => ($(el).attr('data-server-id') == `${index}` ? $(el) : null))
                .get()[0]
                .attr('data-id');
        };
        /**
         * @param url string
         */
        this.scrapeCardPage = async (url) => {
            var _b, _c, _d;
            try {
                const res = {
                    currentPage: 0,
                    hasNextPage: false,
                    totalPages: 0,
                    results: [],
                };
                const { data } = await this.client.get(url);
                const $ = (0, cheerio_1.load)(data);
                const pagination = $('ul.pagination');
                res.currentPage = parseInt((_b = pagination.find('.page-item.active')) === null || _b === void 0 ? void 0 : _b.text());
                const nextPage = (_c = pagination.find('a[title=Next]')) === null || _c === void 0 ? void 0 : _c.attr('href');
                if (nextPage != undefined && nextPage != '') {
                    res.hasNextPage = true;
                }
                const totalPages = (_d = pagination.find('a[title=Last]').attr('href')) === null || _d === void 0 ? void 0 : _d.split('=').pop();
                if (totalPages === undefined || totalPages === '') {
                    res.totalPages = res.currentPage;
                }
                else {
                    res.totalPages = parseInt(totalPages);
                }
                res.results = await this.scrapeCard($);
                if (res.results.length === 0) {
                    res.currentPage = 0;
                    res.hasNextPage = false;
                    res.totalPages = 0;
                }
                return res;
            }
            catch (err) {
                throw new Error('Something went wrong. Please try again later.');
            }
        };
        /**
         * @param $ cheerio instance
         */
        this.scrapeCard = async ($) => {
            try {
                const results = [];
                $('.flw-item').each((i, ele) => {
                    var _b, _c, _d, _e, _f, _g, _h, _j, _k;
                    const card = $(ele);
                    const atag = card.find('.film-name a');
                    const id = (_b = atag.attr('href')) === null || _b === void 0 ? void 0 : _b.split('/')[1].split('?')[0];
                    const type = (_d = (_c = card
                        .find('.fdi-item')) === null || _c === void 0 ? void 0 : _c.first()) === null || _d === void 0 ? void 0 : _d.text().replace(' (? eps)', '').replace(/\s\(\d+ eps\)/g, '');
                    results.push({
                        id: id,
                        title: atag.text(),
                        url: `${this.baseUrl}${atag.attr('href')}`,
                        image: (_e = card.find('img')) === null || _e === void 0 ? void 0 : _e.attr('data-src'),
                        duration: (_f = card.find('.fdi-duration')) === null || _f === void 0 ? void 0 : _f.text(),
                        japaneseTitle: atag.attr('data-jname'),
                        type: type,
                        nsfw: ((_g = card.find('.tick-rate')) === null || _g === void 0 ? void 0 : _g.text()) === '18+' ? true : false,
                        sub: parseInt((_h = card.find('.tick-item.tick-sub')) === null || _h === void 0 ? void 0 : _h.text()) || 0,
                        dub: parseInt((_j = card.find('.tick-item.tick-dub')) === null || _j === void 0 ? void 0 : _j.text()) || 0,
                        episodes: parseInt((_k = card.find('.tick-item.tick-eps')) === null || _k === void 0 ? void 0 : _k.text()) || 0,
                    });
                });
                return results;
            }
            catch (err) {
                throw new Error('Something went wrong. Please try again later.');
            }
        };
        /**
         * @deprecated
         * @param episodeId Episode id
         */
        this.fetchEpisodeServers = (episodeId) => {
            throw new Error('Method not implemented.');
        };
    }
    /**
     * @param query Search query
     * @param page Page number (optional)
     */
    search(query, page = 1) {
        if (0 >= page) {
            page = 1;
        }
        return this.scrapeCardPage(`${this.baseUrl}/search?keyword=${decodeURIComponent(query)}&page=${page}`);
    }
    /**
     * @param page number
     */
    fetchTopAiring(page = 1) {
        if (0 >= page) {
            page = 1;
        }
        return this.scrapeCardPage(`${this.baseUrl}/top-airing?page=${page}`);
    }
    /**
     * @param page number
     */
    fetchMostPopular(page = 1) {
        if (0 >= page) {
            page = 1;
        }
        return this.scrapeCardPage(`${this.baseUrl}/most-popular?page=${page}`);
    }
    /**
     * @param page number
     */
    fetchMostFavorite(page = 1) {
        if (0 >= page) {
            page = 1;
        }
        return this.scrapeCardPage(`${this.baseUrl}/most-favorite?page=${page}`);
    }
    /**
     * @param page number
     */
    fetchLatestCompleted(page = 1) {
        if (0 >= page) {
            page = 1;
        }
        return this.scrapeCardPage(`${this.baseUrl}/completed?page=${page}`);
    }
    /**
     * @param page number
     */
    fetchRecentlyUpdated(page = 1) {
        if (0 >= page) {
            page = 1;
        }
        return this.scrapeCardPage(`${this.baseUrl}/recently-updated?page=${page}`);
    }
    /**
     * @param page number
     */
    fetchRecentlyAdded(page = 1) {
        if (0 >= page) {
            page = 1;
        }
        return this.scrapeCardPage(`${this.baseUrl}/recently-added?page=${page}`);
    }
    /**
     * @param page number
     */
    fetchTopUpcoming(page = 1) {
        if (0 >= page) {
            page = 1;
        }
        return this.scrapeCardPage(`${this.baseUrl}/top-upcoming?page=${page}`);
    }
    /**
     * @param studio Studio id, e.g. "toei-animation"
     * @param page page number (optional) `default 1`
     */
    fetchStudio(studio, page = 1) {
        if (0 >= page) {
            page = 1;
        }
        return this.scrapeCardPage(`${this.baseUrl}/producer/${studio}?page=${page}`);
    }
    /**
     * Fetches trending anime
     */
    async fetchTrending() {
        try {
            var _a;
            const res = { results: [] };
            const { data } = await this.client.get(`${this.baseUrl}/home`);
            const $ = (0, cheerio_1.load)(data);
            $('.trending-list div .swiper-wrapper .swiper-slide').each((i, el) => {
                const card = $(el).find('.item');
                const titleElement = card.find('.film-title');
                const id = (_a = card.find(".film-poster").attr('href')) === null || _a === void 0 ? void 0 : _a.split('/')[1].split('?')[0];
                res.results.push({
                    id: id,
                    title: titleElement.text(),
                    japaneseTitle: titleElement.attr('data-jname'),
                    image: card.find('.film-poster img').attr('data-src'),
                    url: `${this.baseUrl}/${id}`,
                    rank: i + 1
                });
            });
            return res;
        }
        catch (error) {
            throw new Error('Something went wrong. Please try again later.');
        }
    }
    /**
       * Fetches the schedule for a given date.
       * @param date The date in format 'YYYY-MM-DD'. Defaults to the current date.
       * @returns A promise that resolves to an object containing the search results.
       */
    async fetchSchedule(date = new Date().toISOString().slice(0, 10)) {
        try {
            const res = {
                results: [],
            };
            const { data: { html } } = await this.client.get(`${this.baseUrl}/ajax/schedule/list?tzOffset=-480&date=${date}`);
            const $ = (0, cheerio_1.load)(html);
            $('li').each((i, ele) => {
                var _b;
                const card = $(ele);
                const title = card.find('.film-name');
                const id = (_b = card.find("a.tsl-link").attr('href')) === null || _b === void 0 ? void 0 : _b.split('/')[1].split('?')[0];
                const airingTime = card.find("div.time").text().replace("\n", "").trim();
                const airingEpisode = card.find("div.film-detail div.fd-play button").text().replace("\n", "").trim();
                res.results.push({
                    id: id,
                    title: title.text(),
                    japaneseTitle: title.attr('data-jname'),
                    url: `${this.baseUrl}/${id}`,
                    airingEpisode: airingEpisode,
                    airingTime: airingTime,
                });
            });
            return res;
        }
        catch (err) {
            throw new Error('Something went wrong. Please try again later.');
        }
    }
    async fetchSpotlight() {
        try {
            const res = { results: [] };
            const { data } = await this.client.get(`${this.baseUrl}/home`);
            const $ = (0, cheerio_1.load)(data);
            $('#slider div.swiper-wrapper div.swiper-slide').each((i, el) => {
                var _b, _c, _d;
                const card = $(el);
                const titleElement = card.find('div.desi-head-title');
                const id = ((_c = (_b = card.find('div.desi-buttons .btn-secondary').attr('href')) === null || _b === void 0 ? void 0 : _b.match(/\/([^/]+)$/)) === null || _c === void 0 ? void 0 : _c[1]) || null;
                res.results.push({
                    id: id,
                    title: titleElement.text(),
                    japaneseTitle: titleElement.attr('data-jname'),
                    banner: card.find('.deslide-cover-img img').attr('data-src') || null,
                    rank: parseInt((_d = card.find('.desi-sub-text').text().match(/(\d+)/g)) === null || _d === void 0 ? void 0 : _d[0]),
                    url: `${this.baseUrl}/${id}`,
                    type: card.find('div.sc-detail .scd-item:nth-child(1)').text().trim(),
                    duration: card.find('div.sc-detail > div:nth-child(2)').text().trim(),
                    releaseDate: card.find('div.sc-detail > div:nth-child(3)').text().trim(),
                    quality: card.find('div.sc-detail > div:nth-child(4)').text().trim(),
                    sub: parseInt(card.find('div.sc-detail div.tick-sub').text().trim()) || 0,
                    dub: parseInt(card.find('div.sc-detail div.tick-dub').text().trim()) || 0,
                    episodes: parseInt(card.find('div.sc-detail div.tick-eps').text()) || 0,
                    description: card.find('div.desi-description').text().trim()
                });
            });
            return res;
        }
        catch (error) {
            throw new Error('Something went wrong. Please try again later.');
        }
    }
}
// (async () => {
//   const zoro = new Zoro();
//   const anime = await zoro.search('classroom of the elite');
//   const info = await zoro.fetchAnimeInfo(anime.results[0].id);
//   const sources = await zoro.fetchEpisodeSources(info.episodes![0].id);
//   console.log(sources);
// })();
exports.default = Zoro;
//# sourceMappingURL=zoro.js.map