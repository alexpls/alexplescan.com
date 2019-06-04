module.exports = {
  mode: "production",
  entry: "./_javascript/index.ts",
  output: {
    filename: "./index.js"
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js']
  },
  module: {
    rules: [
      { test: /\.tsx?$/, loader: 'ts-loader' }
    ]
  }
}
