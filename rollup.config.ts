// TODO: why is this so mad?
// @ts-ignore
import process from 'process';
import nodeResolve from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import typescript from '@rollup/plugin-typescript';

import React from 'react';
import ReactDOM from 'react-dom';

const isProduction = process.env.NODE_ENV === 'production';

function unpkg(name: string, version: string, path: string): string {
  return `https://unpkg.com/${name}@${version}/${path}`;
}

export default {
  input: 'src/index.tsx',
  output: {
    file: 'dist/microscopy.user.js',
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
      'process.env.NODE_ENV': process.env.NODE_ENV,
      '__react__': unpkg(
        'react', React.version,
        `umd/react.${isProduction ? 'production.min.js' : 'development.js'}`
      ),
      '__react-dom__': unpkg(
        'react-dom', ReactDOM.version,
        `umd/react-dom.${isProduction ? 'production.min.js' : 'development.js'}`
      ),
    }),
  ],
};
