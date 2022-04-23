const scrapeWebPageSchema = {
    type: 'object',
    properties: {
        body: {
            type: 'object',
            properties: {
                url: {
                    type: 'string'
                },
                fileName: {
                    type: 'string'
                },
                waitForSelector: {
                    type: 'string'
                }
            },
            required: ['url', 'fileName', 'waitForSelector']
        }
    }
}

export default scrapeWebPageSchema
