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

hero_link = 'https://feheroes.gamepedia.com/'+name
hero_page = requests.get(hero_link)

new_unit = {
    'lvl1stats': {},
    'growths': [],
    'weapon': '',
    'assist': '',
    'special': '',
    'passives': {'A': [], 'B': [], 'C': []},
    'alias': [],
    'moveType': '',
    'weaponType': '',
    'releaseDate': ''
}

page_parser = BeautifulSoup(hero_page.content, 'html.parser')

infobox = page_parser.find('table', class_='hero-infobox')

weapon_type = ''
move_type = ''
release_date = ''

for tr in infobox.find_all('tr')[2:]:
    if tr.th.get_text() == 'Weapon Type\n':
        new_unit['weaponType'] = tr.td.get_text()[1:-1]
    if tr.th.get_text() == 'Move Type\n':
        new_unit['moveType'] = tr.td.get_text()[1:-1]
    if tr.th.get_text() == 'Release Date\n':
        new_unit['releaseDate'] = tr.td.get_text()[:-1]

tables = page_parser.find_all('table', class_='wikitable default')
i = 0
for table in [tables[0], tables[2]]:
    for row in table.find_all('tr')[1:]:
        rarity = row.td.get_text()
        if i == 0:
            new_unit['lvl1stats'][rarity] = []
        for col in row.find_all('td')[1:-1]:
            if i == 0:
                new_unit['lvl1stats'][rarity].append(col.get_text())
            else:
                new_unit['growths'].append(col.get_text())
    i += 1

skill_types = ['Weapons', 'Assists', 'Specials', 'Passives']
skill_to_data_rep = {'Weapons': 'weapon', 'Assists': 'assist', 'Specials': 'special', 'Passives': 'passives'}
for skill in skill_types:
    skill_h3 = page_parser.find(id=skill)
    print(skill, skill_h3)
    next_element = skill_h3.parent.next_sibling.next_sibling
    if next_element.name != 'div':
        if skill != 'Passives':
            row = next_element.find_all('tr')[-1]
            new_unit[skill_to_data_rep[skill]] = row.a.get_text()
        else:
            passive_type = ''
            for row in next_element.find_all('tr')[1:]:
                if row.find('th') != None:
                    passive_type = row.th.get_text()
                new_unit['passives'][passive_type] = row.find_all('td')[1].get_text()

print(new_unit)

data[name] = new_unit

with open('unit_data.json', 'w') as out:
    json.dump(data, out, indent=4)