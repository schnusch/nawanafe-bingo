# tools
ESBUILD = esbuild
SASSC = sassc
PANDOC = pandoc
TSC = tsc

# flags
tsflags = \
	--noErrorTruncation \
	--noUnusedParameters \
	--strict \
	--moduleResolution node \
	--resolveJsonModule \
	--target es6 \
	$(TSFLAGS)
esflags = \
	$(ESFLAGS)
sassflags = \
	$(SASSFLAGS)

all: build/index.xhtml build/script.js build/style.css

clean:
	$(RM) -r build

serve: all
	mkdir -p build/tmp
	sed -e "s,%%PWD%%,`pwd`,g" nginx.conf > build/nginx.conf
	nginx -p build -c nginx.conf

publish:
	./publish.sh

build/index.xhtml: index.md template.xhtml
	mkdir -p $(@D)
	pandoc -t html5 --standalone --template template.xhtml -o $@ -f markdown+yaml_metadata_block index.md

build/script.js: script.ts items.json
	$(TSC) $(tsflags) --noEmit $(@F:.js=.ts)
	$(ESBUILD) $(esflags) --bundle --platform=browser --outfile=$@ $(@F:.js=.ts)

build/style.css: style.scss
	mkdir -p $(@D)
	$(SASSC) $(sassflags) --sass $(@F:.css=.scss) $@
