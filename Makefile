VERSION := $(shell head -1 version)


all: dist


clean:
	rm -rf dist


init:
	@mkdir -p dist


dist: init dist/text-field-suggester-$(VERSION).js


dist/text-field-suggester-$(VERSION).js: src/text-field-suggester.js
	cp src/text-field-suggester.js dist/text-field-suggester-$(VERSION).js
