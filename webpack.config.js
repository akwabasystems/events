/* ---------------------------------------------------------------------------------------------------------------------
                                    WEBPACK BUILD CONFIGURATION
----------------------------------------------------------------------------------------------------------------------*/

/** Definition of Webpack variables */
const webpack = require('webpack');


/** Definition of plugins used in the build process */
const CleanWebpackPlugin = require('clean-webpack-plugin');


/**
 * Definition of different variables related to input and output directories
 */
const NODE_MODULES = 'node_modules';
const buildPaths = {
    ROOT: `${__dirname}/src`,
    INDEX: `${__dirname}/index.js`,
    LIB: `${__dirname}/lib`,
    NODE_MODULES: `${__dirname}/${NODE_MODULES}`
};


const webpackConfig = {
    
    /**
     * The different entry points in the application.
     */
    entry: {
        index: buildPaths.INDEX
    },

    /** Configuration of the output files, paths, and formats */
    output: {
        path: buildPaths.LIB,
        filename: '[name].js'
    },
    
    /** Allows the output of source maps for JS files for easy debugging */
    devtool: "source-map",

    /**
     * This section allows the ability to 'require' packages without specifying their extensions.
     */
    resolve: {
        extensions: ['.js'],
        modules: [NODE_MODULES]
    },

    /**
     * This section contains Webpack loaders, which are simply a transformation pipeline for text files.
     *
     * Those configurations handle the use cases for running transformations on ES6 modules, JSON files, and more.
     */
    module: {
        rules: [
            {
                test: /\.js$/,
                loaders: ["babel-loader", "eslint-loader"],
                include: buildPaths.ROOT
            }
        ]
    },

    /**
     * Additional plugins that are needed to fine-tune the build output
     */
    plugins: [
        
        /** This plugin removes all files from the output directory before each build */
        new CleanWebpackPlugin([ buildPaths.LIB ]),
       
        /**
         * This option allows the definition of properties on the NODE_ENV object of Node. This optimizes the logic 
         * of the code by creating free variables used to skip certain code blocks
         */
        new webpack.DefinePlugin({
            'process.env': {
                'NODE_ENV': JSON.stringify('production')
            }
        })
    ]

};


module.exports = webpackConfig;
