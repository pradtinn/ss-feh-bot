import send2trash
import os

print(os.getcwd())

os.chdir(os.getcwd()+'\\Art')

print(os.getcwd())

for folderName, subFolders, filenames in os.walk(os.getcwd()):
    for filename in filenames:
        if filename != 'Face_FC.png':
            send2trash.send2trash(folderName+'\\'+filename)