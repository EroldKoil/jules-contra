from playwright.sync_api import sync_playwright

def verify_game_levels():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navigate to the game (assuming standard Vite port 5173, check server.log if different)
        # Often it's http://localhost:5173
        try:
            page.goto("http://localhost:5173")
        except:
             # Fallback if port is different or not ready, usually wait helps
             pass

        # Wait for canvas or main menu text
        page.wait_for_selector("canvas")

        # Screenshot Main Menu
        page.screenshot(path="verification/1_main_menu.png")
        print("Main Menu screenshot taken.")

        # Interact to start level (Press Enter)
        page.keyboard.press("Enter")

        # Wait a bit for level to load
        page.wait_for_timeout(1000)

        # Screenshot Level 1
        page.screenshot(path="verification/2_level_1.png")
        print("Level 1 screenshot taken.")

        # Simulate moving and shooting
        page.keyboard.down("d") # Move Right
        page.wait_for_timeout(500)
        page.keyboard.up("d")

        page.keyboard.press("i") # Fire
        page.wait_for_timeout(100)
        page.keyboard.press("i")

        # Screenshot Action
        page.screenshot(path="verification/3_level_1_action.png")
        print("Action screenshot taken.")

        browser.close()

if __name__ == "__main__":
    verify_game_levels()
