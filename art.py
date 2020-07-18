import requests
from bs4 import BeautifulSoup
import time
import json
import random
import sys

# img_link = img['src']
# selected_img_link = 'https://safebooru.org/index.php?page=post&s=view&id='+img_link[img_link.index('?')+1:]
# i_page = requests.get(selected_img_link)
# i_parser = BeautifulSoup(i_page.content, 'html.parser')
# exit(i_parser.find('img', id='image')['src'])
character = sys.argv[1].replace(' ', '_')
link = 'https://safebooru.org/index.php?page=post&s=list&tags='+character
page = requests.get(link+'&pid=0')
page_parser = BeautifulSoup(page.content, 'html.parser')
pages = page_parser.find('div', class_='pagination').find_all('a')
page_numbers = [0]
for a in pages:
    if a.has_attr('alt'):
        break
    page_numbers.append(int(a.get_text())-1)
# print(page_numbers)
image_pids = []
for i in page_numbers:
    page = requests.get(link+'&pid='+str(i*40))
    page_parser = BeautifulSoup(page.content, 'html.parser')
    for img in page_parser.find_all('img', class_='preview'):
        img_link = img['src']
        image_pids.append(img_link[img_link.index('?')+1:])
# print(image_pids)
img_index = random.randint(0, len(image_pids)-1)
selected_img_link = 'https://safebooru.org/index.php?page=post&s=view&id='+image_pids[img_index]
i_page = requests.get(selected_img_link)
i_parser = BeautifulSoup(i_page.content, 'html.parser')
exit(i_parser.find('img', id='image')['src'])

# data = {
#     'pids': image_pids
# }

# with open('marianne_art.json', 'w') as file:
#     json.dump(data, file)

# filename = sys.argv[1]+'_art.json'

# with open(filename, 'r') as file:
#     image_pids = json.load(file)['pids']