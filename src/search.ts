import { Post } from './cohost/types';
import { ellipsisAfter, ellipsisBefore } from './util';

export interface SearchMatch {
  before: string,
  matched: string,
  after: string,
}

export default class Search {
  query: RegExp;

  constructor(query: string) {
    this.query = new RegExp(query, 'i');
  }

  matches(post: Post): SearchMatch | null {
    const tryMatch = (s: string) => {
      if (!s) return null;

      const match = this.query.exec(s);
      if (!match || match.length === 0) return null;

      return {
        before: ellipsisBefore(s, match.index, 16),
        matched: match[0],
        after: ellipsisAfter(s, match.index + match[0].length, 16),
      };
    };

    return tryMatch(post.headline) || tryMatch(post.plainTextBody);
  }
}
