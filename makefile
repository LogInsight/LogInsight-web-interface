
build: locale

build-js-po:
	mkdir -p po 
	GRAYLOG_EXTRACT_TRANSLATIONS=1 ./node_modules/.bin/webpack

locale: build-js-po
	cd src && django-admin.py makemessages -l en -e jsx -v 2
	./tools/bin/merge-catalogs zh_CN 
	./tools/bin/find-good-catalogs src/locale/catalogs.json
#	cd src/ && django-admin.py compilemessages

