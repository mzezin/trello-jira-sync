import { } from 'dotenv/config';
import { get } from 'axios';
import express from 'express';
import basicAuth from 'express-basic-auth';

const baseUrl = 'https://api.trello.com/1/';


const prepareCards = async (boardId) => {
  const getLists = async () => {
    const url = `${baseUrl}boards/${boardId}/lists`;
    const { data } = await get(url, {
      params: {
        fields: 'id,name',
        key: process.env.API_KEY,
        token: process.env.API_TOKEN,
      },
    });
    return data;
  };

  const getCards = async (listId) => {
    const url = `${baseUrl}lists/${listId}/cards`;
    const { data } = await get(url, {
      params: {
        fields: 'id,name',
        key: process.env.API_KEY,
        token: process.env.API_TOKEN,
      },
    });
    return data;
  };

  const lists = await getLists();
  const cards = lists.map(async e => ({
    status: e.name,
    cards: await getCards(e.id),
  }));
  const out = await Promise.all(cards);

  return out.reduce((a, v) => [...a, ...v.cards.map(e => ({ status: v.status, ...e }))], []);
};

const app = express();

app.use(basicAuth({
  users: { [process.env.LOGIN]: process.env.PASSWORD },
  challenge: true,
  realm: 'Trello adapter',
}));

app.get('/boards/:id', async (req, res) => {
  res.send(await prepareCards(req.params.id));
});

app.listen(process.env.PORT, () => {
  console.log(`App listening on port ${process.env.PORT}!`);
});
