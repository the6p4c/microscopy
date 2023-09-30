import pkg from './package.json' assert { type: 'json' };
import nodeResolve from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import typescript from '@rollup/plugin-typescript';

const isProduction = process.env.NODE_ENV === 'production';

function unpkg(name, path) {
  if (!(name in pkg.dependencies)) {
    throw `couldn't find ${name} in package.json dependencies`;
  }

  const version = pkg.dependencies[name];
  // catch a couple of obvious problems
  if (/^><~\^\*/.test(version)) {
    throw `version ${version} for ${name} doesn't look good`;
  }

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
  external: (id) => /^react(-dom)?/.test(id),
  plugins: [
    nodeResolve({ extensions: ['.js', '.ts', '.tsx'] }),
    typescript(),
    replace({
      preventAssignment: true,
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
      '__react__': unpkg('react',
        `umd/react.${isProduction ? 'production.min.js' : 'development.js'}`
      ),
      '__react-dom__': unpkg('react-dom',
        `umd/react-dom.${isProduction ? 'production.min.js' : 'development.js'}`
      ),
    }),
  ],
};
