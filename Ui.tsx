/******
 * UI *
 ******/
function e(s) {
  return (new Option(s)).innerHTML;
}

function Result({ title, link, match }) {
  const result = document.createElement('li');
  result.className = "mb-4";
  result.innerHTML = `
    <div><a href="${link}" target="_blank" class="underline">${e(title)}</a></div>
    <div style="margin-left: 1rem">
      ${e(match.before)}<strong>${e(match.matched)}</strong>${e(match.after)}
    </div>
  `;
  return result;
}

function Results() {
  const results = document.createElement('div');
  results.innerHTML = `
    <div class="flex gap-2" style="align-items: baseline;">
      <strong class="text-xl font-bold">results</strong>
      <div style="flex-grow: 1;"></div>
      <span>(page ?/?)</span>
      <svg version="1.1" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" class="h-6 self-center text-gray-500" style="animation: 1s infinite spin;">
        <path fill="none" stroke="rgb(131, 37, 79)" stroke-width="3" d="M 8 16 A 8 8 0 0 1 16 8" />
        <path fill="none" stroke="#eee" stroke-width="3" d="M 16 8 A 8 8 0 1 1 8 16" />
      </svg>
    </div>
    <ul></ul>
  `;

  const pageIndicator = results.querySelector('span');
  const setPage = (page, total) => {
    page = page != undefined ? (page + 1) : '?';
    total = total != undefined ? (total + 1) : '?';
    pageIndicator.innerText = `(page ${page}/${total})`;
  };

  const spinner = results.querySelector('svg');
  const setBusy = (busy) => {
    spinner.style.display = busy ? 'block' : 'none';
  };

  const list = results.querySelector('ul');
  const append = (result) => {
    list.appendChild(result);
  };
  const clear = () => {
    list.innerHTML = '';
    setPage();
  };

  results.f = { setPage, setBusy, append, clear };
  return results;
}

function Ui() {
  // mostly stolen from the private note ui
  let ui = document.createElement('div');
  ui.className = 'cohost-shadow-light dark:cohost-shadow-dark flex flex-col divide-y divide-gray-300 rounded-lg bg-white lg:max-w-sm';
  ui.innerHTML = `
    <div class="flex flex-row items-center rounded-t-lg bg-longan p-3 uppercase text-notBlack">Search</div>
    <div class="flex flex-col gap-2 px-3 py-2 text-notBlack">
      <form class="flex flex-col gap-3">
        <div class="relative grid w-full overflow-auto">
          <input name="query" type="text" required autocomplete="off" placeholder="query" class="border-cherry w-full row-start-1 row-end-2 col-start-1 col-end-2 min-h-0" />
        </div>
        <div class="flex w-full flex-row items-center justify-end gap-4">
          <button class="rounded-lg bg-cherry py-2 px-4 text-sm font-bold text-notWhite hover:bg-cherry-600 active:bg-cherry-700 disabled:bg-cherry-200">
            search
          </button>
        </div>
      </form>
    </div>
  `;

  const pathComponents = new URL(window.location).pathname.split('/');
  const username = pathComponents[pathComponents.length - 1];
  
  let searchActive = false;
  const form = ui.querySelector('form');
  const input = form.querySelector('input');
  const button = form.querySelector('button');
  const results = Results();

  const setSearchActive = (value) => {
    searchActive = value;

    input.disabled = searchActive;
    button.innerText = searchActive ? "cancel" : "search";
    results.f.setBusy(searchActive);
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(form);
    const { query } = Object.fromEntries(formData.entries());

    setSearchActive(!searchActive);
    if (searchActive) {
      // doesn't actually re-append the child if it's already there!
      form.parentNode.appendChild(results);
      results.f.clear();

      const search = new Search(query);

      let lastPage = 0;
      const posts = api.posts.profilePosts(username);
      for await (const [post, page] of posts) {
        // check for cancellation
        if (!searchActive) break;

        const match = search.matches(post);
        if (match) {
          const title = post.headline || ellipsisAfter(post.plainTextBody, 0, 32);
          const link = post.singlePostPageUrl;
          const result = { title, link, match };

          results.f.append(Result(result));
        }

        results.f.setPage(page);
        lastPage = page;
      }

      // only indicate completion if we weren't cancelled
      if (searchActive) {
        results.f.setPage(lastPage, lastPage);
        setSearchActive(false);
      }
    }
  });

  return ui;
}

/**********
 * Search *
 **********/
class Search {
  constructor(query) {
    this.query = new RegExp(query, 'i');
  }

  matches(post) {
    const tryMatch = (s) => {
      if (!s) return;

      const match = this.query.exec(s);
      if (!match || match.length === 0) return;

      return {
        before: ellipsisBefore(s, match.index, 16),
        matched: match[0],
        after: ellipsisAfter(s, match.index + match[0].length, 16),
      };
    };
    
    return tryMatch(post.headline) || tryMatch(post.plainTextBody);
  }
}

/**************
 * Cohost API *
 **************/
async function trpc(endpoint, request) {
  const base = 'https://cohost.org/api/v1/trpc/';
  const query = new URLSearchParams({ input: JSON.stringify(request) });
  const uri = `${base}/${endpoint}?${query}`;

  const response = await fetch(uri);
  return response.json();
}

function delay(duration) {
  return new Promise((resolve, reject) => {
    setTimeout(() => resolve(), duration);
  });
}

async function* postsProfilePosts(projectHandle) {
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

/***********
 * Utility *
 ***********/
function ellipsisBefore(s, index, maxLength) {
  const start = Math.max(0, index - maxLength);
  const end = Math.min(index, start + maxLength);
  return (start != 0 ? '...' : '') + s.slice(start, end);
}

function ellipsisAfter(s, index, maxLength) {
  const start = index;
  const end = Math.min(s.length, start + maxLength);
  return s.slice(start, end) + (end != s.length ? '...' : '');
}


