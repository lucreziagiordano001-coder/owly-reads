// httpClient.js — unica istanza Axios dell'app (l'unico file che conosce Axios)
// API di Open Library: https://openlibrary.org/dev/docs/api/subjects
import axios from 'axios';

export const http = axios.create({
  baseURL: 'https://openlibrary.org',
  timeout: 10000,
  headers: { Accept: 'application/json' },
});
