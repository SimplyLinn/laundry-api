import { CookieJar } from 'cookiejar';
import { request, RequestResponse } from './utils/request';

const MAX_REDIRECTS = 20;
const AUTH_URL =
  'https://hyresborsen.telge.se/res/themes/telgebostadminasidor/pages/Aptus/AptusRedirectPage.aspx';

const FINAL_HOST = 'aptus.telge.se';
const FINAL_PATH = '/AptusPortal/wwwashcalendar.aspx';

function extractAndMutateSearchParams<T extends string>(
  attr: readonly T[],
  params: URLSearchParams,
): {
  [key in T]: string | null;
} {
  const ret = {} as {
    [key in T]: string | null;
  };
  for (const key of attr) {
    ret[key] = params.get(key);
    params.delete(key);
  }
  return ret;
}

export interface AuthSession {
  categoryId: number;
  locationId: number;
  weekOffset: number;
  searchParams: URLSearchParams;
}

export default async function performAuth(
  username: string,
  jar: CookieJar,
): Promise<AuthSession> {
  let url: URL = new URL(AUTH_URL);
  url.searchParams.set('username', username);
  let res: RequestResponse;
  let redirects = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    // eslint-disable-next-line no-await-in-loop
    res = await request(url, undefined, jar);
    if (res.statusCode === 302 && res.headers.location != null) {
      url = new URL(res.headers.location, url);
      if (url.host === FINAL_HOST && url.pathname === FINAL_PATH) {
        break;
      }
    } else {
      throw new Error('Authentication failed, loop went to non-redirect');
    }
    if (redirects >= MAX_REDIRECTS) {
      throw new Error('Maximum Redirects reached');
    }
    redirects += 0;
  }
  const { searchParams } = url;
  const { categoryId, locationId, weekOffset } = extractAndMutateSearchParams(
    ['categoryId', 'locationId', 'weekOffset'],
    searchParams,
  );
  const categoryIdNum = Number.parseInt(categoryId as string, 10);
  const locationIdNum = Number.parseInt(locationId as string, 10);
  const weekOffsetNum = (() => {
    if (!weekOffset) return 0;
    return Number.parseInt(weekOffset, 10);
  })();
  if (Number.isNaN(categoryIdNum)) throw new Error('Unable to get categoryId');
  if (Number.isNaN(locationIdNum)) throw new Error('Unable to get locationId');
  if (Number.isNaN(weekOffsetNum)) {
    throw new Error('WeekOffset resolved to NaN');
  }
  return {
    categoryId: categoryIdNum,
    locationId: locationIdNum,
    weekOffset: weekOffsetNum,
    searchParams,
  };
}
