import chromium from 'chrome-aws-lambda'
import { Browser } from 'puppeteer-core'
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda'
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import createError from 'http-errors'
import middy from '@middy/core'
import jsonBodyParser from '@middy/http-json-body-parser'
import validator from '@middy/validator'
import httpErrorHandler from '@middy/http-error-handler'
import scrapeWebPageSchema from '../schemas/scrapeWebPageSchema'

interface IEvent<TBody> extends Omit<APIGatewayProxyEventV2, 'body'> {
    body: TBody
}

interface IBody {
    url: string
    fileName: string
    waitForSelector: string
}

const startBrowser = async (): Promise<Browser | undefined> => {
    let browser: Browser
    try {
        browser = await chromium.puppeteer.launch({
            args: chromium.args,
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath,
            headless: chromium.headless,
            ignoreHTTPSErrors: true
        })

        return browser
    } catch (error) {
        console.log('Failed to create a browser instance: ', error)
        throw new createError.InternalServerError('Could not create a browser instance.')
    }
}

const scrapeWeb = async (event: IEvent<IBody>): Promise<APIGatewayProxyResultV2> => {
    const { url, fileName, waitForSelector } = event.body

    try {
        const browser = await startBrowser()

        if (browser) {
            const page = await browser.newPage()
            await page.setViewport({ width: 1280, height: 800 })
            await page.goto(url)
            await page.waitForSelector(waitForSelector)
            const html = await page.content()

            await browser.close()

            const s3 = new S3Client({})
            const uploadParams = {
                Bucket: process.env.WEB_SNAPSHOTS_BUCKET_NAME,
                Key: fileName,
                Body: html,
                ContentType: 'text/html'
            }

            await s3.send(new PutObjectCommand(uploadParams))

            return {
                statusCode: 200
            }
        }

        throw new createError.InternalServerError('Could not create a browser instance.')
    } catch (error) {
        console.log('Failed to scrape the web page: ', error)
        throw new createError.InternalServerError('Could not scrape this web page.')
    }
}

export const handler = middy(scrapeWeb)
    .use(jsonBodyParser())
    .use(
        validator({
            inputSchema: scrapeWebPageSchema,
            ajvOptions: {
                strict: false
            }
        })
    )
    .use(httpErrorHandler())
