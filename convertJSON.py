import json
import ftfy

with open('Aliases.json') as f:
    data = json.load(f)

#print(data)
newdata = {}

for index in data:
    for alias in index.split('$'):
        newdata[alias] = ftfy.fix_text(data[index])

with open('Aliases1.json', 'w') as json_file:
    json.dump(newdata, json_file)