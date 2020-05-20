import requests
from bs4 import BeautifulSoup
import json

heroes_link = 'https://feheroes.gamepedia.com/List_of_Heroes'
hero_link = 'https://feheroes.gamepedia.com/'
heroes_page = requests.get(heroes_link)

page_parser = BeautifulSoup(heroes_page.content, 'html.parser')

units = page_parser.find_all('tr', class_='hero-filter-element')

data = {}

for unit in units:
    i = 0
    for col in unit.children:
        if i == 1:
            name = col.a.get('href')[1:]
            data[name] = {'lvl1stats': {'1': [], '2': [], '3': [], '4': [], '5': []}, 'growths': [], 'weapons': [],
                 'assists': [], 'passives': []}
            unit_link = hero_link+name
            unit_page = requests.get(unit_link)
            unit_parser = BeautifulSoup(unit_page.content, 'html.parser')
            
            stat_tables = unit_parser.find_all('table', class_ = 'wikitable default')
            j = 0
            for table in stat_tables:
                if j == 0 or j == 2:
                    k = 1
                    for tr in table.tbody.find_all('tr')[1:]:
                        for td in tr.find_all('td')[1:-1]:
                            if j == 0:
                                data[name]['lvl1stats'][str(k)].append(td.get_text())
                            else:
                                data[name]['growths'].append(td.get_text())
                        k += 1  
                j += 1
            print(name)

            skill_indices = ['weapons', 'assists', 'specials', 'passives']
            divs = unit_parser.find_all('div')
            for div in divs:
                if 'Assist' in div.get_text() and 'assists' in skill_indices:
                    skill_indices.remove('assists')
                if 'Special' in div.get_text() and 'specials' in skill_indices:
                    skill_indices.remove('specials')
            
            skills_tables = unit_parser.find_all('table', class_='wikitable default unsortable skills-table')
            j = 0
            for table in skills_tables:
                pass
            print(skill_indices)
            break
        i += 1

print(data)