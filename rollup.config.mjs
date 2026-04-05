import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import terser from "@rollup/plugin-terser";

export default {
  input: "src/pv-energy-donut-card.ts",
  output: {
    file: "dist/pv-energy-donut-card.js",
    format: "es",
    sourcemap: false
  },
  plugins: [
    resolve(),
    commonjs(),
    typescript({
      tsconfig: "./tsconfig.json",
      outDir: undefined
    }),
    terser({
      format: {
        comments: false
      }
    })
  ]
};
