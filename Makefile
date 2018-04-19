default: build

PACKAGES := node_modules/.packages.build
GRUNT := dist/.grunt.build
LINT := .lint.pass
BUILD := dist/build.json

export NO_MINIFY ?= 1

packages: $(PACKAGES)
grunt: $(GRUNT)

NPATH := $(shell pwd)/node_modules/.bin
SRC := $(shell find client/scripts client/html client/images client/stylesheets server -type f)

########################################################
# Building & cleaning targets
########################################################

ifneq ($(SKIP_PACKAGES),1)
$(PACKAGES): package.json
	npm install
	touch $@
else
$(PACKAGES):
	touch $@
endif

ifneq ($(NODE_ENV),production)
$(LINT): $(SRC)
	$(NPATH)/eslint client server
	touch $@
else
$(LINT):
	touch $@
endif

$(GRUNT): $(PACKAGES) $(SEMANTIC) Gruntfile.js $(SRC) $(LINT) Makefile
	$(NPATH)/grunt default
	touch $@

$(BUILD): $(GRUNT) Makefile
	echo '{"git_commit": "$(or $(SOURCE_VERSION),$(shell git rev-parse HEAD))"}' > $@

clean:
	rm -rf $(PACKAGES) $(SEMANTIC) $(GRUNT) dist

realclean: clean
	rm -rf node_modules components
	rm .lint.pass
	rm package-lock.json

build: $(BUILD)

lint: $(LINT)

########################################################
# Runtime-only targets
########################################################
watch:
	$(NPATH)/grunt watch

run: $(BUILD)
	npm start

forcerun:
	npm start
