# Serverless Scraper Service

This service allows the user to grab the HTML of a web page and save it to the S3 bucket.

## Unit tests

```
$ make test
```

## How to deploy it locally

### Step 1

Create shell environment variables called 'AWS_ACCESS_KEY_ID' and 'AWS_SECRET_ACCESS_KEY' and assign your corresponding AWS values to them.

### Step 2

```
$ make deploy-dev
```

## CI/CD

-   After a pull request is made against the main branch, a pipeline will start to lint and test the code changes.
-   After the changes are merged to the main branch, the changes will be deployed to AWS.

## Tech stack

-   Serverless framework
-   AWS Lambda function
-   AWS Simple Storage
-   API Gateway
-   Github Action
-   Docker
-   Typescript
-   Jest
-   puppeteer
