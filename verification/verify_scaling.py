from playwright.sync_api import sync_playwright

def verify_scaling():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Create a viewport that is different from 800x600 to test scaling
        # Let's use 1000x800. Aspect ratio of game is 4:3 (1.333).
        # 1000 / 800 = 1.25. 1.25 < 1.333. So width is the limiting factor if fitting.
        # Wait, 1000 width. Height for 4:3 would be 1000 / 1.333 = 750.
        # So in 1000x800, the game should be 1000x750.
        # And since it's centered, top margin should be (800 - 750) / 2 = 25.

        context = browser.new_context(viewport={'width': 1000, 'height': 800})
        page = context.new_page()
        page.goto("http://localhost:5173/")

        # Wait for canvas to appear
        page.wait_for_selector("canvas")

        # Get canvas element
        canvas = page.locator("canvas")

        # Get computed style
        # Phaser with FIT mode modifies the style width and height of the canvas
        style_width = canvas.evaluate("el => el.style.width")
        style_height = canvas.evaluate("el => el.style.height")
        margin_top = canvas.evaluate("el => el.style.marginTop")
        margin_left = canvas.evaluate("el => el.style.marginLeft")

        print(f"Viewport: 1000x800")
        print(f"Canvas Style Width: {style_width}")
        print(f"Canvas Style Height: {style_height}")
        print(f"Margin Top: {margin_top}")
        print(f"Margin Left: {margin_left}")

        # Take a screenshot
        page.screenshot(path="verification/scaling_test.png")

        browser.close()

if __name__ == "__main__":
    verify_scaling()
