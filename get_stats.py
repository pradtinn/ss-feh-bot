import sys
from datetime import datetime
import json

growth_value_table = {
    8: "20%",
    10: "25%",
    13: "30%",
    15: "35%",
    17: "40%",
    19: "45%",
    22: "50%",
    24: "55%",
    26: "60%",
    28: "65%",
    30: "70%",
    33: "75%",
    35: "80%",
    37: "85%",
    39: "90%"
}

def get_stat_in(msg, delim):
    inp = msg.split(delim)
    out = []
    for stat in inp:
        out.append(int(stat))
    return out

def get_growths(lvl1, lvl40):
    growths = []
    for (i, j) in zip(lvl1,lvl40):
        growth = growth_value_table[j-i]
        growths.append(growth)
    return growths

def stat_to_str_arr(stats):
    out = []
    for stat in stats:
        out.append("{}/{}/{}".format(stat-1, stat, stat+1))
    return out

def lower_rarity(stats, rarity):
    if rarity % 2 == 1:
        stats[0] -= 1
        smallest = (47, -1)
        second_smallest = (47, -1)
        for i in range(1, len(stats)):
            if stats[i] < smallest[0]:
                second_smallest = smallest
                smallest = (stats[i], i)
            elif stats[i] < second_smallest[0]:
                second_smallest = (stats[i], i)
        stats[smallest[1]] -= 1
        stats[second_smallest[1]] -= 1
    else:
        largest = (0, -1)
        second_largest = (0, -1)
        for i in range(1, len(stats)):
            if stats[i] > largest[0]:
                second_largest = largest
                largest = (stats[i], i)
            elif stats[i] > second_largest[0]:
                second_largest = (stats[i], i)
        stats[largest[1]] -= 1
        stats[second_largest[1]] -= 1
    return stats

release_date = datetime.today().strftime("%Y-%m-%d")

name = sys.argv[1]
inp_file = open(sys.argv[2], 'r')
lines = inp_file.readlines()
line_num = 1
lvl1Stats = []
lvl40Stats = []
growths = []
weapon = ""
assist = ""
special = ""
a = ""
b = ""
c = ""
move = ""
weapon_type = ""
for line in lines:
    if '\n' in line:
        line = line[:-1]
    if line_num == 1:
        lvl1Stats = get_stat_in(line, ',')
    elif line_num == 2:
        lvl40Stats = get_stat_in(line, ',')
        growths = get_growths(lvl1Stats, lvl40Stats)
    elif line_num == 3:
        weapon = line
    elif line_num == 4:
        special = line.replace("NONE", "")
    elif line_num == 5:
        assist = line.replace("NONE", "")
    elif line_num == 6:
        if line == "NONE":
            a = []
        else:
            a = line
    elif line_num == 7:
        if line == "NONE":
            b = []
        else:
            b = line
    elif line_num == 8:
        if line == "NONE":
            c = []
        else:
            c = line
    elif line_num == 9:
        move = line.replace("NONE", "")
    elif line_num == 10:
        weapon_type = line.replace("NONE", "")
    line_num += 1

allLvl1Stats = {
    "1": [],
    "2": [],
    "3": [],
    "4": [],
    "5": stat_to_str_arr(lvl1Stats)
}
temp_stats = lvl1Stats
for i in range(5, 1, -1):
    temp_stats = lower_rarity(temp_stats, i)
    allLvl1Stats[str(i-1)] = stat_to_str_arr(temp_stats)

output = {
    name: {
        "lvl1stats": allLvl1Stats,
        "growths": growths,
        "weapon": weapon,
        "assist": assist,
        "special": special,
        "passives": {
            "A": a,
            "B": b,
            "C": c
        },
        "alias": [],
        "moveType": move,
        "weaponType": weapon_type,
        "releaseDate": release_date
    }
}

with open("output.json", "w") as file:
    json.dump(output, file, indent=4)