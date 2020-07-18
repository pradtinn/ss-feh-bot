import requests
from bs4 import BeautifulSoup
import time
import json
import random

# img_link = img['src']
# selected_img_link = 'https://safebooru.org/index.php?page=post&s=view&id='+img_link[img_link.index('?')+1:]
# i_page = requests.get(selected_img_link)
# i_parser = BeautifulSoup(i_page.content, 'html.parser')
# exit(i_parser.find('img', id='image')['src'])
# image_pids = []
# for i in range(0, 11):
#     page = requests.get('https://safebooru.org/index.php?page=post&s=list&tags=marianne_von_edmund&pid='+str(i*40))
#     page_parser = BeautifulSoup(page.content, 'html.parser')
#     for img in page_parser.find_all('img', class_='preview'):
#         img_link = img['src']
#         image_pids.append(img_link[img_link.index('?')+1:])

# data = {
#     'pids': image_pids
# }

# with open('marianne_art.json', 'w') as file:
#     json.dump(data, file)

with open('marianne_art.json', 'r') as file:
    image_pids = json.load(file)['pids']

img_index = random.randint(0, len(image_pids)-1)
selected_img_link = 'https://safebooru.org/index.php?page=post&s=view&id='+image_pids[img_index]
i_page = requests.get(selected_img_link)
i_parser = BeautifulSoup(i_page.content, 'html.parser')
exit(i_parser.find('img', id='image')['src'])