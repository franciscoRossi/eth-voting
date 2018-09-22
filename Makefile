node_modules:
	npm install

.PHONY:ganache
ganache: node_modules
	ganache-cli -d -l 10000000000000 -e 100000 -h 0.0.0.0

.PHONY:test
test: node_modules
	npm test
