/* eslint-disable no-console */
import '../loadenv';
import { CookieJar } from 'cookiejar';
import performAuth from './performAuth';

const username = process.env.USERNAME;

if (!username) {
  console.error('env var USERNAME not supplied.');
  process.exit(1);
}

(async () => {
  const jar = new CookieJar();
  const res = await performAuth(username, jar);
  console.log(res);
})().catch((err) => console.error(err));
