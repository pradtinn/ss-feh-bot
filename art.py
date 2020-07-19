import requests
from bs4 import BeautifulSoup
import time
import json
import random
import sys
import signal

# img_link = img['src']
# selected_img_link = 'https://safebooru.org/index.php?page=post&s=view&id='+img_link[img_link.index('?')+1:]
# i_page = requests.get(selected_img_link)
# i_parser = BeautifulSoup(i_page.content, 'html.parser')
# exit(i_parser.find('img', id='image')['src'])
character = sys.argv[1].replace(' ', '_').lower()

with open('art_cache.json', 'r') as file:
    cache = json.load(file)

image_pids = []

if character in cache:
    print('Loaded pids from cache...')
    image_pids = cache[character]
else:
    print('Getting pids from link...')
    link = 'https://safebooru.org/index.php?page=post&s=list&tags='+character
    page = requests.get(link+'&pid=0')
    page_parser = BeautifulSoup(page.content, 'html.parser')
    print('Going to {}...'.format(link))
    pages = page_parser.find('div', class_='pagination')
    if pages == None:
        exit('ERROR')
    pages = pages.find_all('a')
    page_numbers = [0]
    for a in pages:
        if a.has_attr('alt'):
            break
        page_numbers.append(int(a.get_text())-1)
    # print(page_numbers)
    for i in page_numbers:
        page = requests.get(link+'&pid='+str(i*40))
        page_parser = BeautifulSoup(page.content, 'html.parser')
        for img in page_parser.find_all('img', class_='preview'):
            img_link = img['src']
            image_pids.append(img_link[img_link.index('?')+1:])
    # print(image_pids)
    cache[character] = image_pids
    with open('art_cache.json', 'w') as file:
        json.dump(cache, file, indent=4)
    print('New pids in cache now.')
img_index = random.randint(0, len(image_pids)-1)
print('Going to preview link for image sample link...')
selected_img_link = 'https://safebooru.org/index.php?page=post&s=view&id='+image_pids[img_index]
i_page = requests.get(selected_img_link)
i_parser = BeautifulSoup(i_page.content, 'html.parser')
sample_link = i_parser.find('img', id='image')['src']
print('Got link to sample. Now determining actual link...')
actual_link_png = sample_link.replace('samples', 'images').replace('sample_', '').replace('.jpg?', '.png?')
actual_link_png = actual_link_png[:actual_link_png.index('?')]
actual_page = requests.get(actual_link_png)
print('Page status code: {}'.format(actual_page.status_code))
if actual_page.status_code == 404:
    actual_link_jpg = sample_link.replace('samples', 'images').replace('sample_', '')
    actual_link_jpg = actual_link_jpg[:actual_link_jpg.index('?')]
    actual_page = requests.get(actual_link_jpg)
    if actual_page.status_code == 404:
        print('No proper image is found, returning the preview instead: {}'.format(sample_link))
        exit(sample_link)
    print('Actual link found: {}'.format(actual_link_jpg))
    exit(actual_link_jpg)
print('Actual link found: {}'.format(actual_link_png))
exit(actual_link_png)

# data = {
#     'pids': image_pids
# }

# with open('marianne_art.json', 'w') as file:
#     json.dump(data, file)

# filename = sys.argv[1]+'_art.json'

# with open(filename, 'r') as file:
#     image_pids = json.load(file)['pids']