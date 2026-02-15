import time
import random
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager

# 📍 The Target Cafes
cafes = [
    {"name": "Blue Bottle Coffee Yeoksam", "id": "ChIJJy8PQ1-hfDURg0UO_fZZ9BU"},
    {"name": "Starbucks Gangnam R", "id": "ChIJobb671mhfDURrcE4SebLfyw"},
    {"name": "Camel Coffee", "id": "ChIJXUi4t9GjfDURUNx-9ePDNzo"},
    {"name": "Alver", "id": "ChIJ63FbvuKjfDURnyLgdXNMebI"}
]

def get_popularity_data(cafe_name, place_id):
    chrome_options = Options()
    
    # 📱 MAGIC TRICK: Enable Mobile Emulation
    mobile_emulation = { "deviceName": "iPhone 12 Pro" }
    chrome_options.add_experimental_option("mobileEmulation", mobile_emulation)
    
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    # Force English so we can read "busy"
    chrome_options.add_argument("--lang=en-US")

    driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=chrome_options)
    
    try:
        # Go to the place directly
        url = f"https://www.google.com/maps/place/?q=place_id:{place_id}&hl=en"
        
        print(f"📱 Opening Mobile View for: {cafe_name}...")
        driver.get(url)
        
        # Give it time to load the "App-like" interface
        time.sleep(5) 

        print("   Looking for graph data...")
        wait = WebDriverWait(driver, 10)
        
        # Mobile view often uses different class names. 
        # We look for the "Popular times" header first to ensure we are in the right section.
        try:
            # Scroll down a bit to trigger the graph loading
            driver.execute_script("window.scrollTo(0, 300)")
            time.sleep(2)
        except:
            pass

        # Strategy: Look for the specific bars (Generic "busy" search)
        bars = driver.find_elements(By.XPATH, "//*[contains(@aria-label, 'busy')]")
        
        if not bars:
             # Fallback: Look for the class name often used in mobile web
            bars = driver.find_elements(By.CLASS_NAME, "goog-inline-block")

        # Filter bars to only keep ones that look like data (have %)
        valid_bars = []
        for bar in bars:
            label = bar.get_attribute("aria-label")
            if label and "%" in label:
                valid_bars.append(bar)

        if not valid_bars:
            print("   ❌ Still not found. (Mobile view didn't reveal it either)")
            return None

        # 5. Extract the data
        print(f"   ✅ Success! Found {len(valid_bars)} time slots.")
        
        extracted_trend = [0] * 24
        valid_count = 0
        
        for i, bar in enumerate(valid_bars):
            label = bar.get_attribute("aria-label") 
            if label:
                try:
                    # Clean the label to find the percentage
                    parts = label.split()
                    for part in parts:
                        if "%" in part:
                            percent = int(part.replace("%", ""))
                            score = int(percent / 10) # Scale to 0-10
                            
                            # Simple mapping 
                            target_hour = (6 + i) % 24
                            extracted_trend[target_hour] = score
                            valid_count += 1
                            break
                except:
                    pass

        if valid_count > 0:
            return extracted_trend
        else:
            return None

    except Exception as e:
        print(f"   ⚠️ Error during scrape: {e}")
        return None
        
    finally:
        driver.quit()

# --- RUN THE SCRAPER ---
print("🚀 Launching MOBILE EMULATOR Scraper...")

for cafe in cafes:
    trend = get_popularity_data(cafe['name'], cafe['id'])
    
    if trend:
        trend_str = "{" + ",".join(map(str, trend)) + "}"
        sql = f"UPDATE cafes SET busyness_trend = '{trend_str}' WHERE name ILIKE '%{cafe['name']}%';"
        print(f"\n💾 SQL for {cafe['name']}:\n{sql}\n")
        print("-" * 40)
        time.sleep(random.uniform(2, 5)) 
    else:
        print(f"❌ Failed to get data for {cafe['name']}.\n")