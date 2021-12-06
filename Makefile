MODULE_NAME := $(shell node -e "console.log(require('./package.json').binary.module_name)")

NODE_MAPNIK_BUILD ?= release

NODE_GYP_FLAGS ?= -j $(shell sh -c "nproc 2>/dev/null || sysctl -n hw.physicalcpu 2>/dev/null || echo 1") --ENABLE_GLIBC_WORKAROUND=true

CC  ?= clang
CXX ?= clang++

default: $(NODE_MAPNIK_BUILD)

ifneq (,$(findstring clang,$(CXX)))
    PROFILING_FLAG += -gline-tables-only
else
    PROFILING_FLAG += -g
endif

deps/geometry/include/mapbox/geometry.hpp:
	git submodule update --init

node_modules:
# <<<<<<< HEAD
	npm install --ignore-scripts --clang

mason_packages/.link/bin/mapnik-config:
	./scripts/install_deps.sh

pre_build_check:
	@node -e "console.log('\033[94mNOTICE: to build from source you need mapnik >=',require('./package.json').mapnik_version,'\033[0m');"
	@echo "Looking for mapnik-config on your PATH..."
	mapnik-config -v

release_base: pre_build_check deps/geometry/include/mapbox/geometry.hpp node_modules
	V=1 CXXFLAGS="-fno-omit-frame-pointer $(PROFILING_FLAG)" ./node_modules/.bin/node-pre-gyp configure build --ENABLE_GLIBC_WORKAROUND=true --loglevel=error --clang
	@echo "run 'make clean' for full rebuild"

debug_base: pre_build_check deps/geometry/include/mapbox/geometry.hpp node_modules
	V=1 ./node_modules/.bin/node-pre-gyp configure build --ENABLE_GLIBC_WORKAROUND=true --loglevel=error --debug --clang
	@echo "run 'make clean' for full rebuild"

release: mason_packages/.link/bin/mapnik-config
	CXXFLAGS="-D_GLIBCXX_USE_CXX11_ABI=0" PATH="./mason_packages/.link/bin/:${PATH}" $(MAKE) release_base

debug: mason_packages/.link/bin/mapnik-config
	CXXFLAGS="-D_GLIBCXX_USE_CXX11_ABI=0" PATH="./mason_packages/.link/bin/:${PATH}" $(MAKE) debug_base
# =======
# conflict from: https://github.com/decision-labs/node-mapnik/commit/1e798e34227bb27564de8a97ca3a73ab776b2217 and
# https://github.com/decision-labs/node-mapnik/commit/6139f0c964c003fa490e8ed4477544500cd9ac5b 
# https://github.com/decision-labs/node-mapnik/commit/0ba4b0e38379a22c7e73f1a484c1ca92b429bb33
# 	CC="${CC}" CXX="${CXX}" npm install --ignore-scripts

# mason_packages/.link/bin/mapnik-config: deps/geometry/include/mapbox/geometry.hpp
# 	./install_mason.sh

# pre_build_check:
# 	mapnik-config -v |>/dev/null

# release_base: pre_build_check deps/geometry/include/mapbox/geometry.hpp node_modules
# 	V=1 ./node_modules/.bin/node-pre-gyp configure build --loglevel=error $(NODE_GYP_FLAGS)
# 	@echo "run 'make clean' for full rebuild"

# debug_base: pre_build_check deps/geometry/include/mapbox/geometry.hpp node_modules
# 	V=1 ./node_modules/.bin/node-pre-gyp configure build --loglevel=error --debug $(NODE_GYP_FLAGS)
# 	@echo "run 'make clean' for full rebuild"

# release: mason_packages/.link/bin/mapnik-config
# 	PATH="./mason_packages/.link/bin/:${PATH}" CC="clang" CXX="clang++" $(MAKE) release_base

# debug: mason_packages/.link/bin/mapnik-config
# 	PATH="./mason_packages/.link/bin/:${PATH}" CC="clang" CXX="clang++" $(MAKE) debug_base

# strip:
# 	(find lib -type f \( -iname \*.so    \) | xargs strip -s) 2>/dev/null || true
# 	(find lib -type f \( -iname \*.node  \) | xargs strip -s) 2>/dev/null || true
# 	(find lib -type f \( -iname \*.dylib \) | xargs strip -s) 2>/dev/null || true
# 	(find lib -type f \( -iname \*.input \) | xargs strip -s) 2>/dev/null || true
# 	(find ./lib/binding/bin/* | xargs strip -s) 2>/dev/null || true
# >>>>>>> v3.6.2-carto

coverage:
	./scripts/coverage.sh

clean:
	rm -rf lib/binding
	rm -rf build
	rm -rf .mason
	find test/ -name *actual* -exec rm {} \;
	echo "run make distclean to also remove mason_packages and node_modules"

distclean: clean
	rm -rf node_modules
	rm -rf mason_packages

xcode: node_modules
	./node_modules/.bin/node-pre-gyp configure -- -f xcode

	@# If you need more targets, e.g. to run other npm scripts, duplicate the last line and change NPM_ARGUMENT
	SCHEME_NAME="$(MODULE_NAME)" SCHEME_TYPE=library BLUEPRINT_NAME=$(MODULE_NAME) BUILDABLE_NAME=$(MODULE_NAME).node scripts/create_scheme.sh
	SCHEME_NAME="npm test" SCHEME_TYPE=node BLUEPRINT_NAME=$(MODULE_NAME) BUILDABLE_NAME=$(MODULE_NAME).node NODE_ARGUMENT="`npm bin tape`/tape test/*.test.js" scripts/create_scheme.sh

	open build/binding.xcodeproj

docs:
	npm run docs

test:
	npm test
check: test

check: test

testpack:
	rm -f ./*tgz
	npm pack
	tar -ztvf *tgz
	rm -f ./*tgz

.PHONY: test docs release debug strip
