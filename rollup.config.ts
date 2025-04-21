import { defineConfig } from 'rollup';
import typescript from 'rollup-plugin-typescript2';

export default defineConfig({
  input: './src/lib/index.tsx',
  plugins: [
    typescript({
      tsconfigOverride: {
        compilerOptions: { composite: true },
      },
    }),
  ],
  output: [
    {
      file: './dist/index.umd.cjs',
      format: 'umd',
      sourcemap: true,
      name: 'use-draggable',
      globals: {
        react: 'React',
        'react-dom': 'ReactDOM',
      },
    },
    {
      file: './dist/index.js',
      format: 'esm',
      sourcemap: true,
      globals: {
        react: 'React',
        'react-dom': 'ReactDOM',
      },
    },
  ],
  external: ['react', 'react-dom'],
});
