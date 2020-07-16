import requests
from bs4 import BeautifulSoup
import json
import codecs
import sys

def remap_characters(string, mapping):
    new_string = str(string)
    for target, replacement in mapping.items():
        # print('Replacing {} with {} in {}'.format(target, replacement, new_string))
        new_string = new_string.replace(target, replacement)
    return new_string 

weapon_raw = sys.argv[1]
weapon = ''
weapon_alt = ''
for word in weapon_raw.split():
    if len(word) > 2:
        if word[0] == '(':
            word = word[0] + word[1:].capitalize()
        else:
            word = word.capitalize()
    weapon_alt = '_'.join((weapon_alt, word))
    weapon = '_'.join((weapon, word))
weapon = weapon[1:]

link = ('https://feheroes.gamepedia.com/'+weapon).encode('utf-8')
link_alt = ('https://feheroes.gamepedia.com/'+weapon_alt).encode('utf-8')
page = requests.get(link)
page_parser = BeautifulSoup(page.content, 'html.parser')
result = {
    'name': ' '.join(weapon.split('_')),
    'type': '',
    'might': '',
    'range': '',
    'prereq': [],
    'desc': '',
    'owners': dict(),
    'past_max': False
}
MAX_OWNERS = 5
character_mapping = {
    '\\xe3': '',
    '\\x80': ' ',
    '\\x90': '[ ',
    '\\x91': '] ',
    '\\xc3\\xb8': 'o',
    '\\xc3\\x97': '*',
    '\\xe2\\x89\\xa4': '<=',
    '\\xef\\xbc\\x97': '7',
    '\\xe2\\x89\\xa5': '>=',
    '\\xe2 \\x99': '\'',
    '\\xef\\xbc\\x96': '6'
}

infobox = page_parser.find('div', class_='hero-infobox')
if infobox == None:
    open('weapon_lookup_result.json', 'w')
    exit(1)
infobox = infobox.table.tbody
# print(infobox.prettify().encode('utf-8', 'ignore'))
result['type'] = infobox.find('th', string='Weapon type\n').parent.td.a['title']
result['might'] = infobox.find('th', string='Might\n').parent.td.get_text()[:-1]
result['range'] = infobox.find('th', string='Range\n').parent.td.get_text()[:-1]
prereqs = infobox.find('span', string='Required').parent.parent.td.find_all('a')
if len(prereqs) == 0:
    result['prereq'] = ['None']
else:
    for prereq in prereqs:
        result['prereq'].append(prereq.get_text())
if infobox.find('th', string='Description\n') == None:
    result['desc'] = 'None'
else:
    result['desc'] = infobox.find('th', string='Description\n').parent.td.get_text().encode('utf-8', errors='replace')[:-1]
    result['desc'] = remap_characters(result['desc'], character_mapping)
    result['desc'] = result['desc'][2:-1]

owner_table = page_parser.find('span', id='List_of_owners').parent.next_sibling.next_sibling.tbody
for tr in owner_table.find_all('tr')[1:]:
    td_count = 0
    owner_name = ''
    rarity = ''
    for td in tr.find_all('td'):
        if td_count == 0:
            owner_name = td.div.a['title']
        else:
            if (td.find('a', class_='mw-selflink') != None):
                rarity = td.a.next_sibling.next_sibling
        td_count += 1
    if not result['past_max']:
        result['owners'][owner_name] = rarity
        if len(result['owners']) > MAX_OWNERS:
            result['past_max'] = True 
    else:
        for o, r in result['owners'].items():
            if rarity < r:
                result['owners'].pop(o)
                result['owners'][owner_name] = rarity
                break

# print(result)
with open('weapon_lookup_result.json', 'w') as file:
    json.dump(result, file, indent=4)