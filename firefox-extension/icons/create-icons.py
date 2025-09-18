#!/usr/bin/env python3
import base64
from PIL import Image, ImageDraw, ImageFont
import io

def create_icon(size):
    # Create a new image with a dark background
    img = Image.new('RGBA', (size, size), (31, 41, 55, 255))
    draw = ImageDraw.Draw(img)
    
    # Calculate font size
    font_size = int(size * 0.6)
    
    # Draw a white "V" in the center
    # Using default font since we might not have specific fonts installed
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf", font_size)
    except:
        try:
            font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", font_size)
        except:
            # Use default font
            font = ImageFont.load_default()
    
    # Get text bounding box
    text = "V"
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    
    # Calculate position to center text
    x = (size - text_width) // 2
    y = (size - text_height) // 2 - bbox[1]
    
    # Draw the text
    draw.text((x, y), text, fill=(255, 255, 255, 255), font=font)
    
    # Round corners
    if size >= 48:
        corner_radius = size // 8
        # Create a mask for rounded corners
        mask = Image.new('L', (size, size), 0)
        mask_draw = ImageDraw.Draw(mask)
        mask_draw.rounded_rectangle([(0, 0), (size, size)], corner_radius, fill=255)
        
        # Apply mask
        output = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        output.paste(img, (0, 0), mask)
        return output
    
    return img

# Create icons
for size in [16, 48, 128]:
    icon = create_icon(size)
    icon.save(f'icon-{size}.png')
    print(f'Created icon-{size}.png')

print("Icons created successfully!")