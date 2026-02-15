import populartimes
import json

API_KEY = "AIzaSyCjMUCB_WsVcdcDfsRLwsBXA4fFaU1CU6A"

# 📍 Targeted coordinates for your specific cafes
cafes_to_check = [
    {"name": "Blue Bottle Coffee Yeoksam", "lat": 37.498, "lng": 127.031},
    {"name": "Starbucks Gangnam R", "lat": 37.498, "lng": 127.027},
    {"name": "Camel Coffee", "lat": 37.500, "lng": 127.036},
    {"name": "Alver", "lat": 37.502, "lng": 127.028}
]

print("🕵️‍♂️ Starting Precision Target Scraper...")

for cafe in cafes_to_check:
    try:
        print(f"Searching near: {cafe['name']}...")
        
        # We define a tiny 0.001 degree box (roughly 100 meters)
        p1 = (cafe['lat'] - 0.0005, cafe['lng'] - 0.0005)
        p2 = (cafe['lat'] + 0.0005, cafe['lng'] + 0.0005)
        
        data = populartimes.get(API_KEY, ["cafe"], p1, p2, 10, 100, False)
        
        found = False
        if data:
            for place in data:
                # We check if the name matches (e.g., "Starbucks" is in "Starbucks Gangnam R")
                if cafe['name'].lower() in place['name'].lower() or place['name'].lower() in cafe['name'].lower():
                    if 'populartimes' in place:
                        avg_trend = [0] * 24
                        for day in place['populartimes']:
                            avg_trend = [sum(x) for x in zip(avg_trend, day['data'])]
                        
                        final_trend = [int((x / 7) / 10) for x in avg_trend]
                        sql = f"UPDATE cafes SET busyness_trend = '{{{','.join(map(str, final_trend))}}}' WHERE name ILIKE '%{cafe['name']}%';"
                        print(f"✅ SUCCESS: {place['name']}\n{sql}\n")
                        found = True
                        break
        
        if not found:
            print(f"⚠️ Could not find specific data for {cafe['name']} in this spot.")

    except Exception as e:
        print(f"⚠️ Error with {cafe['name']}: {e}")