#!/usr/bin/env python3
from PIL import Image, ImageDraw, ImageFont
import os

# Create resources directory if it doesn't exist
os.makedirs('resources', exist_ok=True)
os.makedirs('public', exist_ok=True)

# Create a simple icon
def create_icon(size, filename):
    # Create image with dark background
    img = Image.new('RGB', (size, size), color='#1f2937')
    draw = ImageDraw.Draw(img)
    
    # Draw a simple "V" for Voca
    font_size = int(size * 0.5)
    
    # Try to use a basic font
    try:
        from PIL import ImageFont
        font = ImageFont.truetype("/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf", font_size)
    except:
        font = ImageFont.load_default()
    
    # Draw white "V" in center
    text = "V"
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    
    position = ((size - text_width) // 2, (size - text_height) // 2 - font_size // 10)
    draw.text(position, text, fill='#10b981', font=font)
    
    # Add a subtle border
    border_width = max(2, size // 50)
    draw.rectangle(
        [border_width, border_width, size - border_width - 1, size - border_width - 1],
        outline='#10b981',
        width=border_width
    )
    
    img.save(filename, 'PNG')
    print(f"Created {filename}")

# Create icons for Capacitor
create_icon(1024, 'resources/icon-foreground.png')
create_icon(1024, 'resources/icon-background.png')
create_icon(1024, 'resources/splash.png')

# Create icons for PWA
create_icon(192, 'public/icon-192.png')
create_icon(512, 'public/icon-512.png')

print("Icons created successfully!")