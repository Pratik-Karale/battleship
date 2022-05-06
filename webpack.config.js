const path=require("path")
const HtmlWebpackPlugin=require("html-webpack-plugin")
module.exports={
    entry:"./src/index.js",
    output:{
        filename:"wubbalubaadubdub.js",
        path:path.resolve(__dirname,"dist")
    },
    // plugins:[new HtmlWebpackPlugin({
    //     title:"rick and morty",
    //     template:"./src/index.html"
    // })]
}