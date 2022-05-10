const path=require("path")
const HtmlWebpackPlugin=require("html-webpack-plugin")
module.exports={
    entry:"./src/index.js",
    output:{
        filename:"[contenthash].js",
        path:path.resolve(__dirname,"dist"),
        clean:true,
    },
    mode:"development",
    plugins:[new HtmlWebpackPlugin({
        // title:"rick and morty",
        template:"./src/index.html"
    })],
    module: {
        rules: [
          {
            test: /\.css$/i,
            use: ["style-loader", "css-loader"],
          },
        ],
      },
}