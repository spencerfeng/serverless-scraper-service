import chromium from 'chrome-aws-lambda'
import { Browser, Page } from 'puppeteer-core'
import createError from 'http-errors'
import { mockClient } from 'aws-sdk-client-mock'
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { scrapeWeb, IEvent, IBody } from '../../src/handlers/scrapeWeb'

describe('scrapeWeb handler', () => {
    const mockedPageGoTo = jest.fn()
    const mockedPageWait = jest.fn()
    const mockedPageContent = jest.fn()
    const mockedBrowserClose = jest.fn()

    const mockedPage = {
        goto: mockedPageGoTo,
        waitForSelector: mockedPageWait,
        content: mockedPageContent
    } as unknown as Page

    const mockedBrowser = {
        newPage: jest.fn().mockResolvedValue(mockedPage),
        close: mockedBrowserClose
    } as unknown as Browser

    const mockedEvent = {
        body: {
            url: 'http://test-url',
            fileName: 'fileName',
            waitForSelector: '.selector'
        }
    } as unknown as IEvent<IBody>

    const s3Mock = mockClient(S3Client)

    const s3PutObjectCommandPromise = s3Mock.on(PutObjectCommand, {
        Bucket: process.env.WEB_SNAPSHOTS_BUCKET_NAME,
        Key: mockedEvent.body.fileName,
        Body: '<html><body>This is test html</body></html>',
        ContentType: 'text/html'
    })

    beforeEach(() => {
        s3Mock.reset()
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    it('should return status code 200 if it scrapes the web page and uploads its content to S3 successfully', async () => {
        s3PutObjectCommandPromise.resolves({
            $metadata: {}
        })

        jest.spyOn(chromium.puppeteer, 'launch').mockResolvedValueOnce(mockedBrowser)

        const returnedValue = await scrapeWeb(mockedEvent)

        expect(mockedPageGoTo).toHaveBeenCalledTimes(1)
        expect(mockedPageGoTo).toHaveBeenCalledWith(mockedEvent.body.url)

        expect(mockedPageWait).toHaveBeenCalledTimes(1)
        expect(mockedPageWait).toHaveBeenCalledWith(mockedEvent.body.waitForSelector)

        expect(mockedPageContent).toHaveBeenCalledTimes(1)

        expect(mockedBrowserClose).toHaveBeenCalledTimes(1)

        expect(returnedValue).toEqual({
            statusCode: 200
        })
    })

    it('should throw the correct error if the browser instance can not be created', async () => {
        s3PutObjectCommandPromise.resolves({
            $metadata: {}
        })

        jest.spyOn(chromium.puppeteer, 'launch').mockRejectedValueOnce({
            message: 'Could not create a browser instance.'
        })

        try {
            await scrapeWeb(mockedEvent)
        } catch (error) {
            expect((error as createError.HttpError).message).toBe('Could not scrape this web page.')
            expect((error as createError.HttpError).statusCode).toBe(500)
        }
    })

    it('should throw the correct error if it fails to upload the web page content to S3', async () => {
        s3PutObjectCommandPromise.rejects()

        jest.spyOn(chromium.puppeteer, 'launch').mockResolvedValueOnce(mockedBrowser)

        try {
            await scrapeWeb(mockedEvent)
        } catch (error) {
            expect((error as createError.HttpError).message).toBe('Could not scrape this web page.')
            expect((error as createError.HttpError).statusCode).toBe(500)
        }
    })
})
