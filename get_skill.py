import requests
from bs4 import BeautifulSoup
import json
import codecs
import sys
import re

lowercase_words = ['and', 'of', 'for', 'to']

def skill_capitalize(name):
    result = ''
    reg = re.compile('[/-]/g')
    name = name.replace(reg, ' ')
    for word in name.split():
        if word not in lowercase_words:
            word = word.capitalize()
            result += word
    return result
            

skill_raw = sys.argv[1]
print(skill_capitalize(skill_raw))