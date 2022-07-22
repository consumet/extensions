import axios from 'axios';
import { load } from 'cheerio';

import {
  AnimeParser,
  ISearch,
  IAnimeInfo,
  MediaStatus,
  IAnimeResult,
  ISource,
  IAnimeEpisode,
  IEpisodeServer,
  StreamingServers,
} from '../../models';

import { VidCloud } from '../../utils';

class Zoro extends AnimeParser {
  override readonly name = 'Zoro.to';
  protected override baseUrl = 'https://zoro.to';
  protected override logo =
    'https://is3-ssl.mzstatic.com/image/thumb/Purple112/v4/7e/91/00/7e9100ee-2b62-0942-4cdc-e9b93252ce1c/source/512x512bb.jpg';
  protected override classPath = 'ANIME.Zoro';

  /**
   * @param query Search query
   * @param page Page number (optional)
   */
  override search = async (query: string, page: number = 1): Promise<ISearch<IAnimeResult>> => {
    const res: ISearch<IAnimeResult> = {
      currentPage: page,
      hasNextPage: false,
      results: [],
    };
    try {
      const { data } = await axios.get(
        `${this.baseUrl}/search?keyword=${decodeURIComponent(query)}&page=${page}`
      );
      const $ = load(data);

      res.hasNextPage =
        $('.pagination > li').length > 0
          ? $('.pagination > li').last().hasClass('active')
            ? false
            : true
          : false;

      $('.film_list-wrap > div.flw-item').each((i, el) => {
        const id = $(el)
          .find('div:nth-child(1) > a.film-poster-ahref')
          .attr('href')
          ?.split('/')[1]
          .split('?')[0];
        const title = $(el).find('div:nth-child(2) > h3:nth-child(1) > a:nth-child(1)').text();
        // Movie, TV, OVA, ONA, Special, Music
        const type = $(el).find('div:nth-child(2) > div:nth-child(2) > span:nth-child(1)').text();
        const image = $(el).find('div:nth-child(1) > img.film-poster-img').attr('data-src');
        const url = this.baseUrl + $(el).find('div:nth-child(1) > a:nth-child(4)').attr('href');

        res.results.push({
          id: id!,
          title: title,
          type: type,
          image: image,
          url: url,
        });
      });

      return res;
    } catch (err: any) {
      throw new Error(err);
    }
  };

  /**
   * @param id Anime id
   */
  override fetchAnimeInfo = async (id: string): Promise<IAnimeInfo> => {
    const info: IAnimeInfo = {
      id: id,
      title: '',
    };
    try {
      const { data } = await axios.get(`${this.baseUrl}/watch/${id}`);
      const $ = load(data);

      info.title = $('h2.film-name > a.text-white').text();
      info.image = $('img.film-poster-img').attr('src');
      info.description = $('div.film-description').text().trim();
      // Movie, TV, OVA, ONA, Special, Music
      info.type = $('span.item').last().prev().prev().text();
      info.url = `${this.baseUrl}/${id}`;

      const episodesAjax = await axios.get(`${this.baseUrl}/ajax/v2/episode/list/${id.split('-').pop()}`, {
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          Referer: `${this.baseUrl}/watch/${id}`,
        },
      });

      const $$ = load(episodesAjax.data.html);

      info.totalEpisodes = $$('div.detail-infor-content > div > a').length;
      info.episodes = [];
      $$('div.detail-infor-content > div > a').each((i, el) => {
        const episodeId = $$(el).attr('href')?.split('/')[2]?.replace('?ep=', '$episode$')!;
        const number = parseInt($$(el).attr('data-number')!);
        const title = $$(el).attr('title');
        const url = this.baseUrl + $$(el).attr('href');
        const isFiller = $$(el).hasClass('ssl-item-filler');

        info.episodes?.push({
          id: episodeId,
          number: number,
          title: title,
          isFiller: isFiller,
          url: url,
        });
      });

      return info;
    } catch (err) {
      throw new Error((err as Error).message);
    }
  };

  /**
   *
   * @param episodeId Episode id
   */
  override fetchEpisodeSources = async (
    episodeId: string,
    server: StreamingServers = StreamingServers.VidCloud
  ): Promise<ISource> => {
    if (episodeId.startsWith('http')) {
      const serverUrl = new URL(episodeId);
      switch (server) {
        case StreamingServers.VidCloud:
          return {
            headers: { Referer: serverUrl.href },
            ...(await new VidCloud().extract(serverUrl, true)),
          };
      }
    }
    if (!episodeId.includes('$episode$')) throw new Error('Invalid episode id');
    episodeId = `${this.baseUrl}/watch/${episodeId.replace('$episode$', '?ep=')}`;

    try {
      const { data } = await axios.get(
        `${this.baseUrl}/ajax/v2/episode/servers?episodeId=${episodeId.split('?ep=')[1]}`,
        {
          headers: {
            Referer: episodeId,
          },
        }
      );

      const $ = load(data.html);

      /**
       * vidtreaming -> 4
       * vidcloud -> 1
       * streamsb -> 5
       * streamtape -> 3
       */
      let serverId = '';
      switch (server) {
        case StreamingServers.VidCloud:
          serverId = $('div.ps_-block.ps_-block-sub.servers-sub > div.ps__-list > div')
            .map((i, el) => ($(el).attr('data-server-id') == '1' ? $(el) : null))
            .get()[0]
            .attr('data-id')!;

          if (!serverId) throw new Error('VidCloud not found');
          break;
      }

      const {
        data: { link },
      } = await axios.get(`${this.baseUrl}/ajax/v2/episode/sources?id=${serverId}`);

      return await this.fetchEpisodeSources(link, server);
    } catch (err) {
      throw new Error((err as Error).message);
    }
  };

  /**
   *
   * @param episodeId Episode id
   */
  override fetchEpisodeServers = (episodeId: string): Promise<IEpisodeServer[]> => {
    throw new Error('Method not implemented.');
  };
}

(async () => {
  const zoro = new Zoro();
  const info = await zoro.fetchEpisodeSources('one-piece-100$episode$2145');
  console.log(info);
})();

export default Zoro;