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

async function* postsProfilePosts(projectHandle: string): AsyncGenerator<Post & { page: number }, any, any> {
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
    yield* posts.map(post => {
      return { page, ...post };
    });

    page = pagination.nextPage;
    if (!cacheHit) await delay(250);
  }
}

type TrpcResponse<R> = {
  response: R,
  cacheHit: boolean,
};

const cache: { [key: string]: object } = {};

async function trpc<R>(endpoint: string, request: object): Promise<TrpcResponse<R>> {
  const base = 'https://cohost.org/api/v1/trpc/';
  const query = new URLSearchParams({ input: JSON.stringify(request) });
  const uri = `${base}/${endpoint}?${query}`;

  if (uri in cache) {
    return {
      response: cache[uri] as R,
      cacheHit: true,
    };
  } else {
    const response = await (await fetch(uri)).json();
    cache[uri] = response;
    return {
      response,
      cacheHit: false,
    };
  }
}

function delay(duration: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, duration));
}
