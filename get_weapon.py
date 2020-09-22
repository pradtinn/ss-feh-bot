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
    if len(word) > 2 or word == 't':
        if word[0] == '(':
            word = word[0] + word[1:].capitalize()
        else:
            word = word.capitalize()
        try:
            dashIndex = word.find('-', 0, len(word)-1)
            word = word[:dashIndex+1] + word[dashIndex+1:].capitalize()
        except ValueError:
            pass
    weapon_alt = '_'.join((weapon_alt, word))
    weapon = '_'.join((weapon, word))
weapon = weapon[1:]
weapon = weapon.replace('’', '\'')

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
    'refine': '',
    'owners': dict(),
    'past_max': False,
    'image-link': '' 
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
    '\\xef\\xbc\\x96': '6',
    '<br/>': '\n'
}

infobox = page_parser.find('div', class_='hero-infobox')
if infobox == None:
    open('weapon_lookup_result.json', 'w')
    exit(1)
infobox = infobox.table.tbody
# print(infobox.prettify().encode('utf-8', 'ignore'))
image = infobox.find('a', class_='image')
if image != None:
    image = image.img['src']
    result['image-link'] = image[:image.find('?')]
result['type'] = infobox.find('th', string='Weapon type\n').parent.td.a['title']
if 'bow' in result['type']:
    result['type'] = 'All Bows'
elif 'Dagger' in result['type']:
    result['type'] = 'All Daggers'
elif 'Breath' in result['type']:
    result['type'] = 'All Breaths'
elif 'Beast' in result['type']:
    result['type'] = 'All Beasts'
elif 'Staff' in result['type']:
    result['type'] = 'Colorless Staff'
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
    td = infobox.find('th', string='Description\n').parent.td
    desc = ''
    for child in td.children:
        if child.string != None:
            desc += remap_characters(child.string, character_mapping)+'\n'
    td = td.get_text().encode('utf-8', errors='replace')[:-1]
    result['desc'] = remap_characters(desc, character_mapping)
    result['desc'] = result['desc'][:-1]
refine = page_parser.find('span', id='Upgrades')
if refine == None:
    result['refine'] = 'None'
else:
    refine = refine.parent.next_sibling.next_sibling.next_sibling.next_sibling.find('span', style='color:#528C34')
    if refine == None:
        result['refine'] = 'None'
    else:
        refine = refine.parent
        base_eff_desc = ''
        temp = refine.next_element
        while (temp.name != 'span'):
            base_eff_desc += remap_characters(temp, character_mapping)
            temp = temp.next_element
        if (base_eff_desc != result['desc']):
            result['refine'] = remap_characters(base_eff_desc, character_mapping)
        else:
            result['refine'] = ''
        refine = refine.span
        result['refine'] += '*'+remap_characters(refine.get_text(), character_mapping)+'*'

owner_table = page_parser.find('span', id='List_of_owners').parent.next_sibling.next_sibling.tbody
if owner_table != None:
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