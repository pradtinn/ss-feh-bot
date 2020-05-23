import requests
from bs4 import BeautifulSoup
import json
import codecs

heroes_link = 'https://feheroes.gamepedia.com/List_of_Heroes'
hero_link = 'https://feheroes.gamepedia.com/'
heroes_page = requests.get(heroes_link)

page_parser = BeautifulSoup(heroes_page.content, 'html.parser')

units = page_parser.find_all('tr', class_='hero-filter-element')

with open('unit_data.json') as inp:
    data = json.load(inp)

for unit in units:
    i = 3
    name = unit.contents[1].get_text().replace(' ', '_')
    for col in unit.contents[3:]:
        if i == 4:
            weapon_type = col.img['alt']
            if 'Sword' in weapon_type or 'Lance' in weapon_type or 'Axe' in weapon_type:
                weapon_type = weapon_type.split(' ')[1]
            data[name]['weaponType'] = weapon_type
        if i == 3:
            move_type = col.img['alt']
            data[name]['moveType'] = move_type
        if i == 6:
            release_date = col.get_text()
            data[name]['releaseDate'] = release_date
        i += 1

with open('Aliases.json') as a:
    aliases = json.load(a)

for alias, name in aliases.items():
    alias_list = alias.split('+')
    data[name]['alias'] = alias_list

with open('unit_data.json', 'w') as out:
    json.dump(data, out)