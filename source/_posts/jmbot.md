---
title : 搭建jm机器人过程记录
data: 2025-10-30 10:24:21
tags: [code,QQ,python]
category: program
---
本文介绍如何通过``NatCat``，``Nonebot``,以及github上开源的pyapi项目``JMComic-Crawler-Python``来搭建一个能够根据JM号自动下载本子并回应的QQbot。
## 1.下载NatCat并配置远程连接
添加机器人，将**bot QQ**设置为你需要作为bot的QQ号，其他基本设置均默认。接下来打开连接设置。选择``Websocket Client``将url设为``ws://127.0.0.1:8080/onebot/v11/ws``（意为从本地连接）
## 2.建立Nonebot项目

创建项目参考参考[NoneBot官方文档](https://nonebot.dev/docs/quick-start).

选择``simple``模板，适配器选择``Onebotv12``，驱动器选择``FastAPI``和``Webcsocket``，安装依赖且创建虚拟环境，插件无所谓，因为也用不上。
然后再打开工作目录下的``pyproject.toml``

```toml
[tool.nonebot]
adapters = [
    { name = "OneBot V11", module_name = "nonebot.adapters.onebot.v11" }
]
```
将这段代码改为如上代码以使其使用V11适配器

>可以nb run运行项目，启动机器人，若终端中出现``connect open``便说明连接成功

## 3.编写机器人脚本
现在虚拟环境下执行
```cmd
pip install jmcomic -i https://pypi.org/project -U
```
在``src\plugins``路径下创建``__init__.py``空文件以及``comic``py脚本。
```py
from nonebot import on_message
from nonebot.adapters.onebot.v11 import Bot, MessageEvent, MessageSegment
import asyncio
import re
from pathlib import Path
import subprocess
import os

comic_matcher = on_message()

@comic_matcher.handle()
async def handle_comic(bot: Bot, event: MessageEvent):
    plain_text = event.get_plaintext().strip()
    
    if "comic" in plain_text.lower():
        numbers = re.findall(r'\d+', plain_text)
        
        if numbers:
            album_id = numbers[0]
        if album_id == "350234" or album_id == "350235":
            await bot.send(event, "带着你的苦命鸳鸯吃大分去吧！")
        else:
            try:
                await bot.send(event, f"开始下载漫画 {album_id}，请稍候...")
                
                # 使用命令行下载
                result = subprocess.run(
                    f"jmcomic {album_id}", 
                    shell=True, 
                    capture_output=True, 
                    text=True,
                    cwd="."  # 在当前目录执行
                )
                
                if result.returncode == 0:
                    # 查找下载的图片文件
                    image_files = []
                    for file in Path(".").rglob("*"):
                        if file.suffix.lower() in ['.jpg', '.jpeg', '.png', '.webp']:
                            image_files.append(file)
                    
                    # 按修改时间排序，找到最新下载的文件
                    image_files.sort(key=lambda x: x.stat().st_mtime, reverse=True)
                    
                    if image_files:
                        # 只取最近下载的（假设是新下载的漫画）
                        recent_files = image_files[:50]  # 最多取50个文件
                        recent_files.sort(key=lambda x: x.name)  # 按文件名排序
                        
                        await bot.send(event, f"找到 {len(recent_files)} 张图片，开始发送...")
                        
                        # 发送所有图片
                        for i, image_file in enumerate(recent_files, 1):
                            try:
                                await bot.send(event, MessageSegment.image(image_file))
                                await asyncio.sleep(1)
                            except Exception as e:
                                print(f"发送图片失败: {e}")
                                continue
                        
                        await bot.send(event, f"漫画发送完成！")
                    else:
                        await bot.send(event, "下载完成但未找到图片文件")
                else:
                    await bot.send(event, f"下载失败: {result.stderr}")
                    
            except Exception as e:
                await bot.send(event, f"处理失败: {str(e)}")
```