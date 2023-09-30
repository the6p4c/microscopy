import { Post } from './types';

const api = {
  posts: {
    profilePosts: postsProfilePosts,
  },
};
export default api;

type PostsProfilePostsResponse = {
  result: {
    data: {
      posts: Post[],
      pagination: {
        previousPage: number,
        nextPage: number,
        currentPage: number,
      },
    },
  },
} | {
  error: object,
};

async function* postsProfilePosts(projectHandle: string): AsyncGenerator<Post, any, any> {
  let page = 0;
  while (true) {
    const { response, cacheHit } = await trpc<PostsProfilePostsResponse>('posts.profilePosts', {
      projectHandle,
      page,
      options: {},
    });

    if ('error' in response) throw response.error;
    const { posts, pagination } = response.result.data;

    if (posts.length == 0) return;
    yield* posts;

    page = pagination.nextPage;
    if (!cacheHit) await delay(250);
  }
}

type CacheResponse<R> = {
  response: R,
  cacheHit: boolean,
};

const cache: { [key: string]: any } = {};

async function cacheGetOrElse<R>(uri: string, onCacheMiss: () => Promise<R>): Promise<CacheResponse<R>> {
  const pageCacheGet = (key: string) => cache[key];
  const pageCacheSet = (key: string, value: any) => cache[key] = value;
  const browserCacheGet = (key: string) => {
    const s = localStorage.getItem(key);
    if (!s) return null;
    return JSON.parse(s);
  };
  const browserCacheSet = (key: string, value: any) => {
    localStorage.setItem(key, JSON.stringify(value));
  }

  const [cacheGet, cacheSet] =
    process.env.NODE_ENV == 'production'
    ? [pageCacheGet, pageCacheSet]
    : [browserCacheGet, browserCacheSet];

  let cachedResponse = cacheGet(uri);
  if (cachedResponse) {
    return {
      response: cachedResponse as R,
      cacheHit: true,
    };
  } else {
    const response = await onCacheMiss();
    cacheSet(uri, response);
    return {
      response,
      cacheHit: false,
    }
  }
}

async function trpc<R>(endpoint: string, request: any): Promise<CacheResponse<R>> {
  const base = 'https://cohost.org/api/v1/trpc/';
  const query = new URLSearchParams({ input: JSON.stringify(request) });
  const uri = `${base}/${endpoint}?${query}`;

  return cacheGetOrElse(uri, async () => await (await fetch(uri)).json());
}

function delay(duration: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, duration));
}
