import requests
from bs4 import BeautifulSoup
import json
import codecs
import sys
import re

file = open('skill_lookup_result.json', 'w')

out = {}

lowercase_words = ['and', 'of', 'for', 'to']
uppercase_words = ['AR']

def skill_capitalize(name):
    result = ''
    reg = re.compile('([ -/])')
    name = re.split(reg, name)
    for word in name:
        if word.upper() in uppercase_words:
            result += word.upper()
        elif word.lower() not in lowercase_words:
            result += word.capitalize()
        else:
            result += word
    return result

skill_raw = sys.argv[1]
skill = skill_capitalize(skill_raw)
slash_index = skill.find('/')
skill = skill.replace('/', ' ')
level = ''
if skill[-1].isnumeric():
    level = skill[-1]
    skill = skill[:-1]

link = ('https://feheroes.gamepedia.com/'+skill).encode('utf-8')
page = BeautifulSoup(requests.get(link).content, 'html.parser')
if slash_index > -1:
    skill = skill[:slash_index] + '/' + skill[slash_index+1:]

skill_table = page.find('table')
if skill_table == None:
    print('skill table = None')
    file.close()
    exit(1)
out['name'] = skill+level

skill_row = skill_table.find('td', text=skill+level+'\n')
if skill_row == None:
    skill_row = skill_table.find('td', text=skill+' 3'+'\n')
    if skill_row == None:
        skill_row = skill_table.find('td', text=skill+' 2'+'\n')
        if skill_row == None:
            print('skill row = None')
            file.close()
            exit(1)
        else:
            skill = skill+' '
            level = '2'
    else:
        skill = skill+' '
        level = '3'
skill_row = skill_row.parent
passive = False

skill_image = skill_row.find('img')
if skill_image != None:
    out['image'] = skill_image['src']
    passive = True

if passive:
    out['desc'] = skill_row.find_all('td')[-1].get_text()
else:
    out['desc'] = skill_row.find_all('td')[2].get_text()

inherit_restr = skill_table.find_all('tr')[-1].td
out['inherit'] = ''
for restr in inherit_restr.contents:
    if restr.name == 'a':
        title = restr['title'].replace('bow', 'Bow').replace('Staff', 'Colorless Staff')
        out['inherit'] += title
    else:
        out['inherit'] += restr.string

owners_table = page.find_all('table')[1].tbody
owners = {}
for tr in owners_table.find_all('tr')[1:]:
    tds = tr.find_all('td')
    name = tds[0].get_text()
    rarity = ''
    for selflink in tr.find_all('a', class_='mw-selflink selflink'):
        if selflink.get_text() == skill+level:
            rarity = selflink.next_element.next_element.next_element
            break
    if rarity != '':
        owners[name] = rarity

owners = sorted(owners.items(), key=lambda x: x[1])
if len(owners) > 5:
    owners = owners[:5]
out['owners'] = owners

json.dump(out, file, indent=4)