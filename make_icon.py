# 仮アイコン生成（GPTのデザインが決まったら差し替える）
from PIL import Image, ImageDraw
for size in (180, 512):
    s = size / 180
    im = Image.new("RGB", (size, size), (47, 111, 79))
    d = ImageDraw.Draw(im)
    w = lambda v: int(v * s)
    d.rounded_rectangle([w(30), w(55), w(150), w(135)], radius=w(14), outline="white", width=w(9))
    d.rectangle([w(68), w(40), w(112), w(58)], fill="white")
    d.ellipse([w(65), w(70), w(115), w(120)], outline="white", width=w(9))
    im.save(f"icon-{size}.png")
