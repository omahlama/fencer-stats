import axios from 'axios';
import * as cheerio from 'cheerio';

async function scrape(url) {
  const { data: html } = await axios.get(url);
  const $ = cheerio.load(html);

  const cards = $('.card');
  const data = cards.map((i, card) => {
    const $card = $(card);
    const image = $card.find('img').attr('src');
    return {
      name: $card.find('h6').text().trim(),
      image: image === '/img/nopicture.jpg' ? null : image,
      club: $card.find('p.card-text').first().text().trim(),
      url: $card.find('a').attr('href'),
    };
  }).get();

  return data;
}

const url = 'https://fencing.ophardt.online/en/search/biographies?search=aa&search-firstname=&search-nation=FIN&search-gender='

scrape(url).then(console.log);