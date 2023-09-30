import nodeResolve from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import typescript from '@rollup/plugin-typescript';

import React from 'react';
import ReactDOM from 'react-dom';

function unpkg(name: string, version: string, path: string): string {
  return `https://unpkg.com/${name}@${version}/${path}`;
}

export default {
  input: 'src/index.tsx',
  output: {
    file: 'dist/bundle.user.js',
    format: 'iife',
    globals: {
      'react': 'React',
      'react-dom': 'ReactDOM',
      'react-dom/client': 'ReactDOM',
    },
  },
  external: (id: string) => /^react(-dom)?/.test(id),
  plugins: [
    nodeResolve({ extensions: ['.js', '.ts', '.tsx'] }),
    typescript(),
    replace({
      preventAssignment: true,
      '__react__': unpkg('react', React.version, 'umd/react.development.js'),
      '__react-dom__': unpkg('react-dom', ReactDOM.version, 'umd/react-dom.development.js'),
    }),
  ],
};
