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
    const response = await trpc('posts.profilePosts', {
      projectHandle,
      page,
      options: {},
    }) as PostsProfilePostsResponse;

    if ('error' in response) throw response.error;
    const { posts, pagination } = response.result.data;

    if (posts.length == 0) return;
    yield* posts.map(post => {
      return { page, ...post };
    });

    page = pagination.nextPage;
    await delay(250);
  }
}

async function trpc(endpoint: string, request: object) {
  const base = 'https://cohost.org/api/v1/trpc/';
  const query = new URLSearchParams({ input: JSON.stringify(request) });
  const uri = `${base}/${endpoint}?${query}`;

  const response = await fetch(uri);
  return response.json();
}

function delay(duration: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, duration));
}
