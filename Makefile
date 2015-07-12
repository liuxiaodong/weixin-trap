REPORTER = dot
TIMEOUT = 2000
MOCHA = ./node_modules/mocha/bin/mocha
COVERALLS = ./node_modules/coveralls/bin/coveralls.js

test: 
		$NODE_ENV=test $(MOCHA) -R $(REPORTER) -t $(TIMEOUT)

test-cov:
		$(MAKE) test REPORTER=html-cov > coverage.html

lib-cov:
		@jscoverage lib lib-cov

clean:
		rm -r coverage.html
		
.PHONY: test clean