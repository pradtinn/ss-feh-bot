import requests
from bs4 import BeautifulSoup
import json
import codecs
import sys

with open('unit_data.json') as inp:
    data = json.load(inp)

name = sys.argv[1]

if name in data:
    print('Already in data')
    exit(0)

hero_link = 'https://feheroes.gamepedia.com/'+name
hero_page = requests.get(hero_link)

page_parser = BeautifulSoup(hero_page.content, 'html.parser')

infobox = page_parser.find('table', class_='hero-infobox')

weapon_type = ''
move_type = ''
release_date = ''

for tr in infobox.find_all('tr')[2:]:
    if tr.th.get_text() == 'Weapon Type\n':
        weapon_type = tr.td.get_text()[1:]
    if tr.th.get_text() == 'Move Type\n':
        move_type = tr.td.get_text()[1:]
    if tr.th.get_text() == 'Release Date\n':
        release_date = tr.td.get_text()

tables = page_parser.find_all('table', class_='wikitable default')
print(tables)

with open('unit_data.json', 'w') as out:
    json.dump(data, out)