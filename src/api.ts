async function trpc(endpoint: string, request: object) {
  const base = 'https://cohost.org/api/v1/trpc/';
  const query = new URLSearchParams({ input: JSON.stringify(request) });
  const uri = `${base}/${endpoint}?${query}`;

  const response = await fetch(uri);
  return response.json();
}

function delay(duration: number): Promise<void> {
  return new Promise((resolve, reject) => {
    setTimeout(() => resolve(), duration);
  });
}

async function* postsProfilePosts(projectHandle: string) {
  let page = 0;
  while (true) {
    const response = await trpc('posts.profilePosts', {
      projectHandle,
      page,
      options: {},
    });

    if ('result' in response) {
      const posts = response.result.data.posts;
      if (posts.length == 0) return;
      yield* posts.map(post => [post, page]);
    } else {
      throw response.error;
    }

    page = response.result.data.pagination.nextPage;
    await delay(250);
  }
}

const api = {
  posts: {
    profilePosts: postsProfilePosts,
  },
};

export default api;
