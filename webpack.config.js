const slsw = require('serverless-webpack')

module.exports = {
    resolve: {
        extensions: ['.ts', '.js']
    },
    entry: slsw.lib.entries,
    mode: 'production',
    module: {
        rules: [
            {
                test: /\.ts$/,
                exclude: /node_modules/,
                use: {
                    loader: 'ts-loader'
                }
            }
        ]
    },
    externals: ['chrome-aws-lambda']
}
