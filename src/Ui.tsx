import React from 'react';

import api from './cohost/api';
import Search, { SearchMatch } from './search';
import { ellipsisAfter } from './util';

type Progress = [number | null, number | null];

type Result = {
  title: string,
  link: string,
  match: SearchMatch,
};

function Results({ progress, busy, results }: { progress: Progress, busy: boolean, results: Result[] }) {
  const [currentPost, postCount] = progress;
  const count = (pageNumber: number | null) => {
    if (pageNumber !== null) {
      return pageNumber;
    } else {
      return '?';
    }
  };

  const Spinner = () => <svg
    version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"
    className="h-6 self-center text-gray-500" style={{ animation: '1s infinite spin' }}
  >
    <path fill="none" stroke="rgb(131, 37, 79)" strokeWidth="3" d="M 8 16 A 8 8 0 0 1 16 8" />
    <path fill="none" stroke="#eee" strokeWidth="3" d="M 16 8 A 8 8 0 1 1 8 16" />
  </svg>;

  // TODO: names hard
  const resultsX = results.map((result) => {
    return <li className="mb-4">
      <div>
        <a href={result.link} target="_blank" className="underline">{result.title}</a>
      </div>
      <div style={{ marginLeft: '1rem' }}>
        {result.match.before}<strong>{result.match.matched}</strong>{result.match.after}
      </div>
    </li>;
  });

  return <>
    <div className="flex gap-2" style={{ alignItems: 'baseline' }}>
      <strong className="text-xl font-bold">results</strong>
      <div style={{ flexGrow: 1 }}></div>
      <span>({count(currentPost)}/{count(postCount)} posts)</span>
      {busy && <Spinner />}
    </div>
    {
      resultsX.length !== 0
      ? <ul>{resultsX}</ul>
      : busy
      ? <span className="text-gray-500">nothing yet...</span>
      : <>
        <img className="w-24 mx-auto" src="https://cohost.org/static/9559ff8058a895328d76.png" />
        <span className="text-center text-gray-500">no results</span>
      </>
    }
  </>;
}

export default function Ui() {
  const username = new URL(window.location.href).pathname.split('/')[1];

  const [active, setActive] = React.useState(false);
  const [activeSticky, setActiveSticky] = React.useState(false);
  const cancel = React.useRef(false);
  const [progress, setProgress] = React.useState([-1, null] as Progress);
  const [results, setResults] = React.useState([] as Result[]);

  const startSearch = async (query: string) => {
    const search = new Search(query);

    setActive(true);
    setActiveSticky(true);
    cancel.current = false;
    setProgress([null, null]);
    setResults([]);

    let count = 0;
    const posts = api.posts.profilePosts(username);
    for await (const post of posts) {
      if (cancel.current) break;
      console.log(post);

      const match = search.matches(post);
      if (match) {
        const title = post.headline || ellipsisAfter(post.plainTextBody, 0, 32);
        const link = post.singlePostPageUrl;
        const result = { title, link, match };

        setResults(searchResults => [...searchResults, result]);
      }

      setProgress([++count, null]);
    }

    // only show the total post count if we actually reached the end
    if (!cancel.current) {
      setProgress([count, count]);
    }

    cancel.current = false;
    setActive(false);
  };

  const cancelSearch = () => {
    cancel.current = true;
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!active) {
      const formData = new FormData(e.target as HTMLFormElement);
      const { query } = Object.fromEntries(formData.entries()) as { query: string };
      startSearch(query);
    } else {
      cancelSearch();
    }
  };

  return <div className="cohost-shadow-light dark:cohost-shadow-dark flex flex-col divide-y divide-gray-300 rounded-lg bg-white lg:max-w-sm">
    <div className="flex flex-row items-center rounded-t-lg bg-longan p-3 uppercase text-notBlack">
      Search @{username}
    </div>
    <div className="flex flex-col gap-2 px-3 py-2 text-notBlack">
      <form onSubmit={submit} className="flex flex-col gap-3">
        <div className="relative grid w-full overflow-auto">
          <input
            name="query" type="text" required disabled={active}
            autoComplete="off" placeholder="query"
            className="border-cherry w-full row-start-1 row-end-2 col-start-1 col-end-2 min-h-0"
          />
        </div>
        <div className="flex w-full flex-row items-center justify-end gap-4">
          <button className="rounded-lg bg-cherry py-2 px-4 text-sm font-bold text-notWhite hover:bg-cherry-600 active:bg-cherry-700 disabled:bg-cherry-200">
            {active ? 'cancel' : 'search'}
          </button>
        </div>
      </form>
      {activeSticky && <Results progress={progress} busy={active} results={results} />}
    </div>
  </div>;
}
