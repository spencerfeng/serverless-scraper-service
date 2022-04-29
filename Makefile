RUN_NODE=docker-compose run --rm node

install:
	$(RUN_NODE) yarn install

lint:
	$(RUN_NODE) yarn lint

test:install
	$(RUN_NODE) yarn run test
.PHONY: test

deploy-dev:test
	docker-compose run --rm serverless