build-js-po:
	mkdir -p build
	SENTRY_EXTRACT_TRANSLATIONS=1 ./node_modules/.bin/webpack

locale: build-js-po
	cd src && django-admin.py  makemessages -l en
	./tools/bin/merge-catalogs en
	./tools/bin/find-good-catalogs src/locale/catalogs.json
	cd src && django-admin.py compilemessages

update-transifex: build-js-po
	pip install transifex-client
	cd src/ &&  django-admin.py makemessages -i static -l en
	.tools/bin/merge-catalogs en
	tx push -s
	tx pull -a
	./tools/bin/find-good-catalogs src/locale/catalogs.json
	cd src/ &&  django-admin.py compilemessages
